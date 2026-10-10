'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ToggleBoxLogo,
  SearchIcon,
  GridAppsIcon,
  UserIcon,
  ChevronDownIcon,
  CheckIcon,
} from './Icons';
import { SearchModal } from './SearchModal';

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
  const [selectedLang, setSelectedLang] = useState('EN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  // v0.2: scroll shadow
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const languages = ['EN', 'ES', 'DE', 'FR', 'UR', 'HI'];

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

          {/* Language selector */}
          <div className="dropdown-wrapper">
            <button
              className="lang-selector-btn"
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowProfileMenu(false);
              }}
              aria-expanded={showLangMenu}
              title="Select Language"
              type="button"
            >
              <span>{selectedLang}</span>
              <ChevronDownIcon size={12} />
            </button>
            {showLangMenu && (
              <div className="dropdown-menu lang-menu animate-fadeIn">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    className={`dropdown-item${selectedLang === lang ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangMenu(false);
                    }}
                    type="button"
                  >
                    {lang === 'EN' && 'English (EN)'}
                    {lang === 'ES' && 'Español (ES)'}
                    {lang === 'DE' && 'Deutsch (DE)'}
                    {lang === 'FR' && 'Français (FR)'}
                    {lang === 'UR' && 'اردو (UR)'}
                    {lang === 'HI' && 'हिन्दी (HI)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Apps grid icon */}
          <button className="icon-action-btn" title="Toggle Box Apps" aria-label="Apps" type="button">
            <GridAppsIcon size={18} />
          </button>

          {/* User profile avatar */}
          <div className="dropdown-wrapper">
            <button
              className="avatar-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowLangMenu(false);
              }}
              title="Profile & Settings"
              aria-label="Profile"
              type="button"
            >
              <div className="avatar-circle">
                <UserIcon size={18} />
              </div>
            </button>
            {showProfileMenu && (
              <div className="dropdown-menu profile-menu animate-fadeIn">
                <div className="profile-header">
                  <strong>Kazam Mahmood</strong>
                  <span>Active Profile</span>
                </div>
                <div className="menu-divider" />
                <Link
                  href="/mystuff"
                  className="dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  My Watchlist ({watchlistCount})
                </Link>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setIsSubscribed(!isSubscribed);
                    setShowProfileMenu(false);
                  }}
                  type="button"
                >
                  Subscription: {isSubscribed ? '✓ Premium VIP' : 'Free Trial'}
                </button>
                <button className="dropdown-item" onClick={() => setShowProfileMenu(false)} type="button">
                  Account & Settings
                </button>
                <button className="dropdown-item" onClick={() => setShowProfileMenu(false)} type="button">
                  Help & Support
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
