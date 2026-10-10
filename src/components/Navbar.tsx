'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ToggleBoxLogo,
  SearchIcon,
  GridAppsIcon,
  UserIcon,
  CheckIcon,
  SettingsIcon,
  BookmarkIcon,
  HelpIcon,
  LogoutIcon,
  SparklesIcon,
} from './Icons';
import { SearchModal } from './SearchModal';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  watchlistCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery = '',
  onSearchChange,
  watchlistCount = 0,
}) => {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  // v0.2: scroll shadow
  const [isScrolled, setIsScrolled] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close dropdown menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut to open search modal (Ctrl+K, Cmd+K, or '/')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/movies', label: 'Movies' },
    { href: '/tv', label: 'TV Shows' },
    {
      href: '/mystuff',
      label: `My Stuff${watchlistCount > 0 ? ` (${watchlistCount})` : ''}`,
    },
  ];

  return (
    <>
      <header className={`navbar-container${isScrolled ? ' scrolled' : ''}`}>
        <div className="navbar-left">
          {/* Brand Logo */}
          <Link href="/" className="brand-btn" title="Toggle Box Home">
            <ToggleBoxLogo height={28} />
          </Link>

          {/* Navigation Links — underline indicator style */}
          <nav className="nav-links" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link${isActive ? ' nav-link-active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="navbar-right">
          {/* Search Button */}
          <button
            className="icon-action-btn search-nav-btn"
            onClick={() => setIsSearchOpen(true)}
            title="Search"
            aria-label="Search"
            type="button"
          >
            <SearchIcon size={20} />
          </button>

          {/* Language selector — Prime Video style */}
          <LanguageSelector />

          {/* Apps grid icon */}
          <button className="icon-action-btn" title="Toggle Box Apps" aria-label="Apps" type="button">
            <GridAppsIcon size={18} />
          </button>

          {/* User profile avatar */}
          <div className="dropdown-wrapper" ref={profileRef}>
            <button
              className={`avatar-btn${showProfileMenu ? ' is-active' : ''}`}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
              }}
              title="Profile & Settings"
              aria-label="Profile"
              type="button"
            >
              <div className="avatar-circle">
                <span className="avatar-initials">KM</span>
                <span className="avatar-status-dot" />
              </div>
            </button>
            {showProfileMenu && (
              <div className="dropdown-menu profile-menu animate-fadeIn">
                {/* Profile Header Card */}
                <div className="profile-header-card">
                  <div className="profile-avatar-large">
                    <UserIcon size={20} />
                  </div>
                  <div className="profile-details">
                    <strong className="profile-name">Kazam Mahmood</strong>
                    <div className="profile-status-pill">
                      <span className="status-indicator-green" />
                      <span>Primary Profile</span>
                    </div>
                  </div>
                </div>

                {/* Membership Plan Pill / Card */}
                <div className={`profile-tier-card ${isSubscribed ? 'is-vip' : 'is-free'}`}>
                  <div className="tier-card-left">
                    <div className="tier-icon-wrap">
                      <SparklesIcon size={14} />
                    </div>
                    <div className="tier-text">
                      <span className="tier-title">{isSubscribed ? 'TOGGLE+ Member' : 'Standard Pass'}</span>
                      <span className="tier-desc">{isSubscribed ? 'Ultra HD 4K • Dolby Atmos' : 'Free Preview Mode'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tier-toggle-btn"
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    title={isSubscribed ? 'Active membership' : 'Upgrade membership'}
                  >
                    {isSubscribed ? 'Active' : 'Upgrade'}
                  </button>
                </div>

                <div className="menu-divider" />

                {/* Navigation Items */}
                <div className="dropdown-items-group">
                  <Link
                    href="/mystuff"
                    className="dropdown-item profile-nav-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="item-icon-box">
                      <BookmarkIcon size={16} />
                    </div>
                    <span className="item-label">My Watchlist</span>
                    {watchlistCount > 0 && (
                      <span className="item-counter-badge">{watchlistCount}</span>
                    )}
                  </Link>

                  <button
                    className="dropdown-item profile-nav-item"
                    onClick={() => setShowProfileMenu(false)}
                    type="button"
                  >
                    <div className="item-icon-box">
                      <SettingsIcon size={16} />
                    </div>
                    <span className="item-label">Account & Settings</span>
                  </button>

                  <button
                    className="dropdown-item profile-nav-item"
                    onClick={() => setShowProfileMenu(false)}
                    type="button"
                  >
                    <div className="item-icon-box">
                      <HelpIcon size={16} />
                    </div>
                    <span className="item-label">Help & Support</span>
                  </button>
                </div>

                <div className="menu-divider" />

                {/* Sign out */}
                <button
                  className="dropdown-item profile-nav-item sign-out-item"
                  onClick={() => setShowProfileMenu(false)}
                  type="button"
                >
                  <div className="item-icon-box">
                    <LogoutIcon size={16} />
                  </div>
                  <span className="item-label">Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Join Prime / Toggle Box CTA — v0.2 gradient */}
          <button
            className={`join-prime-btn${isSubscribed ? ' subscribed' : ''}`}
            onClick={() => setIsSubscribed(!isSubscribed)}
            type="button"
          >
            {isSubscribed ? (
              <>
                <CheckIcon size={15} /> Member
              </>
            ) : (
              'Join TOGGLE'
            )}
          </button>
        </div>
      </header>

      {/* Cinematic Big Search Popup Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </>
  );
};
