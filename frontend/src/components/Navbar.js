import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Live Monitor', path: '/monitor' },
    // { name: 'Map View', path: '/map' }, // MapView link removed as per user request
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <h2>WildEye</h2>
        </div>
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
      </div>
    </nav>
  );
};

export default Navbar;