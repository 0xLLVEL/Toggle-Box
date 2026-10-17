import React from 'react';

interface GenreBannerProps {
  slug: string;
  label: string;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const GENRE_CONFIG: Record<
  string,
  { actorPath: string; actorName: string; from: string; to: string; accent: string; tagline: string }
> = {
  action:  { actorPath: '/maf8PhSvDCdEwjEMbYfGpojR5RP.jpg', actorName: 'Tom Cruise',       from: '#ff4e2a', to: '#ff8c42', accent: '#ffb347', tagline: 'High Octane • Non-Stop'       },
  comedy:  { actorPath: '/y3U9QfPN6sJaGl6l68xjwWj28ig.jpg', actorName: 'Jim Carrey',        from: '#f59e0b', to: '#fbbf24', accent: '#fde68a', tagline: 'Feel Good • Easy Laughs'      },
  crime:   { actorPath: '/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg', actorName: 'Bryan Cranston',    from: '#6b7280', to: '#9ca3af', accent: '#e5e7eb', tagline: 'Dark & Gripping • Twisted'    },
  drama:   { actorPath: '/g5cVxQBAQ3AXt3LhdBXtbbN47Uc.jpg', actorName: 'Meryl Streep',      from: '#8b5cf6', to: '#a78bfa', accent: '#ddd6fe', tagline: 'Character Driven • Emotional' },
  scifi:   { actorPath: '/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg', actorName: 'Robert Downey Jr.', from: '#06b6d4', to: '#38bdf8', accent: '#bae6fd', tagline: 'Beyond Reality • Epic Scale'   },
  romance: { actorPath: '/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg', actorName: 'Ryan Gosling',      from: '#ec4899', to: '#f472b6', accent: '#fbcfe8', tagline: 'Heart & Soul • Modern Love'    },
  horror:  { actorPath: '/scSjbFCTRngXlkJRoKptM5kQGw7.jpg', actorName: 'Brian Cox',         from: '#dc2626', to: '#ef4444', accent: '#fecaca', tagline: 'Dark & Tense • Late Night'     },
  family:  { actorPath: '/oFvZoKI6lvU03n4YoNGAll9rkas.jpg', actorName: 'Tom Hanks',         from: '#10b981', to: '#34d399', accent: '#a7f3d0', tagline: 'For Everyone • All Ages'       },
  docs:    { actorPath: '/905k0RFzH0Kd6gx8oSxRdnr6FL.jpg',  actorName: 'Morgan Freeman',    from: '#f97316', to: '#fb923c', accent: '#fed7aa', tagline: 'Real Stories • True Life'      },
};

const DEFAULT = GENRE_CONFIG.action;

export const GenreBanner: React.FC<GenreBannerProps> = ({ slug, label }) => {
  const cfg = GENRE_CONFIG[slug] ?? DEFAULT;

  return (
    <div
      className="genre-banner"
      style={{
        background: `linear-gradient(135deg, ${cfg.from}18 0%, ${cfg.to}08 60%, transparent 100%)`,
        borderColor: `${cfg.from}28`,
      }}
    >
      {/* Glow orb behind text */}
      <div
        className="genre-banner-orb"
        style={{ background: `radial-gradient(circle, ${cfg.from}22 0%, transparent 70%)` }}
      />

      {/* Left: text */}
      <div className="genre-banner-content">
        <p className="genre-banner-tagline" style={{ color: cfg.accent }}>
          {cfg.tagline.toUpperCase()}
        </p>
        <h1
          className="genre-banner-label"
          style={{
            backgroundImage: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {label.toUpperCase()}
        </h1>
        <div
          className="genre-banner-line"
          style={{ background: `linear-gradient(90deg, ${cfg.from}, ${cfg.to}, transparent)` }}
        />
      </div>

      {/* Right: circular actor avatar stack */}
      <div className="genre-banner-avatars">
        {/* Outer glow ring */}
        <div
          className="genre-banner-avatar-ring"
          style={{ boxShadow: `0 0 0 3px ${cfg.from}55, 0 0 24px ${cfg.from}40` }}
        >
          <img
            src={`${TMDB_IMG}${cfg.actorPath}`}
            alt={cfg.actorName}
            className="genre-banner-avatar-img"
            loading="eager"
          />
        </div>
        <span className="genre-banner-avatar-name" style={{ color: cfg.accent }}>
          {cfg.actorName}
        </span>
      </div>
    </div>
  );
};
