'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaItem, CategoryRow } from '@/types/media';
import { getLiveTvRows, searchTmdb } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaRow } from '@/components/MediaRow';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { HeroCarousel } from '@/components/HeroCarousel';
import { useWatchlist } from '@/context/WatchlistContext';

export default function TvPage() {
  const router = useRouter();
  const {
    watchlist,
    toggleWatchlist,
    toastMessage,
  } = useWatchlist();

  const [tvRows, setTvRows] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getLiveTvRows()
      .then((rows) => {
        if (isMounted) setTvRows(rows);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchTmdb(searchQuery)
        .then((res) => setSearchResults(res.filter((i) => i.type === 'tv')))
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const carouselShows = useMemo(() => {
    if (!tvRows.length) return [];
    const pool = tvRows.flatMap((r) => r.items).filter((i) => !!i.backdropUrl);
    const seen = new Set<string | number>();
    const unique: MediaItem[] = [];
    for (const item of pool) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
      if (unique.length >= 6) break;
    }
    return unique;
  }, [tvRows]);

  const displayedRows = useMemo(() => {
    if (searchQuery.trim()) {
      return [
        {
          id: 'tv-search-results',
          title: `TV Show Results for "${searchQuery}" (${searchResults.length})`,
          items: searchResults,
        },
      ];
    }
    return tvRows;
  }, [searchQuery, searchResults, tvRows]);

  return (
    <div className="toggle-box-app">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        watchlistCount={watchlist.length}
      />

      {/* Featured TV Animated Hero Carousel */}
      {!searchQuery && !isLoading && carouselShows.length > 0 && (
        <HeroCarousel
          items={carouselShows}
          badgePrefix="Featured Series"
        />
      )}

      {/* Line Divider (replaces genre strip) */}
      {!searchQuery && !isLoading && carouselShows.length > 0 && (
        <div className="hero-section-divider" aria-hidden="true" />
      )}

      <main className="main-content">
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
              {isSearching ? 'Searching series...' : 'No matching TV shows found'}
            </h3>
            <p className="catalog-empty-copy">Try searching for another show or title.</p>
            {searchQuery && (
              <button
                type="button"
                className="home-empty-action"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          displayedRows.map((row) => (
            <MediaRow
              key={row.id}
              row={row}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
              onSelectMedia={(item) => router.push(`/detail/${item.id}`)}
            />
          ))
        )}
      </main>

      <Footer />
      <Toast message={toastMessage} />
    </div>
  );
}
