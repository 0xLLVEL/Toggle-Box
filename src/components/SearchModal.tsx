'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaItem } from '@/types/media';
import { searchTmdb, getTrendingMedia } from '@/services/tmdb';
import {
  SearchIcon,
  CloseIcon,
  ToggleGoldBadgeIcon,
  PlayIcon,
} from './Icons';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const CATEGORY_CHIPS = [
  'All',
  'Trending',
  'Action',
  'Sci-Fi',
  'Comedy',
  'Thriller',
  'Drama',
  'Horror',
  'Animation',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery = '',
  onSearchChange,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchQuery);
  const [activeCategory, setActiveCategory] = useState('All');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load trending media once
  useEffect(() => {
    getTrendingMedia()
      .then((items) => setTrendingItems(items))
      .catch(console.error);
  }, []);

  // Sync query and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(searchQuery);
      setActiveCategory('All');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchQuery]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search when typing
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchTmdb(trimmed)
        .then((items) => {
          setResults(items);
        })
        .catch((err) => {
          console.error('Search error:', err);
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 220);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  // Category chip clicked
  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'All' || cat === 'Trending') {
      setQuery('');
      setResults([]);
    } else {
      setQuery(cat);
    }
    inputRef.current?.focus();
  };

  const handleCardClick = (item: MediaItem) => {
    onClose();
    router.push(`/detail/${item.id}`);
  };

  if (!isOpen) return null;

  // Decide what items to display
  const isDisplayingResults = query.trim().length > 0;
  const displayedCards = isDisplayingResults ? results : trendingItems;

  return (
    <div
      className="cinematic-search-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="cinematic-search-content">
        {/* Top Floating Big Search Bar */}
        <div className="cinematic-search-bar-wrap">
          <div className="cinematic-search-bar">
            <SearchIcon size={26} className="cinematic-search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveCategory('All');
              }}
              placeholder="Search movies, TV shows, actors, genres..."
              className="cinematic-search-input"
              autoComplete="off"
              spellCheck="false"
            />
            {isSearching && (
              <div className="cinematic-search-spinner" />
            )}
            {query && !isSearching && (
              <button
                className="cinematic-search-clear"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                type="button"
                aria-label="Clear search"
              >
                <CloseIcon size={16} />
              </button>
            )}
          </div>

          <button
            className="cinematic-search-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Close search"
          >
            <CloseIcon size={20} />
            <span>Close</span>
          </button>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="cinematic-filter-pills">
          {CATEGORY_CHIPS.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                className={`cinematic-pill${isActive ? ' active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
                type="button"
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Section Heading */}
        <div className="cinematic-section-header">
          <h2 className="cinematic-section-title">
            {isDisplayingResults ? (
              <>
                Search Results for &ldquo;{query}&rdquo;
                {!isSearching && (
                  <span className="cinematic-count-badge">
                    {results.length} {results.length === 1 ? 'title' : 'titles'}
                  </span>
                )}
              </>
            ) : (
              <>
                Trending on Toggle Box
                <span className="cinematic-section-subtitle">
                  Popular movies and series streaming now
                </span>
              </>
            )}
          </h2>
        </div>

        {/* Content Area */}
        {isSearching && results.length === 0 ? (
          /* Loading Skeletons Grid */
          <div className="cinematic-cards-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="cinematic-skeleton-card">
                <div className="cinematic-skeleton-poster" />
                <div className="cinematic-skeleton-title" />
                <div className="cinematic-skeleton-meta" />
              </div>
            ))}
          </div>
        ) : displayedCards.length > 0 ? (
          /* Cards Grid */
          <div className="cinematic-cards-grid">
            {displayedCards.map((item) => {
              const displayImg = item.posterUrl || item.backdropUrl;
              return (
                <div
                  key={item.id}
                  className="cinematic-media-card"
                  onClick={() => handleCardClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCardClick(item);
                  }}
                >
                  <div className="cinematic-card-poster-wrap">
                    <img
                      src={displayImg}
                      alt={item.title}
                      className="cinematic-card-img"
                      loading="lazy"
                    />
                    <div className="cinematic-card-gradient" />

                    {/* Badge */}
                    {item.badge && (
                      <div className="cinematic-card-badge" data-badge={item.badge}>
                        {item.badge}
                      </div>
                    )}

                    {/* Toggle Gold Bag Badge */}
                    <div className="cinematic-card-gold" title="Included with Toggle Box">
                      <ToggleGoldBadgeIcon size={13} />
                    </div>

                    {/* Hover Play Icon Overlay */}
                    <div className="cinematic-card-play-overlay">
                      <div className="cinematic-play-bubble">
                        <PlayIcon size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Card Caption Info */}
                  <div className="cinematic-card-info">
                    <h3 className="cinematic-card-title">{item.title}</h3>
                    <div className="cinematic-card-meta">
                      <span className="cinematic-match">{item.matchScore}% Match</span>
                      <span>{item.year}</span>
                      <span className="cinematic-rating">{item.rating}</span>
                      <span className="cinematic-type">
                        {item.type === 'tv' ? 'TV' : 'Movie'}
                      </span>
                    </div>
                    {item.genre && item.genre.length > 0 && (
                      <div className="cinematic-card-genres">
                        {item.genre.slice(0, 2).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="cinematic-empty-state">
            <div className="cinematic-empty-icon-wrap">
              <SearchIcon size={48} className="cinematic-empty-icon" />
            </div>
            <h3 className="cinematic-empty-title">
              No titles found for &ldquo;{query}&rdquo;
            </h3>
            <p className="cinematic-empty-text">
              Try searching with a different spelling, actor name, or explore one of the popular categories above.
            </p>
            <div className="cinematic-empty-suggestions">
              <button
                className="cinematic-pill active"
                onClick={() => {
                  setQuery('');
                  setActiveCategory('All');
                  inputRef.current?.focus();
                }}
                type="button"
              >
                Clear Search & Browse Trending
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
