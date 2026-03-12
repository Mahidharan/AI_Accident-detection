import cv2
import numpy as np
import requests
import time
import json
import os
import geocoder

# Configuration for Backend API Trigger
BACKEND_URL = os.getenv("BACKEND_ACCIDENT_TRIGGER_URL", "http://localhost:5000/api/accident/trigger")
LOCATION_UPDATE_URL = os.getenv("BACKEND_LOCATION_URL", "http://localhost:5000/api/auth/update-location")

# Detection thresholds (tune these based on your sample video)
FRAME_DIFF_THRESHOLD = 30        # Pixel intensity change to count as "moved"
IMPACT_CHANGE_PERCENT = 20       # % of pixels that changed drastically = impact
BRIGHTNESS_JUMP_RATIO = 1.5      # Brightness must jump 1.5x from baseline to count
WHITE_REGION_PERCENT = 10        # % of frame that is bright white = airbag
CONSECUTIVE_TRIGGERS = 3         # Number of consecutive positive frames to confirm

def get_current_location():
    """
    Tracks the user's real-time location using IP-based geolocation.
    """
    print("[AI ENGINE] Fetching user's real-time location...")
    try:
        g = geocoder.ip('me')
        if g.latlng:
            print(f"[AI ENGINE] Location acquired: {g.latlng}")
            return g.latlng[0], g.latlng[1]
        else:
            print("[AI ENGINE] Failed to get exact location, using fallback.")
    except Exception as e:
        print(f"[AI ENGINE] Geocoder error: {str(e)}")
    
    # Fallback to a default location if IP lookup fails
    return 34.0522, -118.2437

def update_user_location(vehicle_number, lat, lon):
    """
    Sends the user's current GPS location to the backend for real-time tracking.
    """
    payload = {
        "vehicleNumber": vehicle_number,
        "latitude": lat,
        "longitude": lon,
    }
    try:
        requests.post(LOCATION_UPDATE_URL, json=payload, headers={'Content-Type': 'application/json'})
    except Exception as e:
        print(f"[AI ENGINE] Location update failed: {str(e)}")

