'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaItem, CategoryRow } from '@/types/media';
import { getLiveMovieRows, searchTmdb } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaRow } from '@/components/MediaRow';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { HeroCarousel } from '@/components/HeroCarousel';
import { FilterBar, type FilterState, type SortOption } from '@/components/FilterBar';
import { useWatchlist } from '@/context/WatchlistContext';

export default function MoviesPage() {
  const router = useRouter();
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

  // Advanced Filter & Sort State
  const [filterState, setFilterState] = useState<FilterState>({
    selectedGenre: 'All',
    sortBy: 'trending',
    only4k: false,
    onlyOriginals: false,
  });

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

  const carouselMovies = useMemo(() => {
    if (!movieRows.length) return [];
    const pool = movieRows.flatMap((r) => r.items).filter((i) => !!i.backdropUrl);
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
  }, [movieRows]);

  // Extract distinct popular genres across available movie rows
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    movieRows.forEach((row) => {
      row.items.forEach((item) => {
        item.genre?.forEach((g) => genres.add(g));
      });
    });
    const popular = [
      'Action',
      'Sci-Fi',
      'Drama',
      'Comedy',
      'Thriller',
      'Animation',
      'Horror',
      'Adventure',
      'Fantasy',
      'Crime',
    ];
    return popular.filter((g) => genres.has(g));
  }, [movieRows]);

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

    const isFiltering =
      filterState.selectedGenre !== 'All' ||
      filterState.only4k ||
      filterState.onlyOriginals ||
      filterState.sortBy !== 'trending';

    if (!isFiltering) {
      return movieRows;
    }

    return movieRows
      .map((row) => {
        let items = row.items.filter((item) => {
          if (
            filterState.selectedGenre !== 'All' &&
            !item.genre?.includes(filterState.selectedGenre)
          ) {
            return false;
          }
          if (
            filterState.only4k &&
            !item.quality?.some((q) => q.includes('4K') || q.includes('UHD'))
          ) {
            return false;
          }
          if (filterState.onlyOriginals && !item.isOriginal) {
            return false;
          }
          return true;
        });

        if (filterState.sortBy === 'rating') {
          items = [...items].sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
        } else if (filterState.sortBy === 'year') {
          items = [...items].sort((a, b) => b.year - a.year);
        } else if (filterState.sortBy === 'alphabetical') {
          items = [...items].sort((a, b) => a.title.localeCompare(b.title));
        }

        return {
          ...row,
          items,
        };
      })
      .filter((row) => row.items.length > 0);
  }, [searchQuery, searchResults, movieRows, filterState]);

  const totalFilteredCount = useMemo(() => {
    const ids = new Set<string>();
    displayedRows.forEach((r) => r.items.forEach((i) => ids.add(i.id)));
    return ids.size;
  }, [displayedRows]);

  const isFilteringActive =
    filterState.selectedGenre !== 'All' ||
    filterState.only4k ||
    filterState.onlyOriginals ||
    filterState.sortBy !== 'trending';

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

      {/* Discovery Genre & Sort Filter Bar */}
      {!searchQuery && !isLoading && (
        <FilterBar
          genres={availableGenres}
          filterState={filterState}
          onGenreChange={(genre) => setFilterState((prev) => ({ ...prev, selectedGenre: genre }))}
          onSortChange={(sortBy) => setFilterState((prev) => ({ ...prev, sortBy }))}
          onToggle4k={() => setFilterState((prev) => ({ ...prev, only4k: !prev.only4k }))}
          onToggleOriginals={() => setFilterState((prev) => ({ ...prev, onlyOriginals: !prev.onlyOriginals }))}
          onResetFilters={() =>
            setFilterState({
              selectedGenre: 'All',
              sortBy: 'trending',
              only4k: false,
              onlyOriginals: false,
            })
          }
          totalResultsCount={isFilteringActive ? totalFilteredCount : undefined}
        />
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
              {isSearching ? 'Searching movies...' : 'No matching movies found'}
            </h3>
            <p className="catalog-empty-copy">
              {isFilteringActive
                ? 'Try adjusting or resetting your active genre and filters.'
                : 'Try searching for another movie title.'}
            </p>
            {isFilteringActive && (
              <button
                type="button"
                className="home-empty-action"
                onClick={() =>
                  setFilterState({
                    selectedGenre: 'All',
                    sortBy: 'trending',
                    only4k: false,
                    onlyOriginals: false,
                  })
                }
              >
                Reset Filters
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
