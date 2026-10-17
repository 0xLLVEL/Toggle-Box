'use client';

import React from 'react';
import { FilterIcon, CloseIcon, SparklesIcon, ChevronDownIcon } from './Icons';

export type SortOption = 'trending' | 'rating' | 'year' | 'alphabetical';

export interface FilterState {
  selectedGenre: string;
  sortBy: SortOption;
  only4k: boolean;
  onlyOriginals: boolean;
}

interface FilterBarProps {
  genres: string[];
  filterState: FilterState;
  onGenreChange: (genre: string) => void;
  onSortChange: (sort: SortOption) => void;
  onToggle4k: () => void;
  onToggleOriginals: () => void;
  onResetFilters: () => void;
  totalResultsCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  genres,
  filterState,
  onGenreChange,
  onSortChange,
  onToggle4k,
  onToggleOriginals,
  onResetFilters,
  totalResultsCount,
}) => {
  const isAnyFilterActive =
    filterState.selectedGenre !== 'All' ||
    filterState.sortBy !== 'trending' ||
    filterState.only4k ||
    filterState.onlyOriginals;

  const sortLabels: Record<SortOption, string> = {
    trending: 'Trending Today',
    rating: 'Top Rated (TMDB)',
    year: 'Release Year',
    alphabetical: 'Title (A–Z)',
  };

  return (
    <div className="filter-bar-container">
      <div className="filter-bar-inner">
        {/* Left: Genre Pills Row with Horizontal Scroll */}
        <div className="filter-genre-scroll-wrap">
          <div className="filter-pills-list">
            <button
              type="button"
              className={`filter-pill ${filterState.selectedGenre === 'All' ? 'filter-pill-active' : ''}`}
              onClick={() => onGenreChange('All')}
            >
              All Genres
            </button>

            {genres.map((genre) => {
              const isActive = filterState.selectedGenre === genre;
              return (
                <button
                  key={genre}
                  type="button"
                  className={`filter-pill ${isActive ? 'filter-pill-active' : ''}`}
                  onClick={() => onGenreChange(genre)}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Sort and Feature Toggles */}
        <div className="filter-controls-right">
          {/* 4K UHD Toggle */}
          <button
            type="button"
            className={`filter-feature-btn ${filterState.only4k ? 'is-active' : ''}`}
            onClick={onToggle4k}
            title="Filter by 4K Ultra HD resolution"
          >
            <span>4K UHD</span>
          </button>

          {/* Tea+ Originals Toggle */}
          <button
            type="button"
            className={`filter-feature-btn ${filterState.onlyOriginals ? 'is-active' : ''}`}
            onClick={onToggleOriginals}
            title="Filter by Tea+ Originals"
          >
            <SparklesIcon size={13} />
            <span>Originals</span>
          </button>

          {/* Sort Selector Dropdown */}
          <div className="filter-sort-wrapper">
            <span className="sort-label">Sort:</span>
            <div className="sort-select-box">
              <select
                value={filterState.sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="sort-select"
                aria-label="Sort content"
              >
                <option value="trending">{sortLabels.trending}</option>
                <option value="rating">{sortLabels.rating}</option>
                <option value="year">{sortLabels.year}</option>
                <option value="alphabetical">{sortLabels.alphabetical}</option>
              </select>
              <ChevronDownIcon size={13} className="sort-chevron-icon" />
            </div>
          </div>

          {/* Reset Filters Pill (visible only when filters applied) */}
          {isAnyFilterActive && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={onResetFilters}
              title="Reset all active filters"
            >
              <CloseIcon size={13} />
              <span>Reset</span>
            </button>
          )}

          {/* Optional results count badge */}
          {totalResultsCount !== undefined && (
            <span className="filter-results-badge">
              {totalResultsCount} {totalResultsCount === 1 ? 'title' : 'titles'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
