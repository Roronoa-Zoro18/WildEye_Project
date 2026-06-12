import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const navItems = isAuthenticated ? [
    { name: 'Home', path: '/' },
    { name: 'Live Monitor', path: '/monitor' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' }
  ] : [
    { name: 'Home', path: '/' },
    { name: 'Login', path: '/login' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <h2>WildEye</h2>
        </div>
        <div className="nav-right">
          <ul className="nav-menu">
            {navItems.map((item) => (
              <li key={item.name} className="nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
          {isAuthenticated && user && (
            <div className="user-profile-nav">
              <span className="nav-user-greeting">👋 {user.username}</span>
              <button className="nav-logout-btn" onClick={onLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;