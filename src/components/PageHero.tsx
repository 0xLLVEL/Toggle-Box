'use client';

import React from 'react';

interface HeroPanelRow {
  label: string;
  value: string;
}

interface HeroHighlight {
  label: string;
  value: string;
  description?: string;
}

interface PageHeroProps {
  backgroundImage?: string;
  eyebrow?: string;
  badge?: string;
  title: string;
  description?: string;
  meta?: string[];
  actions?: React.ReactNode;
  panelTitle?: string;
  panelRows?: HeroPanelRow[];
  highlights?: HeroHighlight[];
}

export const PageHero: React.FC<PageHeroProps> = ({
  backgroundImage,
  eyebrow,
  badge,
  title,
  description,
  meta = [],
  actions,
  panelTitle,
  panelRows = [],
  highlights = [],
}) => {
  const isPunchlineOnly = !actions && !description;

  return (
    <section className={`page-hero-shell ${isPunchlineOnly ? 'punchline-only' : ''}`}>
      {backgroundImage && (
        <div className="page-hero-backdrop-wrapper" aria-hidden="true">
          <img src={backgroundImage} alt="" className="page-hero-backdrop-img" />
        </div>
      )}

      <div className="page-hero-backdrop-overlay" />

      <div className="page-hero-inner">
        <div className="page-hero-content">
          <div className="page-hero-copy">
            {(eyebrow || badge) && (
              <div className="page-hero-kicker-row">
                {eyebrow && <span className="page-hero-eyebrow">{eyebrow}</span>}
                {badge ? <span className="page-hero-badge">{badge}</span> : null}
              </div>
            )}

            <h1 className="page-hero-title">{title}</h1>

            {meta.length > 0 && (
              <div className="page-hero-meta">
                {meta.map((entry) => (
                  <span key={entry} className="page-hero-meta-item">
                    {entry}
                  </span>
                ))}
              </div>
            )}

            {description ? <p className="page-hero-description">{description}</p> : null}

            {actions ? <div className="page-hero-actions">{actions}</div> : null}
          </div>

          {(panelTitle || panelRows.length > 0) && (
            <aside className="page-hero-panel">
              {panelTitle ? <span className="page-hero-panel-title">{panelTitle}</span> : null}
              <div className="page-hero-panel-rows">
                {panelRows.map((row) => (
                  <div key={row.label} className="page-hero-panel-row">
                    <span className="page-hero-panel-label">{row.label}</span>
                    <span className="page-hero-panel-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>

        {highlights.length > 0 && (
          <div className="page-hero-highlights">
            {highlights.map((highlight) => (
              <div key={highlight.label} className="page-hero-highlight-card">
                <span className="page-hero-highlight-label">{highlight.label}</span>
                <strong className="page-hero-highlight-value">{highlight.value}</strong>
                {highlight.description ? (
                  <p className="page-hero-highlight-description">{highlight.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
