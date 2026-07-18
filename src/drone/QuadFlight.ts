/**
 * Soft-body flight model for the LAAS quad — MAVLink-commanded or keyboard RC.
 *
 * World axes: +X east, +Y up, +Z north (matches Geo.ts).
 * Attitude: yaw about +Y (0 = facing +Z / north), pitch nose-up, roll right-down.
 */

import { Euler, Group, MathUtils, Quaternion, Vector3 } from 'three';
import type { Mesh } from 'three';

export type FlightMode =
  | 'STABILIZE'
  | 'ALT_HOLD'
  | 'LOITER'
  | 'RTL'
  | 'AUTO'
  | 'LAND'
  | 'GUIDED'
  | 'POSHOLD';

export interface RcInput {
  /** -1..1 forward (pitch) */
  pitch: number;
  /** -1..1 right (roll) */
  roll: number;
  /** 0..1 collective thrust (1 = max climb when armed) */
  throttle: number;
  /** -1..1 yaw rate (right positive) */
  yaw: number;
}

export interface GeoHome {
  lat: number;
  lon: number;
  /** AMSL of world y=0 plane, meters */
  altAmsl: number;
  /** meters per degree latitude (~111320) */
  mPerDegLat?: number;
}

export interface QuadTelemetry {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  roll: number;
  pitch: number;
  yaw: number;
  lat: number;
  lon: number;
  alt_amsl: number;
  alt_rel: number;
  armed: boolean;
  mode: FlightMode;
  battery: number;
  heading_deg: number;
  throttle: number;
}

const _Q = new Quaternion();
const _E = new Euler();
const _FWD = new Vector3();
const _RIGHT = new Vector3();
const _THRUST = new Vector3();
const _ACC = new Vector3();

const GRAVITY = 9.81;
const MASS = 1.4;
const MAX_THRUST = MASS * GRAVITY * 2.15;
const MAX_TILT = MathUtils.degToRad(38);
const YAW_RATE = MathUtils.degToRad(95);
const DRAG_H = 0.55;
const DRAG_V = 0.9;
const ATT_RATE = 6.5;
const TARGET_RATE = 1.8;
const BATTERY_DRAIN = 0.000035; // per second at hover

export class QuadFlight {
  readonly root: Group;
  readonly props: { mesh: Mesh; spin: number }[];

  pos = new Vector3(0, 2, 0);
  vel = new Vector3();
  roll = 0;
  pitch = 0;
  yaw = 0;
  armed = false;
  mode: FlightMode = 'STABILIZE';
  battery = 1;
  throttleOut = 0;

  /** relative altitude command (m AGL) for ALT_HOLD / LOITER / GUIDED */
  altCmd = 2;
  /** guided / loiter horizontal target in world xz */
  targetX: number | null = null;
  targetZ: number | null = null;
  homeX = 0;
  homeZ = 0;
  homeY = 2;

  rc: RcInput = { pitch: 0, roll: 0, throttle: 0.5, yaw: 0 };
  groundY: (x: number, z: number) => number = () => 0;
  geo: GeoHome;

  private propPhase = 0;
  private landed = true;

  constructor(root: Group, props: Mesh[], geo: GeoHome) {
    this.root = root;
    this.props = props.map((mesh, i) => ({ mesh, spin: i % 2 === 0 ? 1 : -1 }));
    this.geo = geo;
  }

  setPose(x: number, y: number, z: number, yaw = 0): void {
    this.pos.set(x, y, z);
    this.yaw = yaw;
    this.vel.set(0, 0, 0);
    this.homeX = x;
    this.homeZ = z;
    this.homeY = y;
    this.altCmd = Math.max(1, y - this.groundY(x, z));
    this.syncMesh();
  }

  applyCommand(cmd: Record<string, unknown>): void {
    const t = String(cmd.type ?? '');
    if (t === 'arm') {
      this.armed = Boolean(cmd.armed);
      if (!this.armed) {
        this.rc.throttle = 0;
        this.landed = true;
      }
    } else if (t === 'set_mode') {
      this.mode = String(cmd.mode ?? 'STABILIZE').toUpperCase() as FlightMode;
    } else if (t === 'takeoff') {
      this.armed = true;
      this.mode = 'GUIDED';
      this.altCmd = Math.max(2, Number(cmd.alt) || 10);
      this.targetX = this.pos.x;
      this.targetZ = this.pos.z;
      this.landed = false;
    } else if (t === 'land') {
      this.mode = 'LAND';
    } else if (t === 'rtl') {
      this.mode = 'RTL';
      this.targetX = this.homeX;
      this.targetZ = this.homeZ;
      this.altCmd = Math.max(8, this.pos.y - this.groundY(this.pos.x, this.pos.z) + 5);
    } else if (t === 'goto') {
      this.mode = 'GUIDED';
      const w = this.wgsToWorld(Number(cmd.lat), Number(cmd.lon));
      this.targetX = w.x;
      this.targetZ = w.z;
      if (Number.isFinite(Number(cmd.alt))) {
        // treat as relative alt if small, else AMSL
        const alt = Number(cmd.alt);
        this.altCmd = alt < 200 ? alt : Math.max(1, alt - this.geo.altAmsl);
      }
      this.armed = true;
      this.landed = false;
    } else if (t === 'manual') {
      // MAVLink MANUAL_CONTROL: x pitch, y roll, z thrust 0..1000, r yaw
      this.rc.pitch = clamp(Number(cmd.x) / 1000, -1, 1);
      this.rc.roll = clamp(Number(cmd.y) / 1000, -1, 1);
      this.rc.throttle = clamp(Number(cmd.z) / 1000, 0, 1);
      this.rc.yaw = clamp(Number(cmd.r) / 1000, -1, 1);
    } else if (t === 'rc') {
      const ch = cmd.channels as number[] | undefined;
      if (ch && ch.length >= 4) {
        this.rc.roll = pwmToNorm(ch[0]!);
        this.rc.pitch = pwmToNorm(ch[1]!);
        this.rc.throttle = pwmToThrottle(ch[2]!);
        this.rc.yaw = pwmToNorm(ch[3]!);
      }
    } else if (t === 'mission_start') {
      this.mode = 'AUTO';
    }
  }

