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
  const { watchlist, savedItems, toggleWatchlist, toastMessage, triggerToast, watchProgress } =
    useWatchlist();

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

  // Continue watching row
  const continueWatchingItems = useMemo(() => {
    const pool = [...savedItems, ...rows.flatMap((r) => r.items)];
    const seen = new Set<string>();
    const res: MediaItem[] = [];
    for (const item of pool) {
      if (!seen.has(item.id) && (watchProgress[item.id] || 0) > 0) {
        seen.add(item.id);
        res.push(item);
      }
    }
    return res;
  }, [savedItems, rows, watchProgress]);

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

    const baseRows = !expandedRows && rows.length > 7 ? rows.slice(0, 7) : rows;

    if (continueWatchingItems.length > 0) {
      return [
        {
          id: 'continue-watching',
          title: 'Continue Watching',
          items: continueWatchingItems,
        },
        ...baseRows,
      ];
    }

    return baseRows;
  }, [searchQuery, searchResults, rows, expandedRows, continueWatchingItems]);

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

        {/* See more rows button matching reference */}
        {!expandedRows && rows.length > 7 && !searchQuery && !isLoading && (
          <div className="home-show-more">
            <button
              className="ref-see-more-btn"
              type="button"
              onClick={() => {
                setExpandedRows(true);
                triggerToast('Loaded full catalog (15 categories)');
              }}
            >
              See more
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
