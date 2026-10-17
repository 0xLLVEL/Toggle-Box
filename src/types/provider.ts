export type ProviderType = 'anime' | 'movie' | 'all';

export interface ZangetsuSource {
  id: string;
  name: string;
  version: string;
  type: ProviderType;
  lang: string;
  file: string;
  logo: string;
  nsfw: boolean;
  description?: string;
  sourceRepo?: string;
}

export interface ZangetsuManifest {
  name: string;
  description: string;
  sources: ZangetsuSource[];
}

export interface InstalledProvider extends ZangetsuSource {
  installedAt: number;
  isEnabled: boolean;
  isDefault?: boolean;
  customRepoUrl?: string;
}

export interface ProviderSearchResult {
  id: string;
  title: string;
  url: string;
  cover?: string;
  type?: 'movie' | 'tv' | 'anime';
  sourceId: string;
  sourceName?: string;
  year?: string | number;
}

export interface ProviderEpisode {
  id: string;
  number: number;
  title: string;
  url: string;
  season?: number;
}

export interface ProviderSubtitle {
  url: string;
  lang: string;
  label: string;
  format: 'vtt' | 'srt';
  default?: boolean;
}

export interface ProviderVideoSource {
  url: string;
  quality: string;
  container: 'hls' | 'mp4' | 'iframe';
  headers?: Record<string, string>;
  kind?: string;
  audioLang?: string;
  subtitles?: ProviderSubtitle[];
  providerId: string;
  providerName: string;
  isFallback?: boolean;
  isExtension?: boolean;
}

export interface ProviderDetail {
  id: string;
  title: string;
  url: string;
  cover?: string;
  description?: string;
  year?: string;
  episodes?: ProviderEpisode[];
  seasons?: number[];
  type?: 'movie' | 'tv' | 'anime';
  sourceId: string;
}
