"""
MediRush - Virtual IoT Hardware Traffic Light Simulator
Emulates physical ESP32 LED traffic light hardware nodes in the terminal.
"""

import time
import requests
import sys
import os

BACKEND_URL = "http://127.0.0.1:8000/api/v1/signals"

# ANSI Color codes for terminal emulation
RED_BULB = "\033[91m● RED\033[0m"
YELLOW_BULB = "\033[93m● YELLOW\033[0m"
GREEN_BULB = "\033[92m● GREEN\033[0m"
PREEMPT_GREEN_BULB = "\033[92;1;5m🚨 [GREEN WAVE PREEMPTED]\033[0m"

def render_terminal_signals():
    print("\033[2J\033[H", end="") # Clear screen
    print("=" * 70)
    print("   🚦 MediRush IoT Smart Traffic Signal Mesh - Virtual Hardware Node")
    print("=" * 70)
    print(f"Connecting to Backend at: {BACKEND_URL}\n")

    while True:
        try:
            res = requests.get(BACKEND_URL, timeout=2.0)
            if res.status_code == 200:
                signals = res.json()
                print("\033[2J\033[H", end="")
                print("=" * 75)
                print("   🚦 MediRush IoT Smart Traffic Signal Mesh - Live Physical Node Monitor")
                print("=" * 75)
                print(f"{'SIGNAL ID':<26} | {'INTERSECTION NAME':<26} | {'HARDWARE STATE'}")
                print("-" * 75)

                for sig in signals:
                    state_str = sig["current_state"]
                    is_preempted = sig.get("is_preempted", False)

                    if is_preempted or state_str == "PREEMPTION_GREEN":
                        bulb = PREEMPT_GREEN_BULB
                    elif state_str == "GREEN":
                        bulb = GREEN_BULB
                    elif state_str == "YELLOW":
                        bulb = YELLOW_BULB
                    else:
                        bulb = RED_BULB

                    print(f"{sig['signal_id']:<26} | {sig['name'][:25]:<26} | {bulb}")

                print("-" * 75)
                print("Node Status: SYNCED (600ms heartbeat) | Press Ctrl+C to exit.")
            else:
                print(f"Server returned status {res.status_code}")
        except Exception as e:
            print(f"Waiting for MediRush backend server on port 8000... ({e})")

        time.sleep(0.6)

if __name__ == "__main__":
    try:
        render_terminal_signals()
    except KeyboardInterrupt:
        print("\nVirtual Hardware Node shutdown cleanly.")
