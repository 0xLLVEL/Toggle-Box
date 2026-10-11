'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { MediaItem, CategoryRow } from '@/types/media';
import { getLiveMovieRows, searchTmdb } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaRow } from '@/components/MediaRow';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { HeroCarousel } from '@/components/HeroCarousel';
import { useWatchlist } from '@/context/WatchlistContext';

function MoviesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    watchlist,
    toggleWatchlist,
    toastMessage,
  } = useWatchlist();

  const [movieRows, setMovieRows] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const selectedGenre = searchParams.get('genre')?.trim() || '';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getLiveMovieRows()
      .then((rows) => {
        if (isMounted) setMovieRows(rows);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchTmdb(searchQuery)
        .then((res) => setSearchResults(res.filter((i) => i.type === 'movie')))
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const genreFilteredRows = useMemo(() => {
    if (!selectedGenre) return movieRows;

    return movieRows
      .map((row) => ({
        ...row,
        items: row.items.filter((item) => item.genre.includes(selectedGenre)),
      }))
      .filter((row) => row.items.length > 0);
  }, [movieRows, selectedGenre]);

  const carouselMovies = useMemo(() => {
    if (!genreFilteredRows.length) return [];
    const pool = genreFilteredRows.flatMap((r) => r.items).filter((i) => !!i.backdropUrl);
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
  }, [genreFilteredRows]);

  const displayedRows = useMemo(() => {
    if (searchQuery.trim()) {
      return [
        {
          id: 'movie-search-results',
          title: `Movie Results for "${searchQuery}" (${searchResults.length})`,
          items: searchResults,
        },
      ];
    }
    return genreFilteredRows;
  }, [searchQuery, searchResults, genreFilteredRows]);

  return (
    <div className="toggle-box-app">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        watchlistCount={watchlist.length}
      />

      {/* Featured Movie Animated Hero Carousel */}
      {!searchQuery && !isLoading && carouselMovies.length > 0 && (
        <HeroCarousel
          items={carouselMovies}
          badgePrefix="Featured Movie"
        />
      )}

      {/* Line Divider (replaces genre strip) */}
      {!searchQuery && !isLoading && carouselMovies.length > 0 && (
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
              {isSearching
                ? 'Searching movies...'
                : selectedGenre
                  ? `No matching ${selectedGenre.toLowerCase()} movies found`
                  : 'No matching movies found'}
            </h3>
            <p className="catalog-empty-copy">
              {selectedGenre
                ? 'Try another genre from the dropdown or browse all movies.'
                : 'Try searching for another movie title.'}
            </p>
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

export default function MoviesPage() {
  return (
    <Suspense fallback={null}>
      <MoviesPageContent />
    </Suspense>
  );
}
