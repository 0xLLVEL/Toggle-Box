'use client';

import React from 'react';

export type FilterCategory = 'all' | 'originals' | 'top10' | 'movies' | 'tv' | '4k';

interface FilterBarProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  showPrimeOnly: boolean;
  onTogglePrimeOnly: () => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  regions: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  showPrimeOnly,
  onTogglePrimeOnly,
  selectedRegion,
  onSelectRegion,
  regions,
}) => {
  const filterPills: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All Content' },
    { id: 'originals', label: 'Originals & Exclusives' },
    { id: 'top10', label: 'Top 10 Ranks' },
    { id: 'movies', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: '4k', label: '4K Ultra HD' },
  ];

  return (
    <div className="filter-bar-container">
      <div className="filter-pills-list">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => onFilterChange(pill.id)}
            className={`filter-pill ${activeFilter === pill.id ? 'filter-pill-active' : ''}`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="filter-controls-right">
        {/* Toggle Switch: Included with Prime / Toggle Box */}
        <label className="toggle-switch-wrapper" title="Show only included with Prime">
          <span className="toggle-switch-label">Included with Prime</span>
          <button
            type="button"
            role="switch"
            aria-checked={showPrimeOnly}
            onClick={onTogglePrimeOnly}
            className={`toggle-switch-track ${showPrimeOnly ? 'active' : ''}`}
          >
            <span className="toggle-switch-thumb" />
          </button>
        </label>

        {/* Region Switcher for Top 10 */}
        <div className="region-selector-wrapper">
          <span className="region-label">Region:</span>
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="region-select"
            aria-label="Select Top 10 Region"
          >
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
