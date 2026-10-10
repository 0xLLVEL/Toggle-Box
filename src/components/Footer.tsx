'use client';

import React from 'react';
import { ToggleBoxLogo } from './Icons';

interface FooterProps {
  onSeeMore?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSeeMore }) => {
  return (
    <footer className="footer-container">
      {/* Central "See more" button exactly matching the screenshot */}
      {onSeeMore && (
        <div className="footer-see-more-wrapper">
          <button className="see-more-center-btn" onClick={onSeeMore}>
            See more
          </button>
        </div>
      )}

      {/* Brand logo in footer */}
      <div className="footer-logo-wrapper">
        <ToggleBoxLogo height={24} className="footer-logo" />
      </div>

      {/* Footer Links & Copyright */}
      <div className="footer-links-row">
        <a href="#terms" className="footer-link">
          Terms and Privacy Notice
        </a>
        <a href="#feedback" className="footer-link">
          Send us feedback
        </a>
        <a href="#help" className="footer-link">
          Help
        </a>
        <span className="footer-copyright">
          © 1996–2026, Toggle Box, Inc. or its affiliates.
        </span>
      </div>
    </footer>
  );
};
