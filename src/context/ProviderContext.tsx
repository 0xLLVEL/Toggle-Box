'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      } catch (err) {
        console.error('Failed to get episodes:', err);
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
      } catch (err) {
        console.error('Failed to get video sources:', err);
        return [];
      }
    },
    [installedProviders, executeProvider]
  );

  const resolveProviderStream = useCallback(
    async (
      providerId: string,
      title: string,
      type: 'movie' | 'tv',
      episodeNumber: number = 1
    ): Promise<{ sources: ProviderVideoSource[]; episodes: ProviderEpisode[]; bestMatchTitle?: string }> => {
      try {
        const results = await executeProvider(providerId, 'search', [title, 1]);
        if (!Array.isArray(results) || results.length === 0) {
          return { sources: [], episodes: [] };
        }

        const match = results[0];
        let eps: ProviderEpisode[] = [];
        let sources: ProviderVideoSource[] = [];

        // Check if TV show or has episodes
        try {
          eps = await getEpisodes(providerId, match.url);
        } catch (e) {
          // Some movie providers don't have separate getEpisodes
        }

        if (eps && eps.length > 0) {
          const targetEp = eps.find((e) => e.number === episodeNumber) || eps[0];
          sources = await getVideoSources(providerId, targetEp.url);
        } else {
          // Direct movie video sources
          sources = await getVideoSources(providerId, match.url);
        }

        return { sources, episodes: eps, bestMatchTitle: match.title };
      } catch (err) {
        console.error(`Failed to resolve stream on ${providerId}:`, err);
        return { sources: [], episodes: [] };
      }
    },
    [executeProvider, getEpisodes, getVideoSources]
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
