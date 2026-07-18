/**
 * Keyboard / gamepad-ish RC for the soft quad when GCS sticks are idle.
 *
 * I/K pitch, J/L roll, U/O yaw, Space/Ctrl throttle (or R/F).
 * B arm/disarm, M cycles flight mode, T takeoff, G land.
 */

import type { FlightMode, QuadFlight } from './QuadFlight';

const MODES: FlightMode[] = ['STABILIZE', 'ALT_HOLD', 'LOITER', 'GUIDED', 'LAND', 'RTL'];

export class KeyboardRc {
  private keys = new Set<string>();
  private modeIdx = 0;

  constructor(private flight: QuadFlight) {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
  }

  /**
   * Apply keyboard overlays onto flight.rc without wiping MAVLink sticks
   * when no related key is held.
   */
  poll(): void {
    const pitch = axis(this.keys.has('KeyI'), this.keys.has('KeyK'));
    const roll = axis(this.keys.has('KeyL'), this.keys.has('KeyJ'));
    const yaw = axis(this.keys.has('KeyO'), this.keys.has('KeyU'));
    if (pitch !== 0 || this.keys.has('KeyI') || this.keys.has('KeyK')) this.flight.rc.pitch = pitch;
    if (roll !== 0 || this.keys.has('KeyL') || this.keys.has('KeyJ')) this.flight.rc.roll = roll;
    if (yaw !== 0 || this.keys.has('KeyO') || this.keys.has('KeyU')) this.flight.rc.yaw = yaw;

    if (this.keys.has('Space') || this.keys.has('KeyR')) {
      this.flight.rc.throttle = Math.min(1, this.flight.rc.throttle + 0.025);
    }
    if (this.keys.has('ControlLeft') || this.keys.has('KeyF')) {
      this.flight.rc.throttle = Math.max(0, this.flight.rc.throttle - 0.025);
    }
  }

  private onDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    // don't steal typing from HUD / browser chrome shortcuts with modifiers
    if (e.metaKey || e.altKey) return;
    if (e.code === 'KeyB') {
      this.flight.applyCommand({ type: 'arm', armed: !this.flight.armed });
      return;
    }
    if (e.code === 'KeyM') {
      this.modeIdx = (this.modeIdx + 1) % MODES.length;
      this.flight.mode = MODES[this.modeIdx]!;
      return;
    }
    if (e.code === 'KeyT') {
      this.flight.applyCommand({ type: 'takeoff', alt: 12 });
      return;
    }
    if (e.code === 'KeyG') {
      this.flight.applyCommand({ type: 'land' });
      return;
    }
    this.keys.add(e.code);
  };

  private onUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };
}

function axis(pos: boolean, neg: boolean): number {
  return (pos ? 1 : 0) + (neg ? -1 : 0);
}
