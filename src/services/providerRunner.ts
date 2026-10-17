import nodeCrypto from 'node:crypto';
import type { ZangetsuManifest, ZangetsuSource } from '@/types/provider';

const DEFAULT_REPO_RAW = 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main';
const DEFAULT_MANIFEST_URL = `${DEFAULT_REPO_RAW}/index.json`;

// Fallback hardcoded manifest in case of network issues or rate limits
export const FALLBACK_MANIFEST: ZangetsuManifest = {
  name: 'Zangetsu Providers',
  description: 'Streaming sources for movies, series, and anime from the official Zangetsu repository.',
  sources: [
    {
      id: 'anikoto',
      name: 'AniKoto',
      version: '1.0.8',
      type: 'anime',
      lang: 'en',
      file: 'providers/anikoto.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/anikoto.png',
      nsfw: false,
      description: 'High-speed anime streaming with Sub and Dub, multiple subtitle tracks and fast HLS playback.',
    },
    {
      id: 'hianime',
      name: 'HiAnime',
      version: '1.2.2',
      type: 'anime',
      lang: 'en',
      file: 'providers/hianime.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/hianime.png',
      nsfw: false,
      description: 'Extensive anime catalogue with HD streaming, subbed and dubbed releases.',
    },
    {
      id: 'fourkhdhub',
      name: '4K HDHub',
      version: '1.0.6',
      type: 'movie',
      lang: 'en',
      file: 'providers/fourkhdhub.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/fourkhdhub.png',
      nsfw: false,
      description: 'Movies and TV series up to 2160p 4K HDR quality with clean streams.',
    },
    {
      id: 'hdhub4u',
      name: 'HDHub4u',
      version: '1.2.4',
      type: 'movie',
      lang: 'en',
      file: 'providers/hdhub4u.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/hdhub4u.png',
      nsfw: false,
      description: 'Hollywood and international blockbusters with high-speed direct streams.',
    },
    {
      id: 'uhdmovies',
      name: 'UHD Movies',
      version: '1.0.3',
      type: 'movie',
      lang: 'en',
      file: 'providers/uhdmovies.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/uhdmovies.png',
      nsfw: false,
      description: 'Movies and series with high-bitrate video streams and dual audio options.',
    },
    {
      id: 'vegamovies',
      name: 'VegaMovies',
      version: '1.0.4',
      type: 'movie',
      lang: 'hi',
      file: 'providers/vegamovies.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/vegamovies.png',
      nsfw: false,
      description: 'International and Bollywood cinema releases with multi-quality resolution.',
    },
    {
      id: 'multimovies',
      name: 'MultiMovies',
      version: '1.0.3',
      type: 'movie',
      lang: 'hi',
      file: 'providers/multimovies.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/multimovies.png',
      nsfw: false,
      description: 'Direct HLS video streaming for movies and select TV series.',
    },
    {
      id: 'animecube',
      name: 'AnimeCube',
      version: '1.0.5',
      type: 'anime',
      lang: 'zh',
      file: 'providers/animecube.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/animecube.png',
      nsfw: false,
      description: 'Comprehensive Asian anime and animation streaming repository.',
    },
    {
      id: 'torbox',
      name: 'TorBox',
      version: '1.0.0',
      type: 'movie',
      lang: 'en',
      file: 'providers/torbox.js',
      logo: 'https://raw.githubusercontent.com/Spyou/zangetsu-providers/main/icons/torbox.png',
      nsfw: false,
      description: 'High-speed cached debrid streaming for movies and series via Torrentio discovery.',
    },
  ],
};

