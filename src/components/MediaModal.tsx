'use client';

import React, { useState, useEffect } from 'react';
import type { MediaItem, EpisodeItem, MediaCredits } from '@/types/media';
import { getTrailerKey, getMediaCredits, getTvEpisodes } from '@/services/tmdb';
import {
  CloseIcon,
  PlayIcon,
  PlusIcon,
  CheckIcon,
  ThumbsUpIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  ToggleGoldBadgeIcon,
  BoltIcon,
} from './Icons';
import { StreamPlayerModal } from './StreamPlayerModal';

interface MediaModalProps {
  item: MediaItem | null;
  onClose: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  item,
  onClose,
  isInWatchlist,
  onToggleWatchlist,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'details' | 'more'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [credits, setCredits] = useState<MediaCredits>({ cast: [], director: '' });
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load real TMDB trailers, credits, and episodes when modal opens
  useEffect(() => {
    if (!item) {
      setTrailerKey(null);
      setEpisodes([]);
      setCredits({ cast: [], director: '' });
      setIsPlaying(false);
      return;
    }

    setIsLoadingDetails(true);
    setIsPlaying(false);

    Promise.all([
      getTrailerKey(item.tmdbId, item.type),
      getMediaCredits(item.tmdbId, item.type),
      item.type === 'tv' ? getTvEpisodes(item.tmdbId, selectedSeason) : Promise.resolve([]),
    ])
      .then(([trailer, creds, eps]) => {
        setTrailerKey(trailer);
        setCredits(creds);
        setEpisodes(eps);
        if (trailer) {
          // Auto-start trailer preview after short delay
          setTimeout(() => setIsPlaying(true), 600);
        }
      })
      .finally(() => setIsLoadingDetails(false));
  }, [item, selectedSeason]);

