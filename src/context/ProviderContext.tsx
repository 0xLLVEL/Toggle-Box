'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  ZangetsuSource,
  ZangetsuManifest,
  InstalledProvider,
  ProviderSearchResult,
  ProviderEpisode,
  ProviderVideoSource,
} from '@/types/provider';

const STORAGE_KEY_INSTALLED = 'tea_plus_installed_providers';
const STORAGE_KEY_CUSTOM_REPOS = 'tea_plus_custom_repos';

/** Client-side stream result cache — avoids re-hitting the API for the same title+episode */
const STREAM_RESULT_CACHE = new Map<string, { result: any; ts: number }>();
const STREAM_CACHE_TTL = 1000 * 60 * 10; // 10 minutes

function streamCacheKey(providerId: string, title: string, episode: number) {
  return `${providerId}::${title.toLowerCase().trim()}::${episode}`;
}

// Default installed providers for out-of-the-box streaming
const DEFAULT_PREINSTALLED: Array<Partial<InstalledProvider> & { id: string }> = [
  { id: 'anikoto', isEnabled: true, isDefault: true },
  { id: 'hianime', isEnabled: true },
  { id: 'fourkhdhub', isEnabled: true },
  { id: 'hdhub4u', isEnabled: true },
  { id: 'multimovies', isEnabled: true },
];