// Memory caches
let cachedManifest: { data: ZangetsuManifest; timestamp: number } | null = null;
const scriptCache = new Map<string, { code: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/**
 * Fetch manifest from default or custom repository
 */
export async function getManifest(customRepoUrl?: string): Promise<ZangetsuManifest> {
  const url = customRepoUrl || DEFAULT_MANIFEST_URL;

  if (!customRepoUrl && cachedManifest && Date.now() - cachedManifest.timestamp < CACHE_TTL) {
    return cachedManifest.data;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TeaPlus-ProviderClient/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.warn(`Failed to fetch manifest from ${url}, using fallback.`);
      return FALLBACK_MANIFEST;
    }

    const data = (await res.json()) as ZangetsuManifest;
    
    // Normalize source logos and file paths if relative
    const baseUrl = url.substring(0, url.lastIndexOf('/'));
    data.sources = data.sources.map((s) => ({
      ...s,
      logo: s.logo.startsWith('http') ? s.logo : `${baseUrl}/${s.logo}`,
      sourceRepo: customRepoUrl || 'https://github.com/Spyou/zangetsu-providers',
      description:
        FALLBACK_MANIFEST.sources.find((fs) => fs.id === s.id)?.description ||
        `${s.name} ${s.type} streaming extension.`,
    }));

    if (!customRepoUrl) {
      cachedManifest = { data, timestamp: Date.now() };
    }

    return data;
  } catch (err) {
    console.warn('Error fetching manifest, returning fallback:', err);
    return FALLBACK_MANIFEST;
  }
}

/**
 * Get provider script code from repo
 */
