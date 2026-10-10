'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaItem, CategoryRow } from '@/types/media';
import { getLiveStreamingRows, searchTmdb } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaRow } from '@/components/MediaRow';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { PageHero } from '@/components/PageHero';
import { useWatchlist } from '@/context/WatchlistContext';

export default function ToggleBoxHomePage() {
  const router = useRouter();
  const { watchlist, toggleWatchlist, toastMessage, triggerToast } = useWatchlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(false);

  const featuredItem = useMemo(() => rows[0]?.items[0] || null, [rows]);

  // Initial load of live TMDB data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getLiveStreamingRows()
      .then((data) => {
        if (isMounted) setRows(data);
      })
      .catch((err) => {
        console.error('Error fetching live streaming catalog:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live Debounced TMDB Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchTmdb(searchQuery)
        .then((res) => setSearchResults(res))
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Filtered rows for rendering
  const displayedRows = useMemo(() => {
    if (searchQuery.trim()) {
      return [
        {
          id: 'search-results',
          title: `Search Results for “${searchQuery}” (${searchResults.length})`,
          items: searchResults,
        },
      ];
    }

    if (!expandedRows && rows.length > 5) {
      return rows.slice(0, 5);
    }

    return rows;
  }, [searchQuery, searchResults, rows, expandedRows]);

  return (
    <div className="toggle-box-app">
      {/* Prime Video Styled Top Navigation Bar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        watchlistCount={watchlist.length}
      />

      {/* Main Content: Streaming Carousel Rows */}
      <main className="main-content home-main-content">
        {!searchQuery && featuredItem && (
          <PageHero
            backgroundImage={featuredItem.backdropUrl}
            title="Find Something Worth Watching Tonight"
          />
        )}

        {isLoading ? (
          <div className="loading-skeleton-container">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-row">
                <div className="skeleton-title" />
                <div className="skeleton-cards">
                  {[1, 2, 3, 4, 5, 6].map((m) => (
                    <div key={m} className="skeleton-card" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : displayedRows.length === 0 ? (
          <div className="catalog-empty-state">
            <h3 className="catalog-empty-title">
              {isSearching ? 'Searching live TMDB catalog…' : 'No titles found'}
            </h3>
            <p className="catalog-empty-copy">Try searching for another movie or show title.</p>
            <button type="button" onClick={() => setSearchQuery('')} className="home-empty-action">
              Clear Search
            </button>
          </div>
        ) : (
          displayedRows.map((row: CategoryRow) => (
            <MediaRow
              key={row.id}
              row={row}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
              onSelectMedia={(item) => router.push(`/detail/${item.id}`)}
            />
          ))
        )}

        {/* See more rows button */}
        {!expandedRows && rows.length > 5 && !searchQuery && !isLoading && (
          <div className="home-show-more">
            <button
              className="join-prime-btn"
              type="button"
              onClick={() => {
                setExpandedRows(true);
                triggerToast('Loaded full catalog');
              }}
            >
              Show more titles
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Tactile Feedback Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
