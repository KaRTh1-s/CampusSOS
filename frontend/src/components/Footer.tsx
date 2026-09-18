import React from 'react';

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
          <span>Phase 2: Local Student MVP</span>
        </div>
      </div>
    </footer>
  );
};