  update(dt: number): void {
    const gY = this.groundY(this.pos.x, this.pos.z);
    const agl = this.pos.y - gY;
    const dtClamped = Math.min(dt, 0.05);

    let desireRoll = 0;
    let desirePitch = 0;
    let desireYawRate = 0;
    let desireVy = 0;
    let thrustFrac = 0;

    const mode = this.mode;

    if (!this.armed) {
      thrustFrac = 0;
      this.vel.y -= GRAVITY * dtClamped;
    } else if (mode === 'LAND') {
      this.altCmd = Math.max(0.15, this.altCmd - 1.2 * dtClamped);
      desireVy = (this.altCmd - agl) * 1.4;
      thrustFrac = hoverFrac(desireVy);
      desireRoll = 0;
      desirePitch = 0;
      if (agl < 0.35 && Math.abs(this.vel.y) < 0.8) {
        this.armed = false;
        this.landed = true;
        this.mode = 'STABILIZE';
      }
    } else if (mode === 'RTL') {
      this.flyToTarget(8, agl);
      desireRoll = this._desRoll;
      desirePitch = this._desPitch;
      desireVy = this._desVy;
      thrustFrac = hoverFrac(desireVy);
      const dx = (this.targetX ?? this.homeX) - this.pos.x;
      const dz = (this.targetZ ?? this.homeZ) - this.pos.z;
      if (Math.hypot(dx, dz) < 1.5) {
        this.mode = 'LAND';
      }
    } else if (mode === 'GUIDED' || mode === 'AUTO') {
      this.flyToTarget(12, agl);
      desireRoll = this._desRoll;
      desirePitch = this._desPitch;
      desireVy = this._desVy;
      thrustFrac = hoverFrac(desireVy);
    } else if (mode === 'LOITER' || mode === 'POSHOLD') {
      this.flyToTarget(4, agl);
      desireRoll = this._desRoll + this.rc.roll * MAX_TILT * 0.45;
      desirePitch = this._desPitch + this.rc.pitch * MAX_TILT * 0.45;
      desireYawRate = this.rc.yaw * YAW_RATE;
      this.altCmd += (this.rc.throttle - 0.5) * 6 * dtClamped;
      this.altCmd = clamp(this.altCmd, 1, 120);
      desireVy = (this.altCmd - agl) * 1.6;
      thrustFrac = hoverFrac(desireVy);
    } else if (mode === 'ALT_HOLD') {
      desireRoll = this.rc.roll * MAX_TILT;
      desirePitch = this.rc.pitch * MAX_TILT;
      desireYawRate = this.rc.yaw * YAW_RATE;
      this.altCmd += (this.rc.throttle - 0.5) * 6 * dtClamped;
      this.altCmd = clamp(this.altCmd, 0.5, 120);
      desireVy = (this.altCmd - agl) * 1.8;
      thrustFrac = hoverFrac(desireVy);
    } else {
      // STABILIZE — direct attitude + throttle
      desireRoll = this.rc.roll * MAX_TILT;
      desirePitch = this.rc.pitch * MAX_TILT;
      desireYawRate = this.rc.yaw * YAW_RATE;
      thrustFrac = this.rc.throttle;
    }

    this.roll = MathUtils.damp(this.roll, desireRoll, ATT_RATE, dtClamped);
    this.pitch = MathUtils.damp(this.pitch, desirePitch, ATT_RATE, dtClamped);
    this.yaw += desireYawRate * dtClamped;

    // thrust along body up
    _E.set(this.pitch, this.yaw, -this.roll, 'YXZ');
    _Q.setFromEuler(_E);
    _THRUST.set(0, 1, 0).applyQuaternion(_Q);
    const thrust = this.armed ? thrustFrac * MAX_THRUST : 0;
    this.throttleOut = thrustFrac;
    _ACC.copy(_THRUST).multiplyScalar(thrust / MASS);
    _ACC.y -= GRAVITY;

    // quadratic-ish drag
    _ACC.x -= this.vel.x * DRAG_H;
    _ACC.z -= this.vel.z * DRAG_H;
    _ACC.y -= this.vel.y * DRAG_V;

    this.vel.addScaledVector(_ACC, dtClamped);
    this.pos.addScaledVector(this.vel, dtClamped);

    // ground collision
    const ground = this.groundY(this.pos.x, this.pos.z) + 0.12;
    if (this.pos.y < ground) {
      this.pos.y = ground;
      if (this.vel.y < 0) this.vel.y = 0;
      this.vel.x *= 0.85;
      this.vel.z *= 0.85;
      this.landed = true;
      if (!this.armed) {
        this.roll = MathUtils.damp(this.roll, 0, 8, dtClamped);
        this.pitch = MathUtils.damp(this.pitch, 0, 8, dtClamped);
      }
    } else {
      this.landed = false;
    }

    if (this.armed) {
      this.battery = Math.max(0, this.battery - BATTERY_DRAIN * (0.4 + thrustFrac) * dtClamped);
      if (this.battery <= 0.02) {
        this.armed = false;
        this.mode = 'LAND';
      }
    }

    // spin props
    const spin = this.armed ? 40 + thrustFrac * 90 : this.landed ? 0 : 8;
    this.propPhase += spin * dtClamped;
    for (const p of this.props) {
      p.mesh.rotation.y = this.propPhase * p.spin;
    }

    this.syncMesh();
  }

