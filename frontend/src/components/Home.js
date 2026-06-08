import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [statsData, setStatsData] = useState([
    { title: 'Animals Detected', value: '0', icon: '🐾' },
    { title: 'Alerts Prevented', value: '0', icon: '🛡️' }
  ]);

  const navigate = useNavigate();

  // Fetch live stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch animal sightings count
        const sightingsResponse = await fetch('http://localhost:5000/api/sightings');
        if (sightingsResponse.ok) {
          const sightings = await sightingsResponse.json();
          const animalsDetected = sightings.length;
          const alertsPrevented = sightings.length; // For now, using same count
          
          // Update stats with live data
          setStatsData([
            { title: 'Animals Detected', value: animalsDetected.toString(), icon: '🐾' },
            { title: 'Alerts Prevented', value: alertsPrevented.toString(), icon: '🛡️' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    // Fetch stats immediately on component mount
    fetchStats();

    // Set up interval to fetch stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Protecting Wildlife, Securing Villages</h1>
          <p className="hero-subtitle">
            WildEye is an AI-powered wildlife monitoring system that detects dangerous animals in real-time 
            to prevent human-wildlife conflict and protect both communities and endangered species.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/monitor')}>View Live Monitor</button>
            <button className="btn-secondary" onClick={() => navigate('/reports')}>Learn More</button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <h2 className="stats-heading">System Overview</h2>
          <div className="stats-grid">
            {statsData.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-info">
                  <h3 className="stat-value">{stat.value}</h3>
                  <p className="stat-title">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              Human-wildlife conflict is a growing concern in many regions, threatening both community safety 
              and wildlife conservation. WildEye bridges this gap by providing early warning systems that 
              allow communities to take preventive measures while supporting conservation efforts.
            </p>
            <div className="mission-features">
              <div className="feature">
                <h3>Real-time Detection</h3>
                <p>AI-powered animal recognition with instant alerts</p>
              </div>
              <div className="feature">
                <h3>Community Protection</h3>
                <p>Early warnings to prevent dangerous encounters</p>
              </div>
              <div className="feature">
                <h3>Conservation Support</h3>
                <p>Data collection for wildlife research and protection</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;