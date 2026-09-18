import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <p className="footer-disclaimer">
          <strong>CampusSOS</strong> is an intelligent reporting and routing assistant. It does not replace emergency
          services, campus police, or trained medical personnel. For active fires, armed hazards, or life-threatening
          emergencies, alert campus emergency services or dial 911 immediately.
        </p>

        <div className="footer-meta">
          <span>WeMakeDevs × AWS First Commit (Bharat Builds Tour 2026)</span>
          <span>•</span>
          <span>Student Hackathon Project</span>
          <span>•</span>
          <Link to="/admin" style={{ color: 'inherit', textDecoration: 'underline' }}>Admin Portal</Link>
        </div>
      </div>
    </footer>
  );
};
