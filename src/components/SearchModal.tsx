'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaItem } from '@/types/media';
import { searchTmdb } from '@/services/tmdb';
import { useWatchlist } from '@/context/WatchlistContext';
import {
  SearchIcon,
  CloseIcon,
  ToggleGoldBadgeIcon,
  PlayIcon,
  PlusIcon,
  CheckIcon,
  ThumbsUpIcon,
  InfoIcon,
} from './Icons';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery = '',
  onSearchChange,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const [query, setQuery] = useState(searchQuery);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sync query and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(searchQuery);
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

  const handleCardClick = (item: MediaItem) => {
    onClose();
    router.push(`/detail/${item.id}`);
  };

  if (!isOpen) return null;

  // Decide what items to display — search results only; no default trending feed.
  const isDisplayingResults = query.trim().length > 0;
  const displayedCards = results;

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

        {/* Section Heading — only shown for actual search results */}
        {isDisplayingResults && (
          <div className="cinematic-section-header">
            <h2 className="cinematic-section-title">
              Search Results for &ldquo;{query}&rdquo;
              {!isSearching && (
                <span className="cinematic-count-badge">
                  {results.length} {results.length === 1 ? 'title' : 'titles'}
                </span>
              )}
            </h2>
          </div>
        )}

        {/* Content Area — only rendered once a query is entered */}
        {!isDisplayingResults ? null : isSearching && results.length === 0 ? (
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

                    {/* Card Caption Info — overlaid on poster, revealed on hover */}
                    <div className="cinematic-card-info">
                      <h3 className="cinematic-card-title">{item.title}</h3>

                      {/* Quick Action buttons — same row as the normal-page cards */}
                      <div
                        className="card-quick-actions cinematic-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="action-btn-circle play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(item);
                          }}
                          title="Play Now"
                          aria-label="Play Now"
                          type="button"
                        >
                          <PlayIcon size={14} />
                        </button>

                        <button
                          className={`action-btn-circle ${
                            isInWatchlist(item.id) ? 'active-watchlist' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(item);
                          }}
                          title={isInWatchlist(item.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          aria-label="Toggle Watchlist"
                          aria-pressed={isInWatchlist(item.id)}
                          type="button"
                        >
                          {isInWatchlist(item.id) ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
                        </button>

                        <button
                          className={`action-btn-circle ${
                            likedIds.has(item.id) ? 'active-like' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(item.id);
                          }}
                          title="Like"
                          aria-label="Like"
                          aria-pressed={likedIds.has(item.id)}
                          type="button"
                        >
                          <ThumbsUpIcon size={13} />
                        </button>

                        <button
                          className="action-btn-circle info-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(item);
                          }}
                          title="More Info"
                          aria-label="More Info"
                          type="button"
                        >
                          <InfoIcon size={13} />
                        </button>
                      </div>

                      <div className="cinematic-card-meta">
                        {typeof item.matchScore === 'number' && (
                          <span className="cinematic-match cinematic-meta-item">
                            {item.matchScore}% Match
                          </span>
                        )}
                        <span className="cinematic-meta-item">{item.year}</span>
                        <span className="cinematic-meta-item cinematic-rating">{item.rating}</span>
                        <span className="cinematic-meta-item">{item.duration}</span>
                      </div>
                      {item.genre && item.genre.length > 0 && (
                        <div className="cinematic-card-genres">
                          {item.genre.slice(0, 3).join(' • ')}
                        </div>
                      )}
                    </div>
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
              Try searching with a different spelling, or an actor or director name.
            </p>
            <div className="cinematic-empty-suggestions">
              <button
                className="cinematic-pill active"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                type="button"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
