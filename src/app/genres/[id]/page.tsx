'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getGenreResults, type GenrePageData } from '@/services/tmdb';
import { Navbar } from '@/components/Navbar';
import { MediaRow } from '@/components/MediaRow';
import { Footer } from '@/components/Footer';
import { Toast } from '@/components/Toast';
import { useWatchlist } from '@/context/WatchlistContext';
import { GenreBanner } from '@/components/GenreBanner';



export default function GenrePage() {
  const params = useParams();
  const router  = useRouter();
  const slug =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : '';

  const { watchlist, toggleWatchlist, toastMessage } = useWatchlist();

  const [data, setData]           = useState<GenrePageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setNotFound(false);
    setData(null);

    getGenreResults(slug)
      .then((result) => {
        if (!result) setNotFound(true);
        else setData(result);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  return (
    <div className="toggle-box-app">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        watchlistCount={watchlist.length}
      />

      <main className="main-content">
        {isLoading ? (
          <div className="loading-skeleton-container">
            {/* Heading skeleton */}
            <div className="genre-heading-skeleton" />
            {[1, 2].map((n) => (
              <div key={n} className="skeleton-row">
                <div className="skeleton-title" />
                <div className="skeleton-cards">
                  {[1, 2, 3, 4, 5, 6].map((m) => (
                    <div key={m} className="skeleton-card" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : notFound ? (
          <div className="catalog-empty-state">
            <p className="catalog-empty-icon">🎭</p>
            <h3 className="catalog-empty-title">Genre not found</h3>
            <p className="catalog-empty-copy">
              &ldquo;{slug}&rdquo; isn&apos;t a known category. Pick one from the ⊞ menu.
            </p>
            <button
              type="button"
              className="home-empty-action"
              onClick={() => router.push('/')}
            >
              Back to Home
            </button>
          </div>
        ) : data ? (
          <>
            {/* SVG Genre Banner */}
            <div className="genre-banner-wrap">
              <GenreBanner slug={slug} label={data.label} />
            </div>

            {data.movieRow.items.length > 0 && (
              <MediaRow
                row={data.movieRow}
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onSelectMedia={(item) => router.push(`/detail/${item.id}`)}
              />
            )}

            {data.tvRow.items.length > 0 && (
              <MediaRow
                row={data.tvRow}
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onSelectMedia={(item) => router.push(`/detail/${item.id}`)}
              />
            )}
          </>
        ) : null}
      </main>

      <Footer />
      <Toast message={toastMessage} />
    </div>
  );
}