export async function getProviderScript(
  source: ZangetsuSource,
  customRepoUrl?: string
): Promise<string> {
  const cacheKey = `${source.id}:${source.version}`;
  const cached = scriptCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.code;
  }

  let fileUrl = source.file;
  if (!fileUrl.startsWith('http')) {
    const baseRepo = customRepoUrl
      ? customRepoUrl.substring(0, customRepoUrl.lastIndexOf('/'))
      : DEFAULT_REPO_RAW;
    fileUrl = `${baseRepo}/${source.file.replace(/^\//, '')}`;
  }

  const res = await fetch(fileUrl, {
    headers: {
      'User-Agent': 'TeaPlus-ProviderClient/1.0',
      Accept: '*/*',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download provider script from ${fileUrl} (status ${res.status})`);
  }

  const code = await res.text();
  scriptCache.set(cacheKey, { code, timestamp: Date.now() });
  return code;
}

/**
 * Executes a provider function with the full Zangetsu sandbox environment
 */
export async function executeProviderMethod(
  providerId: string,
  method: string,
  args: any[] = [],
  customRepoUrl?: string
): Promise<any> {
  const manifest = await getManifest(customRepoUrl);
  const source = manifest.sources.find((s) => s.id === providerId);

  if (!source) {
    throw new Error(`Provider "${providerId}" not found in manifest.`);
  }

  const code = await getProviderScript(source, customRepoUrl);

  // Setup Zangetsu JS Host Runtime Environment
  const host: Record<string, any> = {};

  host.__providers = {};
  host.__extractors = {};

  host.__fetch = async function (src: string, u: string, opts: any = {}) {
    opts = opts || {};
    const headers = Object.assign(
      {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: '*/*',
      },
      opts.headers || {}
    );

    const init: RequestInit = {
      method: opts.method || 'GET',
      headers,
      body: opts.body,
    };
    if (opts.followRedirects === false) {
      init.redirect = 'manual';
    }

    try {
      const r = await fetch(u, init);
      const text = await r.text();
      const hdrs: Record<string, string> = {};
      r.headers.forEach((val, key) => {
        hdrs[key] = val;
      });

      return {
        ok: r.ok,
        status: r.status,
        statusText: r.statusText,
        headers: hdrs,
        url: r.url,
        body: text,
        text: async () => text,
        json: async () => JSON.parse(text),
      };
    } catch (err: any) {
      console.warn(`[${src}] Fetch failed for ${u}:`, err.message);
      throw err;
    }
  };

  host.__console = (src: string, level: string, logArgs: any[]) => {
    // Suppress spammy logs in production, log errors
    if (level === 'error') {
      console.error(`[${src} ${level}]`, ...logArgs);
    }
  };

  host.htmlText = function (html: string) {
    if (!html) return '';
    return String(html)
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  host.absUrl = function (href: string, base: string) {
    if (!href) return '';
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith('//')) return 'https:' + href;
    if (!base) return href;
    if (href.startsWith('/')) {
      const m = base.match(/^(https?:\/\/[^/]+)/i);
      return m ? m[1] + href : href;
    }
    return base.replace(/\/$/, '') + '/' + href;
  };

  host.unpackJs = function (sourceText: string) {
    const s = String(sourceText);
    const open = s.indexOf("}('");
    const close = s.indexOf(".split('|'),0,{}))");
    if (open === -1 || close <= open) return s;
    const body = s.slice(open + 3, close);
    let end = 0;
    while (end < body.length && body.charAt(end) !== "'") {
      end += body.charAt(end) === '\\' ? 2 : 1;
    }
    if (body.charAt(end + 1) !== ',') return s;
    const payload = body.slice(0, end).replace(/\\'/g, "'");
    const tail = body.slice(end + 2);
    let radix = parseInt(tail, 10);
    if (!(radix >= 2 && radix <= 62)) radix = 62;
    const dictStart = tail.indexOf("'");
    const dictEnd = tail.lastIndexOf("'");
    if (dictStart === -1 || dictEnd <= dictStart) return s;
    const dict = tail.slice(dictStart + 1, dictEnd).split('|');
    const unbase = (t: string) => {
      let a = 0;
      for (const c of t) {
        const d =
          c <= '9' ? c.charCodeAt(0) - 48 : c >= 'a' ? c.charCodeAt(0) - 87 : c.charCodeAt(0) - 29;
        if (d >= radix) return -1;
        a = a * radix + d;
      }
      return a;
    };
    return payload.replace(/[0-9A-Za-z]+/g, (k: string) => {
      const i = unbase(k);
      return i >= 0 && i < dict.length && dict[i] !== '' ? dict[i] : k;
    });
  };

  host.sha256Hex = async function (message: string) {
    return nodeCrypto.createHash('sha256').update(String(message)).digest('hex');
  };

  host.aesCtrDecrypt = async function (opts: { keyHex: string; counterHex: string; dataB64: string }) {
    const key = Buffer.from(opts.keyHex, 'hex');
    const ctr = Buffer.from(opts.counterHex, 'hex');
    const data = Buffer.from(opts.dataB64, 'base64');
    const d = nodeCrypto.createDecipheriv('aes-256-ctr', key, ctr);
    return Buffer.concat([d.update(data), d.final()]).toString('utf8');
  };

  host.base64ToBytes = (b64: string) => Array.from(Buffer.from(String(b64), 'base64'));
  host.bytesToHex = (bytes: number[]) => Buffer.from(bytes).toString('hex');
  host.bytesToB64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

  // Wrap the script
  const wrapped = `(function(globalThis) {
    var __SOURCE_ID = '${providerId}';
    var fetch = function(u, o) { return globalThis.__fetch(__SOURCE_ID, u, o); };
    var extractVideo = function(u, o) { return Promise.reject('Not supported'); };
    var console = {
      log: function() { globalThis.__console(__SOURCE_ID, 'log', Array.from(arguments)); },
      warn: function() { globalThis.__console(__SOURCE_ID, 'warn', Array.from(arguments)); },
      error: function() { globalThis.__console(__SOURCE_ID, 'error', Array.from(arguments)); }
    };
    var htmlText = globalThis.htmlText;
    var absUrl = globalThis.absUrl;
    var unpackJs = globalThis.unpackJs;
    var sha256Hex = globalThis.sha256Hex;
    var aesCtrDecrypt = globalThis.aesCtrDecrypt;
    var base64ToBytes = globalThis.base64ToBytes;
    var bytesToHex = globalThis.bytesToHex;
    var bytesToB64 = globalThis.bytesToB64;

    ${code}

    globalThis.__providers['${providerId}'] = {
      getInfo: typeof getInfo === 'function' ? getInfo : null,
      getHome: typeof getHome === 'function' ? getHome : null,
      search: typeof search === 'function' ? search : null,
      popular: typeof popular === 'function' ? popular : null,
      getDetail: typeof getDetail === 'function' ? getDetail : null,
      getEpisodes: typeof getEpisodes === 'function' ? getEpisodes : null,
      getVideoSources: typeof getVideoSources === 'function' ? getVideoSources : null,
      getSettings: typeof getSettings === 'function' ? getSettings : null
    };
  })(host);`;

  // Evaluate wrapper passing the host context
  const evalFn = new Function('host', wrapped);
  evalFn(host);

  const provider = host.__providers[providerId];
  if (!provider) {
    throw new Error(`Provider "${providerId}" failed to initialize.`);
  }

  const targetFn = provider[method];
  if (typeof targetFn !== 'function') {
    throw new Error(`Method "${method}" is not implemented by provider "${providerId}".`);
  }

  const result = await targetFn.apply(null, args);
  return result;
}