  private _desRoll = 0;
  private _desPitch = 0;
  private _desVy = 0;

  private flyToTarget(speed: number, agl: number): void {
    const tx = this.targetX ?? this.pos.x;
    const tz = this.targetZ ?? this.pos.z;
    const dx = tx - this.pos.x;
    const dz = tz - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const maxV = speed;
    let vx = 0;
    let vz = 0;
    if (dist > 0.4) {
      const v = Math.min(maxV, dist * TARGET_RATE);
      vx = (dx / dist) * v;
      vz = (dz / dist) * v;
      // face velocity for guided
      if (dist > 2) this.yaw = MathUtils.damp(this.yaw, Math.atan2(vx, vz), 2.5, 0.05);
    }
    // convert desired world vel to tilt (body: +pitch → -Z when yaw=0? yaw0 faces +Z)
    // body forward = (sin yaw, 0, cos yaw), right = (cos yaw, 0, -sin yaw)
    _FWD.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    _RIGHT.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const errVx = vx - this.vel.x;
    const errVz = vz - this.vel.z;
    const fwdErr = errVx * _FWD.x + errVz * _FWD.z;
    const rightErr = errVx * _RIGHT.x + errVz * _RIGHT.z;
    this._desPitch = clamp(fwdErr * 0.12, -MAX_TILT, MAX_TILT);
    this._desRoll = clamp(rightErr * 0.12, -MAX_TILT, MAX_TILT);
    this._desVy = (this.altCmd - agl) * 1.5;
  }

  syncMesh(): void {
    this.root.position.copy(this.pos);
    this.root.rotation.set(this.pitch, this.yaw, -this.roll, 'YXZ');
  }

  wgsToWorld(lat: number, lon: number): { x: number; z: number } {
    const mLat = this.geo.mPerDegLat ?? 111_320;
    const mLon = mLat * Math.cos(MathUtils.degToRad(this.geo.lat));
    return {
      x: (lon - this.geo.lon) * mLon,
      z: (lat - this.geo.lat) * mLat,
    };
  }

  worldToWgs(x: number, z: number): { lat: number; lon: number } {
    const mLat = this.geo.mPerDegLat ?? 111_320;
    const mLon = mLat * Math.cos(MathUtils.degToRad(this.geo.lat));
    return {
      lat: this.geo.lat + z / mLat,
      lon: this.geo.lon + x / mLon,
    };
  }

  telemetry(): QuadTelemetry {
    const wgs = this.worldToWgs(this.pos.x, this.pos.z);
    const gY = this.groundY(this.pos.x, this.pos.z);
    const altRel = this.pos.y - gY;
    return {
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      vx: this.vel.x,
      vy: this.vel.y,
      vz: this.vel.z,
      roll: this.roll,
      pitch: this.pitch,
      yaw: this.yaw,
      lat: wgs.lat,
      lon: wgs.lon,
      alt_amsl: this.geo.altAmsl + this.pos.y,
      alt_rel: altRel,
      armed: this.armed,
      mode: this.mode,
      battery: this.battery,
      heading_deg: ((MathUtils.radToDeg(this.yaw) % 360) + 360) % 360,
      throttle: this.throttleOut,
    };
  }
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

function hoverFrac(desireVy: number): number {
  // thrust fraction that counters gravity + climbs
  const base = GRAVITY / (MAX_THRUST / MASS);
  return clamp(base + desireVy * 0.08, 0.05, 1);
}

function pwmToNorm(pwm: number): number {
  if (pwm < 800) return 0;
  return clamp((pwm - 1500) / 500, -1, 1);
}

function pwmToThrottle(pwm: number): number {
  if (pwm < 800) return 0;
  return clamp((pwm - 1000) / 1000, 0, 1);
}