def detect_airbag_in_frame(frame, prev_frame, baseline_brightness):
    """
    Analyzes a video frame for airbag deployment indicators using multiple methods:
      1. Frame differencing — detects sudden large visual changes (collision impact)
      2. Brightness jump — detects relative brightness spike vs baseline (airbag flash)
      3. White region analysis — detects the inflated airbag (large white area)
    Returns (detected: bool, confidence: float, reason: str)
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    confidence = 0.0
    reasons = []

    # --- Method 1: Frame Differencing (sudden impact / scene change) ---
    if prev_frame is not None:
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        diff = cv2.absdiff(gray, prev_gray)
        changed_pixels = np.count_nonzero(diff > FRAME_DIFF_THRESHOLD)
        total_pixels = gray.shape[0] * gray.shape[1]
        change_percent = (changed_pixels / total_pixels) * 100

        if change_percent > IMPACT_CHANGE_PERCENT:
            confidence += 0.4
            reasons.append(f"Sudden impact ({change_percent:.1f}% pixels changed)")

    # --- Method 2: Brightness Jump (relative to rolling baseline) ---
    avg_brightness = np.mean(gray)
    if baseline_brightness > 0:
        brightness_ratio = avg_brightness / baseline_brightness
        if brightness_ratio >= BRIGHTNESS_JUMP_RATIO:
            confidence += 0.3
            reasons.append(f"Brightness jump ({brightness_ratio:.1f}x baseline, {avg_brightness:.0f}/255)")

    # --- Method 3: White Region Detection (inflated airbag) ---
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 50, 255])
    mask = cv2.inRange(hsv, lower_white, upper_white)
    white_ratio = (cv2.countNonZero(mask) / (frame.shape[0] * frame.shape[1])) * 100

    if white_ratio > WHITE_REGION_PERCENT:
        confidence += 0.3
        reasons.append(f"White region ({white_ratio:.1f}% of frame)")

    detected = confidence >= 0.6
    reason = " | ".join(reasons) if reasons else "No indicators"
    return detected, confidence, reason

def detect_accident(video_source=0, vehicle_number="TN33AB1234"):
    """
    AI accident detection from video feed (sample video or webcam).
    Monitors for airbag deployment using frame analysis.
    When airbag is detected:
      1. Tracks user's GPS location
      2. Sends alert to backend which emails the user's emergency contact
    """
    print(f"[AI ENGINE] Starting detection on source: {video_source}")
    print(f"[AI ENGINE] Monitoring vehicle: {vehicle_number}")

    # Initialize video capture
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print(f"[AI ENGINE] Error: Could not open video source '{video_source}'.")
        print("[AI ENGINE] Falling back to local webcam (0)")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[AI ENGINE] Error: No video sources available.")
            return

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[AI ENGINE] Video FPS: {fps:.0f} | Total frames: {total_frames}")

    frame_count = 0
    prev_frame = None
    consecutive_detections = 0
    cooldown_frames = 0
    COOLDOWN_DURATION = int(fps * 10)  # 10 seconds cooldown after a trigger
    LOCATION_UPDATE_INTERVAL = int(fps * 5)  # Update location every 5 seconds
    alert_sent = False
    baseline_brightness = 0.0  # Rolling average of normal scene brightness
    BASELINE_FRAMES = int(fps * 3)  # Use first 3 seconds to establish baseline

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                if alert_sent:
                    print("\n[AI ENGINE] Video finished. Accident was detected and reported.")
                    break
                print("[AI ENGINE] End of video stream. Looping back...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                frame_count = 0
                prev_frame = None
                consecutive_detections = 0
                continue

            frame_count += 1

            # Build brightness baseline from the first few seconds
            gray_for_baseline = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            current_brightness = np.mean(gray_for_baseline)
            if frame_count <= BASELINE_FRAMES:
                # Accumulate running average
                baseline_brightness = ((baseline_brightness * (frame_count - 1)) + current_brightness) / frame_count
                cv2.putText(frame, f"Calibrating baseline... ({frame_count}/{BASELINE_FRAMES})", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                prev_frame = frame.copy()
                cv2.imshow('AI Accident Monitor', frame)
                if cv2.waitKey(int(1000 / fps)) & 0xFF == ord('q'):
                    break
                continue

            # Periodically update user location
            if frame_count % LOCATION_UPDATE_INTERVAL == 0:
                lat, lon = get_current_location()
                update_user_location(vehicle_number, lat, lon)

            # --- AIRBAG / ACCIDENT DETECTION ---
            if cooldown_frames > 0:
                cooldown_frames -= 1
                cv2.putText(frame, "ACCIDENT REPORTED - Emergency Services Notified", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
                progress = f"Frame {frame_count}/{total_frames}"
                cv2.putText(frame, progress, (10, frame.shape[0] - 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            else:
                detected, confidence, reason = detect_airbag_in_frame(frame, prev_frame, baseline_brightness)

                if detected:
                    consecutive_detections += 1
                else:
                    consecutive_detections = max(0, consecutive_detections - 1)

                # Require multiple consecutive positive frames to confirm
                is_confirmed = consecutive_detections >= CONSECUTIVE_TRIGGERS

                if is_confirmed:
                    # Get precise GPS location at the moment of the accident
                    lat, lon = get_current_location()

                    print("\n" + "=" * 60)
                    print("[AI ENGINE] *** AIRBAG DEPLOYMENT CONFIRMED ***")
                    print(f"[AI ENGINE] Confidence: {confidence * 100:.0f}%")
                    print(f"[AI ENGINE] Reason: {reason}")
                    print(f"[AI ENGINE] Frame: {frame_count}")
                    print(f"[AI ENGINE] Vehicle: {vehicle_number}")
                    print(f"[AI ENGINE] GPS Location: {lat}, {lon}")
                    print("[AI ENGINE] Sending EMAIL alert to registered emergency contact...")
                    print("=" * 60)

                    # Draw alert overlay on frame
                    overlay = frame.copy()
                    cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]), (0, 0, 255), -1)
                    frame = cv2.addWeighted(overlay, 0.3, frame, 0.7, 0)
                    cv2.putText(frame, "!! AIRBAG DEPLOYED !!", (30, frame.shape[0] // 2 - 40),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
                    cv2.putText(frame, f"Confidence: {confidence * 100:.0f}%", (30, frame.shape[0] // 2 + 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
                    cv2.putText(frame, "EMAIL ALERT SENT TO EMERGENCY CONTACT", (30, frame.shape[0] // 2 + 60),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 3)
                    cv2.imshow('AI Accident Monitor', frame)
                    cv2.waitKey(3000)  # Pause to show alert

                    # Trigger the backend
                    trigger_accident_event(vehicle_number=vehicle_number, lat=lat, lon=lon)

                    cooldown_frames = COOLDOWN_DURATION
                    consecutive_detections = 0
                    alert_sent = True
                else:
                    # Show monitoring status with detection info
                    status_color = (0, 255, 255) if detected else (0, 255, 0)
                    status_text = f"Analyzing... [{consecutive_detections}/{CONSECUTIVE_TRIGGERS}]" if detected else "Monitoring - No Airbag Detected"
                    cv2.putText(frame, status_text, (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

                    if detected:
                        cv2.putText(frame, f"Signal: {reason}", (10, 60),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)

                # Show frame progress
                progress = f"Frame {frame_count}/{total_frames} | FPS: {fps:.0f}"
                cv2.putText(frame, progress, (10, frame.shape[0] - 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            prev_frame = frame.copy()
            cv2.imshow('AI Accident Monitor', frame)

            # Press 'q' to quit
            if cv2.waitKey(int(1000 / fps)) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        print("\n[AI ENGINE] Stopped by user.")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        if alert_sent:
            print("[AI ENGINE] Session ended. Accident alert was dispatched.")
        else:
            print("[AI ENGINE] Session ended. No accidents detected.")

def trigger_accident_event(vehicle_number, lat, lon):
    """
    Sends the accident event to the Node.js backend.
    Backend will:
      1. Look up the user by vehicle number
      2. Send SMS to user's registered phone number
      3. Send SMS to user's emergency contact
      4. Notify nearest hospital and police
    """
    payload = {
        "vehicleNumber": vehicle_number,
        "latitude": lat,
        "longitude": lon,
        "airbagDeployed": True,
        "timestamp": int(time.time() * 1000)
    }
    
    try:
        print(f"[AI ENGINE] Sending payload to Backend: {BACKEND_URL}")
        response = requests.post(BACKEND_URL, json=payload, headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            data = response.json()
            print("\n[BACKEND RESPONSE] Accident alert registered successfully.")
            
            if data.get('emailSentTo'):
                for recipient in data['emailSentTo']:
                    print(f"  Email Sent to: {recipient}")
            
            if data.get('nearestHospital'):
                print(f"  Notified Nearest Hospital: {data['nearestHospital']['name']}")
            if data.get('nearestPolice'):
                print(f"  Notified Nearest Police: {data['nearestPolice']['name']}")
            print("====================================================\n")
        else:
            print(f"[AI ENGINE] Failed to trigger alert. Status: {response.status_code}")
            try:
                print(f"[AI ENGINE] Response: {response.text}")
            except Exception:
                pass
            
    except Exception as e:
        print(f"[AI ENGINE] Connection error to backend API: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("  AI Airbag Deployment Detection System")
    print("  Detects accidents from video feed via airbag analysis")
    print("=" * 60)
    print("Controls: Press 'q' to quit\n")

    # Vehicle number to monitor
    # Priority: Command line arg > Environment variable > Default
    import sys
    if len(sys.argv) > 1:
        vehicle = sys.argv[1].replace(" ", "").upper()
    else:
        vehicle = os.getenv("VEHICLE_NUMBER", "TN42BA6555")

    # Use sample video in the ai_engine directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    video_file = os.path.join(script_dir, "mock-accident-video.mp4")

    if os.path.exists(video_file):
        print(f"[AI ENGINE] Loading sample video: {video_file}")
        print(f"[AI ENGINE] Vehicle being monitored: {vehicle}")
        print(f"[AI ENGINE] Detection thresholds:")
        print(f"  - Frame diff threshold: {FRAME_DIFF_THRESHOLD}")
        print(f"  - Impact change percent: {IMPACT_CHANGE_PERCENT}%")
        print(f"  - Brightness jump ratio: {BRIGHTNESS_JUMP_RATIO}x baseline")
        print(f"  - White region: {WHITE_REGION_PERCENT}%")
        print(f"  - Consecutive confirms needed: {CONSECUTIVE_TRIGGERS}")
        print()
    else:
        print(f"[AI ENGINE] Warning: '{video_file}' not found.")
        print("[AI ENGINE] Place a sample accident video as 'mock-accident-video.mp4' in the ai_engine folder.")
        print("[AI ENGINE] Falling back to webcam...\n")

    detect_accident(video_file, vehicle_number=vehicle)
