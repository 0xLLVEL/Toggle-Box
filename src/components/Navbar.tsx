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

const genreDropdownItems = [
  {
    id: 'action',
    label: 'Action',
    href: '/movies?genre=Action',
    description: 'Blockbusters, chases, and big-screen adrenaline.',
  },
  {
    id: 'comedy',
    label: 'Comedy',
    href: '/movies?genre=Comedy',
    description: 'Light watches and easy picks for any night.',
  },
  {
    id: 'crime',
    label: 'Crime',
    href: '/tv?genre=Crime',
    description: 'Detectives, tension, and sharp mystery series.',
  },
  {
    id: 'drama',
    label: 'Drama',
    href: '/tv?genre=Drama',
    description: 'Character-led stories with high-stakes arcs.',
  },
  {
    id: 'scifi',
    label: 'Sci-Fi',
    href: '/movies?genre=Sci-Fi',
    description: 'Future worlds, fantasy edges, and epic scale.',
  },
  {
    id: 'romance',
    label: 'Romance',
    href: '/movies?genre=Romance',
    description: 'Chemistry, longing, and modern love stories.',
  },
  {
    id: 'horror',
    label: 'Horror',
    href: '/movies?genre=Horror',
    description: 'Dark, tense, and built for late-night viewing.',
  },
  {
    id: 'family',
    label: 'Family',
    href: '/movies?genre=Family',
    description: 'Family-friendly picks and comfort watches.',
  },
  {
    id: 'docs',
    label: 'Docs',
    href: '/movies?genre=Documentary',
    description: 'True stories, real people, and standout docs.',
  },
] as const;

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
  const [showGenresMenu, setShowGenresMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  // v0.2: scroll shadow
  const [isScrolled, setIsScrolled] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const genresRef = useRef<HTMLDivElement>(null);

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
      if (genresRef.current && !genresRef.current.contains(e.target as Node)) {
        setShowGenresMenu(false);
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
          <Link href="/" className="brand-btn" title="Tea+ Home">
            <ToggleBoxLogo height={28} />
          </Link>

          {/* Navigation Links — underline indicator style */}
          <nav className="nav-links" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

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

          {/* Language selector */}
          <LanguageSelector />

          {/* Genres menu */}
          <div className="dropdown-wrapper" ref={genresRef}>
            <button
              className={`icon-action-btn genre-apps-trigger${showGenresMenu ? ' is-active' : ''}`}
              title="Browse Genres"
              aria-label="Browse Genres"
              aria-haspopup="menu"
              aria-expanded={showGenresMenu}
              type="button"
              onClick={() => {
                setShowGenresMenu((prev) => !prev);
                setShowProfileMenu(false);
              }}
            >
              <GridAppsIcon size={18} />
            </button>
            {showGenresMenu && (
              <div className="dropdown-menu genre-menu animate-fadeIn">
                <div className="dropdown-menu-header">
                  <div className="dropdown-header-title-group">
                    <GridAppsIcon size={14} />
                    <span>Browse by Genre</span>
                  </div>
                </div>

                <div className="genre-menu-lead">
                  <strong className="genre-menu-title">Pick a lane</strong>
                  <p className="genre-menu-copy">
                    Jump straight into the closest movies or TV shelf without the extra hub page.
                  </p>
                </div>

                <div className="genre-menu-grid">
                  {genreDropdownItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="genre-menu-tile"
                      onClick={() => setShowGenresMenu(false)}
                    >
                      <span className="genre-menu-tile-title">{item.label}</span>
                      <span className="genre-menu-tile-description">{item.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User profile avatar */}
          <div className="dropdown-wrapper" ref={profileRef}>
            <button
              className={`avatar-btn${showProfileMenu ? ' is-active' : ''}`}
              onClick={() => {
                setShowGenresMenu(false);
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
              <div className="dropdown-menu profile-menu">
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

                {/* Membership Plan — Prime-style subtle row */}
                <div className={`profile-tier-card ${isSubscribed ? 'is-vip' : 'is-free'}`}>
                  <div className="tier-card-left">
                    <SparklesIcon size={16} className="tier-icon-inline" />
                    <div className="tier-text">
                      <span className="tier-title">
                        {isSubscribed ? 'Tea+ Member' : 'Standard Pass'}
                      </span>
                      <span className="tier-desc">
                        {isSubscribed ? 'Ultra HD 4K • Dolby Atmos' : 'Free Preview Mode'}
                      </span>
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

                {/* Navigation Items — plain text rows, inline icons (Prime style) */}
                <div className="dropdown-items-group">
                  <Link
                    href="/mystuff"
                    className="dropdown-item profile-nav-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <BookmarkIcon size={17} className="profile-nav-icon" />
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
                    <SettingsIcon size={17} className="profile-nav-icon" />
                    <span className="item-label">Account &amp; Settings</span>
                  </button>

                  <button
                    className="dropdown-item profile-nav-item"
                    onClick={() => setShowProfileMenu(false)}
                    type="button"
                  >
                    <HelpIcon size={17} className="profile-nav-icon" />
                    <span className="item-label">Help &amp; Support</span>
                  </button>
                </div>

                <div className="menu-divider" />

                {/* Sign out */}
                <button
                  className="dropdown-item profile-nav-item sign-out-item"
                  onClick={() => setShowProfileMenu(false)}
                  type="button"
                >
                  <LogoutIcon size={17} className="profile-nav-icon" />
                  <span className="item-label">Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Join Tea+ CTA — v0.2 gradient */}
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
              'Join Tea+'
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
