from ultralytics import YOLO
import cv2
import requests  # Import the requests library
import time      # Import time for the cooldown

# --- Define your target animals (all lowercase) ---
TARGET_ANIMALS = ["lion", "leopard", "tiger", "elephant", "deer"]

# --- Node.js Backend API Endpoint ---
# We will create this in Node.js later
API_URL = "http://localhost:5000/api/alert"  # Example URL

# --- Alert Cooldown (in seconds) ---
# Prevents spamming the server every frame
ALERT_COOLDOWN = 10  # 10 seconds
last_alert_time = 0

# --- Function to send alert to backend ---
def send_alert_to_backend(animal_name):
    global last_alert_time
    current_time = time.time()
    
    # Check if cooldown has passed
    if current_time - last_alert_time > ALERT_COOLDOWN:
        print(f"Cooldown passed. Sending alert for {animal_name} to backend...")
        try:
            # Prepare the data to send (as JSON)
            data = {
                "animal": animal_name,
                "timestamp": current_time
                # We can add location data here later
            }
            
            # Send the POST request
            response = requests.post(API_URL, json=data)
            
            if response.status_code == 200:
                print("Alert successfully sent to backend.")
                last_alert_time = current_time  # Reset cooldown
            else:
                print(f"Failed to send alert. Server responded with: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to the backend server. Is it running?")
    else:
        # This will print for frames where the animal is still visible
        # but we are in the cooldown period.
        print(f"({animal_name} still detected, but in cooldown period)")


# --- 1. Path to your local video file ---
video_path = r"D:\Wildeye - AI Powered eye on wildlife.mp4" 

# --- 2. Load YOLO model ---
model = YOLO(r"C:\Users\ASUS\Downloads\best.pt")

print("Model loaded. Class names are:")
print(model.names)
print("---------------------------------")

# --- 4. Open local video with OpenCV ---
cap = cv2.VideoCapture(video_path)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Video ended or error reading file.")
        break

    # Run YOLO detection
    results = model(frame)

    # --- 5. Check Detections and Send Alert ---
    class_names = model.names 
    
    for r in results:
        class_ids = r.boxes.cls.cpu().numpy()
        
        for cls_id in class_ids:
            animal_name = class_names[int(cls_id)]
            
            if animal_name.lower() in TARGET_ANIMALS:
                # --- THIS IS THE CHANGE ---
                # Instead of just printing, call our alert function
                send_alert_to_backend(animal_name)
                # --------------------------

    # --- 6. Draw boxes ---
    annotated = results[0].plot()
    cv2.imshow("WildEye Local Video Detection", annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()