'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { CategoryRow, MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { ChevronLeftIcon, ChevronRightIcon, RefreshIcon } from './Icons';
import { useWatchlist } from '@/context/WatchlistContext';

interface MediaRowProps {
  row: CategoryRow;
  watchlist: string[];
  onToggleWatchlist: (item: MediaItem) => void;
  onSelectMedia: (item: MediaItem) => void;
}

const MediaRowInner: React.FC<MediaRowProps> = ({
  row,
  watchlist,
  onToggleWatchlist,
  onSelectMedia,
}) => {
  const { watchProgress } = useWatchlist();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

      const maxScroll = Math.max(1, scrollWidth - clientWidth);
      const calculatedPages = Math.max(1, Math.ceil(scrollWidth / clientWidth));
      const activeIdx = Math.min(
        calculatedPages - 1,
        Math.max(0, Math.round((scrollLeft / maxScroll) * (calculatedPages - 1)))
      );
      setTotalPages(calculatedPages);
      setCurrentPage(activeIdx);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [row.items, checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const pageWidth = scrollRef.current.clientWidth * 0.84;
      const scrollAmount = direction === 'left' ? -pageWidth : pageWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 420);
    }
  };

  const scrollToPageIndex = (pageIdx: number) => {
    if (scrollRef.current && totalPages > 1) {
      const { scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const targetScroll = (pageIdx / (totalPages - 1)) * maxScroll;
      scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setTimeout(checkScroll, 420);
    }
  };

  const isPortrait = row.cardLayout === 'portrait' || row.id === 'featured-originals';

  if (row.items.length === 0) {
    return null;
  }

  return (
    <section className="media-row-section">
      {/* Row Header */}
      <div className="row-header">
        <div className="row-title-left">
          <h2 className="row-title" data-testid="carousel-title">
            <span className="row-title-text">{row.title}</span>
            <ChevronRightIcon size={14} className="row-title-chevron" aria-hidden="true" />
          </h2>
          {row.isTop10 && (
            <button
              type="button"
              className={`top10-reload-btn ${isRefreshing ? 'is-spinning' : ''}`}
              title="Refresh Top 10"
              aria-label="Refresh Top 10"
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 800);
              }}
            >
              <RefreshIcon size={15} />
            </button>
          )}
          {row.seeMoreLink && (
            <a href={row.seeMoreLink} className="see-more-link see-more-inline">
              <span>See more</span>
              <ChevronRightIcon size={13} />
            </a>
          )}
        </div>

        <div className="row-header-right">
          {/* Subtle multi-segment page indicators */}
          {totalPages > 1 && (
            <div
              className="row-pagination-indicators"
              aria-label={`Page ${currentPage + 1} of ${totalPages}`}
              role="tablist"
            >
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pagination-indicator-dash ${idx === currentPage ? 'is-active' : ''}`}
                  onClick={() => scrollToPageIndex(idx)}
                  aria-label={`Jump to page ${idx + 1}`}
                  role="tab"
                  aria-selected={idx === currentPage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row Carousel Area */}
      <div
        className={`carousel-wrapper ${canScrollLeft ? 'has-left-mask' : ''} ${
          canScrollRight ? 'has-right-mask' : ''
        }`}
      >
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            type="button"
          >
            <ChevronLeftIcon size={22} />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={`carousel-track ${
            row.isTop10 ? 'top10-track' : isPortrait ? 'portrait-track' : 'landscape-track'
          }`}
        >
          {row.items.map((item, idx) => (
            <MediaCard
              key={item.id}
              item={item}
              rank={row.isTop10 ? item.rank || idx + 1 : undefined}
              cardLayout={isPortrait ? 'portrait' : 'landscape'}
              isInWatchlist={watchlist.includes(item.id)}
              onToggleWatchlist={onToggleWatchlist}
              onSelect={onSelectMedia}
              watchProgress={watchProgress?.[item.id]}
            />
          ))}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            type="button"
          >
            <ChevronRightIcon size={22} />
          </button>
        )}
      </div>
    </section>
  );
};

export const MediaRow = React.memo(MediaRowInner);
