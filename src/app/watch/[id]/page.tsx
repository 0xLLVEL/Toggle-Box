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

const GTA_HINTS = [
  'HINT: Tea+ automatically scans multiple decentralized extensions to stream the highest-bitrate source available.',
  'HINT: Press [F] to toggle Fullscreen, [SPACE] to pause or resume playback, and [M] to mute audio.',
  'HINT: If a stream buffers, switch provider mirrors anytime from the Extensions menu in player controls.',
  'HINT: Multi-language audio tracks and CC subtitles can be toggled on the fly during playback.',
  'HINT: Install additional streaming extensions from the Extensions hub to unlock extra 4K mirrors.',
];

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
  // Guard: stores "mediaId:episode" of the last started scan.
  // Using a compound key avoids the effect-ordering race where the old boolean
  // reset effect ran AFTER the scan effect (both triggered by selectedEpisode),
  // causing episode changes to silently skip re-scanning.
  const lastScanKeyRef = useRef<string>('');

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

  // ── Providers that will actually be queried for this content type ────────────
  // Mirrors the filter in resolveAllProviders: anime providers only run when
  // the content has the 'Animation' TMDB genre. This prevents pips from
  // showing for providers that won't actually be queried.
  const scanProviders = useMemo(() => {
    const isAnimeContent = (detail?.genres ?? []).some(
      (g) => g.toLowerCase() === 'animation'
    );
    return enabledExtensions.filter((p) => {
      if (p.type === 'anime' && !isAnimeContent) return false;
      return true;
    });
  }, [enabledExtensions, detail]);

  // 2. Parallel auto-scan — all providers race simultaneously
  useEffect(() => {
    if (!detail || enabledExtensions.length === 0) return;

    // Key-based guard: only re-scan when the actual content+episode changes,
    // not when callback references refresh (installedProviders reload, etc.).
    const scanKey = `${mediaId}:${selectedEpisode}`;
    if (lastScanKeyRef.current === scanKey) return;
    lastScanKeyRef.current = scanKey;

    let isMounted = true;
    setIsAutoScanning(true);
    setIsResolvingStream(true);
    setScanProgress(5);
    setFinishedProviderIds(new Set());
    setWinnerProviderId('');
    setScanStep(`Checking ${scanProviders.length} sources in parallel...`);

    const total = scanProviders.length;
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
      },
      detail.genres ?? []
    )
      .then((winner) => {
        if (!isMounted) return;
        if (winner && winner.sources.length > 0) {
          setScanProgress(100);
          const prov = scanProviders.find((e) => e.id === winner.providerId);
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
          // NOTE: Do NOT set selectedProviderId here — doing so triggers the
          // manual-switch useEffect (which watches selectedProviderId), which
          // would set isResolvingStream=true and hide the warning banner.
          // The user selects an extension manually via the banner's action pills.
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
  }, [detail, enabledExtensions, selectedEpisode, resolveAllProviders, scanProviders, mediaId]);

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

  // (Episode-change scan is handled by lastScanKeyRef in the scan effect above;
  //  no separate reset effect needed.)

  const [gtaTipIndex, setGtaTipIndex] = useState(0);

  useEffect(() => {
    if (!isAutoScanning) return;
    const interval = setInterval(() => {
      setGtaTipIndex((prev) => (prev + 1) % GTA_HINTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoScanning]);

  if (isLoadingDetail || !detail) {
    return (
      <div className="gta-loading-screen">
        <div className="gta-ls-art-layer gta-initial-bg" />
        <div className="gta-ls-vignette" />
        <div className="gta-ls-scanlines" />

        <div className="gta-ls-top-bar">
          <button
            className="gta-ls-back-btn"
            onClick={() => router.back()}
            type="button"
            aria-label="Return to menu"
          >
            <span className="gta-key-pill">ESC</span>
            <span className="gta-back-text">RETURN</span>
          </button>
          <div className="gta-ls-top-right">
            <div className="gta-wanted-stars">
              <span className="gta-star active">★</span>
              <span className="gta-star active">★</span>
              <span className="gta-star active">★</span>
              <span className="gta-star active">★</span>
              <span className="gta-star active">★</span>
            </div>
            <div className="gta-emblem-badge">
              <span className="gta-emblem-tea">TEA</span>
              <span className="gta-emblem-v">V</span>
              <span className="gta-emblem-sub">ONLINE</span>
            </div>
          </div>
        </div>

        <div className="gta-ls-bottom-right">
          <div className="gta-spinner-wrap">
            <svg className="gta-spinner-svg" viewBox="0 0 44 44">
              <circle
                className="gta-spinner-track"
                cx="22"
                cy="22"
                r="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth="3.5"
              />
              <circle
                className="gta-spinner-blade"
                cx="22"
                cy="22"
                r="16"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeDasharray="24 76"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="gta-loading-meta">
            <span className="gta-loading-label">INITIALIZING...</span>
            <span className="gta-loading-sub">CONNECTING TO TEA+ NETWORK</span>
          </div>
        </div>
      </div>
    );
  }

  // GTA 5 style loading screen while auto-scanning sources
  if (isAutoScanning) {
    const isDone = scanProgress === 100;
    const bgUrl = detail.backdropUrl || detail.posterUrl || '/api/media/media_1791277209569.png';
    const numStars = Math.min(5, Math.max(3, Math.round(((detail.voteAverage || 7.5) / 10) * 5)));

    return (
      <div
        className="gta-loading-screen"
        style={
          {
            '--pv-bg': `url("${bgUrl}")`,
          } as React.CSSProperties
        }
      >
        {/* Fullscreen cinematic backdrop with Ken Burns motion */}
        <div className="gta-ls-art-layer" />

        {/* Vintage vignette & lighting gradients */}
        <div className="gta-ls-vignette" />

        {/* Subtle retro scanlines */}
        <div className="gta-ls-scanlines" />

        {/* Top HUD Bar */}
        <div className="gta-ls-top-bar">
          <button
            className="gta-ls-back-btn"
            onClick={() => router.back()}
            type="button"
            aria-label="Return to menu"
          >
            <span className="gta-key-pill">ESC</span>
            <span className="gta-back-text">RETURN TO MENU</span>
          </button>

          <div className="gta-ls-top-right">
            <div
              className="gta-wanted-stars"
              title={`Rating: ${detail.voteAverage ? detail.voteAverage.toFixed(1) : '8.0'} / 10`}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`gta-star ${s <= numStars ? 'active' : ''}`}>
                  ★
                </span>
              ))}
            </div>
            <div className="gta-emblem-badge">
              <span className="gta-emblem-tea">TEA</span>
              <span className="gta-emblem-v">V</span>
              <span className="gta-emblem-sub">ONLINE</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Dossier on Left, Character/Poster on Right */}
        <div className="gta-ls-content-grid">
          {/* Left: Mission / Briefing Dossier */}
          <div className="gta-ls-dossier">
            <div className="gta-ls-brand-row">
              <span className="gta-badge-pill">★ TEA+ EXCLUSIVE</span>
              <span className="gta-badge-type">
                {detail.type === 'tv' ? 'EPISODIC SERIES' : 'FEATURE FILM'}
              </span>
            </div>

            <h1 className="gta-ls-title">{detail.title}</h1>

            {detail.type === 'tv' && selectedEpisode > 0 && (
              <p className="gta-ls-ep-badge">
                SEASON {selectedSeason} &nbsp;·&nbsp; EPISODE {selectedEpisode}
                {currentEpDetail ? ` — ${currentEpDetail.title.toUpperCase()}` : ''}
              </p>
            )}

            {/* HUD Metadata Tags */}
            <div className="gta-ls-hud-tags">
              {detail.year && <span className="gta-hud-tag">[{detail.year}]</span>}
              {detail.rating && <span className="gta-hud-tag">[{detail.rating}]</span>}
              {detail.voteAverage ? (
                <span className="gta-hud-tag gold">[{detail.voteAverage.toFixed(1)} ★]</span>
              ) : null}
              <span className="gta-hud-tag">[4K ULTRA HD]</span>
              <span className="gta-hud-tag">[5.1 AUDIO]</span>
            </div>

            {/* GTA 5 Cycling Hints Box */}
            <div className="gta-ls-hint-box">
              <div className="gta-hint-header">
                <span className="gta-hint-icon">ⓘ</span> GAMEPLAY HINT
              </div>
              <p className="gta-hint-text" key={gtaTipIndex}>
                {GTA_HINTS[gtaTipIndex]}
              </p>
            </div>

            {/* Mission / Scanner Progress Bar */}
            <div className="gta-ls-progress-block">
              <div className="gta-progress-header">
                <span className="gta-progress-status">
                  {!isDone ? (
                    <>
                      <span className="gta-pulse-dot" />
                      SCANNING SATELLITE FEEDS:&nbsp;
                      <strong className="gta-step-highlight">{scanStep}</strong>
                    </>
                  ) : (
                    <span
                      className={`gta-step-highlight ${
                        sources.length === 0 ? 'failed' : 'gold'
                      }`}
                    >
                      ★ {scanStep}
                    </span>
                  )}
                </span>
                <span className="gta-progress-pct">{scanProgress}%</span>
              </div>

              <div className="gta-bar-track">
                <div className="gta-bar-fill" style={{ width: `${scanProgress}%` }} />
              </div>

              {/* Provider Radar Nodes */}
              <div className="gta-provider-radar">
                {scanProviders.map((ext) => {
                  const done = finishedProviderIds.has(ext.id);
                  const winner = winnerProviderId === ext.id;
                  return (
                    <div
                      key={ext.id}
                      className={`gta-radar-chip ${
                        winner ? 'winner' : done ? 'done' : 'scanning'
                      }`}
                      title={ext.name}
                    >
                      <span className="gta-radar-blip" />
                      <span className="gta-radar-name">{ext.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: GTA Style Character / Box Art Poster */}
          {detail.posterUrl && (
            <div className="gta-ls-poster-container">
              <div className="gta-ls-poster-frame">
                <img
                  src={detail.posterUrl}
                  alt={detail.title}
                  className="gta-ls-poster-img"
                />
                <div className="gta-ls-poster-stamp">TEA+ ARCHIVE</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Right: Iconic GTA 5 Spinning Ring & Loading Text */}
        <div className="gta-ls-bottom-right">
          <div className="gta-spinner-wrap">
            <svg className="gta-spinner-svg" viewBox="0 0 44 44">
              <circle
                className="gta-spinner-track"
                cx="22"
                cy="22"
                r="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.18)"
                strokeWidth="3.5"
              />
              <circle
                className="gta-spinner-blade"
                cx="22"
                cy="22"
                r="16"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeDasharray="24 76"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="gta-loading-meta">
            <span className="gta-loading-label">
              {!isDone ? 'LOADING...' : 'STREAM READY'}
            </span>
            <span className="gta-loading-sub">
              {scanProgress < 100
                ? `INITIALIZING · ${scanProgress}%`
                : 'LAUNCHING REEL'}
            </span>
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
          // ── No-source warning banner (slides up from bottom) ────────────────
          <div className="watch-warn-banner" onClick={(e) => e.stopPropagation()}>
            {/* Left: icon column */}
            <div className="wwb-icon-col">
              <svg className="wwb-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2L2 20h20L12 2Z"
                  stroke="currentColor" strokeWidth="1.8"
                  strokeLinejoin="round" fill="rgba(255,180,0,0.12)"
                />
                <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" fill="currentColor" />
              </svg>
            </div>

            {/* Centre: text + actions */}
            <div className="wwb-body">
              <p className="wwb-title">No playable stream found</p>
              <p className="wwb-msg">{statusMessage}</p>

              <div className="wwb-actions">
                {/* Try compatible providers */}
                {scanProviders.filter((e) => e.id !== selectedProviderId).map((alt) => (
                  <button
                    key={alt.id}
                    className="wwb-pill"
                    onClick={() => setSelectedProviderId(alt.id)}
                    type="button"
                  >
                    <PuzzleIcon size={13} />
                    <span>{alt.name}</span>
                  </button>
                ))}

                <Link href="/providers" className="wwb-pill wwb-pill--outline">
                  <PuzzleIcon size={13} />
                  <span>Get extensions</span>
                </Link>

                <button
                  className="wwb-pill wwb-pill--ghost"
                  onClick={() => router.back()}
                  type="button"
                >
                  <ChevronLeftIcon size={13} />
                  <span>Go back</span>
                </button>
              </div>
            </div>

            {/* Right: dismiss */}
            <button
              className="wwb-dismiss"
              onClick={() => setStatusMessage('')}
              type="button"
              aria-label="Dismiss warning"
            >
              <CloseIcon size={16} />
            </button>
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
