import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LiveMonitor from './components/LiveMonitor';
// MapView component removed as per user request
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('wildeye_token'));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wildeye_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('wildeye_token');
    localStorage.removeItem('wildeye_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/monitor" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} 
            />
            <Route 
              path="/monitor" 
              element={isAuthenticated ? <LiveMonitor /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/reports" 
              element={isAuthenticated ? <Reports /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/settings" 
              element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} 
            />
            {/* Redirect any other path to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;