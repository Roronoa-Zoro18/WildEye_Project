import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LiveMonitor from './components/LiveMonitor';
// MapView component removed as per user request
import Reports from './components/Reports';
import Settings from './components/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/monitor" element={<LiveMonitor />} />
            {/* MapView route removed as per user request */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;