interface ProviderContextValue {
  availableProviders: ZangetsuSource[];
  installedProviders: InstalledProvider[];
  isLoadingManifest: boolean;
  manifestInfo: ZangetsuManifest | null;
  customRepos: string[];
  installProvider: (source: ZangetsuSource) => void;
  uninstallProvider: (providerId: string) => void;
  toggleProvider: (providerId: string) => void;
  setDefaultProvider: (providerId: string) => void;
  addCustomRepo: (url: string) => Promise<boolean>;
  removeCustomRepo: (url: string) => void;
  searchAcrossProviders: (
    query: string,
    type?: 'anime' | 'movie' | 'tv'
  ) => Promise<ProviderSearchResult[]>;
  getEpisodes: (providerId: string, url: string) => Promise<ProviderEpisode[]>;
  getVideoSources: (providerId: string, episodeUrl: string) => Promise<ProviderVideoSource[]>;
  resolveProviderStream: (
    providerId: string,
    title: string,
    type: 'movie' | 'tv',
    episodeNumber?: number
  ) => Promise<{ sources: ProviderVideoSource[]; episodes: ProviderEpisode[]; bestMatchTitle?: string }>;
  /** Race all enabled providers in parallel — resolves with the first winner */
  resolveAllProviders: (
    title: string,
    type: 'movie' | 'tv',
    episodeNumber?: number,
    onProgress?: (providerId: string, index: number, total: number) => void,
    genres?: string[]
  ) => Promise<{ sources: ProviderVideoSource[]; episodes: ProviderEpisode[]; providerId: string; bestMatchTitle?: string } | null>;
  executeProvider: (providerId: string, method: string, args?: any[]) => Promise<any>;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

export const ProviderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableProviders, setAvailableProviders] = useState<ZangetsuSource[]>([]);
  const [installedProviders, setInstalledProviders] = useState<InstalledProvider[]>([]);
  const [manifestInfo, setManifestInfo] = useState<ZangetsuManifest | null>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);
  const [customRepos, setCustomRepos] = useState<string[]>([]);

  // Load custom repos and installed extensions from localStorage on mount
  useEffect(() => {
    try {
      const storedRepos = localStorage.getItem(STORAGE_KEY_CUSTOM_REPOS);
      if (storedRepos) {
        setCustomRepos(JSON.parse(storedRepos));
      }
    } catch (e) {
      console.warn('Failed to parse custom repos from storage', e);
    }
  }, []);

  // Fetch available providers from manifest
  useEffect(() => {
    let isMounted = true;
    setIsLoadingManifest(true);

    fetch('/api/providers/manifest')
      .then((res) => res.json())
      .then((manifest: ZangetsuManifest) => {
        if (!isMounted) return;
        setManifestInfo(manifest);
        setAvailableProviders(manifest.sources || []);

        // Load installed providers from storage or bootstrap with defaults
        try {
          const stored = localStorage.getItem(STORAGE_KEY_INSTALLED);
          if (stored) {
            const parsed: InstalledProvider[] = JSON.parse(stored);
            setInstalledProviders(parsed);
          } else {
            // First time launch: pre-install the recommended extensions
            const initial: InstalledProvider[] = (manifest.sources || [])
              .filter((s) => DEFAULT_PREINSTALLED.some((p) => p.id === s.id))
              .map((s) => ({
                ...s,
                installedAt: Date.now(),
                isEnabled: true,
                isDefault: s.id === 'anikoto',
              }));
            setInstalledProviders(initial);
            localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(initial));
          }
        } catch (e) {
          console.warn('Error reading installed providers', e);
        }
      })
      .catch((err) => console.error('Failed to load manifest', err))
      .finally(() => {
        if (isMounted) setIsLoadingManifest(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveInstalled = (updated: InstalledProvider[]) => {
    setInstalledProviders(updated);
    try {
      localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist installed providers', e);
    }
  };

  const installProvider = useCallback(
    (source: ZangetsuSource) => {
      setInstalledProviders((prev) => {
        if (prev.some((p) => p.id === source.id)) return prev;
        const newProvider: InstalledProvider = {
          ...source,
          installedAt: Date.now(),
          isEnabled: true,
          isDefault: prev.length === 0,
        };
        const updated = [...prev, newProvider];
        saveInstalled(updated);
        return updated;
      });
    },
    []
  );

  const uninstallProvider = useCallback((providerId: string) => {
    setInstalledProviders((prev) => {
      const updated = prev.filter((p) => p.id !== providerId);
      saveInstalled(updated);
      return updated;
    });
  }, []);

  const toggleProvider = useCallback((providerId: string) => {
    setInstalledProviders((prev) => {
      const updated = prev.map((p) =>
        p.id === providerId ? { ...p, isEnabled: !p.isEnabled } : p
      );
      saveInstalled(updated);
      return updated;
    });
  }, []);

  const setDefaultProvider = useCallback((providerId: string) => {
    setInstalledProviders((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        isDefault: p.id === providerId,
      }));
      saveInstalled(updated);
      return updated;
    });
  }, []);

  const addCustomRepo = useCallback(async (url: string) => {
    try {
      const res = await fetch(`/api/providers/manifest?repoUrl=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Invalid manifest');
      const data = await res.json();
      if (!data.sources || !Array.isArray(data.sources)) throw new Error('Missing sources in manifest');

      setCustomRepos((prev) => {
        if (prev.includes(url)) return prev;
        const next = [...prev, url];
        localStorage.setItem(STORAGE_KEY_CUSTOM_REPOS, JSON.stringify(next));
        return next;
      });

      // Merge new sources
      setAvailableProviders((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newSources = data.sources.filter((s: ZangetsuSource) => !existingIds.has(s.id));
        return [...prev, ...newSources];
      });

      return true;
    } catch (err) {
      console.error('Failed to add custom repo', err);
      return false;
    }
  }, []);

  const removeCustomRepo = useCallback((url: string) => {
    setCustomRepos((prev) => {
      const next = prev.filter((r) => r !== url);
      localStorage.setItem(STORAGE_KEY_CUSTOM_REPOS, JSON.stringify(next));
      return next;
    });
  }, []);

  const executeProvider = useCallback(
    async (providerId: string, method: string, args: any[] = []) => {
      const res = await fetch('/api/providers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, method, args }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Provider execution failed');
      }
      return data.result;
    },
    []
  );

  const searchAcrossProviders = useCallback(
    async (query: string, type?: 'anime' | 'movie' | 'tv'): Promise<ProviderSearchResult[]> => {
      const active = installedProviders.filter((p) => p.isEnabled);
      if (active.length === 0) return [];

      // Query active providers in parallel
      const promises = active.map(async (provider) => {
        try {
          const results = await executeProvider(provider.id, 'search', [query, 1]);
          if (!Array.isArray(results)) return [];
          return results.map((r: any) => ({
            id: r.id || r.url,
            title: r.title,
            url: r.url,
            cover: r.cover || r.poster,
            type: r.type || provider.type,
            sourceId: provider.id,
            sourceName: provider.name,
            year: r.year,
          }));
        } catch (err) {
          console.warn(`Search failed on provider ${provider.name}:`, err);
          return [];
        }
      });

      const allResults = await Promise.all(promises);
      return allResults.flat();
    },
    [installedProviders, executeProvider]
  );

  const getEpisodes = useCallback(
    async (providerId: string, url: string): Promise<ProviderEpisode[]> => {
      try {
        const eps = await executeProvider(providerId, 'getEpisodes', [url]);
        if (!Array.isArray(eps)) return [];
        return eps.map((ep: any, index: number) => ({
          id: ep.id || `ep-${index + 1}`,
          number: ep.number != null ? Number(ep.number) : index + 1,
          title: ep.title || `Episode ${ep.number || index + 1}`,
          url: ep.url,
          season: ep.season,
        }));
      } catch (err: any) {
        // getEpisodes failing is expected for movie providers — warn only
        console.warn(`[${providerId}] getEpisodes failed:`, err?.message ?? err);
        return [];
      }
    },
    [executeProvider]
  );

  const getVideoSources = useCallback(
    async (providerId: string, episodeUrl: string): Promise<ProviderVideoSource[]> => {
      try {
        const sources = await executeProvider(providerId, 'getVideoSources', [episodeUrl]);
        const provider = installedProviders.find((p) => p.id === providerId);
        if (!Array.isArray(sources)) return [];

        return sources.map((s: any) => {
          let playUrl = s.url;
          // If stream has headers, route through our stream proxy
          if (s.headers && Object.keys(s.headers).length > 0) {
            playUrl = `/api/providers/proxy?url=${encodeURIComponent(s.url)}&headers=${encodeURIComponent(
              JSON.stringify(s.headers)
            )}`;
          }

          return {
            url: playUrl,
            quality: s.quality || 'Auto',
            container: s.container || (playUrl.includes('.m3u8') ? 'hls' : 'mp4'),
            headers: s.headers,
            kind: s.kind,
            audioLang: s.audioLang,
            subtitles: s.subtitles || [],
            providerId,
            providerName: provider?.name || providerId,
            isExtension: true,
          };
        });
      } catch (err: any) {
        // Provider-level failure (no links, timeout) — warn only
        console.warn(`[${providerId}] getVideoSources failed:`, err?.message ?? err);
        return [];
      }
    },
    [installedProviders, executeProvider]
  );

  /**
   * Score how well a provider result title matches the query.
   * Returns 0–1 (1 = perfect match).
   */
  const titleScore = (query: string, candidate: string): number => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const q = norm(query);
    const c = norm(candidate);
    if (q === c) return 1;
    // Word-overlap ratio
    const qWords = new Set(q.split(/\s+/));
    const cWords = c.split(/\s+/);
    const hits = cWords.filter((w) => qWords.has(w)).length;
    return hits / Math.max(qWords.size, cWords.length, 1);
  };

  const resolveProviderStream = useCallback(
    async (
      providerId: string,
      title: string,
      type: 'movie' | 'tv',
      episodeNumber: number = 1
    ): Promise<{ sources: ProviderVideoSource[]; episodes: ProviderEpisode[]; bestMatchTitle?: string }> => {
      // Check client-side cache first
      const cacheKey = streamCacheKey(providerId, title, episodeNumber);
      const cached = STREAM_RESULT_CACHE.get(cacheKey);
      if (cached && Date.now() - cached.ts < STREAM_CACHE_TTL) {
        return cached.result;
      }

      try {
        const results = await executeProvider(providerId, 'search', [title, 1]);
        if (!Array.isArray(results) || results.length === 0) {
          return { sources: [], episodes: [] };
        }

        // Pick the best title match rather than blindly taking results[0].
        // Providers sometimes return loosely ranked lists; a word-overlap score
        // ensures we pick the correct content when the top result is off.
        const scored = results
          .map((r: any) => ({ r, score: titleScore(title, r.title || '') }))
          .sort((a, b) => b.score - a.score);

        // Reject the entire provider result if no match is good enough.
        // A threshold of 0.4 means ≥40% word overlap — low enough for partial
        // titles ("Avengers" matching "Avengers: Endgame") but high enough to
        // reject anime providers returning completely unrelated content.
        const MIN_TITLE_SCORE = 0.4;
        if (scored[0].score < MIN_TITLE_SCORE) {
          return { sources: [], episodes: [] };
        }

        const match = scored[0].r;

        let eps: ProviderEpisode[] = [];
        let sources: ProviderVideoSource[] = [];

        try {
          eps = await getEpisodes(providerId, match.url);
        } catch (e) {
          // movie providers may not have getEpisodes — ignore
        }

        if (eps && eps.length > 0) {
          const targetEp = eps.find((e) => e.number === episodeNumber) || eps[0];
          sources = await getVideoSources(providerId, targetEp.url);
        } else {
          sources = await getVideoSources(providerId, match.url);
        }

        const result = { sources, episodes: eps, bestMatchTitle: match.title };
        // Cache only when we have sources
        if (sources.length > 0) {
          STREAM_RESULT_CACHE.set(cacheKey, { result, ts: Date.now() });
        }
        return result;
      } catch (err: any) {
        // Provider-level failures ("no download links", timeout, etc.) are
        // expected outcomes — downgrade to warn to avoid console noise.
        console.warn(`[${providerId}] stream resolve failed:`, err?.message ?? err);
        return { sources: [], episodes: [] };
      }
    },
    [executeProvider, getEpisodes, getVideoSources]
  );

  /**
   * Race all enabled providers in parallel — calls onProgress for each attempt
   * and resolves as soon as the first provider returns sources.
   *
   * Fix: onProgress is fired via a side-effect tap that is independent of the
   * Promise.any race. Previously, Promise.any short-circuited as soon as the
   * first winner resolved, silently dropping onProgress calls for every other
   * provider still in flight — leaving their status pips permanently "pending".
   */
  const resolveAllProviders = useCallback(
    async (
      title: string,
      type: 'movie' | 'tv',
      episodeNumber: number = 1,
      onProgress?: (providerId: string, index: number, total: number) => void,
      genres: string[] = []
    ): Promise<{ sources: ProviderVideoSource[]; episodes: ProviderEpisode[]; providerId: string; bestMatchTitle?: string } | null> => {
      // Detect anime content from TMDB genres so anime providers only run
      // when the content is actually anime (Animation genre).
      // Without this, anime providers query non-anime titles, find a loosely
      // named anime, and play the wrong content.
      const isAnimeContent = genres.some((g) => g.toLowerCase() === 'animation');

      const active = installedProviders.filter((p) => {
        if (!p.isEnabled) return false;
        // Anime-only providers: only include when the content is actually anime.
        // Previously only blocked for movies; now blocked for all non-anime
        // content (movies AND non-anime tv series like "Breaking Bad").
        if (p.type === 'anime' && !isAnimeContent) return false;
        return true;
      });
      if (active.length === 0) return null;

      const total = active.length;

      // For each provider, build two things:
      //  1. A side-effect promise that fires onProgress as soon as the provider
      //     finishes — completely decoupled from the race below.
      //  2. A "winner" promise that rejects (so Promise.any skips it) if the
      //     provider returned no sources, and resolves with the result otherwise.
      const winnerPromises = active.map((provider, index) => {
        const base = resolveProviderStream(provider.id, title, type, episodeNumber)
          .then((result) => {
            // Always notify progress immediately when this provider is done
            onProgress?.(provider.id, index, total);
            return result;
          })
          .catch(() => {
            // Provider threw — still notify progress
            onProgress?.(provider.id, index, total);
            return { sources: [] as ProviderVideoSource[], episodes: [] as ProviderEpisode[] };
          });

        // Expose a promise for the race: resolves only when sources were found,
        // otherwise rejects so Promise.any continues waiting for other providers.
        return base.then((result) => {
          if (result.sources && result.sources.length > 0) {
            return { ...result, providerId: provider.id };
          }
          throw new Error('no sources');
        });
      });

      try {
        return await Promise.any(winnerPromises);
      } catch {
        // AggregateError — all providers either failed or returned no sources
        return null;
      }
    },
    [installedProviders, resolveProviderStream]
  );

  return (
    <ProviderContext.Provider
      value={{
        availableProviders,
        installedProviders,
        isLoadingManifest,
        manifestInfo,
        customRepos,
        installProvider,
        uninstallProvider,
        toggleProvider,
        setDefaultProvider,
        addCustomRepo,
        removeCustomRepo,
        searchAcrossProviders,
        getEpisodes,
        getVideoSources,
        resolveProviderStream,
        resolveAllProviders,
        executeProvider,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
};

export const useProviders = () => {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProviders must be used within a ProviderProvider');
  }
  return context;
};
