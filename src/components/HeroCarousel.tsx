'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaItem } from '@/types/media';
import { useWatchlist } from '@/context/WatchlistContext';
import {
  PlayIcon,
  PlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ToggleGoldBadgeIcon,
} from './Icons';

interface HeroCarouselProps {
  items: MediaItem[];
  badgePrefix?: string;
  autoPlayInterval?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  items,
  badgePrefix = 'Featured',
  autoPlayInterval = 6000,
}) => {
  const router = useRouter();
  const { watchlist, toggleWatchlist } = useWatchlist();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const count = items.length;
  const currentItem = items[activeIndex] || items[0];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
  };

  // Auto-play timer with pause on hover
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, autoPlayInterval, handleNext, activeIndex]);

  if (!currentItem) return null;

  const isInList = watchlist.includes(currentItem.id);

  return (
    <section
      className="hero-carousel-shell"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Featured Media Carousel"
    >
      {/* Background Slides Stack (Smooth Crossfade + Subtle Ken Burns) */}
      <div className="hero-carousel-backdrops">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.id}
              className={`hero-carousel-backdrop-slide ${isActive ? 'is-active' : ''}`}
              aria-hidden={!isActive}
            >
              {item.backdropUrl && (
                <img
                  src={item.backdropUrl}
                  alt=""
                  className="hero-carousel-backdrop-img"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Seamless Black Vignette Overlays */}
      <div className="hero-carousel-overlay" />

      {/* Foreground Content */}
      <div className="hero-carousel-inner">
        <div className="hero-carousel-content" key={currentItem.id}>
          {/* Eyebrow & Rank Pill — Prime Video Style */}
          <div className="hero-carousel-kicker">
            <span className="hero-carousel-badge hero-carousel-gold-badge">
              <ToggleGoldBadgeIcon size={13} />
              Included with Tea+
            </span>
            <span className="hero-carousel-badge hero-carousel-rank-badge">
              <span className="hero-carousel-pulse-dot" />
              {badgePrefix} #{activeIndex + 1}
            </span>
            {currentItem.matchScore ? (
              <span className="hero-carousel-match">{currentItem.matchScore}% Match</span>
            ) : null}
          </div>

          {/* Title */}
          <h1 className="hero-carousel-title">{currentItem.title}</h1>

          {/* Meta Tags Row */}
          <div className="hero-carousel-meta">
            {currentItem.rating && (
              <span className="hero-carousel-meta-tag rating-tag">{currentItem.rating}</span>
            )}
            {currentItem.year && (
              <span className="hero-carousel-meta-tag">{currentItem.year}</span>
            )}
            {currentItem.duration && (
              <span className="hero-carousel-meta-tag">{currentItem.duration}</span>
            )}
            <span className="hero-carousel-meta-tag quality-tag">Ultra HD 4K</span>
            <span className="hero-carousel-meta-tag audio-tag">Dolby Atmos</span>
          </div>

          {/* Synopsis */}
          {currentItem.synopsis && (
            <p className="hero-carousel-synopsis">{currentItem.synopsis}</p>
          )}

          {/* Interactive Actions */}
          <div className="hero-carousel-actions">
            <button
              className="hero-btn-play"
              type="button"
              onClick={() => router.push(`/detail/${currentItem.id}`)}
              title={`Play ${currentItem.title}`}
            >
              <PlayIcon size={20} />
              <span>Watch Now</span>
            </button>

            <button
              className={`hero-btn-watchlist ${isInList ? 'is-active' : ''}`}
              type="button"
              onClick={() => toggleWatchlist(currentItem)}
              title={isInList ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInList ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
              <span>{isInList ? 'Added' : 'Watchlist'}</span>
            </button>

            <button
              className="hero-btn-details"
              type="button"
              onClick={() => router.push(`/detail/${currentItem.id}`)}
            >
              <span>More Info</span>
            </button>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Animated Progress Indicators */}
        <div className="hero-carousel-controls">
          <button
            className="hero-carousel-arrow hero-carousel-arrow-prev"
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
          >
            <ChevronLeftIcon size={22} />
          </button>

          <div className="hero-carousel-indicators" role="tablist">
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  className={`hero-carousel-indicator-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelect(idx)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${idx + 1}: ${item.title}`}
                  title={item.title}
                >
                  {isActive && (
                    <span
                      key={`progress-${idx}`}
                      className={`hero-carousel-indicator-fill ${isPaused ? 'is-paused' : ''}`}
                      style={{ animationDuration: `${autoPlayInterval}ms` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="hero-carousel-arrow hero-carousel-arrow-next"
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
          >
            <ChevronRightIcon size={22} />
          </button>
        </div>
      </div>
    </section>
  );
};
