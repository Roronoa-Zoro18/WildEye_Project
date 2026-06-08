import React, { useState, useEffect } from 'react';
import './MapView.css';

const MapView = () => {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sightings data from backend
  useEffect(() => {
    const fetchSightings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/sightings');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        
        // Filter to only include animals with conservation status (exclude "Human" and "Unknown")
        const filteredSightings = data.filter(sighting => 
          sighting.status && 
          sighting.status !== 'Human' && 
          sighting.status !== 'Unknown'
        );
        
        setSightings(filteredSightings);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSightings();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchSightings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to get color based on conservation status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Endangered':
        return '#ef4444'; // red
      case 'Vulnerable':
      case 'Near Threatened':
        return '#f97316'; // orange
      case 'Least Concern':
        return '#4ade80'; // green
      default:
        return '#94a3b8'; // gray for unknown
    }
  };

  // Generate random coordinates for heatmap points (in a real app, this would come from actual GPS data)
  const generateRandomCoordinates = (index) => {
    // Create pseudo-random but consistent coordinates based on animal name and index
    const seed = index * 137 + sightings.length * 73;
    const x = (seed % 80) + 10; // 10-90%
    const y = ((seed * 7) % 70) + 15; // 15-85%
    return { x, y };
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-header">
          <h1>Wildlife Distribution Map</h1>
          <p>Loading wildlife data...</p>
        </div>
        <div className="map-content">
          <div className="map-placeholder">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <div className="map-header">
          <h1>Wildlife Distribution Map</h1>
          <p>Error loading data: {error}</p>
        </div>
        <div className="map-content">
          <div className="map-placeholder">
            <p>Please make sure the backend server is running.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h1>Wildlife Distribution Map</h1>
        <p>Real-time animal locations and movement patterns</p>
      </div>
      
      <div className="map-content">
        <div className="map-heatmap-container">
          <div className="map-heatmap">
            <div className="map-grid"></div>
            
            {/* Render heatmap points for each sighting */}
            {sightings.map((sighting, index) => {
              const { x, y } = generateRandomCoordinates(index);
              const intensity = Math.min(1, (index + 1) / 5); // Higher intensity for recent sightings
              
              return (
                <div
                  key={`${sighting._id}-${index}`}
                  className="heatmap-point"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: getStatusColor(sighting.status),
                    opacity: intensity,
                    boxShadow: `0 0 0 ${intensity * 10}px ${getStatusColor(sighting.status)}`
                  }}
                  title={`${sighting.animal} - ${sighting.status} (${new Date(sighting.timestamp).toLocaleString()})`}
                >
                  <span className="animal-name">{sighting.animal.charAt(0)}</span>
                </div>
              );
            })}
            
            {/* Intensity legend */}
            <div className="intensity-legend">
              <div className="legend-title">Recent Sightings</div>
              <div className="intensity-scale">
                <div className="intensity-high">High</div>
                <div className="intensity-low">Low</div>
              </div>
            </div>
          </div>
          
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color endangered"></div>
              <span>Endangered Species</span>
            </div>
            <div className="legend-item">
              <div className="legend-color vulnerable"></div>
              <span>Vulnerable Species</span>
            </div>
            <div className="legend-item">
              <div className="legend-color least-concern"></div>
              <span>Least Concern</span>
            </div>
          </div>
          
          <div className="map-stats">
            <div className="stat-card">
              <h3>Total Sightings</h3>
              <p>{sightings.length}</p>
            </div>
            <div className="stat-card">
              <h3>Endangered</h3>
              <p>{sightings.filter(s => s.status === 'Endangered').length}</p>
            </div>
            <div className="stat-card">
              <h3>Vulnerable</h3>
              <p>{sightings.filter(s => s.status === 'Vulnerable' || s.status === 'Near Threatened').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;