  if (!item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <CloseIcon size={20} />
        </button>

        {/* Modal Billboard / Live Preview Player */}
        <div className="modal-hero-player">
          {isPlaying && trailerKey ? (
            <div className="modal-video-embed">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&loop=1&playlist=${trailerKey}`}
                title="Trailer Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="trailer-iframe"
              />
            </div>
          ) : (
            <img
              src={item.backdropUrl}
              alt={item.title}
              className="modal-backdrop-img"
            />
          )}

          {/* Ambient Dark Gradient Layer */}
          <div className="player-ambient-effect" />

          {/* Player Controls Overlay */}
          <div className="modal-hero-content">
            <div className="modal-badge-row">
              <span className="modal-gold-tag">
                <ToggleGoldBadgeIcon size={14} /> Included with Tea+
              </span>
              {item.badge && <span className="modal-category-tag">{item.badge}</span>}
            </div>

            <h1 className="modal-title">{item.title}</h1>
            {item.subtitle && <p className="modal-subtitle">{item.subtitle}</p>}

            {/* Action Buttons */}
            <div className="modal-actions-row">
              <button
                className="modal-btn-play"
                onClick={() => setIsStreamOpen(true)}
                type="button"
                title="Stream full title"
              >
                <PlayIcon size={20} />
                <span>Watch Now</span>
              </button>

              {trailerKey && (
                <button
                  className="modal-btn-icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  type="button"
                  title={isPlaying ? 'Pause Trailer' : 'Watch Trailer'}
                >
                  <PlayIcon size={18} />
                  <span>{isPlaying ? 'Pause' : 'Trailer'}</span>
                </button>
              )}

              <button
                className={`modal-btn-icon ${isInWatchlist ? 'active-btn' : ''}`}
                onClick={() => onToggleWatchlist(item)}
                title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {isInWatchlist ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
                <span>{isInWatchlist ? 'Added' : 'Watchlist'}</span>
              </button>

              <button className="modal-btn-icon" title="Like">
                <ThumbsUpIcon size={18} />
              </button>

              {trailerKey && isPlaying && (
                <button
                  className="modal-btn-audio"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeMuteIcon size={18} /> : <VolumeHighIcon size={18} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body & Metadata */}
        <div className="modal-body">
          <div className="modal-meta-grid">
            <div className="modal-meta-left">
              {/* Badges line */}
              <div className="meta-tags-line">
                <span className="match-tag">{item.matchScore}% Match</span>
                <span className="age-rating-pill">{item.rating}</span>
                <span className="year-pill">{item.year}</span>
                <span className="duration-pill">{item.duration}</span>
                {item.quality?.map((q) => (
                  <span key={q} className="quality-pill">
                    {q}
                  </span>
                ))}
              </div>

              <p className="modal-synopsis">{item.synopsis}</p>

              <div className="modal-features-list">
                <div className="feature-item">
                  <span className="feature-label">Audio Languages:</span>
                  <span className="feature-value">
                    English [Original], Español, Français, Deutsch, Urdu, Hindi
                  </span>
                </div>
                <div className="feature-item">
                  <span className="feature-label">Subtitles:</span>
                  <span className="feature-value">English [CC], Español, Français, Urdu, Arabic</span>
                </div>
              </div>
            </div>

            <div className="modal-meta-right">
              <div className="info-block">
                <span className="info-label">Starring:</span>
                <span className="info-text">
                  {credits.cast.length > 0
                    ? credits.cast.join(', ')
                    : 'Leading Cast & Performers'}
                </span>
              </div>
              <div className="info-block">
                <span className="info-label">Genres:</span>
                <span className="info-text">{item.genre.join(', ')}</span>
              </div>
              <div className="info-block">
                <span className="info-label">Director:</span>
                <span className="info-text">{credits.director || 'Visionary Creators'}</span>
              </div>
            </div>
          </div>

          {/* Tabs: Episodes (if TV) / Related Details */}
          <div className="modal-tabs-header">
            {item.type === 'tv' && (
              <button
                className={`modal-tab-btn ${activeTab === 'episodes' ? 'active' : ''}`}
                onClick={() => setActiveTab('episodes')}
              >
                Episodes ({episodes.length})
              </button>
            )}
            <button
              className={`modal-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details & Production
            </button>
          </div>

          {/* Episodes List View */}
          {item.type === 'tv' && activeTab === 'episodes' && (
            <div className="episodes-container">
              <div className="season-selector-bar">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="season-dropdown"
                >
                  <option value={1}>Season 1</option>
                  <option value={2}>Season 2</option>
                </select>
              </div>

              <div className="episodes-list">
                {episodes.length > 0 ? (
                  episodes.map((ep) => (
                    <div key={ep.num} className="episode-card">
                      <div className="episode-thumbnail">
                        {ep.stillUrl ? (
                          <img
                            src={ep.stillUrl}
                            alt={ep.title}
                            className="episode-still-img"
                          />
                        ) : (
                          <img
                            src={item.backdropUrl}
                            alt={ep.title}
                            className="episode-still-img"
                          />
                        )}
                        <span className="ep-num">{ep.num}</span>
                        <div className="ep-play-circle">
                          <PlayIcon size={14} />
                        </div>
                      </div>
                      <div className="episode-info">
                        <div className="ep-title-row">
                          <h4>{ep.title}</h4>
                          <span className="ep-duration">{ep.duration}</span>
                        </div>
                        <p className="ep-desc">{ep.desc}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', padding: '1rem 0' }}>
                    {isLoadingDetails ? 'Loading episodes...' : 'Episode guide coming soon.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Details & Production View */}
          {activeTab === 'details' && (
            <div className="trivia-container">
              <div className="trivia-card">
                <h4>About This Production</h4>
                <p>
                  Captured with state-of-the-art cinematic optics and calibrated for HDR10+ and Dolby
                  Vision on Tea+. Features multi-channel spatial audio.
                </p>
              </div>
              <div className="trivia-card">
                <h4>Audience Rating & Content Advisory</h4>
                <p>
                  Rated {item.rating}. Recommended for mature audiences based on dramatic tension,
                  language, and storyline themes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Player Modal */}
      <StreamPlayerModal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        media={{
          id: item.id,
          tmdbId: item.tmdbId,
          title: item.title,
          type: item.type,
          year: item.year,
          currentSeason: selectedSeason,
          currentEpisode: 1,
        }}
      />
    </div>
  );
};
