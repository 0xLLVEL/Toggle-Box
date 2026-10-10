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
import { useWatchlist } from '@/context/WatchlistContext';

export default function MyStuffPage() {
  const router = useRouter();
  const {
    watchlist,
    savedItems,
    toggleWatchlist,
    toastMessage,
  } = useWatchlist();

  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'tv'>('all');
  const [recommended, setRecommended] = useState<MediaItem[]>([]);

  // Fetch recommendations in case watchlist has few items
  useEffect(() => {
    getLiveStreamingRows()
      .then((rows) => {
        if (rows[0]?.items) {
          setRecommended(rows[0].items.slice(0, 6));
        }
      })
      .catch(console.error);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'movies') {
      return savedItems.filter((i) => i.type === 'movie');
    }
    if (activeFilter === 'tv') {
      return savedItems.filter((i) => i.type === 'tv');
    }
    return savedItems;
  }, [savedItems, activeFilter]);

  const savedMoviesCount = useMemo(
    () => savedItems.filter((item) => item.type === 'movie').length,
    [savedItems],
  );
  const savedTvCount = useMemo(
    () => savedItems.filter((item) => item.type === 'tv').length,
    [savedItems],
  );
  const heroItem = filteredItems[0] || savedItems[0] || recommended[0] || null;

  return (
    <div className="toggle-box-app">
      <Navbar watchlistCount={watchlist.length} />

      <PageHero
        backgroundImage={heroItem?.backdropUrl}
        eyebrow="My Stuff"
        badge={filteredItems.length > 0 ? 'Your queue' : 'Ready to build'}
        title={filteredItems.length > 0 ? 'Everything you saved, in one premium queue' : 'Build a watchlist worth coming back to'}
        meta={[
          `${savedItems.length} saved total`,
          `${savedMoviesCount} movies`,
          `${savedTvCount} series`,
        ]}
        description={
          filteredItems.length > 0
            ? 'Your saved titles now sit inside the same cinematic shell as the rest of the app, with cleaner filtering and a stronger sense of hierarchy.'
            : 'Start saving titles from Home, Movies, or TV and they will land here in a calmer, more polished watchlist space.'
        }
        actions={
          <>
            <button className="modal-btn-play" type="button" onClick={() => router.push('/movies')}>
              <span>Browse Movies</span>
            </button>
            <button className="modal-btn-icon" type="button" onClick={() => router.push('/tv')}>
              <span>Browse TV Shows</span>
            </button>
          </>
        }
        panelTitle="Library overview"
        panelRows={[
          { label: 'Active view', value: activeFilter === 'all' ? 'All watchlist' : activeFilter === 'movies' ? 'Movies only' : 'TV shows only' },
          { label: 'Saved now', value: `${filteredItems.length} visible` },
          { label: 'Recommendations', value: `${recommended.length} ready` },
        ]}
        highlights={[
          {
            label: 'Watchlist',
            value: savedItems.length > 0 ? `${savedItems.length} titles saved` : 'Waiting for your first save',
            description: 'Anything you add elsewhere in the app stays one click away here.',
          },
          {
            label: 'Filters',
            value: activeFilter === 'all' ? 'All, Movies, TV' : activeFilter === 'movies' ? 'Movie mode on' : 'TV mode on',
            description: 'Simple segmented filters keep the collection readable even as the list grows.',
          },
          {
            label: 'Next up',
            value: heroItem ? heroItem.title : 'Recommendations ready',
            description: 'Use this page as a quieter launchpad back into the titles you already care about.',
          },
        ]}
      />

      <main className="mystuff-page-container">
        {/* Header Section */}
        <div className="mystuff-header">
          <div className="mystuff-title-group">
            <div>
              <h1 className="mystuff-title">My Stuff</h1>
              <p className="mystuff-subtitle">Your personal streaming vault</p>
            </div>
            <span className="mystuff-count">
              {filteredItems.length} {filteredItems.length === 1 ? 'title' : 'titles'}
            </span>
          </div>

          {/* Sub-navigation tabs: All, Movies, TV shows */}
          <div className="mystuff-tabs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`mystuff-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            >
              All Watchlist
            </button>
            <button
              onClick={() => setActiveFilter('movies')}
              className={`mystuff-tab-btn ${activeFilter === 'movies' ? 'active' : ''}`}
            >
              Movies
            </button>
            <button
              onClick={() => setActiveFilter('tv')}
              className={`mystuff-tab-btn ${activeFilter === 'tv' ? 'active' : ''}`}
            >
              TV Shows
            </button>
          </div>
        </div>

        {/* Watchlist Grid */}
        {filteredItems.length > 0 ? (
          <div className="mystuff-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="mystuff-card-cell">
                <MediaCard
                  item={item}
                  isInWatchlist={true}
                  onToggleWatchlist={toggleWatchlist}
                  onSelect={(selected) => router.push(`/detail/${selected.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mystuff-empty-state">
            <div className="empty-state-card">
              <span className="empty-state-icon">🍿</span>
              <h2>Your Watchlist is empty</h2>
              <p>
                Explore movies and TV shows, then click the{' '}
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
                <h3>Recommended to add to your list:</h3>
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
