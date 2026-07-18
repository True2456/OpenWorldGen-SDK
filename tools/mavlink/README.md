# LAAS soft vehicle (pymavlink)

Bridge between the browser quad (`?scene=drone`) and a MAVLink GCS such as **Mission Planner** or **QGroundControl**.

Browsers cannot open UDP sockets, so this process:

1. Speaks **MAVLink over UDP** to the GCS (default `udpout:127.0.0.1:14550`)
2. Speaks **JSON over WebSocket** to the LAAS page (`ws://127.0.0.1:8765`)

Physics live in the browser; this bridge is a soft FC that streams telemetry and forwards arm / mode / RC / guided commands.

## Setup

```bash
python3 -m venv tools/mavlink/.venv
tools/mavlink/.venv/bin/pip install -r tools/mavlink/requirements.txt
```

## Run

Terminal 1 — bridge:

```bash
npm run mavlink
# or: tools/mavlink/.venv/bin/python tools/mavlink/soft_vehicle.py
```

Terminal 2 — world:

```bash
npm run dev
```

Open `http://localhost:5173/?scene=drone&mav=1`.

GCS:

- **Mission Planner**: connection type **UDP**, port **14550**
- **QGroundControl**: Comm Links → UDP, listen **14550** (or Auto-connect to UDP)

## What works

- Heartbeat as quadrotor / ArduPilot-compatible custom modes
- `GLOBAL_POSITION_INT`, `ATTITUDE`, `VFR_HUD`, `GPS_RAW_INT`, `SYS_STATUS`
- Arm / disarm, mode change, takeoff, land, RTL
- Guided goto / reposition
- RC override + `MANUAL_CONTROL`

## Limits

This is **not** ArduPilot SITL. No parameter tree, no full AUTO mission upload, no EKF. For a full autopilot stack, point the browser (later) at real SITL UDP instead of this soft vehicle.

## Keyboard (browser)

`B` arm · `T` takeoff · `G` land · `M` mode · `I/K` pitch · `J/L` roll · `U/O` yaw · `R/F` throttle
