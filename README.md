# ◧ TOGGLE BOX

<div align="center">

```
  ████████╗ ██████╗  ██████╗  ██████╗ ██╗     ███████╗    ██████╗  ██████╗ ██╗  ██╗
  ╚══██╔══╝██╔═══██╗██╔════╝ ██╔════╝ ██║     ██╔════╝    ██╔══██╗██╔═══██╗╚██╗██╔╝
     ██║   ██║   ██║██║  ███╗██║  ███╗██║     █████╗      ██████╔╝██║   ██║ ╚███╔╝ 
     ██║   ██║   ██║██║   ██║██║   ██║██║     ██╔══╝      ██╔══██╗██║   ██║ ██╔██╗ 
     ██║   ╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗    ██████╔╝╚██████╔╝██╔╝ ██╗
     ╚═╝    ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
```

**The Next-Generation Cinematic Streaming & Media Discovery Experience**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CSS3](https://img.shields.io/badge/CSS3-Obsidian_Glass-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![TMDB API](https://img.shields.io/badge/TMDB-API_v3-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)](LICENSE)

<br />

[Explore Features](#-features) • [Quick Start](#-getting-started) • [Tech Stack](#-tech-stack) • [Design System](#-design-system) • [Project Structure](#-project-structure)

</div>

---

## 📽 Overview

**Toggle Box** is a premium, cinematic web streaming and media discovery platform engineered with **Next.js 16 (App Router)**, **React 19**, and **TypeScript**. 

Drawing inspiration from world-class streaming platforms, Toggle Box delivers an immersive, ultra-responsive entertainment interface characterized by an **authentic obsidian dark aesthetic**, bespoke glassmorphic interfaces, butter-smooth micro-animations, and complete scrollbar suppression.

Whether browsing trending blockbusters, filtering award-winning TV series, watching high-definition trailers, or curating a personal watchlist, Toggle Box sets a new benchmark for web video discovery.

---

## ✨ Features

### 🎬 Dynamic Cinematic Carousels
- **Ken-Burns Motion Engine**: Smooth, ambient scale and zoom backdrop transitions on Movie and TV series discovery pages.
- **Auto-Play Progression**: Interactive progress-indicator pills that sync with automated carousel timers.
- **Interactive Controls**: Manual directional navigation chevrons, pause-on-hover logic, and direct watchlist actions from the hero banner.

### 🖤 Obsidian Glassmorphism Design
- **True OLED Black**: Styled strictly in `#000000` and deep obsidian grays (`#0a0a0a` / `#111111`), eliminating unwanted bluish or purple tints.
- **Frosted Acrylic Glass**: Backdrop-blur filters (`blur(28px)`) with hairline platinum borders (`rgba(255, 255, 255, 0.12)`).
- **Custom SVG Brand Logo**: Hand-crafted interactive toggle switch icon with metallic chrome gradients and platinum glow.

### 🧭 Sophisticated Navigation & Menus
- **Global Sticky Frosted Header**: Reacts to window scroll events with dynamic elevation shadows and border highlight.
- **Multilingual Selector**: Comprehensive dropdown supporting English, Spanish, German, French, Urdu, and Hindi with native typography, country tags, and auto-dismiss click-outside listeners.
- **Luxury Account & Tier Suite**: 
  - Monogram avatar with a live green status pulse.
  - Interactive **TOGGLE+** membership card with real-time plan switching (*4K UHD Dolby Atmos* vs. *Standard Pass*).
  - Watchlist counter badge synchronizing instantly with your saved items.
  - Profile preferences, help center, and styled sign-out options.

### 🔍 Instant Omnisearch Modal
- **Real-Time Live Search**: Debounced querying against titles, overviews, and genres.
- **Genre Chips & Filters**: Quick-filter by Action, Sci-Fi, Drama, Comedy, Horror, and Animation.
- **Keyboard Navigation**: Press `Esc` to instantly dismiss, with accessible focus trapping.

### 🍿 In-Depth Media Exploration
- **Top 10 Today**: High-impact numbered ranking cards (1 through 10) featuring custom typographic badges.
- **Interactive Media Cards**: Hover-expansion preview cards revealing match scores, maturity ratings (e.g., `18+`, `16+`), resolution tags (`4K UHD`, `HDR`, `5.1 Audio`), and quick-action toolbars.
- **Rich Media Modals & Detail Pages**:
  - Full-screen trailer playback with embedded YouTube player.
  - TV series season & episode navigator with thumbnails, runtimes, and descriptions.
  - Cast, directors, and producer attribution cards.
  - Curated "Customers Also Watched" recommendation carousels.

### 📌 State Management & Watchlist
- **Persistent Storage**: React 19 Context API backed by browser `localStorage` ensuring your watchlist survives refreshes.
- **Instant Toast Alerts**: Non-intrusive micro-feedback toasts confirming additions and removals.

---

## 🛠 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Hybrid Server/Client Components, file-based routing |
| **UI Library** | [React 19](https://react.dev/) | React Server Components, Actions, latest hooks |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) | Strict type-safety, comprehensive data interfaces |
| **Styling** | **Pure Vanilla CSS** | Zero CSS-framework bloat, custom CSS design tokens |
| **Typography** | [Outfit (Google Fonts)](https://fonts.google.com/specimen/Outfit) | Modern, clean geometric sans-serif |
| **Data Source** | [The Movie Database (TMDB)](https://www.themoviedb.org/) | Real-time movie & TV metadata with curated fallback data |
| **Icons** | Custom Vector SVGs | Lightweight inline SVG icons with zero runtime overhead |
| **Tooling** | ESLint 9 & Prettier | Strict code formatting and automated lint checks |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **npm**, **pnpm**, or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/toggle-box.git
cd toggle-box
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (Optional)

Toggle Box works out of the box with a rich, curated offline dataset. To enable live fetching from The Movie Database (TMDB), create a `.env.local` file in the root directory:

```env
# TMDB API v3 Key (Optional — fallback data provided)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
```

> **Note**: If no API key is provided, Toggle Box automatically falls back to its comprehensive internal database of high-definition movies and series.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience the application.

---

## 📁 Project Structure

```
Toggle Box/
├── public/                     # Static media and assets
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── detail/[id]/        # Full-page media detail view
│   │   ├── movies/             # Movies discovery page (Hero Carousel)
│   │   ├── mystuff/            # User watchlist page
│   │   ├── tv/                 # TV series discovery page (Hero Carousel)
│   │   ├── globals.css         # Master design system & CSS variables
│   │   ├── layout.tsx          # Root layout & font configuration
│   │   └── page.tsx            # Home landing page
│   ├── components/             # Reusable UI component library
│   │   ├── FilterBar.tsx       # Genre & category filter pills
│   │   ├── Footer.tsx          # Brand footer with links & copyright
│   │   ├── HeroCarousel.tsx    # Ken-Burns animated auto-play hero carousel
│   │   ├── Icons.tsx           # Custom inline SVG icon system & Toggle logo
│   │   ├── MediaCard.tsx       # Hover-expandable thumbnail cards
│   │   ├── MediaModal.tsx      # Deep dive modal with trailers & episode lists
│   │   ├── MediaRow.tsx        # Horizontal scrolling content carousels
│   │   ├── Navbar.tsx          # Obsidian sticky navigation bar with dropdowns
│   │   ├── PageHero.tsx        # Punchline & hero banner container
│   │   ├── SearchModal.tsx     # Fullscreen debounced live search modal
│   │   └── Toast.tsx           # Watchlist notification pills
│   ├── context/
│   │   └── WatchlistContext.tsx# Watchlist state management with LocalStorage
│   ├── services/
│   │   └── tmdb.ts             # TMDB API client with offline fallback catalog
│   └── types/
│       └── media.ts            # TypeScript definitions for media, cast & episodes
├── .prettierrc                 # Code formatting rules
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js image domains & settings
├── package.json                # Project dependencies and npm scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 🎨 Design System

Toggle Box relies on carefully crafted CSS custom properties defined in `src/app/globals.css`:

```css
:root {
  /* Core Obsidian Palette */
  --bg-core: #000000;
  --bg-surface: #0a0a0a;
  --bg-surface-elevated: #111111;
  --bg-surface-hover: #191919;

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
- **Zero Scrollbar Distraction**: Scrollbars are globally suppressed across WebKit, Firefox, and Chromium engines for an app-like feel.
- **Glassmorphic Dropdowns**: Dropdowns feature 28px backdrop blur filters, smooth entrance scales, and click-outside boundary detection.
- **Touch & Keyboard Accessible**: Full keyboard focus visibility and touch-friendly targets.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server at `http://localhost:3000` |
| `npm run build` | Compiles optimized production build |
| `npm run start` | Boots production server |
| `npm run lint` | Runs ESLint to check for code issues |
| `npm run format` | Automatically formats codebase with Prettier |
| `npm run type-check` | Runs TypeScript compiler to verify all types |

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

**[Toggle Box](https://github.com/your-username/toggle-box)** • Stream Movies, TV Shows & Originals

</div>
