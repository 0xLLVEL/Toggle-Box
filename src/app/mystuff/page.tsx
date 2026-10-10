'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MediaItem } from '@/types/media';
import { getLiveStreamingRows } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaCard } from '@/components/MediaCard';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { PageHero } from '@/components/PageHero';
import {
  GridIcon,
  ListIcon,
  PlayIcon,
  CheckIcon,
  HistoryIcon,
  ChevronDownIcon,
  CloseIcon,
  SparklesIcon,
} from '@/components/Icons';
import { useWatchlist } from '@/context/WatchlistContext';

export type MyStuffViewMode = 'grid' | 'showcase' | 'compact';
export type MyStuffSort = 'recent' | 'rating' | 'year' | 'alphabetical';
export type MyStuffTab = 'all' | 'movies' | 'tv' | 'continue';

export default function MyStuffPage() {
  const router = useRouter();
  const {
    watchlist,
    savedItems,
    toggleWatchlist,
    toastMessage,
    watchProgress,
    clearWatchlist,
  } = useWatchlist();

  const [activeTab, setActiveTab] = useState<MyStuffTab>('all');
  const [viewMode, setViewMode] = useState<MyStuffViewMode>('grid');
  const [sortBy, setSortBy] = useState<MyStuffSort>('recent');
  const [recommended, setRecommended] = useState<MediaItem[]>([]);

  // Fetch recommendations in case watchlist is empty
  useEffect(() => {
    getLiveStreamingRows()
      .then((rows) => {
        if (rows[0]?.items) {
          setRecommended(rows[0].items.slice(0, 8));
        }
      })
      .catch(console.error);
  }, []);

  // Continue Watching pool
  const continueWatchingItems = useMemo(() => {
    return savedItems.filter((item) => (watchProgress[item.id] || 0) > 0);
  }, [savedItems, watchProgress]);

  // Tab filtering
  const tabFilteredItems = useMemo(() => {
    if (activeTab === 'movies') {
      return savedItems.filter((i) => i.type === 'movie');
    }
    if (activeTab === 'tv') {
      return savedItems.filter((i) => i.type === 'tv');
    }
    if (activeTab === 'continue') {
      return continueWatchingItems;
    }
    return savedItems;
  }, [savedItems, activeTab, continueWatchingItems]);

  // Sort logic
  const sortedItems = useMemo(() => {
    const list = [...tabFilteredItems];
    if (sortBy === 'rating') {
      return list.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    }
    if (sortBy === 'year') {
      return list.sort((a, b) => b.year - a.year);
    }
    if (sortBy === 'alphabetical') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    // Default 'recent' retains original order
    return list;
  }, [tabFilteredItems, sortBy]);

  const savedMoviesCount = useMemo(
    () => savedItems.filter((item) => item.type === 'movie').length,
    [savedItems]
  );
  const savedTvCount = useMemo(
    () => savedItems.filter((item) => item.type === 'tv').length,
    [savedItems]
  );

  const heroItem = sortedItems[0] || savedItems[0] || recommended[0] || null;

  return (
    <div className="toggle-box-app">
      <Navbar watchlistCount={watchlist.length} />

      <PageHero
        backgroundImage={heroItem?.backdropUrl}
        eyebrow="Personal Vault"
        badge={savedItems.length > 0 ? 'Your Queue' : 'Ready to Build'}
        title={
          savedItems.length > 0
            ? 'Everything you saved, in one cinematic library'
            : 'Build a watchlist worth coming back to'
        }
        meta={[
          `${savedItems.length} saved titles`,
          `${savedMoviesCount} movies`,
          `${savedTvCount} series`,
          `${continueWatchingItems.length} in progress`,
        ]}
        description={
          savedItems.length > 0
            ? 'Access your saved movies, series, and watch progress with custom views, instant sorting, and seamless resume playback.'
            : 'Explore titles from Home, Movies, or TV and click + Watchlist to build your curated streaming collection.'
        }
        actions={
          <>
            <button
              className="modal-btn-play"
              type="button"
              onClick={() => router.push('/movies')}
            >
              <span>Explore Movies</span>
            </button>
            <button
              className="modal-btn-icon"
              type="button"
              onClick={() => router.push('/tv')}
            >
              <span>Explore TV Shows</span>
            </button>
          </>
        }
        panelTitle="Library Status"
        panelRows={[
          {
            label: 'View Mode',
            value:
              viewMode === 'grid'
                ? 'Cinematic Grid'
                : viewMode === 'showcase'
                ? 'Showcase List'
                : 'Compact Library',
          },
          { label: 'Saved Visible', value: `${sortedItems.length} titles` },
          { label: 'In Progress', value: `${continueWatchingItems.length} active` },
        ]}
      />

      <main className="mystuff-page-container">
        {/* Header Controls Bar */}
        <div className="mystuff-header">
          <div className="mystuff-title-group">
            <div>
              <h1 className="mystuff-title">My Stuff</h1>
              <p className="mystuff-subtitle">Your personalized entertainment queue</p>
            </div>
            <span className="mystuff-count">
              {sortedItems.length} {sortedItems.length === 1 ? 'title' : 'titles'}
            </span>
          </div>

          <div className="mystuff-toolbar">
            {/* Filter Tabs */}
            <div className="mystuff-tabs" role="tablist">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`mystuff-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'all'}
              >
                <span>All Watchlist</span>
                <span className="tab-badge">{savedItems.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('movies')}
                className={`mystuff-tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'movies'}
              >
                <span>Movies</span>
                <span className="tab-badge">{savedMoviesCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tv')}
                className={`mystuff-tab-btn ${activeTab === 'tv' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === 'tv'}
              >
                <span>TV Shows</span>
                <span className="tab-badge">{savedTvCount}</span>
              </button>

              {continueWatchingItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('continue')}
                  className={`mystuff-tab-btn ${activeTab === 'continue' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={activeTab === 'continue'}
                >
                  <HistoryIcon size={14} />
                  <span>In Progress</span>
                  <span className="tab-badge">{continueWatchingItems.length}</span>
                </button>
              )}
            </div>

            {/* Right Controls: Sort & View Mode Switcher */}
            <div className="mystuff-controls-right">
              {/* Sort Selector */}
              <div className="mystuff-sort-box">
                <span className="mystuff-sort-label">Sort:</span>
                <div className="mystuff-select-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as MyStuffSort)}
                    className="mystuff-select"
                    aria-label="Sort library"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="rating">Highest Rated</option>
                    <option value="year">Release Year</option>
                    <option value="alphabetical">Title (A–Z)</option>
                  </select>
                  <ChevronDownIcon size={12} className="select-chevron" />
                </div>
              </div>

              {/* View Switcher Icons */}
              <div className="mystuff-view-switcher" role="group" aria-label="View Switcher">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Cinematic Grid View"
                  aria-label="Grid View"
                >
                  <GridIcon size={16} />
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'showcase' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('showcase')}
                  title="Showcase List View"
                  aria-label="List View"
                >
                  <ListIcon size={16} />
                </button>
              </div>

              {/* Clear List Button */}
              {savedItems.length > 0 && (
                <button
                  type="button"
                  className="mystuff-clear-btn"
                  onClick={clearWatchlist}
                  title="Clear all saved titles"
                >
                  <CloseIcon size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Rendering by View Mode */}
        {sortedItems.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="mystuff-grid">
              {sortedItems.map((item) => (
                <div key={item.id} className="mystuff-card-cell">
                  <MediaCard
                    item={item}
                    isInWatchlist={true}
                    onToggleWatchlist={toggleWatchlist}
                    onSelect={(selected) => router.push(`/detail/${selected.id}`)}
                    watchProgress={watchProgress[item.id]}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Showcase / List View */
            <div className="mystuff-showcase-list">
              {sortedItems.map((item) => {
                const progress = watchProgress[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="showcase-item-card"
                    onClick={() => router.push(`/detail/${item.id}`)}
                  >
                    <div className="showcase-poster-box">
                      <img
                        src={item.backdropUrl || item.posterUrl}
                        alt={item.title}
                        className="showcase-img"
                        loading="lazy"
                      />
                      {progress > 0 && (
                        <div className="card-progress-bar-wrap">
                          <div
                            className="card-progress-bar-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="showcase-info-box">
                      <div className="showcase-top-row">
                        <div className="showcase-title-group">
                          <h3 className="showcase-title">{item.title}</h3>
                          <div className="showcase-tags">
                            {item.matchScore && (
                              <span className="card-match-score">{item.matchScore}% Match</span>
                            )}
                            <span className="card-meta-rating">{item.rating}</span>
                            <span className="card-meta-duration">{item.duration}</span>
                            <span className="card-meta-year">{item.year}</span>
                            {item.quality?.[0] && (
                              <span className="card-quality-tag-inline">{item.quality[0]}</span>
                            )}
                          </div>
                        </div>

                        <div className="showcase-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="showcase-play-btn"
                            onClick={() => router.push(`/detail/${item.id}`)}
                          >
                            <PlayIcon size={14} />
                            <span>{progress > 0 ? 'Resume' : 'Play'}</span>
                          </button>

                          <button
                            type="button"
                            className="showcase-remove-btn"
                            onClick={() => toggleWatchlist(item)}
                            title="Remove from Watchlist"
                          >
                            <CheckIcon size={14} />
                            <span>Saved</span>
                          </button>
                        </div>
                      </div>

                      <p className="showcase-synopsis">{item.synopsis}</p>

                      <div className="showcase-footer">
                        {item.genre && item.genre.length > 0 && (
                          <div className="showcase-genre-chips">
                            {item.genre.map((g) => (
                              <span key={g} className="showcase-chip">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        {progress > 0 && (
                          <span className="showcase-progress-text">
                            {progress}% completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="mystuff-empty-state">
            <div className="empty-state-card">
              <span className="empty-state-icon">🍿</span>
              <h2>Your Watchlist is empty</h2>
              <p>
                Explore blockbuster movies and award-winning series, then click the{' '}
                <strong className="mystuff-empty-accent">+ Watchlist</strong> button on any title to save
                it here for easy viewing later.
              </p>
              <div className="empty-state-actions">
                <Link href="/movies" className="primary-pill-link">
                  Browse Movies
                </Link>
                <Link href="/tv" className="secondary-pill-link">
                  Browse TV Shows
                </Link>
              </div>
            </div>

            {/* Recommended additions */}
            {recommended.length > 0 && (
              <div className="empty-recommendations">
                <h3>Recommended for your list</h3>
                <div className="mystuff-grid">
                  {recommended.map((item) => (
                    <div key={item.id} className="mystuff-card-cell">
                      <MediaCard
                        item={item}
                        isInWatchlist={watchlist.includes(item.id)}
                        onToggleWatchlist={toggleWatchlist}
                        onSelect={(selected) => router.push(`/detail/${selected.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <Toast message={toastMessage} />
    </div>
  );
}
