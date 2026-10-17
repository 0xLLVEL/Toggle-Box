'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { FullMediaDetail, EpisodeItem } from '@/types/media';
import { getFullMediaDetails } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaRow } from '@/components/MediaRow';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { useWatchlist } from '@/context/WatchlistContext';
import {
  ToggleGoldBadgeIcon,
  PlusIcon,
  CheckIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ShareIcon,
  PlayIcon,
  ChevronDownIcon,
  CloseIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  BoltIcon,
} from '@/components/Icons';

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const mediaId = resolvedParams.id || 'dupahiya';
  const router = useRouter();

  const {
    watchlist,
    toggleWatchlist,
    toastMessage,
    triggerToast,
  } = useWatchlist();

  const [detail, setDetail] = useState<FullMediaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'related' | 'details'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState<number>(2);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(true);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [streamEpisode, setStreamEpisode] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getFullMediaDetails(mediaId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          if (data.currentSeason) setSelectedSeason(data.currentSeason);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  if (isLoading || !detail) {
    return (
      <div className="toggle-box-app">
        <Navbar watchlistCount={watchlist.length} />
        <div className="detail-loading-skeleton">
          <div className="skeleton-billboard-hero" />
        </div>
      </div>
    );
  }

  const isInList = watchlist.includes(detail.id);
  const episodesList = detail.episodes || [];

  // Recommendations formatted for MediaRow
  const recRow = {
    id: 'customers-also-watched',
    title: 'Customers also watched',
    items: detail.recommendations,
  };

  return (
    <div className="toggle-box-app detail-page-view">
      <Navbar watchlistCount={watchlist.length} />

      {/* Hero Cinematic Section */}
      <section className="detail-hero-section">
        {/* Backdrop Image or Active Trailer */}
        {isPlayingTrailer && detail.trailerKey ? (
          <div className="detail-trailer-wrapper">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${detail.trailerKey}?autoplay=1&mute=${isTrailerMuted ? 1 : 0}&controls=1&rel=0`}
              title="Official Trailer"
              className="detail-trailer-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <div className="trailer-close-bar">
              <button
                className="trailer-audio-btn"
                onClick={() => setIsTrailerMuted(!isTrailerMuted)}
                type="button"
              >
                {isTrailerMuted ? <VolumeMuteIcon size={18} /> : <VolumeHighIcon size={18} />}
              </button>
              <button
                className="trailer-close-btn"
                onClick={() => setIsPlayingTrailer(false)}
                type="button"
              >
                <CloseIcon size={18} /> Close Trailer
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-backdrop-wrapper">
            <img
              src={detail.backdropUrl}
              alt={detail.title}
              className="detail-backdrop-img"
            />
            <div className="detail-backdrop-gradient" />
          </div>
        )}

        {/* Hero Content Overlay */}
        <div className="detail-hero-content">
          {/* Top Brand Tag: prime original / toggle original */}
          <div className="detail-brand-badge">
            <svg width="22" height="12" viewBox="0 0 40 18" fill="none">
              <path
                d="M1 9C10 16 30 16 39 9"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M33 5L39 9L34 13"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="brand-original-text">prime original</span>
          </div>

          {/* Huge Clean Show Title */}
          <h1 className="detail-main-title">{detail.title}</h1>

          {/* Action Row & Subscription CTA */}
          <div className="detail-actions-banner-group">
            {/* Circular Action Buttons Row */}
            <div className="detail-circle-actions">
              {/* Play / Stream button */}
              <button
                className="detail-action-circle play-circle"
                onClick={() => {
                  router.push(`/watch/${detail.id}?season=${selectedSeason}&episode=1`);
                }}
                title="Stream Now"
                type="button"
                aria-label="Stream Now"
              >
                <PlayIcon size={18} />
              </button>

              {/* Watchlist toggle */}
              <button
                className={`detail-action-circle${isInList ? ' active-action' : ''}`}
                onClick={() => {
                  toggleWatchlist({
                    id: detail.id,
                    tmdbId: detail.tmdbId,
                    title: detail.title,
                    rating: detail.rating,
                    duration: detail.duration,
                    year: detail.year,
                    genre: detail.genres,
                    synopsis: detail.synopsis,
                    backdropUrl: detail.backdropUrl,
                    posterUrl: detail.posterUrl,
                    type: detail.type,
                  });
                }}
                title={isInList ? 'In Watchlist' : 'Add to Watchlist'}
                type="button"
                aria-label="Watchlist"
              >
                {isInList ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
              </button>

              {/* Like */}
              <button
                className={`detail-action-circle${isLiked ? ' active-action' : ''}`}
                onClick={() => {
                  setIsLiked(!isLiked);
                  if (isDisliked) setIsDisliked(false);
                  triggerToast(isLiked ? 'Rating removed' : 'Added to Loved titles');
                }}
                title="I like this"
                type="button"
                aria-label="Like"
              >
                <ThumbsUpIcon size={17} />
              </button>

              {/* Dislike */}
              <button
                className={`detail-action-circle${isDisliked ? ' active-action' : ''}`}
                onClick={() => {
                  setIsDisliked(!isDisliked);
                  if (isLiked) setIsLiked(false);
                  triggerToast(isDisliked ? 'Rating removed' : 'Marked as Not for me');
                }}
                title="Not for me"
                type="button"
                aria-label="Dislike"
              >
                <ThumbsDownIcon size={17} />
              </button>

              {/* Share */}
              <button
                className="detail-action-circle"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    triggerToast('Link copied to clipboard');
                  }
                }}
                title="Share"
                type="button"
                aria-label="Share"
              >
                <ShareIcon size={17} />
              </button>
            </div>

            {/* White Free Trial Subscription Box */}
            <div className="detail-trial-box">
              <button
                className="trial-pill-card"
                onClick={() => {
                  router.push(`/watch/${detail.id}?season=${selectedSeason}&episode=1`);
                }}
                type="button"
              >
                <span className="trial-pill-brand">Tea+</span>
                <span className="trial-pill-text">Watch Now</span>
              </button>
              <div className="trial-join-line">
                <ToggleGoldBadgeIcon size={14} />
                <span className="trial-join-text">Included with Tea+</span>
                <span className="trial-terms-text">Instant Stream</span>
              </div>
            </div>
          </div>

          {/* Synopsis & Metadata Block */}
          <div className="detail-meta-synopsis-layout">
            <div className="detail-meta-left">
              {/* Badges line: NEW SEASON + All episodes available */}
              <div className="detail-badges-row">
                <span className="detail-badge-pill">NEW SEASON</span>
                <span className="detail-badge-episodes-available">
                  <span className="speaker-icon">🔊</span> All episodes available
                </span>
              </div>

              {/* 3-line synopsis */}
              <p className="detail-synopsis-snippet">
                {detail.synopsis}
              </p>

              {/* Genres, year, seasons */}
              <div className="detail-tags-row">
                <span className="detail-genres-text">{detail.genres.join(' • ')}</span>
                <span className="detail-dot">•</span>
                <span>{detail.year}</span>
                <span className="detail-dot">•</span>
                <span>{detail.duration}</span>
              </div>
            </div>

            {/* Right: Cast list & Tech badges */}
            <div className="detail-meta-right">
              <div className="detail-cast-preview">
                <span className="cast-lead">Cast: </span>
                <span className="cast-names">
                  {detail.cast.slice(0, 3).join(', ')}
                </span>
              </div>

              <div className="detail-tech-badges">
                <span className="detail-spec-badge">{detail.rating}</span>
                <span className="detail-spec-badge">CC</span>
                <span className="detail-spec-badge">AD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Navbar & Tabs Bar */}
      <section className="detail-subnav-section">
        <div className="detail-subnav-container">
          <div className="detail-subnav-left">
            {/* Season Selector Dropdown */}
            {detail.type === 'tv' && (
              <div className="season-selector-wrapper">
                <button
                  className="season-selector-btn"
                  onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                  type="button"
                >
                  <ToggleGoldBadgeIcon size={14} />
                  <span>Season {selectedSeason}</span>
                  <ChevronDownIcon size={14} />
                </button>

                {showSeasonDropdown && (
                  <div className="season-dropdown-menu">
                    <button
                      className={`season-option${selectedSeason === 1 ? ' active' : ''}`}
                      onClick={() => {
                        setSelectedSeason(1);
                        setShowSeasonDropdown(false);
                      }}
                      type="button"
                    >
                      Season 1
                    </button>
                    <button
                      className={`season-option${selectedSeason === 2 ? ' active' : ''}`}
                      onClick={() => {
                        setSelectedSeason(2);
                        setShowSeasonDropdown(false);
                      }}
                      type="button"
                    >
                      Season 2
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tabs: Episodes | Related | Details */}
            <div className="detail-tabs-list">
              {detail.type === 'tv' && (
                <button
                  className={`detail-tab-btn${activeTab === 'episodes' ? ' is-active' : ''}`}
                  onClick={() => setActiveTab('episodes')}
                  type="button"
                >
                  Episodes
                </button>
              )}
              <button
                className={`detail-tab-btn${activeTab === 'related' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('related')}
                type="button"
              >
                Related
              </button>
              <button
                className={`detail-tab-btn${activeTab === 'details' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('details')}
                type="button"
              >
                Details
              </button>
            </div>
          </div>

          <div className="detail-subnav-right">
            {detail.type === 'tv' && (
              <span className="episodes-count-label">
                {episodesList.length} episodes
              </span>
            )}
          </div>
        </div>
      </section>

      {/* TAB 1: EPISODES GRID (Matches Screenshot: 4-Column Grid) */}
      {activeTab === 'episodes' && detail.type === 'tv' && (
        <section className="detail-episodes-section">
          <div className="detail-episodes-container">
            <h3 className="episodes-section-heading">{episodesList.length} episodes</h3>

            <div className="episodes-cards-grid">
              {episodesList.map((ep) => (
                <div
                  key={ep.num}
                  className="episode-card-item"
                  onClick={() => {
                    router.push(`/watch/${detail.id}?season=${selectedSeason}&episode=${ep.num}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/watch/${detail.id}?season=${selectedSeason}&episode=${ep.num}`);
                    }
                  }}
                >
                  {/* Thumbnail still with gold badge at bottom left */}
                  <div className="episode-thumb-wrap">
                    <img
                      src={ep.stillUrl || detail.backdropUrl}
                      alt={ep.title}
                      className="episode-thumb-img"
                      loading="lazy"
                    />
                    <div className="episode-thumb-gradient" />
                    <div className="episode-gold-badge" title="Included with Prime">
                      <ToggleGoldBadgeIcon size={12} />
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="episode-title">
                    {ep.num}. {ep.title}
                  </h4>

                  {/* Description */}
                  <p className="episode-desc">{ep.desc}</p>

                  {/* Meta: [13+] [CC] 43min Oct 1, 2026 */}
                  <div className="episode-meta-line">
                    <span className="episode-spec-badge">{ep.rating || '13+'}</span>
                    <span className="episode-spec-badge">CC</span>
                    <span className="episode-duration">{ep.duration}</span>
                    <span className="episode-airdate">{ep.airDate || 'Oct 1, 2026'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: RELATED CONTENT */}
      {activeTab === 'related' && (
        <section className="detail-related-section">
          <MediaRow
            row={recRow}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onSelectMedia={(item) => {
              router.push(`/detail/${item.id}`);
            }}
          />
        </section>
      )}

      {/* "Customers also watched" Carousel always shown under episodes matching screenshot */}
      {activeTab === 'episodes' && (
        <section className="detail-recommendations-carousel">
          <MediaRow
            row={recRow}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onSelectMedia={(item) => {
              router.push(`/detail/${item.id}`);
            }}
          />
        </section>
      )}

      {/* Comprehensive Details Section at the bottom matching reference */}
      <section className="detail-comprehensive-section">
        <div className="detail-comprehensive-container">
          <div className="comprehensive-dual-layout">
            {/* Left Column: Full Details & Credits */}
            <div className="comprehensive-left-col">
              <h2 className="comp-title">{detail.title}</h2>
              <div className="comp-genres-line">
                {detail.genres.join(' • ')}
              </div>
              <div className="comp-specs-line">
                <span>{detail.year}</span>
                <span>{detail.duration}</span>
                <span className="comp-spec-tag">HDR</span>
                <span className="comp-spec-tag">UHD</span>
              </div>

              <p className="comp-synopsis-full">
                {showFullSynopsis
                  ? detail.synopsis
                  : detail.synopsis}
              </p>
              <button
                className="comp-more-btn"
                onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                type="button"
              >
                {showFullSynopsis ? 'Less' : 'More'}
              </button>

              {/* Creators and Cast list */}
              <div className="comp-credits-block">
                <h3 className="comp-credits-title">Creators and Cast</h3>

                <div className="comp-credit-row">
                  <span className="comp-role">Directors</span>
                  <span className="comp-person-link">{detail.directors.join(', ')}</span>
                </div>

                <div className="comp-credit-row">
                  <span className="comp-role">Producers</span>
                  <span className="comp-person-link">{detail.producers.join(', ')}</span>
                </div>

                <div className="comp-credit-row">
                  <span className="comp-role">Cast</span>
                  <span className="comp-person-link">{detail.cast.join(', ')}</span>
                </div>

                <div className="comp-credit-row">
                  <span className="comp-role">Studio</span>
                  <span className="comp-person-text">{detail.studio}</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3 Surface Cards */}
            <div className="comprehensive-right-col">
              {/* Card 1: Content advisory */}
              <div className="comp-surface-card">
                <h4 className="comp-card-title">Content advisory</h4>
                <div className="comp-rating-pill">{detail.rating}</div>
                <p className="comp-card-text">{detail.advisory}</p>
              </div>

              {/* Card 2: Audio languages */}
              <div className="comp-surface-card">
                <h4 className="comp-card-title">Audio languages</h4>
                <div className="comp-audio-badges">
                  <span className="comp-tag-pill">5.1</span>
                  <span className="comp-tag-pill">AD</span>
                </div>
                <p className="comp-card-text">
                  {detail.audioLanguages.join(', ')}
                </p>
              </div>

              {/* Card 3: Subtitles */}
              <div className="comp-surface-card">
                <h4 className="comp-card-title">Subtitles</h4>
                <div className="comp-sub-badge">
                  <span className="comp-tag-pill">CC</span>
                </div>
                <p className="comp-card-text">
                  {detail.subtitles.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Legal line */}
          <div className="detail-terms-footer-line">
            <span>By clicking play, you agree to our </span>
            <a href="#terms" className="terms-anchor">
              Terms of Use
            </a>
            .
          </div>
        </div>
      </section>

      {/* Feedback & Support Section */}
      <section className="detail-feedback-support-row">
        <div className="feedback-col">
          <span className="feedback-caption">Feedback</span>
          <button
            className="feedback-action-button"
            onClick={() => triggerToast('Feedback form opened')}
            type="button"
          >
            Send us feedback
          </button>
        </div>

        <div className="support-col">
          <span className="support-caption">Support</span>
          <a href="#help" className="support-anchor-link">
            Get Help
          </a>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />

      {/* Toast notifications */}
      <Toast message={toastMessage} />
    </div>
  );
}
