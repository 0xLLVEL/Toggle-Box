'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useProviders } from '@/context/ProviderContext';
import type { ProviderVideoSource, ProviderEpisode, InstalledProvider } from '@/types/provider';
import {
  CloseIcon,
  PlayIcon,
  PuzzleIcon,
  CheckIcon,
  ChevronDownIcon,
  ToggleGoldBadgeIcon,
} from './Icons';

interface StreamPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: string | number;
    tmdbId: number;
    title: string;
    type: 'movie' | 'tv';
    year?: string | number;
    currentSeason?: number;
    currentEpisode?: number;
  } | null;
}

declare global {
  interface Window {
    Hls?: any;
  }
}

export const StreamPlayerModal: React.FC<StreamPlayerModalProps> = ({
  isOpen,
  onClose,
  media,
}) => {
  const {
    installedProviders,
    resolveProviderStream,
    getEpisodes,
    getVideoSources,
  } = useProviders();

  // Active enabled extensions from the extensions page
  const enabledExtensions = useMemo(
    () => installedProviders.filter((p) => p.isEnabled),
    [installedProviders]
  );

  // Selected extension provider
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<ProviderVideoSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ProviderVideoSource | null>(null);
  const [episodes, setEpisodes] = useState<ProviderEpisode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-pick best default extension when opening
  useEffect(() => {
    if (!isOpen || !media || enabledExtensions.length === 0) return;

    if (!selectedProviderId || !enabledExtensions.some((p) => p.id === selectedProviderId)) {
      // Pick matching extension type if available
      const animeMatch = enabledExtensions.find((p) => p.type === 'anime');
      const movieMatch = enabledExtensions.find((p) => p.type === 'movie' || p.type === 'all');
      
      const defaultExt =
        enabledExtensions.find((p) => p.isDefault) ||
        (media.type === 'tv' && animeMatch ? animeMatch : movieMatch) ||
        enabledExtensions[0];

      setSelectedProviderId(defaultExt.id);
    }
  }, [isOpen, media, enabledExtensions, selectedProviderId]);

  // Load HLS.js script dynamically once
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Hls) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProviderMenu(false);
      }
    };
    if (showProviderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProviderMenu]);

  // Stream resolution effect for the currently selected extension
  useEffect(() => {
    if (!isOpen || !media || !selectedProviderId) return;

    let isMounted = true;
    setIsLoading(true);

    const providerObj = enabledExtensions.find((p) => p.id === selectedProviderId);
    const providerName = providerObj?.name || selectedProviderId;

    setStatusMessage(`Searching "${media.title}" on ${providerName}...`);

    async function resolve() {
      try {
        const result = await resolveProviderStream(
          selectedProviderId,
          media!.title,
          media!.type,
          selectedEpisode
        );

        if (!isMounted) return;

        if (result.episodes && result.episodes.length > 0) {
          setEpisodes(result.episodes);
        }

        if (result.sources && result.sources.length > 0) {
          setSources(result.sources);
          setSelectedSource(result.sources[0]);
          setStatusMessage('');
        } else {
          setSources([]);
          setSelectedSource(null);
          setStatusMessage(
            `No stream available on ${providerName} for "${media!.title}". Please switch to another installed extension.`
          );
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`Failed to stream from ${selectedProviderId}:`, err);
          setSources([]);
          setSelectedSource(null);
          setStatusMessage(
            `Error extracting stream from ${providerName}. Please try another extension.`
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    resolve();

    return () => {
      isMounted = false;
    };
  }, [isOpen, media, selectedProviderId, selectedEpisode, resolveProviderStream, enabledExtensions]);

  // Attach HLS stream to video tag
  useEffect(() => {
    if (!selectedSource || selectedSource.container === 'iframe') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (selectedSource.url.includes('.m3u8')) {
      if (window.Hls && window.Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(selectedSource.url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedSource.url;
        video.play().catch(() => {});
      }
    } else {
      video.src = selectedSource.url;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedSource]);

  if (!isOpen || !media) return null;

  const currentProvider = enabledExtensions.find((p) => p.id === selectedProviderId);

  return (
    <div className="modal-backdrop stream-theater-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog stream-theater-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar matching Prime Video authentic aesthetic */}
        <div className="stream-theater-header">
          <div className="stream-header-meta">
            <span className="modal-gold-tag">
              <ToggleGoldBadgeIcon size={14} /> Included with Tea+
            </span>
            <div className="stream-header-title-row">
              <h2 className="stream-theater-title">{media.title}</h2>
              {media.type === 'tv' && (
                <span className="stream-ep-badge">
                  S{selectedSeason} : E{selectedEpisode}
                </span>
              )}
            </div>
          </div>

          <div className="stream-header-actions">
            {/* Extension Source Selector */}
            <div className="stream-source-dropdown-wrap" ref={dropdownRef}>
              <button
                className="modal-btn-icon stream-source-btn"
                onClick={() => setShowProviderMenu(!showProviderMenu)}
                type="button"
                title="Select streaming extension"
              >
                <PuzzleIcon size={16} />
                <span className="stream-source-label">
                  {currentProvider ? currentProvider.name : 'Select Extension'}
                </span>
                <ChevronDownIcon size={13} />
              </button>

              {showProviderMenu && (
                <div className="stream-source-menu">
                  <div className="source-menu-header">INSTALLED EXTENSIONS</div>

                  {enabledExtensions.length === 0 ? (
                    <div className="source-menu-empty">
                      <span>No active extensions found.</span>
                      <Link href="/providers" className="source-manage-link" onClick={onClose}>
                        Install Extensions
                      </Link>
                    </div>
                  ) : (
                    enabledExtensions.map((ext) => (
                      <button
                        key={ext.id}
                        className={`source-menu-row ${selectedProviderId === ext.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedProviderId(ext.id);
                          setShowProviderMenu(false);
                        }}
                        type="button"
                      >
                        <div className="source-menu-left">
                          <span className="source-menu-name">{ext.name}</span>
                          <span className="source-menu-tag">{ext.type.toUpperCase()}</span>
                        </div>
                        {selectedProviderId === ext.id && (
                          <span className="source-active-check">
                            <CheckIcon size={14} />
                          </span>
                        )}
                      </button>
                    ))
                  )}

                  <div className="source-menu-divider" />
                  <Link
                    href="/providers"
                    className="source-manage-link"
                    onClick={onClose}
                  >
                    <PuzzleIcon size={14} />
                    <span>Manage Installed Extensions</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              className="modal-close-btn stream-modal-close"
              onClick={onClose}
              type="button"
              aria-label="Close Player"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Video Canvas Section */}
        <div className="stream-video-viewport">
          {isLoading ? (
            <div className="stream-loading-placeholder">
              <div className="stream-loader-spinner" />
              <p className="stream-loading-text">{statusMessage}</p>
            </div>
          ) : selectedSource ? (
            selectedSource.container === 'iframe' ? (
              <iframe
                src={selectedSource.url}
                title={`${media.title} Player`}
                className="stream-iframe-player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="stream-native-player-wrap">
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  className="stream-native-video"
                  autoPlay
                >
                  {selectedSource.subtitles?.map((sub, idx) => (
                    <track
                      key={idx}
                      kind="subtitles"
                      src={sub.url}
                      srcLang={sub.lang}
                      label={sub.label}
                      default={sub.default}
                    />
                  ))}
                </video>
              </div>
            )
          ) : (
            <div className="stream-error-placeholder">
              <p className="stream-error-text">{statusMessage}</p>

              {/* Quick-switch buttons to other installed extensions */}
              {enabledExtensions.filter((e) => e.id !== selectedProviderId).length > 0 && (
                <div className="stream-switch-alternatives">
                  <span className="switch-hint-label">Try another installed extension:</span>
                  <div className="switch-buttons-row">
                    {enabledExtensions
                      .filter((e) => e.id !== selectedProviderId)
                      .map((alt) => (
                        <button
                          key={alt.id}
                          className="filter-pill"
                          onClick={() => setSelectedProviderId(alt.id)}
                          type="button"
                        >
                          <PuzzleIcon size={13} />
                          <span>Switch to {alt.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <Link href="/providers" className="modal-btn-play stream-browse-ext-btn" onClick={onClose}>
                <PuzzleIcon size={16} />
                <span>Open Extensions Manager</span>
              </Link>
            </div>
          )}
        </div>

        {/* TV / Anime Episode Selector Bar matching Prime Video filter bar */}
        {media.type === 'tv' && (
          <div className="stream-theater-episodes">
            <span className="stream-episodes-label">EPISODES:</span>
            <div className="stream-episodes-list">
              {episodes.length > 0 ? (
                episodes.map((ep) => (
                  <button
                    key={ep.id}
                    className={`filter-pill ${
                      selectedEpisode === ep.number ? 'filter-pill-active' : ''
                    }`}
                    onClick={() => setSelectedEpisode(ep.number)}
                    type="button"
                  >
                    {ep.title || `Episode ${ep.number}`}
                  </button>
                ))
              ) : (
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <button
                    key={num}
                    className={`filter-pill ${selectedEpisode === num ? 'filter-pill-active' : ''}`}
                    onClick={() => setSelectedEpisode(num)}
                    type="button"
                  >
                    Episode {num}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
