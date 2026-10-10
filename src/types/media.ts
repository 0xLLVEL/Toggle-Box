export type BadgeType =
  | 'NEW MOVIE'
  | 'NEW SEASON'
  | 'NEW SERIES'
  | 'RECENTLY ADDED'
  | 'TOP 10'
  | 'MOST LIKED'
  | 'NEW EPISODE';

export interface MediaItem {
  id: string;
  tmdbId: number;
  title: string;
  subtitle?: string;
  badge?: BadgeType;
  rating: string; // e.g. "16+", "18+", "13+", "All"
  duration: string; // e.g. "2h 14m" or "Season 1"
  year: number;
  genre: string[];
  quality?: string[]; // e.g. ["4K UHD", "HDR", "5.1 Audio"]
  synopsis: string;
  backdropUrl: string; // High-res TMDB backdrop image
  posterUrl: string; // TMDB poster image
  accentColor?: string;
  type: 'movie' | 'tv';
  rank?: number; // For Top 10 row
  isOriginal?: boolean;
  matchScore?: number; // e.g. 96%
  voteAverage?: number;
  trailerKey?: string;
}

export interface EpisodeItem {
  num: number;
  title: string;
  duration: string;
  desc: string;
  stillUrl?: string;
  rating?: string;
  hasCc?: boolean;
  airDate?: string;
}

export interface MediaCredits {
  cast: string[];
  director?: string;
  producers?: string[];
}

export interface FullMediaDetail {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle?: string;
  tagline?: string;
  synopsis: string;
  backdropUrl: string;
  posterUrl: string;
  year: number;
  duration: string;
  rating: string;
  imdbRating: string;
  genres: string[];
  cast: string[];
  directors: string[];
  producers: string[];
  studio: string;
  trailerKey: string | null;
  advisory: string;
  audioLanguages: string[];
  subtitles: string[];
  recommendations: MediaItem[];
  type: 'movie' | 'tv';
  rankPakistan?: number;
  isOriginal?: boolean;
  episodes?: EpisodeItem[];
  seasonsCount?: number;
  currentSeason?: number;
}

export interface CategoryRow {
  id: string;
  title: string;
  seeMoreLink?: string;
  isTop10?: boolean;
  region?: string;
  items: MediaItem[];
}
