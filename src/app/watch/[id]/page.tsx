'use client';

import React, { useState, useEffect, useRef, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFullMediaDetails } from '@/services/tmdb';
import type { FullMediaDetail, EpisodeItem } from '@/types/media';
import { useProviders } from '@/context/ProviderContext';
import type { ProviderVideoSource, ProviderEpisode } from '@/types/provider';
import {
  ChevronLeftIcon,
  PlayIcon,
  PauseIcon,
  Rewind10Icon,
  Forward10Icon,
  VolumeHighIcon,
  VolumeMuteIcon,
  FullscreenIcon,
  FullscreenExitIcon,
  SubtitlesIcon,
  PuzzleIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  ListIcon,
  ToggleGoldBadgeIcon,
} from '@/components/Icons';

declare global {
  interface Window {
    Hls?: any;
  }
}

export default function WatchPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const mediaId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();

  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  const {
    installedProviders,
    resolveProviderStream,
    resolveAllProviders,
  } = useProviders();

  // Active enabled extensions from the extensions page
  const enabledExtensions = useMemo(
    () => installedProviders.filter((p) => p.isEnabled),
    [installedProviders]
  );

  const [detail, setDetail] = useState<FullMediaDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  // Player state
  const [selectedSeason, setSelectedSeason] = useState<number>(
    seasonParam ? parseInt(seasonParam, 10) : 1
  );
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodeParam ? parseInt(episodeParam, 10) : 1
  );

  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [isResolvingStream, setIsResolvingStream] = useState(true);
  // Auto-scan state: true = initial scan across all providers
  const [isAutoScanning, setIsAutoScanning] = useState(true);
  const [scanStep, setScanStep] = useState<string>('Finding best source...');
  const [scanProgress, setScanProgress] = useState(0); // 0-100
  /** IDs of providers that have already finished (success or fail) during auto-scan */
  const [finishedProviderIds, setFinishedProviderIds] = useState<Set<string>>(new Set());
  const [winnerProviderId, setWinnerProviderId] = useState<string>('');
  const [sources, setSources] = useState<ProviderVideoSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ProviderVideoSource | null>(null);
  const [providerEpisodes, setProviderEpisodes] = useState<ProviderEpisode[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showExtensionsMenu, setShowExtensionsMenu] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);
  const [selectedSubLang, setSelectedSubLang] = useState<string>('off');

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<any>(null);
  // Guard so auto-scan only runs once per media+episode
  const autoScanDoneRef = useRef(false);

  // 1. Fetch Media Details
  useEffect(() => {
    let isMounted = true;
    setIsLoadingDetail(true);

    getFullMediaDetails(mediaId)
      .then((data) => {
        if (!isMounted) return;
        setDetail(data);
        if (seasonParam) setSelectedSeason(parseInt(seasonParam, 10));
        else if (data.currentSeason) setSelectedSeason(data.currentSeason);
        if (episodeParam) setSelectedEpisode(parseInt(episodeParam, 10));
      })
      .catch((err) => {
        console.error('Failed to load media detail:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mediaId, seasonParam, episodeParam]);

  // Load HLS.js dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Hls) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // 2. Parallel auto-scan — all providers race simultaneously
  useEffect(() => {
    if (!detail || enabledExtensions.length === 0) return;
    if (autoScanDoneRef.current) return;
    autoScanDoneRef.current = true;

    let isMounted = true;
    setIsAutoScanning(true);
    setIsResolvingStream(true);
    setScanProgress(5);
    setFinishedProviderIds(new Set());
    setWinnerProviderId('');
    setScanStep(`Checking ${enabledExtensions.length} sources in parallel...`);

    const total = enabledExtensions.length;
    let finishedCount = 0;

    resolveAllProviders(
      detail.title,
      detail.type,
      selectedEpisode,
      (providerId, _idx, _total) => {
        if (!isMounted) return;
        finishedCount++;
        const pct = Math.min(90, Math.round((finishedCount / total) * 90));
        setScanProgress(pct);
        setFinishedProviderIds((prev) => new Set([...prev, providerId]));
      }
    )
      .then((winner) => {
        if (!isMounted) return;
        if (winner && winner.sources.length > 0) {
          setScanProgress(100);
          const prov = enabledExtensions.find((e) => e.id === winner.providerId);
          setScanStep(`Found on ${prov?.name || winner.providerId}!`);
          setWinnerProviderId(winner.providerId);

          if (winner.episodes && winner.episodes.length > 0) {
            setProviderEpisodes(winner.episodes);
          }
          setSources(winner.sources);
          setSelectedSource(winner.sources[0]);
          setSelectedProviderId(winner.providerId);
          setStatusMessage('');

          // Brief flash so the user sees success
          setTimeout(() => {
            if (isMounted) {
              setIsAutoScanning(false);
              setIsResolvingStream(false);
            }
          }, 500);
        } else {
          setScanProgress(100);
          setScanStep('No working source found.');
          setSelectedProviderId(enabledExtensions[0]?.id || '');
          setSources([]);
          setSelectedSource(null);
          setStatusMessage(
            `No working stream found for "${detail.title}". Install more extensions or check your connection.`
          );
          setIsAutoScanning(false);
          setIsResolvingStream(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setScanProgress(100);
        setScanStep('Scan failed.');
        setIsAutoScanning(false);
        setIsResolvingStream(false);
      });

    return () => {
      isMounted = false;
    };
  }, [detail, enabledExtensions, selectedEpisode, resolveAllProviders]);

  // When user manually switches extension, re-resolve (not auto-scan)
  useEffect(() => {
    if (!selectedProviderId || !detail || isAutoScanning) return;

    let isMounted = true;
    setIsResolvingStream(true);
    const providerObj = enabledExtensions.find((p) => p.id === selectedProviderId);
    const providerName = providerObj?.name || selectedProviderId;
    setStatusMessage(`Switching to ${providerName}...`);

    resolveProviderStream(selectedProviderId, detail.title, detail.type, selectedEpisode)
      .then((result) => {
        if (!isMounted) return;
        if (result.episodes && result.episodes.length > 0) setProviderEpisodes(result.episodes);
        if (result.sources && result.sources.length > 0) {
          setSources(result.sources);
          setSelectedSource(result.sources[0]);
          setStatusMessage('');
        } else {
          setSources([]);
          setSelectedSource(null);
          setStatusMessage(`No stream on ${providerName}. Try another extension.`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSources([]);
          setSelectedSource(null);
          setStatusMessage(`Error loading from ${providerName}.`);
        }
      })
      .finally(() => {
        if (isMounted) setIsResolvingStream(false);
      });

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProviderId]);

  // 5. Attach video stream via HLS
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
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(selectedSource.url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setIsPlaying(true);
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedSource.url;
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      video.src = selectedSource.url;
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedSource]);

  // Subtitle track selection synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (selectedSubLang === 'off') {
        track.mode = 'disabled';
      } else if (track.language === selectedSubLang) {
        track.mode = 'showing';
      } else {
        track.mode = 'disabled';
      }
    }
  }, [selectedSubLang]);

  // 6. Ambient Controls Auto-Hiding
  const triggerActivity = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);

    if (isPlaying && !showExtensionsMenu && !showSubtitlesMenu && !showEpisodesDrawer) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    } else {
      triggerActivity();
    }
  }, [isPlaying, showExtensionsMenu, showSubtitlesMenu, showEpisodesDrawer]);

  // 7. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEpisodesDrawer) setShowEpisodesDrawer(false);
        else if (showExtensionsMenu) setShowExtensionsMenu(false);
        else if (showSubtitlesMenu) setShowSubtitlesMenu(false);
        else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.key.toLowerCase() === 'm') {
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, showEpisodesDrawer, showExtensionsMenu, showSubtitlesMenu]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
    setCurrentTime(video.currentTime);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (!isNaN(video.duration)) setDuration(video.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = v;
      video.muted = v === 0;
      setVolume(v);
      setIsMuted(v === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentProvider = enabledExtensions.find((p) => p.id === selectedProviderId);
  const currentEpDetail = detail?.episodes?.find((e) => e.num === selectedEpisode);

  // Available episodes list (either from TMDB detail or from scraper)
  const episodesList: EpisodeItem[] = detail?.episodes && detail.episodes.length > 0
    ? detail.episodes
    : providerEpisodes.map((pe) => ({
        num: pe.number,
        title: pe.title,
        desc: '',
        duration: '',
        stillUrl: detail?.backdropUrl || '',
      }));

  // Also reset auto-scan guard when episode changes so re-scanning works
  useEffect(() => {
    autoScanDoneRef.current = false;
    setIsAutoScanning(true);
    setScanProgress(0);
    setScanStep('Finding best source...');
  }, [selectedEpisode]);

  if (isLoadingDetail || !detail) {
    return (
      <div className="pv-loading-screen">
        <div className="pv-loader-ring" />
      </div>
    );
  }

  // Prime Video style loading screen while auto-scanning sources
  if (isAutoScanning) {
    const isDone = scanProgress === 100;
    return (
      <div
        className="pv-loading-screen"
        style={
          detail.backdropUrl
            ? { '--pv-bg': `url(${detail.backdropUrl})` } as React.CSSProperties
            : {}
        }
      >
        {/* Blurred backdrop */}
        <div className="pv-ls-backdrop" />
        {/* Scrim gradients */}
        <div className="pv-ls-scrim" />

        {/* Top-left back button */}
        <button
          className="pv-ls-back"
          onClick={() => router.back()}
          type="button"
          aria-label="Go back"
        >
          <ChevronLeftIcon size={18} />
        </button>

        {/* Centre content card */}
        <div className="pv-ls-card">
          {/* Poster */}
          {detail.posterUrl && (
            <img src={detail.posterUrl} alt={detail.title} className="pv-ls-poster" />
          )}

          <div className="pv-ls-meta">
            {/* Brand */}
            <span className="pv-ls-brand">
              <ToggleGoldBadgeIcon size={11} />
              Included with Tea+
            </span>

            {/* Title */}
            <h1 className="pv-ls-title">{detail.title}</h1>

            {/* Episode label for TV */}
            {detail.type === 'tv' && selectedEpisode > 0 && (
              <p className="pv-ls-ep">
                Season {selectedSeason} &nbsp;·&nbsp; Episode {selectedEpisode}
                {currentEpDetail ? ` — ${currentEpDetail.title}` : ''}
              </p>
            )}

            {/* Genre / year metadata strip */}
            <div className="pv-ls-tags">
              {detail.year && <span className="pv-ls-tag">{detail.year}</span>}
              {detail.voteAverage ? (
                <span className="pv-ls-tag">{detail.voteAverage.toFixed(1)} ★</span>
              ) : null}
              {detail.rating && <span className="pv-ls-tag">{detail.rating}</span>}
              <span className="pv-ls-tag">{detail.type === 'tv' ? 'Series' : 'Movie'}</span>
            </div>

            {/* Progress bar */}
            <div className="pv-ls-bar-track">
              <div
                className="pv-ls-bar-fill"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            {/* Status row */}
            <div className="pv-ls-status-row">
              {!isDone ? (
                <>
                  <div className="pv-ls-spinner" />
                  <span className="pv-ls-status-text">{scanStep}</span>
                </>
              ) : (
                <span className={`pv-ls-status-text ${scanProgress === 100 && sources.length === 0 ? 'pv-ls-failed' : 'pv-ls-ok'}`}>
                  {scanStep}
                </span>
              )}
            </div>

            {/* Extension pips */}
            <div className="pv-ls-pips">
              {enabledExtensions.map((ext) => {
                const done = finishedProviderIds.has(ext.id);
                const winner = winnerProviderId === ext.id;
                return (
                  <div
                    key={ext.id}
                    className={`pv-ls-pip ${winner ? 'winner' : done ? 'done' : 'pending'}`}
                    title={ext.name}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div
      className={`watch-page-container ${!showControls && isPlaying ? 'hide-cursor' : ''}`}
      ref={containerRef}
      onMouseMove={triggerActivity}
      onClick={triggerActivity}
    >
      {/* 1. Video Canvas */}
      <div className="watch-video-surface" onClick={togglePlay}>
        {isResolvingStream ? (
          <div className="watch-loading-overlay">
            <div className="watch-spinner" />
            <p className="watch-status-text">{statusMessage}</p>
          </div>
        ) : selectedSource ? (
          selectedSource.container === 'iframe' ? (
            <iframe
              src={selectedSource.url}
              title={`${detail.title} Player`}
              className="watch-iframe-player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              className="watch-native-video"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                if (detail.type === 'tv' && selectedEpisode < episodesList.length) {
                  setSelectedEpisode(selectedEpisode + 1);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              {selectedSource.subtitles?.map((sub, idx) => (
                <track
                  key={idx}
                  kind="subtitles"
                  src={sub.url}
                  srcLang={sub.lang}
                  label={sub.label}
                  default={selectedSubLang === sub.lang}
                />
              ))}
            </video>
          )
        ) : (
          <div className="watch-error-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="watch-error-card">
              <span className="modal-gold-tag">
                <ToggleGoldBadgeIcon size={14} /> Extension Streamer
              </span>
              <h3 className="watch-error-title">No Direct Stream Found</h3>
              <p className="watch-error-copy">{statusMessage}</p>

              {/* Direct extension alternatives */}
              {enabledExtensions.filter((e) => e.id !== selectedProviderId).length > 0 && (
                <div className="watch-alternatives-box">
                  <span className="alternatives-label">Try another installed extension:</span>
                  <div className="alternatives-grid">
                    {enabledExtensions
                      .filter((e) => e.id !== selectedProviderId)
                      .map((alt) => (
                        <button
                          key={alt.id}
                          className="filter-pill"
                          onClick={() => setSelectedProviderId(alt.id)}
                          type="button"
                        >
                          <PuzzleIcon size={14} />
                          <span>Switch to {alt.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="watch-error-actions">
                <button
                  className="modal-btn-icon"
                  onClick={() => router.back()}
                  type="button"
                >
                  <ChevronLeftIcon size={18} />
                  <span>Go Back</span>
                </button>
                <Link href="/providers" className="modal-btn-play">
                  <PuzzleIcon size={16} />
                  <span>Open Extensions Page</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Navigation Bar (Prime Video Overlay) */}
      <div
        className={`watch-top-overlay ${showControls ? 'visible' : 'hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="watch-top-left">
          {/* Back button */}
          <button
            className="watch-back-btn"
            onClick={() => router.push(`/detail/${detail.id}`)}
            title="Back to Details"
            type="button"
          >
            <ChevronLeftIcon size={22} />
          </button>

          <div className="watch-title-meta">
            <span className="watch-brand-pill">
              <ToggleGoldBadgeIcon size={13} /> Included with Tea+
            </span>
            <div className="watch-title-row">
              <h1 className="watch-main-title">{detail.title}</h1>
              {detail.type === 'tv' && (
                <span className="watch-ep-pill">
                  S{selectedSeason} E{selectedEpisode}
                  {currentEpDetail ? ` : ${currentEpDetail.title}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="watch-top-right">
          {/* Extension Selector Dropdown */}
          <div className="watch-provider-dropdown">
            <button
              className="watch-ctrl-pill"
              onClick={() => {
                setShowExtensionsMenu(!showExtensionsMenu);
                setShowSubtitlesMenu(false);
              }}
              title="Select extension provider"
              type="button"
            >
              <PuzzleIcon size={15} />
              <span className="watch-ctrl-text">
                {currentProvider ? currentProvider.name : 'Select Extension'}
              </span>
              <ChevronDownIcon size={12} />
            </button>

            {showExtensionsMenu && (
              <div className="watch-menu-popover">
                <div className="watch-menu-header">INSTALLED EXTENSIONS</div>
                {enabledExtensions.map((ext) => (
                  <button
                    key={ext.id}
                    className={`watch-menu-item ${selectedProviderId === ext.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProviderId(ext.id);
                      setShowExtensionsMenu(false);
                    }}
                    type="button"
                  >
                    <div className="watch-menu-item-left">
                      <span className="watch-ext-name">{ext.name}</span>
                      <span className="watch-ext-badge">{ext.type.toUpperCase()}</span>
                    </div>
                    {selectedProviderId === ext.id && <CheckIcon size={14} className="accent-check" />}
                  </button>
                ))}
                <div className="watch-menu-divider" />
                <Link href="/providers" className="watch-menu-footer-link">
                  <PuzzleIcon size={14} />
                  <span>Manage Extensions</span>
                </Link>
              </div>
            )}
          </div>

          {/* Subtitles & Audio */}
          {selectedSource?.subtitles && selectedSource.subtitles.length > 0 && (
            <div className="watch-provider-dropdown">
              <button
                className="watch-ctrl-pill"
                onClick={() => {
                  setShowSubtitlesMenu(!showSubtitlesMenu);
                  setShowExtensionsMenu(false);
                }}
                title="Subtitles & Audio"
                type="button"
              >
                <SubtitlesIcon size={16} />
                <span className="watch-ctrl-text">Subtitles</span>
              </button>

              {showSubtitlesMenu && (
                <div className="watch-menu-popover watch-subtitles-popover">
                  <div className="watch-menu-header">
                    SUBTITLES ({selectedSource.subtitles.length})
                  </div>
                  <div className="watch-subtitles-scroll-list">
                    <button
                      className={`watch-menu-item ${selectedSubLang === 'off' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSubLang('off');
                        setShowSubtitlesMenu(false);
                      }}
                      type="button"
                    >
                      <span className="sub-label-text">Off</span>
                      {selectedSubLang === 'off' && <CheckIcon size={14} className="accent-check" />}
                    </button>
                    {selectedSource.subtitles.map((sub, idx) => (
                      <button
                        key={`${sub.lang}-${idx}`}
                        className={`watch-menu-item ${selectedSubLang === sub.lang ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSubLang(sub.lang);
                          setShowSubtitlesMenu(false);
                        }}
                        type="button"
                        title={sub.label || sub.lang.toUpperCase()}
                      >
                        <span className="sub-label-text">{sub.label || sub.lang.toUpperCase()}</span>
                        {selectedSubLang === sub.lang && <CheckIcon size={14} className="accent-check" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Episodes Drawer Button (for TV / Anime) */}
          {detail.type === 'tv' && (
            <button
              className={`watch-ctrl-pill ${showEpisodesDrawer ? 'active' : ''}`}
              onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
              title="Episodes"
              type="button"
            >
              <ListIcon size={16} />
              <span className="watch-ctrl-text">Episodes</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Bottom Playback Controls Overlay (Prime Video Web Player) */}
      <div
        className={`watch-bottom-overlay ${showControls ? 'visible' : 'hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Timeline Scrubber */}
        <div className="watch-timeline-bar">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="watch-timeline-slider"
          />
        </div>

        <div className="watch-bottom-controls-row">
          <div className="watch-controls-left">
            {/* Play / Pause */}
            <button
              className="watch-btn-icon play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              type="button"
            >
              {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </button>

            {/* Skip 10s Backward */}
            <button
              className="watch-btn-icon"
              onClick={() => skipTime(-10)}
              title="Rewind 10s"
              type="button"
            >
              <Rewind10Icon size={20} />
            </button>

            {/* Skip 10s Forward */}
            <button
              className="watch-btn-icon"
              onClick={() => skipTime(10)}
              title="Fast Forward 10s"
              type="button"
            >
              <Forward10Icon size={20} />
            </button>

            {/* Volume Control */}
            <div className="watch-volume-wrap">
              <button
                className="watch-btn-icon"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                type="button"
              >
                {isMuted || volume === 0 ? <VolumeMuteIcon size={20} /> : <VolumeHighIcon size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="watch-volume-slider"
              />
            </div>

            {/* Time Stamp */}
            <span className="watch-time-display">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>

          <div className="watch-controls-right">
            {/* Next Episode Button */}
            {detail.type === 'tv' && selectedEpisode < episodesList.length && (
              <button
                className="watch-next-ep-btn"
                onClick={() => setSelectedEpisode(selectedEpisode + 1)}
                type="button"
              >
                <span>Next Episode</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              className="watch-btn-icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              type="button"
            >
              {isFullscreen ? <FullscreenExitIcon size={20} /> : <FullscreenIcon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Slide-in Episodes Drawer */}
      {showEpisodesDrawer && (
        <aside className="watch-episodes-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <div>
              <h3 className="drawer-title">Episodes</h3>
              <span className="drawer-subtitle">
                {detail.title} • Season {selectedSeason}
              </span>
            </div>
            <button
              className="drawer-close-btn"
              onClick={() => setShowEpisodesDrawer(false)}
              type="button"
              aria-label="Close Episodes Drawer"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          <div className="drawer-episodes-list">
            {episodesList.map((ep) => {
              const isActive = ep.num === selectedEpisode;
              return (
                <div
                  key={ep.num}
                  className={`drawer-ep-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEpisode(ep.num);
                    setShowEpisodesDrawer(false);
                  }}
                >
                  <div className="drawer-ep-thumb-wrap">
                    <img
                      src={ep.stillUrl || detail.backdropUrl}
                      alt={ep.title}
                      className="drawer-ep-thumb"
                    />
                    <div className="drawer-ep-play-overlay">
                      <PlayIcon size={16} />
                    </div>
                  </div>
                  <div className="drawer-ep-info">
                    <div className="drawer-ep-title-row">
                      <span className="drawer-ep-num">Ep {ep.num}</span>
                      <h4 className="drawer-ep-title">{ep.title}</h4>
                    </div>
                    {ep.desc && <p className="drawer-ep-desc">{ep.desc}</p>}
                    {ep.duration && <span className="drawer-ep-dur">{ep.duration}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
