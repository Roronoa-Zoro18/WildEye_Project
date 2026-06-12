import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './LiveMonitor.css';

const LiveMonitor = () => {
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const fetchIntervalRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection with better reconnection options
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000
    });

    // Listen for connection events
    socketRef.current.on('connect', () => {
      console.log('Socket connected with id:', socketRef.current.id);
      setConnectionStatus('connected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
      setConnectionStatus('error');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Disconnection was initiated by the server, reconnect manually
        socketRef.current.connect();
      }
      setConnectionStatus('disconnected');
    });

    // Listen for new alerts from the backend
    socketRef.current.on('new-alert', (newAlert) => {
      console.log('New alert received:', newAlert);
      // Add the new alert to the beginning of the array
      setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
    });

    // Clean up the socket connection on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch video frames from backend
  useEffect(() => {
    const fetchVideoFrame = () => {
      // Add timestamp to prevent caching
      const imageUrl = `http://localhost:5000/api/video-frame?t=${new Date().getTime()}`;
      
      if (videoRef.current) {
        videoRef.current.src = imageUrl;
        videoRef.current.onerror = () => {
          setVideoError(true);
        };
        videoRef.current.onload = () => {
          setVideoError(false);
        };
      }
    };

    // Fetch frame every 300ms (increased frequency for smoother playback)
    fetchIntervalRef.current = setInterval(fetchVideoFrame, 300);
    
    // Fetch initial frame
    fetchVideoFrame();
    
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  // Helper function to pick a color based on status
  const getStatusColor = (status) => {
    if (status === 'Endangered') return '#ef4444'; // red
    if (status === 'Vulnerable') return '#f97316'; // orange
    if (status === 'Human') return '#3b82f6'; // blue
    return '#22c55e'; // green for Least Concern
  };

  return (
    <div className="monitor-container">
      <div className="monitor-layout">
        {/* Video Feed Section (70%) */}
        <div className="video-section">
          <div className="video-header">
            <h2>Live Camera Feed</h2>
            <div className="camera-status">
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span>Camera 1 - {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}</span>
            </div>
          </div>
          <div className="video-player">
            {videoError && (
              <div className="video-placeholder">
                <p>Waiting for video stream...</p>
                <p>Make sure the Python detection script is running</p>
              </div>
            )}
            <img 
              ref={videoRef}
              alt="Live camera feed"
              className="live-video"
              style={{ display: videoError ? 'none' : 'block' }}
            />
            <div className="video-overlay">
              <div className="overlay-info">
                <span className="location">Serengeti National Park</span>
                <span className="time">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Alerts Panel (30%) */}
        <div className="alerts-section">
          <div className="alerts-header">
            <h2>Live Alerts</h2>
            <span className="alert-count">{alerts.length} alerts</span>
          </div>
          <div className="alerts-terminal">
            {connectionStatus === 'connecting' && (
              <div className="no-alerts">
                <p>Connecting to server...</p>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="no-alerts">
                <p>Error connecting to server. Please check if the backend is running.</p>
                <button onClick={() => window.location.reload()}>Retry Connection</button>
              </div>
            )}
            {connectionStatus === 'connected' && alerts.length === 0 ? (
              <div className="no-alerts">
                <p>No alerts yet. Waiting for animal detections...</p>
                <p>Make sure to:</p>
                <ol>
                  <li>Ensure the backend server is running</li>
                  <li>Run the wildeye_test.py script</li>
                </ol>
              </div>
            ) : connectionStatus === 'connected' && alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div key={alert._id || Math.random()} className="alert-card animated-entry">
                    <div className="alert-header">
                      <h3>{alert.animal}</h3>
                      {alert.status && (
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: getStatusColor(alert.status) }}
                        >
                          {alert.status}
                        </span>
                      )}
                    </div>
                    <div className="alert-details">
                      <p className="alert-time">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;