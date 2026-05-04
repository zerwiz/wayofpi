# System Startup Diagnosis and Fix Report
**Date:** 2026-05-04
**Status:** Resolved

## 1. Problem Description
The `start-wayofpi.sh` script failed to reliably start and maintain the Way of Pi system (Bun server and Vite UI). Even when it appeared to start, the processes would terminate immediately after the script finished.

## 2. Root Cause Analysis

### A. PID Extraction Bug (Port Conflict)
The `kill_on_port` function in `start-wayofpi.sh` was failing to correctly identify process IDs on ports 3333 and 5173.
- **Symptom:** Servers would fail with `EADDRINUSE`.
- **Cause:** The script was using `ss -tlnp` and a greedy `grep -oE '[0-9]+' | tail -1`. In Bun's case, the output includes `fd=11`, and the script was accidentally grabbing the file descriptor `11` instead of the actual `pid`.
- **Evidence:** `LISTEN 0 512 *:3333 *:* users:(("bun",pid=672877,fd=11))` -> script tried to `kill -9 11`.

### B. Early Exit & SIGHUP (Process Persistence)
The script was starting servers in the background and then exiting immediately.
- **Symptom:** Logs showed `cross-env ... exited with code SIGHUP`.
- **Cause:** When a parent shell script exits, background processes often receive a `SIGHUP` (Hangup) signal. Since the script didn't `wait` for the processes, they were killed as soon as the terminal "finished" the script execution.

### C. Justfile Regressions
The `justfile` had several broken or missing targets:
- `wayofpi-full` target name was missing, leaving a blank line and making the command unreachable.
- `wayofpi-full` pointed to a non-existent `start-full-system.sh`.
- `wayofpi-electron` pointed to a non-existent `start-wayofpi-electron.sh`.

## 3. Implemented Fixes

### A. Improved `start-wayofpi.sh`
- **Robust Port Killing:** Updated `kill_on_port` to prioritize `lsof -t`. Added a specific regex for `ss` (`pid=\K[0-9]+`) to ensure it only captures the PID, not the file descriptor.
- **Process Waiting:** Added `wait "$DEV_PID"` at the end of the script. This keeps the script active in the foreground, prevents `SIGHUP`, and allows the user to see live logs and stop the system with `Ctrl+C`.

### B. Justfile Cleanup
- Restored the `wayofpi-full` target name and pointed it to the working `start-wayofpi.sh`.
- Updated `wayofpi-electron` to run `bun run electron:dev` directly from the `apps/wayofpi-ui` directory.

## 4. Verification
- **Cold Start:** Verified that the script starts both servers and waits for the UI to be ready.
- **Port Reuse:** Verified that running the script while servers are already active correctly identifies the real PIDs and restarts them without conflict.
- **Persistence:** Verified that servers stay running as long as the script is active.

## 5. Cleaned Up Artifacts
- Removed legacy/temporary log files from the project root:
    - `startup.log`
    - `startup_test.log`
    - `restore_test.log` (and variants 2, 3, 4)
