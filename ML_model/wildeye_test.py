from ultralytics import YOLO
import cv2
import requests  # Import the requests library
import time      # Import time for the cooldown
import os       # Import os for path handling
import numpy as np
from datetime import datetime

# --- Define your target animals (all lowercase) ---
TARGET_ANIMALS = ["elephant", "bear", "zebra", "giraffe", "leopard", "lion", "tiger", "cheetah", "jaguar", "fox", "wolf", "deer", "boar"]

# --- NEW: Define Conservation Status Dictionary ---
# This maps the animal name to its status
CONSERVATION_STATUS = {
    "elephant": "Endangered",
    "bear": "Vulnerable",
    "zebra": "Least Concern",
    "giraffe": "Vulnerable",
    "leopard": "Vulnerable",
    "lion": "Vulnerable",
    "tiger": "Endangered",
    "cheetah": "Vulnerable",
    "jaguar": "Near Threatened",
    "fox": "Least Concern",
    "wolf": "Least Concern",
    "deer": "Least Concern",
    "boar": "Least Concern"
}

# --- Node.js Backend API Endpoint ---
API_URL = "http://localhost:5000/api/alert"

# --- Alert Cooldown (in seconds) ---
ALERT_COOLDOWN = 20  # Changed from 5 to 20 seconds
last_alert_time = 0

# --- Function to send alert to backend ---
def send_alert_to_backend(animal_name):
    global last_alert_time
    current_time = time.time()
    
    # Check if cooldown has passed
    if current_time - last_alert_time > ALERT_COOLDOWN:
        print(f"Cooldown passed. Sending alert for {animal_name} to backend...")
        
        # --- NEW: Get the status from our dictionary ---
        # .get() looks up the name, defaults to "Unknown" if not found
        status = CONSERVATION_STATUS.get(animal_name.lower(), "Unknown")
        
        try:
            # Prepare the data to send (now includes 'status')
            data = {
                "animal": animal_name,
                "status": status,  # <--- Sending the new info
                "timestamp": current_time
            }
            
            # Send the POST request
            response = requests.post(API_URL, json=data)
            
            if response.status_code == 200:
                print(f"Alert sent! ({animal_name}: {status})")
                last_alert_time = current_time  # Reset cooldown
            else:
                print(f"Failed to send alert. Server responded with: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to the backend server. Is it running?")
        except Exception as e:
            print(f"Error sending alert: {e}")
    else:
        print(f"({animal_name} still detected, but in cooldown period)")

# --- 1. Path to your local video file ---
# Using your actual video file
video_path = r"D:\Wildeye - AI Powered eye on wildlife.mp4"

# --- 2. Load YOLO model ---
# Using your new trained YOLO model
model_path = r"C:\Users\ASUS\Downloads\my_new_model\runs\detect\train\weights\best.pt"  # <-- Updated to your model path

# Check if files exist before proceeding
if not os.path.exists(video_path):
    print(f"ERROR: Video file not found at {video_path}")
    print("Please update the video_path variable to point to your actual video file")
    exit(1)

if not os.path.exists(model_path):
    print(f"ERROR: Model file not found at {model_path}")
    print("Please update the model_path variable to point to your actual model file")
    exit(1)

try:
    model = YOLO(model_path)
    print("Model loaded successfully!")
except Exception as e:
    print(f"ERROR: Failed to load model from {model_path}")
    print(f"Error details: {e}")
    exit(1)

print("Model loaded. Class names are:")
print(model.names)
print("---------------------------------")

# --- 4. Open local video with OpenCV ---
cap = cv2.VideoCapture(video_path)

# Check if video opened successfully
if not cap.isOpened():
    print(f"ERROR: Could not open video file {video_path}")
    exit(1)

frame_count = 0
print("Starting video processing... Press 'q' to quit")

# Create directory for saving frames if it doesn't exist
frames_dir = r"c:\VS code\WildEye_Project(EDI)\backend"
frame_path = os.path.join(frames_dir, "latest_frame.jpg")

# Ensure the directory exists
os.makedirs(frames_dir, exist_ok=True)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Video ended or error reading file.")
        # Try to reopen the video file
        cap.release()
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"ERROR: Could not reopen video file {video_path}")
            break
        continue
    
    frame_count += 1
    print(f"Processing frame {frame_count}")

    # Resize frame for better performance
    frame_resized = cv2.resize(frame, (640, 480))

    # Run YOLO detection
    try:
        results = model(frame_resized)
    except Exception as e:
        print(f"Error during detection: {e}")
        continue

    # --- 5. Check Detections and Send Alert ---
    class_names = model.names 
    
    detections_found = False
    for r in results:
        class_ids = r.boxes.cls.cpu().numpy()
        confidences = r.boxes.conf.cpu().numpy()
        
        for i, cls_id in enumerate(class_ids):
            animal_name = class_names[int(cls_id)]
            confidence = confidences[i]
            
            # Only send alerts for high-confidence detections
            if animal_name.lower() in TARGET_ANIMALS and confidence > 0.5:
                send_alert_to_backend(animal_name)
                detections_found = True
    
    if detections_found:
        print(f"Frame {frame_count}: Detections found")
    else:
        print(f"Frame {frame_count}: No target animals detected")

    # --- 6. Draw boxes ---
    annotated = results[0].plot()
    
    # Save the annotated frame for web display
    try:
        success = cv2.imwrite(frame_path, annotated)
        if success:
            print(f"Frame saved to {frame_path}")
        else:
            print(f"Failed to save frame to {frame_path}")
    except Exception as e:
        print(f"Error saving frame: {e}")
    
    # Show the frame in a window (optional)
    cv2.imshow("WildEye Local Video Detection", annotated)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("Quitting...")
        break

cap.release()
cv2.destroyAllWindows()
print("Video processing completed.")