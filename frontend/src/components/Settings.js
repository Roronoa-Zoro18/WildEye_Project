import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  // Forest officer registration state
  const [forestOfficers, setForestOfficers] = useState([]);
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    phone: '',
    enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch registered forest officers from backend
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('wildeye_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch('http://localhost:5000/api/officers', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch forest officers');
        }
        const officers = await response.json();
        setForestOfficers(officers);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching forest officers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // Handle forest officer form changes
  const handleOfficerChange = (field, value) => {
    setNewOfficer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add a new forest officer
  const handleAddOfficer = async (e) => {
    e.preventDefault();
    if (!newOfficer.name) {
      alert('Please provide officer name');
      return;
    }
    
    if (!newOfficer.email && !newOfficer.phone) {
      alert('Please provide at least one contact method (email or phone)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('wildeye_token');
      const response = await fetch('http://localhost:5000/api/officers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newOfficer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register forest officer');
      }

      const result = await response.json();
      setForestOfficers(prev => [...prev, result.data]);
      setNewOfficer({
        name: '',
        email: '',
        phone: '',
        enabled: true
      });
      alert('Forest officer registered successfully!');
    } catch (err) {
      setError(err.message);
      alert(`Error registering forest officer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove a forest officer
  const handleRemoveOfficer = async (id) => {
    if (!window.confirm('Are you sure you want to remove this forest officer?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('wildeye_token');
      const response = await fetch(`http://localhost:5000/api/officers/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove forest officer');
      }

      setForestOfficers(prev => prev.filter(officer => officer._id !== id));
      alert('Forest officer removed successfully!');
    } catch (err) {
      setError(err.message);
      alert(`Error removing forest officer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings saved:', { forestOfficers });
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>System Settings</h1>
        <p>Configure your WildEye monitoring preferences</p>
      </div>

      <div className="settings-content">
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Forest Officer Registration */}
          <section className="settings-section">
            <h2>Forest Officer Registration</h2>
            <div className="settings-group">
              <div className="officer-form">
                <h3>Add New Forest Officer</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="officerName">Name *</label>
                    <input
                      type="text"
                      id="officerName"
                      value={newOfficer.name}
                      onChange={(e) => handleOfficerChange('name', e.target.value)}
                      placeholder="Enter officer name"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="officerEmail">Email</label>
                    <input
                      type="email"
                      id="officerEmail"
                      value={newOfficer.email}
                      onChange={(e) => handleOfficerChange('email', e.target.value)}
                      placeholder="Enter email address"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="officerPhone">Phone Number</label>
                    <input
                      type="tel"
                      id="officerPhone"
                      value={newOfficer.phone}
                      onChange={(e) => handleOfficerChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={newOfficer.enabled}
                        onChange={(e) => handleOfficerChange('enabled', e.target.checked)}
                        disabled={loading}
                      />
                      Enable alerts for this officer
                    </label>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="add-officer-btn"
                  onClick={handleAddOfficer}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Forest Officer'}
                </button>
              </div>
              
              {/* Registered Officers List */}
              {forestOfficers.length > 0 && (
                <div className="registered-officers">
                  <h3>Registered Officers</h3>
                  <div className="officers-list">
                    {forestOfficers.map((officer) => (
                      <div key={officer._id} className="officer-item">
                        <div className="officer-info">
                          <h4>{officer.name}</h4>
                          <p>Email: {officer.email || 'N/A'}</p>
                          <p>Phone: {officer.phone || 'N/A'}</p>
                          <span className={`status-badge ${officer.enabled ? 'active' : 'inactive'}`}>
                            {officer.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveOfficer(officer._id)}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="loading-indicator">
                  Processing...
                </div>
              )}
            </div>
          </section>

          {/* Save Button */}
          <div className="save-button-container">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;