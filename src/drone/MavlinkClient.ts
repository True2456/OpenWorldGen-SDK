/**
 * Browser ↔ soft_vehicle.py WebSocket client.
 * Receives MAVLink-derived commands; pushes vehicle telemetry JSON.
 */

export type MavCommand = Record<string, unknown> & { type: string };

export interface MavlinkClientOpts {
  url: string;
  onCommand: (cmd: MavCommand) => void;
  onStatus?: (s: { connected: boolean; detail: string }) => void;
}

export class MavlinkClient {
  private ws: WebSocket | null = null;
  private opts: MavlinkClientOpts;
  private closed = false;
  private retryTimer: number | null = null;
  private backoffMs = 800;

  constructor(opts: MavlinkClientOpts) {
    this.opts = opts;
  }

  start(): void {
    this.closed = false;
    this.connect();
  }

  stop(): void {
    this.closed = true;
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  sendState(state: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'state', ...state }));
  }

  private connect(): void {
    if (this.closed) return;
    this.opts.onStatus?.({ connected: false, detail: `connecting ${this.opts.url}` });
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.opts.url);
    } catch (e) {
      this.opts.onStatus?.({ connected: false, detail: String(e) });
      this.scheduleRetry();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.backoffMs = 800;
      this.opts.onStatus?.({ connected: true, detail: 'connected' });
    };
    ws.onclose = () => {
      this.opts.onStatus?.({ connected: false, detail: 'disconnected' });
      this.ws = null;
      this.scheduleRetry();
    };
    ws.onerror = () => {
      this.opts.onStatus?.({ connected: false, detail: 'error' });
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as MavCommand;
        if (data && typeof data.type === 'string' && data.type !== 'hello' && data.type !== 'pong') {
          this.opts.onCommand(data);
        }
      } catch {
        /* ignore */
      }
    };
  }

  private scheduleRetry(): void {
    if (this.closed || this.retryTimer !== null) return;
    const wait = this.backoffMs;
    this.backoffMs = Math.min(8000, this.backoffMs * 1.6);
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, wait);
  }
}
