# WildEye - AI-Powered Wildlife Monitoring System

WildEye is an AI-powered wildlife monitoring system that detects dangerous animals in real-time to prevent human-wildlife conflict and protect both communities and endangered species.

## Project Structure

```
WildEye_Project(EDI)/
├── ML_model/
│   ├── wildeye_test.py     # Animal detection script using YOLO
│   └── yolov8n.pt          # Pre-trained YOLO model (replace with your model)
├── backend/
│   └── server.js           # Node.js backend server
└── frontend/
    └── src/                # React frontend application
```

## How to Run the Complete System

### 1. Start the Backend Server

```bash
cd backend
node server.js
```

The backend server will start on port 5000 and connect to MongoDB.

### 2. Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on port 3000. Open http://localhost:3000 in your browser.

### 3. Run the Animal Detection Script

In a new terminal:

1. Make sure you have updated the paths in `ML_model/wildeye_test.py`:
   - `video_path` should point to your actual video file
   - `model_path` should point to your actual model file (best.pt)

2. Run the detection script:
```bash
cd ML_model
python wildeye_test.py
```

This will:
- Load your YOLO model
- Process the video file
- Detect animals in the video
- Send alerts to the backend server
- Display the video with detection boxes in a window

### 4. View Results

- The frontend live monitor page (http://localhost:3000/monitor) will display alerts in real-time
- The video processing window will show the video with animal detection boxes

## Current Limitations

- The web interface currently shows a demo video instead of the live video feed from the Python script
- For true live streaming, the Python script would need to be modified to stream the video to a web-compatible format