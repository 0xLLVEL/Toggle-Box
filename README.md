# ☕ TEA+

<div align="center">

```
  ████████╗███████╗ █████╗         ██╗
  ╚══██╔══╝██╔════╝██╔══██╗     ████████╗
     ██║   █████╗  ███████║     ╚═████╔═╝
     ██║   ██╔══╝  ██╔══██║     ████████╗
     ██║   ███████╗██║  ██║       ╚═██╔═╝
     ╚═╝   ╚══════╝╚═╝  ╚═╝         ╚═╝
```

**The Next-Generation Cinematic Streaming & Media Discovery Experience**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CSS3](https://img.shields.io/badge/CSS3-Obsidian_&_Cyan-00A8E1?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![TMDB API](https://img.shields.io/badge/TMDB-API_v3-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
[![HLS Streaming](https://img.shields.io/badge/HLS-Video_Stream-E50914?style=for-the-badge&logo=html5&logoColor=white)](https://github.com/video-dev/hls.js/)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](LICENSE)

<br />

[Explore Features](#-features) • [Quick Start](#-getting-started) • [Tech Stack](#-tech-stack) • [Design System](#-design-system) • [Project Structure](#-project-structure)

</div>

---

## 📽 Overview

**Tea+** is a premium, cinematic web streaming and media discovery platform engineered with **Next.js 16 (App Router)**, **React 19**, and **TypeScript**.

Crafted with a reverse-engineered cinematic aesthetic inspired by top-tier streaming services, Tea+ delivers an immersive entertainment interface characterized by an **authentic obsidian dark foundation**, bespoke glassmorphic interfaces, signature **electric cyan (`#00A8E1`)** accents, butter-smooth micro-animations, and complete scrollbar suppression.

Beyond media discovery, Tea+ features a **native HLS video streaming engine** and a modular **extension and scraper provider system** (supporting Zangetsu providers and custom repositories). Whether exploring trending blockbusters, filtering TV series, streaming high-definition content with multi-provider fallbacks, or managing a persistent watchlist, Tea+ sets a new standard for modern web streaming experiences.

---

## ✨ Features

### 🎬 Dynamic Cinematic Carousels

- **Ken-Burns Motion Engine**: Smooth, ambient scale and zoom backdrop transitions on Movies, TV Series, and Home discovery pages.
- **Auto-Play Progression**: Interactive progress-indicator pills that sync with automated carousel timers.
- **Interactive Controls**: Manual directional navigation chevrons, pause-on-hover logic, and direct watchlist actions straight from the hero banner.

### 📺 Integrated HLS Cinema Player (`/watch/[id]`)

- **Direct Video Streaming**: Seamless playback powered by HLS.js with adaptive bitrate streaming.
- **Multi-Source Provider Switcher**: Dynamically resolve and switch video streams across installed extension providers on the fly.
- **TV Series Episode Navigator**: In-player season and episode drawers with thumbnails, episode titles, and quick seek.
- **Cinema Controls**: Custom scrub bar, 10s skip backward/forward, playback speed selectors (0.5x to 2x), volume slider, subtitles toggle, and true fullscreen mode.
- **Watch Progress Tracking**: Automatically stores playback timestamp to resume right where you left off.

### 🧩 Streaming Extensions & Provider Hub (`/providers`)

- **Zangetsu Providers Integration**: Native support for community scrapers (movies, series, and anime) from `Spyou/zangetsu-providers`.
- **Dynamic Scraper Execution**: On-demand server-side stream extraction and proxying (`/api/providers/execute`).
- **Custom Repository Support**: Add, install, test, enable, or remove third-party scraper manifests via URL.
- **Connection Health Checks**: In-app provider diagnostic testing to verify endpoint latency and scraper availability.

### 🖤 Obsidian & Electric Cyan Design

- **True OLED Black**: Styled strictly in `#000000` and deep obsidian grays (`#0a0a0a` / `#0f172a`), eliminating unwanted tinting.
- **Signature Cyan Accent**: Premium `#00A8E1` branding for primary CTAs, active states, and glowing focus rings.
- **Frosted Acrylic Glass**: Backdrop-blur filters (`blur(28px)`) with hairline platinum borders (`rgba(255, 255, 255, 0.12)`).
- **Custom SVG Wordmark**: Precision-engineered Tea+ vector logo with electric blue plus symbol and gold inclusion badges.

### 🧭 Sophisticated Navigation & Menus

- **Global Sticky Frosted Header**: Reacts to window scroll events with dynamic elevation shadows, category links, and quick search.
- **Multilingual Selector**: Comprehensive dropdown supporting English, Spanish, German, French, Urdu, and Hindi with native typography, country tags, and auto-dismiss click-outside listeners.
- **Luxury Account & Tier Suite**:
  - Monogram avatar with a live green status pulse.
  - Interactive **Tea+ Member** card with real-time plan switching (_4K UHD Dolby Atmos_ vs. _Standard Pass_).
  - Watchlist counter badge synchronizing instantly with your saved items.
  - Profile preferences, help center, and styled sign-out options.

### 🔍 Instant Omnisearch Modal

- **Real-Time Live Search**: Debounced querying against titles, overviews, and genres.
- **Genre Chips & Filters**: Quick-filter by Action, Sci-Fi, Drama, Comedy, Horror, and Animation.
- **Keyboard Navigation**: Press `Esc` to instantly dismiss, with accessible focus trapping.

### 🍿 In-Depth Media Exploration

- **Top 10 Today**: High-impact numbered ranking cards (1 through 10) featuring custom typographic badges.
- **Interactive Media Cards**: Hover-expansion preview cards revealing match scores, maturity ratings (e.g., `18+`, `16+`), resolution tags (`4K UHD`, `HDR`, `5.1 Audio`), and quick-action toolbars.
- **Dual Modal & Full-Page Detail Views**:
  - Modal overlay for fast, non-disruptive previews.
  - Dedicated full-page route (`/detail/[id]`) with trailers, full season/episode grids, director/cast attribution cards, and "Customers Also Watched" recommendation carousels.

### 📌 State Management & Watchlist ("My Stuff")

- **Persistent Storage**: React 19 Context API backed by browser `localStorage` ensuring your watchlist and watch history survive page refreshes.
- **Instant Toast Alerts**: Non-intrusive micro-feedback toasts confirming additions and removals.

---

## 🛠 Tech Stack

| Domain             | Technology                                                        | Description                                                         |
| :----------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------ |
| **Framework**      | [Next.js 16 (App Router)](https://nextjs.org/)                    | Hybrid Server/Client Components, Route Handlers, App Router         |
| **UI Library**     | [React 19](https://react.dev/)                                    | React Server Components, Actions, latest hooks                      |
| **Language**       | [TypeScript 5.6](https://www.typescriptlang.org/)                 | Strict type-safety, comprehensive data interfaces                   |
| **Styling**        | **Pure Vanilla CSS**                                              | Zero CSS-framework bloat, custom CSS design tokens                  |
| **Video Playback** | [HLS.js](https://github.com/video-dev/hls.js/)                    | Adaptive HTTP Live Streaming in browser                             |
| **Typography**     | [Outfit (Google Fonts)](https://fonts.google.com/specimen/Outfit) | Modern, clean geometric sans-serif                                  |
| **Data Source**    | [The Movie Database (TMDB)](https://www.themoviedb.org/)          | Real-time movie & TV metadata with curated offline fallback catalog |
| **Extensions**     | Zangetsu Scraper Architecture                                     | On-demand stream resolvers with server-side proxying                |
| **Icons**          | Custom Vector SVGs                                                | Lightweight inline SVG icons with zero runtime overhead             |
| **Tooling**        | ESLint 9 & Prettier                                               | Strict code formatting and automated lint checks                    |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **npm**, **pnpm**, or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/tea-plus.git
cd tea-plus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (Optional)

Tea+ works out of the box with a rich, curated offline dataset. To enable live fetching from The Movie Database (TMDB), create a `.env.local` file in the root directory:

```env
# TMDB API v3 Key (Optional — curated fallback data provided)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
```

> **Note**: If no API key is provided, Tea+ automatically falls back to its comprehensive internal database of high-definition movies and series.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience Tea+.

---

## 📁 Project Structure

```
tea-plus/
├── public/                     # Static media and assets
├── src/
│   ├── app/                    # Next.js App Router pages & APIs
│   │   ├── api/                # API Route Handlers
│   │   │   ├── media/          # Media resolution & search endpoints
│   │   │   └── providers/      # Provider scraper execute, manifest & proxy
│   │   ├── detail/[id]/        # Full-page media detail view with seasons & cast
│   │   ├── genres/[id]/        # Genre catalog & category landing pages
│   │   ├── movies/             # Movies discovery page (Hero Carousel)
│   │   ├── mystuff/            # Watchlist & continue-watching library
│   │   ├── providers/          # Extensions & scraper provider manager
│   │   ├── tv/                 # TV series discovery page (Hero Carousel)
│   │   ├── watch/[id]/         # HLS cinema player page with episode selector
│   │   ├── globals.css         # Master design system & CSS variables
│   │   ├── layout.tsx          # Root layout, metadata & font configuration
│   │   └── page.tsx            # Home landing page with curated rows
│   ├── components/             # Reusable UI component library
│   │   ├── FilterBar.tsx       # Genre & category filter pills
│   │   ├── Footer.tsx          # Brand footer with links & copyright
│   │   ├── GenreBanner.tsx     # Cinematic header banner for genre pages
│   │   ├── HeroCarousel.tsx    # Ken-Burns animated auto-play hero carousel
│   │   ├── Icons.tsx           # Custom inline SVG icon system & Tea+ logo
│   │   ├── LanguageSelector.tsx# Multi-language selector dropdown
│   │   ├── MediaCard.tsx       # Hover-expandable thumbnail cards
│   │   ├── MediaModal.tsx      # Deep dive modal with trailers & episode lists
│   │   ├── MediaRow.tsx        # Horizontal scrolling content carousels
│   │   ├── Navbar.tsx          # Obsidian sticky navigation bar with dropdowns
│   │   ├── PageHero.tsx        # Punchline & hero banner container
│   │   ├── SearchModal.tsx     # Fullscreen debounced live search modal
│   │   ├── StreamPlayerModal.tsx# In-modal stream video player
│   │   └── Toast.tsx           # Watchlist notification pills
│   ├── context/
│   │   ├── LanguageContext.tsx # Dynamic i18n & locale provider
│   │   ├── ProviderContext.tsx # Scraper extensions state & stream resolution
│   │   └── WatchlistContext.tsx# Watchlist & progress state with LocalStorage
│   ├── services/
│   │   └── tmdb.ts             # TMDB API client with offline fallback catalog
│   └── types/
│       ├── media.ts            # TypeScript definitions for media, cast & episodes
│       └── provider.ts         # TypeScript definitions for scrapers & streams
├── .prettierrc                 # Code formatting rules
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js image domains & settings
├── package.json                # Project dependencies and npm scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 🎨 Design System

Tea+ relies on carefully crafted CSS custom properties defined in `src/app/globals.css`:

```css
:root {
  /* Core Obsidian Palette */
  --bg-core: #000000;
  --bg-surface: #0a0a0a;
  --bg-surface-elevated: #111111;
  --bg-surface-hover: #191919;

  /* Signature Electric Cyan Accent */
  --prime-blue: #00a8e1;
  --prime-cyan: #00a8e1;
  --prime-gold: #f59e0b;

  /* Crisp Monochrome Accents */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.72);
  --text-muted: rgba(255, 255, 255, 0.48);

  /* Hairline Glass Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.16);

  /* Micro-Motion Timings */
  --transition-fast: 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  --transition-smooth: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Highlights:

- **Zero Scrollbar Distraction**: Scrollbars are globally suppressed across WebKit, Firefox, and Chromium engines for an authentic app-like feel.
- **Glassmorphic Dropdowns**: Dropdowns feature 28px backdrop blur filters, smooth entrance scales, and click-outside boundary detection.
- **Touch & Keyboard Accessible**: Full keyboard focus visibility and touch-friendly targets.

---

## 📜 Available Scripts

| Command              | Action                                                             |
| :------------------- | :----------------------------------------------------------------- |
| `npm run dev`        | Starts local Next.js development server at `http://localhost:3000` |
| `npm run build`      | Compiles optimized production build                                |
| `npm run start`      | Boots production server                                            |
| `npm run lint`       | Runs ESLint to check for code issues                               |
| `npm run format`     | Automatically formats codebase with Prettier                       |
| `npm run type-check` | Runs TypeScript compiler to verify all types                       |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

Crafted with 🖤 for cinematic entertainment enthusiasts.

**[Tea+](https://github.com/your-username/tea-plus)** • Stream Movies, TV Shows & Originals

</div>
