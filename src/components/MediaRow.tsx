'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { CategoryRow, MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [row.items, checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const pageWidth = scrollRef.current.clientWidth * 0.82;
      const scrollAmount = direction === 'left' ? -pageWidth : pageWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 400);
    }
  };

  const displayTitle = row.isTop10 ? 'Top 10 Today' : row.title;

  if (row.items.length === 0) {
    return null;
  }

  return (
    <section className="media-row-section">
      {/* Row Header */}
      <div className="row-header">
        <div className="row-title-left">
          <h2 className="row-title">{displayTitle}</h2>
        </div>

        {row.seeMoreLink && (
          <a href={row.seeMoreLink} className="see-more-link">
            <span>See More</span>
            <ChevronRightIcon size={16} />
          </a>
        )}
      </div>

      {/* Row Carousel Area */}
      <div className="carousel-wrapper">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            type="button"
          >
            <ChevronLeftIcon size={24} />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className={`carousel-track ${row.isTop10 ? 'top10-track' : ''}`}
        >
          {row.items.map((item, idx) => (
            <MediaCard
              key={item.id}
              item={item}
              rank={row.isTop10 ? item.rank || idx + 1 : undefined}
              isInWatchlist={watchlist.includes(item.id)}
              onToggleWatchlist={onToggleWatchlist}
              onSelect={onSelectMedia}
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
            <ChevronRightIcon size={24} />
          </button>
        )}
      </div>
    </section>
  );
};

export const MediaRow = React.memo(MediaRowInner);
