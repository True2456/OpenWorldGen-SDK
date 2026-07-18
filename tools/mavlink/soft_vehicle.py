#!/usr/bin/env python3
"""
LAAS soft vehicle — pymavlink UDP GCS ↔ WebSocket browser bridge.

Mission Planner / QGroundControl see a MAVLink vehicle on UDP.
The browser sim owns physics and streams pose; the GCS sends modes,
arming, RC, and guided commands through this process.

Typical setup (Mission Planner "UDP" / QGC UDP listen on 14550):

  python3 tools/mavlink/soft_vehicle.py
  # then open http://localhost:5173/?scene=drone&mav=1

  GCS connection: UDP, listen port 14550 (default).
  Browser WebSocket: ws://127.0.0.1:8765
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import signal
import time
from typing import Any

from pymavlink import mavutil
from pymavlink.dialects.v20 import common as mavlink2

try:
    from websockets.asyncio.server import serve
except ImportError as e:  # pragma: no cover
    raise SystemExit("Install deps: pip install -r tools/mavlink/requirements.txt") from e


# Copter mode numbers (ArduCopter-compatible so GCS mode lists work)
MODE_STABILIZE = 0
MODE_ALT_HOLD = 2
MODE_LOITER = 5
MODE_RTL = 6
MODE_AUTO = 3
MODE_LAND = 9
MODE_GUIDED = 4
MODE_POSHOLD = 16

MODE_BY_NAME = {
    "STABILIZE": MODE_STABILIZE,
    "ALT_HOLD": MODE_ALT_HOLD,
    "LOITER": MODE_LOITER,
    "RTL": MODE_RTL,
    "AUTO": MODE_AUTO,
    "LAND": MODE_LAND,
    "GUIDED": MODE_GUIDED,
    "POSHOLD": MODE_POSHOLD,
}
MODE_BY_NUM = {v: k for k, v in MODE_BY_NAME.items()}


class SoftVehicle:
    def __init__(self, gcs_out: str, system_id: int, component_id: int) -> None:
        self.mav = mavutil.mavlink_connection(
            gcs_out,
            source_system=system_id,
            source_component=component_id,
        )
        self.system_id = system_id
        self.component_id = component_id
        self.ws: Any = None
        self.state: dict[str, Any] = {
            "x": 0.0,
            "y": 2.0,
            "z": 0.0,
            "vx": 0.0,
            "vy": 0.0,
            "vz": 0.0,
            "roll": 0.0,
            "pitch": 0.0,
            "yaw": 0.0,
            "lat": -33.732,
            "lon": 150.280,
            "alt_amsl": 980.0,
            "alt_rel": 2.0,
            "armed": False,
            "mode": "STABILIZE",
            "battery": 1.0,
            "heading_deg": 0.0,
        }
        self.home_lat = self.state["lat"]
        self.home_lon = self.state["lon"]
        self.home_alt = self.state["alt_amsl"]
        self.boot_ms = int(time.time() * 1000)
        self.seq = 0

    def boot_time_ms(self) -> int:
        return int(time.time() * 1000) - self.boot_ms

    async def broadcast(self, msg: dict[str, Any]) -> None:
        if self.ws is None:
            return
        try:
            await self.ws.send(json.dumps(msg))
        except Exception:
            self.ws = None

    def mode_num(self) -> int:
        return MODE_BY_NAME.get(str(self.state.get("mode", "STABILIZE")).upper(), MODE_STABILIZE)

    def send_heartbeat(self) -> None:
        base = mavlink2.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
        base |= mavlink2.MAV_MODE_FLAG_MANUAL_INPUT_ENABLED
        if self.state.get("armed"):
            base |= mavlink2.MAV_MODE_FLAG_SAFETY_ARMED
        self.mav.mav.heartbeat_send(
            mavlink2.MAV_TYPE_QUADROTOR,
            mavlink2.MAV_AUTOPILOT_ARDUPILOTMEGA,
            base,
            self.mode_num(),
            mavlink2.MAV_STATE_ACTIVE if self.state.get("armed") else mavlink2.MAV_STATE_STANDBY,
        )

    def send_telemetry(self) -> None:
        s = self.state
        t = self.boot_time_ms()
        lat = int(float(s["lat"]) * 1e7)
        lon = int(float(s["lon"]) * 1e7)
        alt_mm = int(float(s["alt_amsl"]) * 1000)
        rel_mm = int(float(s["alt_rel"]) * 1000)
        # LAAS world: +X east, +Y up, +Z north → NED: x north, y east, z down
        vx = int(float(s["vz"]) * 100)  # cm/s north
        vy = int(float(s["vx"]) * 100)  # cm/s east
        vz = int(-float(s["vy"]) * 100)  # cm/s down
        hdg = int((float(s.get("heading_deg", 0.0)) % 360.0) * 100)

        self.mav.mav.heartbeat_send(
            mavlink2.MAV_TYPE_QUADROTOR,
            mavlink2.MAV_AUTOPILOT_ARDUPILOTMEGA,
            (
                mavlink2.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
                | mavlink2.MAV_MODE_FLAG_MANUAL_INPUT_ENABLED
                | (mavlink2.MAV_MODE_FLAG_SAFETY_ARMED if s.get("armed") else 0)
            ),
            self.mode_num(),
            mavlink2.MAV_STATE_ACTIVE if s.get("armed") else mavlink2.MAV_STATE_STANDBY,
        )

        self.mav.mav.sys_status_send(
            0,
            0,
            0,
            0,
            int(max(0.0, min(1.0, float(s.get("battery", 1.0)))) * 12500),
            -1,
            int(max(0.0, min(1.0, float(s.get("battery", 1.0)))) * 100),
            0,
            0,
            0,
            0,
            0,
            0,
        )

        self.mav.mav.attitude_send(
            t,
            float(s["roll"]),
            float(s["pitch"]),
            float(s["yaw"]),
            0.0,
            0.0,
            0.0,
        )

        self.mav.mav.global_position_int_send(
            t,
            lat,
            lon,
            alt_mm,
            rel_mm,
            vx,
            vy,
            vz,
            hdg,
        )

        self.mav.mav.vfr_hud_send(
            math.hypot(float(s["vx"]), float(s["vz"])),
            0.0,
            int(float(s.get("heading_deg", 0.0)) % 360),
            int(max(0.0, min(1.0, float(s.get("throttle", 0.0)))) * 100),
            float(s["alt_amsl"]),
            float(s["vy"]),
        )

        self.mav.mav.gps_raw_int_send(
            t * 1000,
            mavlink2.GPS_FIX_TYPE_3D_FIX,
            lat,
            lon,
            alt_mm,
            80,
            65535,
            0,
            0,
            12,
        )

        self.mav.mav.home_position_send(
            int(self.home_lat * 1e7),
            int(self.home_lon * 1e7),
            int(self.home_alt * 1000),
            0.0,
            0.0,
            0.0,
            [1.0, 0.0, 0.0, 0.0],
            0.0,
            0.0,
            0.0,
            0,
        )

    def handle_mav_message(self, msg: Any) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        if msg is None:
            return out
        mtype = msg.get_type()
        if mtype == "HEARTBEAT":
            return out
        if mtype == "REQUEST_DATA_STREAM":
            # ignore — we push a fixed set
            return out
        if mtype == "COMMAND_LONG":
            out.extend(self._command_long(msg))
        elif mtype == "COMMAND_INT":
            out.extend(self._command_int(msg))
        elif mtype == "SET_MODE":
            custom = int(getattr(msg, "custom_mode", 0))
            name = MODE_BY_NUM.get(custom, "STABILIZE")
            self.state["mode"] = name
            out.append({"type": "set_mode", "mode": name})
            self._ack_command(mavlink2.MAV_CMD_DO_SET_MODE, mavlink2.MAV_RESULT_ACCEPTED)
        elif mtype == "MANUAL_CONTROL":
            out.append(
                {
                    "type": "manual",
                    "x": int(msg.x),
                    "y": int(msg.y),
                    "z": int(msg.z),
                    "r": int(msg.r),
                    "buttons": int(getattr(msg, "buttons", 0)),
                }
            )
        elif mtype == "RC_CHANNELS_OVERRIDE":
            ch = [
                int(getattr(msg, f"chan{i}_raw", 0) or 0)
                for i in range(1, 9)
            ]
            out.append({"type": "rc", "channels": ch})
        elif mtype == "MISSION_ITEM_INT" or mtype == "MISSION_ITEM":
            out.extend(self._mission_item(msg))
        elif mtype == "SET_POSITION_TARGET_GLOBAL_INT":
            out.append(
                {
                    "type": "goto",
                    "lat": msg.lat_int / 1e7,
                    "lon": msg.lon_int / 1e7,
                    "alt": float(msg.alt),
                }
            )
        return out

    def _ack_command(self, command: int, result: int) -> None:
        self.mav.mav.command_ack_send(command, result)

    def _command_long(self, msg: Any) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        cmd = int(msg.command)
        if cmd == mavlink2.MAV_CMD_COMPONENT_ARM_DISARM:
            armed = float(msg.param1) >= 0.5
            self.state["armed"] = armed
            out.append({"type": "arm", "armed": armed})
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        elif cmd == mavlink2.MAV_CMD_DO_SET_MODE:
            custom = int(msg.param2)
            name = MODE_BY_NUM.get(custom, "STABILIZE")
            self.state["mode"] = name
            out.append({"type": "set_mode", "mode": name})
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        elif cmd == mavlink2.MAV_CMD_NAV_TAKEOFF:
            alt = float(msg.param7) if float(msg.param7) != 0 else 10.0
            self.state["mode"] = "GUIDED"
            out.append({"type": "takeoff", "alt": alt})
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        elif cmd == mavlink2.MAV_CMD_NAV_LAND:
            self.state["mode"] = "LAND"
            out.append({"type": "land"})
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        elif cmd == mavlink2.MAV_CMD_NAV_RETURN_TO_LAUNCH:
            self.state["mode"] = "RTL"
            out.append({"type": "rtl"})
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        elif cmd == mavlink2.MAV_CMD_MISSION_START:
            self.state["mode"] = "AUTO"
            out.append({"type": "mission_start"})
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        else:
            self._ack_command(cmd, mavlink2.MAV_RESULT_UNSUPPORTED)
        return out

    def _command_int(self, msg: Any) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        cmd = int(msg.command)
        if cmd == mavlink2.MAV_CMD_DO_REPOSITION or cmd == mavlink2.MAV_CMD_NAV_WAYPOINT:
            out.append(
                {
                    "type": "goto",
                    "lat": msg.x / 1e7,
                    "lon": msg.y / 1e7,
                    "alt": float(msg.z),
                }
            )
            self.state["mode"] = "GUIDED"
            self._ack_command(cmd, mavlink2.MAV_RESULT_ACCEPTED)
        else:
            self._ack_command(cmd, mavlink2.MAV_RESULT_UNSUPPORTED)
        return out

    def _mission_item(self, msg: Any) -> list[dict[str, Any]]:
        # Accept single guided-style mission items as goto
        frame = int(getattr(msg, "frame", 0))
        cmd = int(getattr(msg, "command", 0))
        if cmd in (mavlink2.MAV_CMD_NAV_WAYPOINT, mavlink2.MAV_CMD_NAV_TAKEOFF):
            if hasattr(msg, "x") and abs(float(msg.x)) > 180:  # MISSION_ITEM_INT
                lat, lon = msg.x / 1e7, msg.y / 1e7
            else:
                lat, lon = float(msg.x), float(msg.y)
            alt = float(msg.z)
            kind = "takeoff" if cmd == mavlink2.MAV_CMD_NAV_TAKEOFF else "goto"
            return [{"type": kind, "lat": lat, "lon": lon, "alt": alt, "frame": frame}]
        return []


async def mav_poll_loop(vehicle: SoftVehicle) -> None:
    while True:
        msg = vehicle.mav.recv_match(blocking=False)
        while msg is not None:
            cmds = vehicle.handle_mav_message(msg)
            for c in cmds:
                await vehicle.broadcast(c)
            msg = vehicle.mav.recv_match(blocking=False)
        await asyncio.sleep(0.01)


async def telemetry_loop(vehicle: SoftVehicle, rate_hz: float) -> None:
    dt = 1.0 / rate_hz
    while True:
        try:
            vehicle.send_telemetry()
        except Exception as exc:  # pragma: no cover
            print(f"[mav] telemetry send error: {exc}")
        await asyncio.sleep(dt)


async def ws_handler(vehicle: SoftVehicle, websocket: Any) -> None:
    print(f"[ws] browser connected from {websocket.remote_address}")
    vehicle.ws = websocket
    await websocket.send(
        json.dumps(
            {
                "type": "hello",
                "home": {"lat": vehicle.home_lat, "lon": vehicle.home_lon, "alt": vehicle.home_alt},
            }
        )
    )
    try:
        async for raw in websocket:
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(data, dict):
                continue
            if data.get("type") == "state":
                for k in (
                    "x",
                    "y",
                    "z",
                    "vx",
                    "vy",
                    "vz",
                    "roll",
                    "pitch",
                    "yaw",
                    "lat",
                    "lon",
                    "alt_amsl",
                    "alt_rel",
                    "armed",
                    "mode",
                    "battery",
                    "heading_deg",
                    "throttle",
                ):
                    if k in data:
                        vehicle.state[k] = data[k]
                if data.get("set_home"):
                    vehicle.home_lat = float(data["lat"])
                    vehicle.home_lon = float(data["lon"])
                    vehicle.home_alt = float(data["alt_amsl"])
            elif data.get("type") == "ping":
                await websocket.send(json.dumps({"type": "pong", "t": data.get("t")}))
    finally:
        if vehicle.ws is websocket:
            vehicle.ws = None
        print("[ws] browser disconnected")


async def main_async(args: argparse.Namespace) -> None:
    vehicle = SoftVehicle(args.gcs, args.sysid, args.compid)
    vehicle.home_lat = args.lat
    vehicle.home_lon = args.lon
    vehicle.home_alt = args.alt
    vehicle.state["lat"] = args.lat
    vehicle.state["lon"] = args.lon
    vehicle.state["alt_amsl"] = args.alt
    vehicle.state["alt_rel"] = 0.0

    print(f"[laas] soft vehicle → GCS {args.gcs}  (open Mission Planner/QGC UDP {args.listen_hint})")
    print(f"[laas] WebSocket ws://{args.ws_host}:{args.ws_port}")
    print(f"[laas] home WGS84 {args.lat:.6f},{args.lon:.6f} alt {args.alt:.1f} m")

    async with serve(lambda ws: ws_handler(vehicle, ws), args.ws_host, args.ws_port):
        await asyncio.gather(
            mav_poll_loop(vehicle),
            telemetry_loop(vehicle, args.rate),
        )


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="LAAS pymavlink soft vehicle bridge")
    p.add_argument(
        "--gcs",
        default="udpout:127.0.0.1:14550",
        help="pymavlink connection string toward GCS (default udpout:127.0.0.1:14550)",
    )
    p.add_argument("--ws-host", default="127.0.0.1")
    p.add_argument("--ws-port", type=int, default=8765)
    p.add_argument("--sysid", type=int, default=1)
    p.add_argument("--compid", type=int, default=1)
    p.add_argument("--rate", type=float, default=10.0, help="telemetry Hz to GCS")
    p.add_argument("--lat", type=float, default=-33.732, help="home latitude")
    p.add_argument("--lon", type=float, default=150.280, help="home longitude")
    p.add_argument("--alt", type=float, default=980.0, help="home AMSL meters")
    p.add_argument(
        "--listen-hint",
        default="14550",
        help="printed hint for GCS listen port",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def _stop(*_a: object) -> None:
        for task in asyncio.all_tasks(loop):
            task.cancel()

    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    try:
        loop.run_until_complete(main_async(args))
    except (asyncio.CancelledError, KeyboardInterrupt):
        print("\n[laas] soft vehicle stopped")
    finally:
        loop.close()


if __name__ == "__main__":
    main()
