'use client';

import React from 'react';
import Link from 'next/link';
import { ToggleBoxLogo, GlobeIcon } from './Icons';

interface FooterProps {
  onSeeMore?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSeeMore }) => {
  return (
    <footer className="footer-container">
      {/* Sleek feathered line divider above footer */}
      <div className="footer-section-divider" aria-hidden="true" />

      {/* Optional Central "See more" button if provided */}
      {onSeeMore && (
        <div className="footer-see-more-wrapper">
          <button className="see-more-center-btn" onClick={onSeeMore}>
            See more
          </button>
        </div>
      )}

      <div className="footer-content-wrap">
        {/* Top Tier: Brand Identity, Live Status & Language */}
        <div className="footer-top-tier">
          <div className="footer-brand-col">
            <ToggleBoxLogo height={28} className="footer-logo" />
            <p className="footer-tagline">
              Cinematic streaming entertainment. Watch blockbuster movies and original series in 4K HDR.
            </p>
          </div>

          <div className="footer-utility-actions">
            <button type="button" className="footer-lang-btn" aria-label="Language Selector">
              <GlobeIcon size={14} />
              <span>English (US)</span>
            </button>
          </div>
        </div>

        {/* Middle Tier: 4-Column Quick Navigation Grid */}
        <div className="footer-columns-grid">
          <div className="footer-col">
            <h4 className="footer-col-title">Explore</h4>
            <ul className="footer-nav-list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/movies">Movies</Link>
              </li>
              <li>
                <Link href="/tv">TV Shows</Link>
              </li>
              <li>
                <Link href="/mystuff">My Stuff (Watchlist)</Link>
              </li>
              <li>
                <a href="/#top-10">Top 10 in Pakistan</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Categories</h4>
            <ul className="footer-nav-list">
              <li>
                <Link href="/movies">Featured Originals</Link>
              </li>
              <li>
                <Link href="/tv">Top TV Series</Link>
              </li>
              <li>
                <Link href="/movies">Award Winners & Acclaimed</Link>
              </li>
              <li>
                <Link href="/tv">Mystery & Thriller TV</Link>
              </li>
              <li>
                <Link href="/tv">Anime & Animation</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Ways to Watch</h4>
            <ul className="footer-nav-list">
              <li>
                <span className="footer-static-item">Web & Desktop Browsers</span>
              </li>
              <li>
                <span className="footer-static-item">Apple TV & AirPlay 2</span>
              </li>
              <li>
                <span className="footer-static-item">Android TV & Google Cast</span>
              </li>
              <li>
                <span className="footer-static-item">Smart TVs (Samsung & LG)</span>
              </li>
              <li>
                <span className="footer-static-item">PlayStation 5 & Xbox Series</span>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Help & Support</h4>
            <ul className="footer-nav-list">
              <li>
                <a href="#help">Account & Billing</a>
              </li>
              <li>
                <a href="#devices">Supported Devices</a>
              </li>
              <li>
                <a href="#speed">Network Speed Test</a>
              </li>
              <li>
                <a href="#feedback">Send Us Feedback</a>
              </li>
              <li>
                <a href="#contact">Contact Support</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Tier: Legal & Attribution Strip */}
        <div className="footer-bottom-strip">
          <nav className="footer-legal-links" aria-label="Legal">
            <a href="#terms" className="footer-legal-link">
              Terms and Privacy Notice
            </a>
            <span className="footer-dot-sep" aria-hidden="true" />
            <a href="#feedback" className="footer-legal-link">
              Send us feedback
            </a>
            <span className="footer-dot-sep" aria-hidden="true" />
            <a href="#help" className="footer-legal-link">
              Help
            </a>
            <span className="footer-dot-sep" aria-hidden="true" />
            <a href="#cookies" className="footer-legal-link">
              Cookie Preferences
            </a>
          </nav>

          <div className="footer-meta-row">
            <p className="footer-copyright-text">
              © 1996–2026, T-BOX, Inc. or its affiliates.
            </p>
            <span className="footer-meta-divider" aria-hidden="true" />
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-tmdb-credit"
            >
              <span className="footer-tmdb-badge">TMDb</span>
              <span>API Powered</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
