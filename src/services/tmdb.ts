import type {
  MediaItem,
  CategoryRow,
  EpisodeItem,
  MediaCredits,
  BadgeType,
  FullMediaDetail,
} from '@/types/media';

// TMDB API key is injected via NEXT_PUBLIC_TMDB_API_KEY or TMDB_API_KEY.
const TMDB_API_KEY =
  process.env.NEXT_PUBLIC_TMDB_API_KEY ||
  process.env.TMDB_API_KEY ||
  'aa2cc9486c0a47e331576c9a49f07050';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_W780 = 'https://image.tmdb.org/t/p/w780';
const IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
const IMAGE_BASE_W300 = 'https://image.tmdb.org/t/p/w300';

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Helper: Transform raw TMDB response to MediaItem
function formatTmdbItem(
  raw: any,
  forcedType?: 'movie' | 'tv',
  rank?: number,
  customBadge?: BadgeType,
): MediaItem {
  const isMovie = forcedType
    ? forcedType === 'movie'
    : raw.title !== undefined || raw.media_type === 'movie';
  const type: 'movie' | 'tv' = isMovie ? 'movie' : 'tv';
  const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
  const releaseDate = raw.release_date || raw.first_air_date || '';
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 2025;

  const genres: string[] = (raw.genre_ids || [])
    .map((gid: number) => GENRE_MAP[gid])
    .filter(Boolean)
    .slice(0, 3);

  if (genres.length === 0) {
    genres.push(type === 'movie' ? 'Feature Film' : 'TV Series');
  }

  // Derive badge if not provided
  let badge = customBadge;
  if (!badge) {
    if (rank) {
      badge = 'TOP 10';
    } else if (raw.popularity > 600) {
      badge = type === 'movie' ? 'NEW MOVIE' : 'NEW SEASON';
    } else if (raw.vote_average >= 8.0) {
      badge = 'MOST LIKED';
    } else if (
      releaseDate &&
      new Date(releaseDate).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
    ) {
      badge = type === 'movie' ? 'NEW MOVIE' : 'RECENTLY ADDED';
    }
  }

  const backdropPath = raw.backdrop_path || raw.poster_path;
  const posterPath = raw.poster_path || raw.backdrop_path;

  const backdropUrl = backdropPath
    ? `${IMAGE_BASE_W780}${backdropPath}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=780&auto=format&fit=crop';

  const posterUrl = posterPath ? `${IMAGE_BASE_W500}${posterPath}` : backdropUrl;

  const voteAvg = raw.vote_average || 7.0;
  const matchScore = Math.min(99, Math.max(82, Math.round(voteAvg * 10) + 5));

  const rating = raw.adult ? '18+' : voteAvg >= 8.0 ? '16+' : voteAvg >= 7.0 ? '13+' : 'All';

  const isAnime =
    ((raw.genre_ids || []).includes(16) || genres.includes('Animation')) &&
    (raw.original_language === 'ja' || (raw.origin_country || []).includes('JP'));

  let duration = raw.duration;
  if (!duration) {
    if (type === 'movie') {
      if (raw.runtime) {
        const h = Math.floor(raw.runtime / 60);
        const m = raw.runtime % 60;
        duration = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
      } else {
        duration = '2h 14m';
      }
    } else {
      if (raw.number_of_seasons) {
        duration = `${raw.number_of_seasons} Season${raw.number_of_seasons > 1 ? 's' : ''}`;
      } else {
        duration = 'Season 1';
      }
    }
  }

  return {
    id: `${type}-${raw.id}`,
    tmdbId: raw.id,
    title,
    subtitle: raw.tagline || (genres[0] ? `${genres[0]} • ${year}` : undefined),
    badge,
    rating,
    duration,
    year,
    genre: genres,
    quality: ['4K UHD', 'HDR', '5.1 Audio'],
    synopsis: raw.overview || 'No synopsis available for this title.',
    backdropUrl,
    posterUrl,
    type,
    rank,
    isOriginal: raw.vote_count > 1000 && Math.random() > 0.5,
    isAnime,
    matchScore,
    voteAverage: voteAvg,
  };
}

// Fetch helper with error tolerance
async function fetchTmdb(endpoint: string, params: Record<string, string> = {}) {
  const activeKey =
    TMDB_API_KEY ||
    (typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY
      : undefined);

  if (!activeKey) {
    throw new Error(
      'TMDB_API_KEY is not set. Create a .env.local file (copy .env.example) and add your TMDB API key.',
    );
  }
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', activeKey);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch all initial streaming rows directly from TMDB (Home)
 */
export async function getLiveStreamingRows(region: string = 'Pakistan'): Promise<CategoryRow[]> {
  const regionMap: Record<string, string> = {
    Pakistan: 'PK',
    'United States': 'US',
    'United Kingdom': 'GB',
    Global: '',
    India: 'IN',
  };
  const regCode = regionMap[region] || 'PK';

  try {
    const [
      top10Data,
      featuredData,
      topTvData,
      comedyData,
      mysteryData,
      topMoviesData,
      horrorData,
      actionTvData,
      dramaData,
      romanceData,
      awardData,
      scifiData,
      crimeData,
      kidsData,
      animeData,
    ] = await Promise.all([
      fetchTmdb('/movie/popular', regCode ? { region: regCode } : {}),
      fetchTmdb('/trending/all/day'),
      fetchTmdb('/tv/top_rated'),
      fetchTmdb('/discover/tv', { with_genres: '35', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/tv', { with_genres: '9648,80,53', sort_by: 'popularity.desc' }),
      fetchTmdb('/movie/top_rated'),
      fetchTmdb('/discover/movie', { with_genres: '27,53', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/tv', { with_genres: '10759', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/tv', { with_genres: '18', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/movie', { with_genres: '10749,18', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/movie', {
        with_genres: '18,36',
        sort_by: 'vote_average.desc',
        'vote_count.gte': '500',
      }),
      fetchTmdb('/discover/movie', { with_genres: '878,14', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/movie', { with_genres: '80,53', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/movie', { with_genres: '10751,16', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/tv', { with_genres: '16', sort_by: 'popularity.desc' }),
    ]);

    const top10Items = (top10Data.results || [])
      .filter((i: any) => i.backdrop_path || i.poster_path)
      .slice(0, 10)
      .map((i: any, idx: number) => {
        const topBadges: BadgeType[] = ['NEW MOVIE', 'NEW SEASON', 'NEW SERIES', 'NEW SERIES'];
        return formatTmdbItem(i, 'movie', idx + 1, topBadges[idx % topBadges.length] || 'TOP 10');
      });

    const featuredItems = (featuredData.results || [])
      .filter((i: any) => i.poster_path || i.backdrop_path)
      .slice(0, 12)
      .map((i: any, idx: number) => {
        const badges: BadgeType[] = [
          'NEW SEASON',
          'NEW SERIES',
          'RECENTLY ADDED',
          'NEW SERIES',
          'NEW SERIES',
          'MOST LIKED',
        ];
        return formatTmdbItem(i, undefined, undefined, badges[idx % badges.length]);
      });

    const topTvItems = (topTvData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any, idx: number) =>
        formatTmdbItem(i, 'tv', undefined, idx < 2 ? 'NEW SERIES' : undefined),
      );

    const comedyItems = (comedyData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'tv'));

    const mysteryItems = (mysteryData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'tv'));

    const topMoviesItems = (topMoviesData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any, idx: number) =>
        formatTmdbItem(i, 'movie', undefined, idx < 4 ? 'NEW MOVIE' : undefined),
      );

    const horrorItems = (horrorData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'tv'));

    const actionTvItems = (actionTvData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any, idx: number) =>
        formatTmdbItem(i, 'tv', undefined, idx < 2 ? 'NEW SERIES' : undefined),
      );

    const dramaItems = (dramaData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'tv'));

    const romanceItems = (romanceData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any, idx: number) =>
        formatTmdbItem(i, 'movie', undefined, idx < 2 ? 'NEW MOVIE' : undefined),
      );

    const awardItems = (awardData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'MOST LIKED'));

    const scifiItems = (scifiData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'movie'));

    const crimeItems = (crimeData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'NEW MOVIE'));

    const kidsItems = (kidsData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any) => formatTmdbItem(i, 'movie'));

    const animeItems = (animeData.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 12)
      .map((i: any, idx: number) =>
        formatTmdbItem(i, 'tv', undefined, idx < 2 ? 'NEW SERIES' : undefined),
      );

    return [
      {
        id: 'top-10',
        title: `Top 10 in ${region}`,
        isTop10: true,
        region,
        cardLayout: 'landscape',
        items: top10Items,
      },
      {
        id: 'featured-originals',
        title: 'Featured Originals and Exclusives',
        seeMoreLink: '/movies',
        cardLayout: 'portrait',
        items: featuredItems,
      },
      {
        id: 'top-tv',
        title: 'Top TV',
        seeMoreLink: '/tv',
        cardLayout: 'landscape',
        items: topTvItems,
      },
      {
        id: 'comedy-tv',
        title: 'Comedy TV',
        seeMoreLink: '/tv',
        cardLayout: 'landscape',
        items: comedyItems,
      },
      {
        id: 'mystery-thriller-tv',
        title: 'Mystery and thriller TV',
        seeMoreLink: '/tv',
        cardLayout: 'landscape',
        items: mysteryItems,
      },
      {
        id: 'top-movies',
        title: 'Top movies',
        seeMoreLink: '/movies',
        cardLayout: 'landscape',
        items: topMoviesItems,
      },
      {
        id: 'horror-tv',
        title: 'Horror TV',
        seeMoreLink: '/tv',
        cardLayout: 'landscape',
        items: horrorItems,
      },
      {
        id: 'action-adventure-tv',
        title: 'Action & Adventure TV',
        seeMoreLink: '/tv',
        cardLayout: 'landscape',
        items: actionTvItems,
      },
      {
        id: 'drama-tv',
        title: 'Drama TV',
        seeMoreLink: '/tv',
        cardLayout: 'landscape',
        items: dramaItems,
      },
      {
        id: 'romance-movies',
        title: 'Romance & Drama Movies',
        seeMoreLink: '/movies',
        cardLayout: 'landscape',
        items: romanceItems,
      },
      {
        id: 'award-winners',
        title: 'Award Winners & Acclaimed',
        seeMoreLink: '/movies',
        cardLayout: 'landscape',
        items: awardItems,
      },
      {
        id: 'scifi-fantasy',
        title: 'Sci-Fi & Fantasy',
        seeMoreLink: '/movies',
        cardLayout: 'landscape',
        items: scifiItems,
      },
      {
        id: 'crime-movies',
        title: 'Crime & Thriller Movies',
        seeMoreLink: '/movies',
        cardLayout: 'landscape',
        items: crimeItems,
      },
      {
        id: 'kids-family',
        title: 'Kids & Family',
        seeMoreLink: '/movies',
        cardLayout: 'landscape',
        items: kidsItems,
      },
      {
        id: 'anime-animation',
        title: 'Anime & Animation',
        seeMoreLink: '/anime',
        cardLayout: 'landscape',
        items: animeItems,
      },
    ];
  } catch (error) {
    console.error('Failed to load TMDB streaming data:', error);
    return [];
  }
}

/**
 * Fetch dedicated Movies page rows
 */
export async function getLiveMovieRows(): Promise<CategoryRow[]> {
  try {
    const [trending, action, topRated, comedy, scifi, horror] = await Promise.all([
      fetchTmdb('/trending/movie/day'),
      fetchTmdb('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc' }),
      fetchTmdb('/movie/top_rated'),
      fetchTmdb('/discover/movie', { with_genres: '35', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/movie', { with_genres: '878', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/movie', { with_genres: '27,53', sort_by: 'popularity.desc' }),
    ]);

    return [
      {
        id: 'trending-movies',
        title: 'Trending Movies This Week',
        items: (trending.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'NEW MOVIE')),
      },
      {
        id: 'action-movies',
        title: 'Blockbuster Action & Adventure',
        items: (action.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'TOP 10')),
      },
      {
        id: 'top-rated-movies',
        title: 'Critically Acclaimed & Award Winners',
        items: (topRated.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'MOST LIKED')),
      },
      {
        id: 'comedy-hits',
        title: 'Laugh-Out-Loud Comedies',
        items: (comedy.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie')),
      },
      {
        id: 'scifi-movies',
        title: 'Sci-Fi & Cosmic Worlds',
        items: (scifi.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie')),
      },
      {
        id: 'thriller-movies',
        title: 'Psychological Thrillers & Mystery',
        items: (horror.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie')),
      },
    ];
  } catch (error) {
    console.error('Failed to load movie rows:', error);
    return [];
  }
}

/**
 * Fetch dedicated TV Shows page rows
 */
export async function getLiveTvRows(): Promise<CategoryRow[]> {
  try {
    const [trending, topRated, onAir, crime, scifi, drama] = await Promise.all([
      fetchTmdb('/trending/tv/day'),
      fetchTmdb('/tv/top_rated'),
      fetchTmdb('/tv/on_the_air'),
      fetchTmdb('/discover/tv', { with_genres: '80,9648', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/tv', { with_genres: '10765', sort_by: 'popularity.desc' }),
      fetchTmdb('/discover/tv', { with_genres: '18', sort_by: 'popularity.desc' }),
    ]);

    return [
      {
        id: 'trending-tv',
        title: 'Trending Shows Today',
        items: (trending.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'NEW SEASON')),
      },
      {
        id: 'top-rated-tv',
        title: 'Prime All-Time Best Series',
        items: (topRated.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'MOST LIKED')),
      },
      {
        id: 'airing-tv',
        title: 'New Episodes Airing This Week',
        items: (onAir.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'NEW EPISODE')),
      },
      {
        id: 'crime-tv',
        title: 'Gripping Crime & Detective Series',
        items: (crime.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv')),
      },
      {
        id: 'scifi-fantasy-tv',
        title: 'Epic Fantasy & Sci-Fi Worlds',
        items: (scifi.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'NEW SERIES')),
      },
      {
        id: 'drama-tv',
        title: 'Compelling High-Stakes Dramas',
        items: (drama.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv')),
      },
    ];
  } catch (error) {
    console.error('Failed to load TV rows:', error);
    return [];
  }
}

/**
 * Fetch dedicated Anime page rows
 */
export async function getLiveAnimeRows(): Promise<CategoryRow[]> {
  try {
    const [trending, topRated, actionShonen, movies, fantasy, romance] = await Promise.all([
      fetchTmdb('/discover/tv', {
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
      }),
      fetchTmdb('/discover/tv', {
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'vote_average.desc',
        'vote_count.gte': '250',
      }),
      fetchTmdb('/discover/tv', {
        with_genres: '16,10759',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
      }),
      fetchTmdb('/discover/movie', {
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
      }),
      fetchTmdb('/discover/tv', {
        with_genres: '16,10765',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
      }),
      fetchTmdb('/discover/tv', {
        with_genres: '16,35',
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
      }),
    ]);

    return [
      {
        id: 'trending-anime',
        title: 'Trending Anime This Season',
        cardLayout: 'landscape',
        items: (trending.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'NEW EPISODE')),
      },
      {
        id: 'top-rated-anime',
        title: 'All-Time Acclaimed Anime Masterpieces',
        cardLayout: 'landscape',
        items: (topRated.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'MOST LIKED')),
      },
      {
        id: 'action-shonen-anime',
        title: 'Shonen & Adrenaline Action',
        cardLayout: 'landscape',
        items: (actionShonen.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'NEW SEASON')),
      },
      {
        id: 'anime-movies',
        title: 'Top Theatrical Anime Movies',
        cardLayout: 'landscape',
        items: (movies.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'NEW MOVIE')),
      },
      {
        id: 'fantasy-isekai-anime',
        title: 'Supernatural, Dark Fantasy & Isekai',
        cardLayout: 'landscape',
        items: (fantasy.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv')),
      },
      {
        id: 'romance-comedy-anime',
        title: 'Comedy & Slice of Life',
        cardLayout: 'landscape',
        items: (romance.results || [])
          .filter((i: any) => i.backdrop_path)
          .slice(0, 10)
          .map((i: any) => formatTmdbItem(i, 'tv')),
      },
    ];
  } catch (error) {
    console.error('Failed to load Anime rows:', error);
    return [];
  }
}

/**
 * Search TMDB specifically for Anime
 */
export async function searchAnime(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  try {
    const data = await fetchTmdb('/search/multi', { query });
    const all = (data.results || []).filter(
      (i: any) =>
        (i.media_type === 'movie' || i.media_type === 'tv') &&
        (i.backdrop_path || i.poster_path)
    );
    const animeFiltered = all.filter(
      (i: any) =>
        (i.genre_ids || []).includes(16) ||
        i.original_language === 'ja' ||
        (i.origin_country || []).includes('JP')
    );
    const results = animeFiltered.length > 0 ? animeFiltered : all;
    return results.slice(0, 18).map((i: any) => formatTmdbItem(i));
  } catch (error) {
    console.error('Failed to search anime:', error);
    return [];
  }
}

/**
 * Fetch Top 10 specifically when region changes
 */
export async function getTop10ByRegion(region: string): Promise<MediaItem[]> {
  const regionMap: Record<string, string> = {
    Pakistan: 'PK',
    'United States': 'US',
    'United Kingdom': 'GB',
    Global: '',
    India: 'IN',
  };
  const regCode = regionMap[region] || 'PK';

  try {
    const data = await fetchTmdb('/movie/popular', regCode ? { region: regCode } : {});
    return (data.results || [])
      .filter((i: any) => i.backdrop_path)
      .slice(0, 10)
      .map((i: any, idx: number) => formatTmdbItem(i, 'movie', idx + 1, 'TOP 10'));
  } catch (error) {
    console.error('Failed to fetch top 10 for region:', region, error);
    return [];
  }
}

/**
 * Search TMDB across Movies & TV
 */
export async function searchTmdb(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  try {
    const data = await fetchTmdb('/search/multi', { query });
    return (data.results || [])
      .filter(
        (i: any) =>
          (i.media_type === 'movie' || i.media_type === 'tv') && (i.backdrop_path || i.poster_path),
      )
      .slice(0, 18)
      .map((i: any) => formatTmdbItem(i));
  } catch (error) {
    console.error('TMDB Search error:', error);
    return [];
  }
}

/**
 * Fetch YouTube trailer video key
 */
export async function getTrailerKey(tmdbId: number, type: 'movie' | 'tv'): Promise<string | null> {
  try {
    const endpoint = `/${type}/${tmdbId}/videos`;
    const data = await fetchTmdb(endpoint);
    const videos = data.results || [];
    const officialTrailer = videos.find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official,
    );
    const anyTrailer = videos.find(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
    );
    const fallback = videos.find((v: any) => v.site === 'YouTube');

    return (officialTrailer || anyTrailer || fallback)?.key || null;
  } catch {
    return null;
  }
}

/**
 * Fetch Cast and Director credits
 */
export async function getMediaCredits(tmdbId: number, type: 'movie' | 'tv'): Promise<MediaCredits> {
  try {
    const endpoint = `/${type}/${tmdbId}/credits`;
    const data = await fetchTmdb(endpoint);
    const cast = (data.cast || []).slice(0, 4).map((c: any) => c.name);
    const directorObj = (data.crew || []).find(
      (c: any) => c.job === 'Director' || c.department === 'Directing',
    );
    return {
      cast,
      director: directorObj?.name || 'Production Team',
    };
  } catch {
    return { cast: ['Ensemble Cast'], director: 'Showrunner' };
  }
}

/**
 * Fetch real TV episodes
 */
export async function getTvEpisodes(
  tmdbId: number,
  seasonNumber: number = 1,
): Promise<EpisodeItem[]> {
  try {
    const endpoint = `/tv/${tmdbId}/season/${seasonNumber}`;
    const data = await fetchTmdb(endpoint);
    return (data.episodes || []).slice(0, 8).map((ep: any) => ({
      num: ep.episode_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      duration: ep.runtime ? `${ep.runtime}m` : '50m',
      desc: ep.overview || 'No description available for this episode.',
      stillUrl: ep.still_path ? `${IMAGE_BASE_W300}${ep.still_path}` : undefined,
    }));
  } catch {
    return [];
  }
}

const DUPAHIYA_EPISODES: EpisodeItem[] = [
  {
    num: 1,
    title: 'AG OG Lo Ji SG',
    duration: '43min',
    rating: '13+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: 'The winter winds bring new chaos to Dhadakpur! Roshni struggles with her studies while Banwari discovers surprising news about the disputed mobile tower land.',
    stillUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop',
  },
  {
    num: 2,
    title: 'Gurudakshina',
    duration: '40min',
    rating: '13+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: 'Banwari is determined to get the mobile tower up- by hook or by crook. Meanwhile, Bhugol takes on an unexpected challenge in the village.',
    stillUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
  },
  {
    num: 3,
    title: 'Hastakshar',
    duration: '39min',
    rating: '11+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: "Mithlesh's investigation leads him to Pratham Kumar, closing in on the contract while Banwari rallies local support.",
    stillUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop',
  },
  {
    num: 4,
    title: 'Khaki Wala Gunda',
    duration: '34min',
    rating: '11+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: "Banwari's tower work sparks a village showdown as Pushpalata confronts the local administration and police.",
    stillUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop',
  },
  {
    num: 5,
    title: 'Prem Tribhuj',
    duration: '36min',
    rating: '13+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: 'Mithlesh gets his hands on a crucial clue. Desperate to get the villagers to cooperate, an unlikely alliance is formed.',
    stillUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop',
  },
  {
    num: 6,
    title: 'Double Engine',
    duration: '34min',
    rating: '13+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: 'Mithlesh recruits Bhugol, Roshni, and Amavas for a risky undercover operation to unveil the true intentions behind the scheme.',
    stillUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop',
  },
  {
    num: 7,
    title: 'Bloody Beauty',
    duration: '39min',
    rating: '7+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: 'Roshni comes face-to-face with Kuber-he humiliates her, but she refuses to give up her ambitions for Dhadakpur.',
    stillUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
  },
  {
    num: 8,
    title: 'Pareeksha',
    duration: '44min',
    rating: '11+',
    airDate: 'Oct 1, 2026',
    hasCc: true,
    desc: 'Roshni and Bhugol reach the exam center; Kuber refuses to enter as tensions reach boiling point in the dramatic conclusion.',
    stillUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop',
  },
];

const DUPAHIYA_RECOMMENDATIONS: MediaItem[] = [
  {
    id: 'raakh',
    tmdbId: 201,
    title: 'Raakh',
    rating: '16+',
    duration: '2h 10m',
    year: 2025,
    genre: ['Crime', 'Drama'],
    synopsis: 'A gritty crime thriller uncovering deceit in a dusty heartland town.',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=780&auto=format&fit=crop',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop',
    type: 'movie',
    matchScore: 94,
  },
  {
    id: 'panchayat',
    tmdbId: 202,
    title: 'Panchayat',
    badge: 'TOP 10',
    rating: '16+',
    duration: 'Season 3',
    year: 2024,
    genre: ['Comedy', 'Drama'],
    synopsis:
      'An engineering graduate takes up a job as a secretary of a gram panchayat in a remote village.',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=780&auto=format&fit=crop',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop',
    type: 'tv',
    matchScore: 98,
  },
  {
    id: 'aspirants',
    tmdbId: 203,
    title: 'Aspirants',
    rating: '16+',
    duration: 'Season 2',
    year: 2024,
    genre: ['Drama'],
    synopsis:
      'The journey of three UPSC aspirants navigating friendship, ambition, and heartbreak in Old Rajinder Nagar.',
    backdropUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=780&auto=format&fit=crop',
    posterUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop',
    type: 'tv',
    matchScore: 96,
  },
  {
    id: 'guilty-minds',
    tmdbId: 204,
    title: 'Guilty Minds',
    rating: '16+',
    duration: 'Season 1',
    year: 2024,
    genre: ['Legal Drama', 'Crime'],
    synopsis:
      'Two college friends face off against each other in high-stakes courtroom battles across India.',
    backdropUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=780&auto=format&fit=crop',
    posterUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop',
    type: 'tv',
    matchScore: 92,
  },
  {
    id: 'agni',
    tmdbId: 205,
    title: 'Agni',
    rating: '16+',
    duration: '2h 05m',
    year: 2024,
    genre: ['Action', 'Thriller'],
    synopsis:
      'Firefighters fight an inferno that threatens an entire metropolis while battling personal demons.',
    backdropUrl:
      'https://images.unsplash.com/photo-1496247749665-49cf5b104999?w=780&auto=format&fit=crop',
    posterUrl:
      'https://images.unsplash.com/photo-1496247749665-49cf5b104999?w=500&auto=format&fit=crop',
    type: 'movie',
    matchScore: 91,
  },
  {
    id: 'mirzapur',
    tmdbId: 206,
    title: 'Mirzapur',
    rating: '18+',
    duration: 'Season 3',
    year: 2024,
    genre: ['Crime', 'Action'],
    synopsis:
      'A shocking incident at a wedding procession ignites a brutal gang war for the throne of Mirzapur.',
    backdropUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=780&auto=format&fit=crop',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop',
    type: 'tv',
    matchScore: 97,
  },
];

export function getFallbackStreamingRows(region: string = 'Pakistan'): CategoryRow[] {
  return [
    {
      id: 'top-10',
      title: `Top 10 in ${region}`,
      isTop10: true,
      region,
      cardLayout: 'landscape',
      items: DUPAHIYA_RECOMMENDATIONS.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        badge: (idx === 0 ? 'TOP 10' : idx < 3 ? 'NEW SEASON' : undefined) as BadgeType | undefined,
      })),
    },
    {
      id: 'featured-originals',
      title: 'Featured Originals and Exclusives',
      seeMoreLink: '/movies',
      cardLayout: 'portrait',
      items: DUPAHIYA_RECOMMENDATIONS,
    },
    {
      id: 'top-tv',
      title: 'Top TV',
      seeMoreLink: '/tv',
      cardLayout: 'landscape',
      items: DUPAHIYA_RECOMMENDATIONS.filter((i) => i.type === 'tv').concat(DUPAHIYA_RECOMMENDATIONS),
    },
    {
      id: 'top-movies',
      title: 'Top movies',
      seeMoreLink: '/movies',
      cardLayout: 'landscape',
      items: DUPAHIYA_RECOMMENDATIONS.filter((i) => i.type === 'movie').concat(DUPAHIYA_RECOMMENDATIONS),
    },
    {
      id: 'comedy-tv',
      title: 'Comedy TV',
      seeMoreLink: '/tv',
      cardLayout: 'landscape',
      items: DUPAHIYA_RECOMMENDATIONS,
    },
    {
      id: 'action-adventure-tv',
      title: 'Action & Adventure TV',
      seeMoreLink: '/tv',
      cardLayout: 'landscape',
      items: DUPAHIYA_RECOMMENDATIONS,
    },
  ];
}

const DUPAHIYA_DETAILS: FullMediaDetail = {
  id: 'dupahiya',
  tmdbId: 998822,
  title: 'Dupahiya',
  originalTitle: 'Dupahiya',
  tagline: 'Dhadakpur is back with a new wave of chaos',
  synopsis:
    "Dhadakpur is back! Banwari's barren land is chosen for a mobile tower-but villagers link everything from typhoid to tsunamis to it. Bhugol is famous now, but only as a female influencer. Roshni's SSC challenge seems insurmountable but Amavas is right there to shake things up.",
  backdropUrl: '/api/media/media_1791277209569.png',
  posterUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
  year: 2026,
  duration: '2 seasons',
  rating: '13+',
  voteAverage: 8.4,
  imdbRating: '8.4/10',
  genres: ['Comedy', 'Drama'],
  cast: [
    'Gajraj Rao',
    'Renuka Shahane',
    'Sparsh Shrivastava',
    'Bhuvan Arora',
    'Shivani Raghuvanshi',
    'Dinesh Lal Yadav (Nirahua)',
    'Yashpal Sharma',
  ],
  directors: ['Sonam Nair'],
  producers: ['Salona Bains Joshi', 'Shubh Shivdasani'],
  studio: 'Amazon Studios',
  trailerKey: null,
  advisory:
    'violence, substance use, smoking, foul language, Flashing lights and strobing patterns might affect photosensitive viewers',
  audioLanguages: [
    'हिन्दी',
    'हिन्दी [ऑडियो विवरण]',
    'हिन्दी Dialogue Boost: Medium',
    'हिन्दी Dialogue Boost: High',
    'English',
  ],
  subtitles: ['English [CC]', 'हिन्दी [CC]', 'العربية', 'Français', 'Español'],
  recommendations: DUPAHIYA_RECOMMENDATIONS,
  type: 'tv',
  isOriginal: true,
  seasonsCount: 2,
  currentSeason: 2,
  episodes: DUPAHIYA_EPISODES,
};

/**
 * Fetch full details for the dedicated Prime Video-style Detail Page
 */
export async function getFullMediaDetails(id: string): Promise<FullMediaDetail> {
  const isDupahiya =
    !id ||
    id === 'dupahiya' ||
    id === 'the-love-hypothesis' ||
    id.toLowerCase().includes('dupahiya') ||
    id === 'default';

  if (isDupahiya) {
    return DUPAHIYA_DETAILS;
  }

  const rawType: 'movie' | 'tv' = id.startsWith('tv-') ? 'tv' : 'movie';
  const rawNumericId = parseInt(id.replace(/\D/g, ''), 10) || 998822;

  try {
    const data = await fetchTmdb(`/${rawType}/${rawNumericId}`, {
      append_to_response: 'credits,recommendations,videos',
    });

    const title = data.title || data.name || 'Dupahiya';
    const releaseYear =
      data.release_date || data.first_air_date
        ? new Date(data.release_date || data.first_air_date).getFullYear()
        : 2026;
    const duration = data.runtime
      ? `${Math.floor(data.runtime / 60)} h ${data.runtime % 60} min`
      : data.number_of_seasons
        ? `${data.number_of_seasons} seasons`
        : '1 season';
    const imdb = (data.vote_average ? data.vote_average.toFixed(1) : '7.5') + '/10';
    const backdropUrl = data.backdrop_path
      ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
      : '/api/media/media_1791277209569.png';
    const posterUrl = data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop';

    const cast = (data.credits?.cast || []).slice(0, 8).map((c: any) => c.name);
    const directors = (data.credits?.crew || [])
      .filter((c: any) => c.job === 'Director')
      .map((c: any) => c.name);
    const producers = (data.credits?.crew || [])
      .filter((c: any) => c.job === 'Producer' || c.job === 'Executive Producer')
      .slice(0, 5)
      .map((c: any) => c.name);

    const trailer =
      (data.videos?.results || []).find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
        ?.key || null;

    const recs: MediaItem[] = (data.recommendations?.results || [])
      .slice(0, 10)
      .map((r: any) => formatTmdbItem(r, rawType, undefined, 'NEW MOVIE'));

    let episodes: EpisodeItem[] = [];
    if (rawType === 'tv') {
      try {
        episodes = await getTvEpisodes(data.id, 1);
      } catch {
        episodes = DUPAHIYA_EPISODES;
      }
    }

    return {
      id: `${rawType}-${data.id}`,
      tmdbId: data.id,
      title,
      originalTitle: data.original_title || data.original_name,
      tagline: data.tagline,
      synopsis: data.overview || DUPAHIYA_DETAILS.synopsis,
      backdropUrl,
      posterUrl,
      year: releaseYear,
      duration,
      rating: '13+',
      voteAverage: typeof data.vote_average === 'number' ? data.vote_average : 7.5,
      imdbRating: imdb,
      genres: data.genres?.length ? data.genres.map((g: any) => g.name) : ['Comedy', 'Drama'],
      cast: cast.length ? cast : DUPAHIYA_DETAILS.cast,
      directors: directors.length ? directors : DUPAHIYA_DETAILS.directors,
      producers: producers.length ? producers : DUPAHIYA_DETAILS.producers,
      studio: 'Amazon Studios',
      trailerKey: trailer,
      advisory: 'violence, substance use, foul language',
      audioLanguages: DUPAHIYA_DETAILS.audioLanguages,
      subtitles: DUPAHIYA_DETAILS.subtitles,
      recommendations: recs.length ? recs : DUPAHIYA_RECOMMENDATIONS,
      type: rawType,
      isOriginal: true,
      isAnime:
        (data.genres || []).some(
          (g: any) => g.id === 16 || g.name?.toLowerCase() === 'animation'
        ) &&
        (data.original_language === 'ja' || (data.origin_country || []).includes('JP')),
      seasonsCount: data.number_of_seasons || 1,
      currentSeason: 1,
      episodes: episodes.length ? episodes : DUPAHIYA_EPISODES,
    };
  } catch (error) {
    console.error('Failed to fetch details:', error);
    return DUPAHIYA_DETAILS;
  }
}

// ── Genre page ────────────────────────────────────────────────────────────────

/** Maps the 9-dots genre slug → { label, movieGenreIds, tvGenreIds } */
const GENRE_SLUG_MAP: Record<
  string,
  { label: string; movieIds: string; tvIds: string }
> = {
  action:      { label: 'Action',       movieIds: '28',        tvIds: '10759' },
  comedy:      { label: 'Comedy',       movieIds: '35',        tvIds: '35'    },
  crime:       { label: 'Crime',        movieIds: '80',        tvIds: '80'    },
  drama:       { label: 'Drama',        movieIds: '18',        tvIds: '18'    },
  scifi:       { label: 'Sci-Fi',       movieIds: '878',       tvIds: '10765' },
  romance:     { label: 'Romance',      movieIds: '10749',     tvIds: '10749' },
  horror:      { label: 'Horror',       movieIds: '27',        tvIds: '27'    },
  family:      { label: 'Family',       movieIds: '10751',     tvIds: '10751' },
  docs:        { label: 'Documentary',  movieIds: '99',        tvIds: '99'    },
};

export interface GenrePageData {
  label: string;
  heroItems: MediaItem[];
  movieRow: CategoryRow;
  tvRow: CategoryRow;
}

export async function getGenreResults(slug: string): Promise<GenrePageData | null> {
  const meta = GENRE_SLUG_MAP[slug];
  if (!meta) return null;

  try {
    const [moviesData, tvData, moviesData2, tvData2] = await Promise.all([
      fetchTmdb('/discover/movie', {
        with_genres: meta.movieIds,
        sort_by: 'popularity.desc',
        page: '1',
      }),
      fetchTmdb('/discover/tv', {
        with_genres: meta.tvIds,
        sort_by: 'popularity.desc',
        page: '1',
      }),
      fetchTmdb('/discover/movie', {
        with_genres: meta.movieIds,
        sort_by: 'vote_average.desc',
        'vote_count.gte': '300',
        page: '1',
      }),
      fetchTmdb('/discover/tv', {
        with_genres: meta.tvIds,
        sort_by: 'vote_average.desc',
        'vote_count.gte': '200',
        page: '1',
      }),
    ]);

    const movies: MediaItem[] = (moviesData.results || [])
      .filter((i: any) => i.backdrop_path || i.poster_path)
      .slice(0, 20)
      .map((i: any) => formatTmdbItem(i, 'movie'));

    const topMovies: MediaItem[] = (moviesData2.results || [])
      .filter((i: any) => i.backdrop_path || i.poster_path)
      .slice(0, 10)
      .map((i: any) => formatTmdbItem(i, 'movie', undefined, 'MOST LIKED'));

    const shows: MediaItem[] = (tvData.results || [])
      .filter((i: any) => i.backdrop_path || i.poster_path)
      .slice(0, 20)
      .map((i: any) => formatTmdbItem(i, 'tv'));

    const topShows: MediaItem[] = (tvData2.results || [])
      .filter((i: any) => i.backdrop_path || i.poster_path)
      .slice(0, 10)
      .map((i: any) => formatTmdbItem(i, 'tv', undefined, 'MOST LIKED'));

    // De-duplicate hero pool
    const seen = new Set<string>();
    const heroItems: MediaItem[] = [];
    for (const item of [...movies, ...shows]) {
      if (!seen.has(item.id) && item.backdropUrl) {
        seen.add(item.id);
        heroItems.push(item);
        if (heroItems.length >= 6) break;
      }
    }

    // Merge popular + top-rated, de-duplicate
    const mergeRows = (popular: MediaItem[], top: MediaItem[]): MediaItem[] => {
      const s = new Set<string>(popular.map(i => i.id));
      return [...popular, ...top.filter(i => !s.has(i.id))];
    };

    return {
      label: meta.label,
      heroItems,
      movieRow: {
        id: `genre-movies-${slug}`,
        title: `${meta.label} Movies`,
        items: mergeRows(movies, topMovies),
      },
      tvRow: {
        id: `genre-tv-${slug}`,
        title: `${meta.label} TV Shows`,
        items: mergeRows(shows, topShows),
      },
    };
  } catch (err) {
    console.error('getGenreResults error:', err);
    return null;
  }
}

