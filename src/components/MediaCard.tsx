'use client';

import React, { useState } from 'react';
import type { MediaItem } from '@/types/media';
import {
  ToggleGoldBadgeIcon,
  PlayIcon,
  PlusIcon,
  CheckIcon,
  ThumbsUpIcon,
  InfoIcon,
} from './Icons';

interface MediaCardProps {
  item: MediaItem;
  rank?: number;
  cardLayout?: 'portrait' | 'landscape';
  isInWatchlist: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
  onSelect: (item: MediaItem) => void;
  watchProgress?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  rank,
  cardLayout = 'landscape',
  isInWatchlist,
  onToggleWatchlist,
  onSelect,
  watchProgress,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Landscape cards prefer 16:9 backdrop; portrait cards prefer 2:3 poster
  const isPortrait = cardLayout === 'portrait';
  const displayImage = isPortrait
    ? (item.posterUrl || item.backdropUrl || '')
    : (item.backdropUrl || item.posterUrl || '');

  const handleCardClick = () => {
    onSelect(item);
  };

  return (
    <div
      className={`media-card-wrapper ${
        rank
          ? 'top10-card-wrapper'
          : isPortrait
            ? 'portrait-card-wrapper'
            : 'landscape-card-wrapper'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top 10 rank numeral */}
      {rank !== undefined && (
        <div className="top10-rank-number" data-rank={rank} aria-hidden="true">
          <span className="rank-stroke">{rank}</span>
          <span className="rank-fill">{rank}</span>
        </div>
      )}

      <div
        className={`media-card-container ${isHovered ? 'card-hovered' : ''}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`${item.title}, ${item.type === 'tv' ? 'series' : 'movie'}, ${item.year}`}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Card Artwork / Live TMDB Image */}
        <div className="card-poster">
          {!imgError ? (
            <img
              src={displayImage}
              alt={item.title}
              className="card-img"
              loading="lazy"
              width={640}
              height={360}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-fallback-gradient" />
          )}

          {/* Constant base gradient overlay for text readability */}
          <div className="card-backdrop-overlay" />

          {/* Badge at top right — v0.2 dynamic colors via data-badge */}
          {item.badge && (
            <div className="card-top-badge" data-badge={item.badge}>
              <span>{item.badge}</span>
            </div>
          )}

          {/* Quality badge (4K, HDR) */}
          {item.quality && item.quality[0] && (
            <div className="card-quality-tag">{item.quality[0]}</div>
          )}

          {/* Included-with-Tea+ gold badge — stays visible on the card face */}
          <div className="card-gold-badge" title="Included with Tea+">
            <ToggleGoldBadgeIcon size={12} aria-hidden="true" />
          </div>

          {/* Hover Slide-up Actions & Metadata (title is revealed here on hover) */}
          <div className={`card-hover-drawer ${isHovered ? 'drawer-visible' : ''}`}>
            {/* Title — revealed on hover (hidden on the card face by default) */}
            <h3 className="card-drawer-title">{item.title}</h3>

            {/* Quick Action buttons */}
            <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="action-btn-circle play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                title="Play Now"
                aria-label="Play Now"
                type="button"
              >
                <PlayIcon size={14} />
              </button>

              <button
                className={`action-btn-circle ${isInWatchlist ? 'active-watchlist' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(item);
                }}
                title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                aria-label="Toggle Watchlist"
                aria-pressed={isInWatchlist}
                type="button"
              >
                {isInWatchlist ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
              </button>

              <button
                className={`action-btn-circle ${isLiked ? 'active-like' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                }}
                title="Like"
                aria-label="Like"
                aria-pressed={isLiked}
                type="button"
              >
                <ThumbsUpIcon size={13} />
              </button>

              <button
                className="action-btn-circle info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                title="More Info"
                aria-label="More Info"
                type="button"
              >
                <InfoIcon size={13} />
              </button>
            </div>

            {/* Quick Meta tags */}
            <div className="card-meta-line">
              {item.matchScore ? (
                <span className="card-match-score">{item.matchScore}% Match</span>
              ) : null}
              <span className="card-meta-rating">{item.rating}</span>
              <span className="card-meta-duration">{item.duration}</span>
              <span className="card-meta-year">{item.year}</span>
            </div>

            {item.genre.length > 0 && (
              <div className="card-genres-line">{item.genre.slice(0, 3).join(' • ')}</div>
            )}
          </div>

          {/* Playback progress bar for continue watching */}
          {watchProgress !== undefined && watchProgress > 0 && (
            <div className="card-progress-bar-wrap" title={`${watchProgress}% watched`}>
              <div
                className="card-progress-bar-fill"
                style={{ width: `${Math.min(100, Math.max(4, watchProgress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
