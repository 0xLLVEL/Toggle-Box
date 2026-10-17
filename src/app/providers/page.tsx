'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { useProviders } from '@/context/ProviderContext';
import { useWatchlist } from '@/context/WatchlistContext';
import type { ZangetsuSource } from '@/types/provider';
import {
  PuzzleIcon,
  SearchIcon,
  CloseIcon,
  PlusIcon,
} from '@/components/Icons';

export default function ProvidersPage() {
  const { watchlist } = useWatchlist();
  const {
    availableProviders,
    installedProviders,
    isLoadingManifest,
    installProvider,
    uninstallProvider,
    toggleProvider,
    addCustomRepo,
  } = useProviders();

  const [activeFilter, setActiveFilter] = useState<'all' | 'anime' | 'movie' | 'installed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [repoUrlInput, setRepoUrlInput] = useState('');
  const [repoError, setRepoError] = useState('');
  const [isAddingRepo, setIsAddingRepo] = useState(false);

  // Connection testing state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; msg: string }>>({});

  const activeCount = useMemo(
    () => installedProviders.filter((p) => p.isEnabled).length,
    [installedProviders]
  );

  // Filtered providers
  const filteredSources = useMemo(() => {
    return availableProviders.filter((source) => {
      if (activeFilter === 'anime' && source.type !== 'anime') return false;
      if (activeFilter === 'movie' && source.type !== 'movie' && source.type !== 'all') return false;
      if (activeFilter === 'installed') {
        const isInst = installedProviders.some((p) => p.id === source.id);
        if (!isInst) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          source.name.toLowerCase().includes(q) ||
          source.lang.toLowerCase().includes(q) ||
          source.type.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [availableProviders, installedProviders, activeFilter, searchQuery]);

  const handleTestConnection = async (source: ZangetsuSource) => {
    setTestingId(source.id);
    setTestResults((prev) => ({
      ...prev,
      [source.id]: { success: false, msg: 'Testing scraper...' },
    }));

    try {
      const testTerm = source.type === 'anime' ? 'One Piece' : 'Inception';
      const res = await fetch('/api/providers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: source.id,
          method: 'search',
          args: [testTerm, 1],
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.result) && data.result.length > 0) {
        setTestResults((prev) => ({
          ...prev,
          [source.id]: {
            success: true,
            msg: `Online • Found ${data.result.length} streams`,
          },
        }));
      } else if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [source.id]: {
            success: true,
            msg: 'Online • Scraper responding',
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [source.id]: {
            success: false,
            msg: data.error || 'Server error',
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [source.id]: { success: false, msg: err.message || 'Connection failed' },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleAddRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrlInput.trim()) return;

    setIsAddingRepo(true);
    setRepoError('');

    const ok = await addCustomRepo(repoUrlInput.trim());
    setIsAddingRepo(false);

    if (ok) {
      setShowAddRepoModal(false);
      setRepoUrlInput('');
    } else {
      setRepoError('Could not fetch manifest. Make sure it points to a valid index.json.');
    }
  };

  const handleInstallAll = () => {
    availableProviders.forEach((p) => {
      if (!installedProviders.some((inst) => inst.id === p.id)) {
        installProvider(p);
      }
    });
  };

  return (
    <div className="toggle-box-app">
      <Navbar watchlistCount={watchlist.length} />

      {/* Cinematic Hero matching MyStuff and Category pages with backdrop */}
      <PageHero
        backgroundImage="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80"
        eyebrow="EXTENSIONS"
        badge="ZANGETSU ECOSYSTEM"
        title="Streaming Extensions"
        description="Integrate streaming scrapers from Spyou/zangetsu-providers to stream movies, series, and anime directly in Tea+. Each extension runs on-demand with direct HLS playback."
        meta={[
          `${availableProviders.length} Sources Available`,
          `${activeCount} Active Extensions`,
          'Official Zangetsu Manifest',
        ]}
        actions={
          <>
            <button
              className="modal-btn-play"
              type="button"
              onClick={handleInstallAll}
            >
              <span>Install All Extensions</span>
            </button>
            <button
              className="modal-btn-icon"
              type="button"
              onClick={() => setShowAddRepoModal(true)}
            >
              <PlusIcon size={16} />
              <span>Add Custom Repo</span>
            </button>
          </>
        }
      />

      <main className="main-content">
        {/* Filter & Search Bar — 100% Matching site filter bar */}
        <div className="filter-bar-container" style={{ padding: '0 0 1.5rem 0' }}>
          <div className="filter-bar-inner">
            <div className="filter-genre-scroll-wrap">
              <div className="filter-pills-list">
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'all' ? 'filter-pill-active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All Sources ({availableProviders.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'anime' ? 'filter-pill-active' : ''}`}
                  onClick={() => setActiveFilter('anime')}
                >
                  Anime ({availableProviders.filter((p) => p.type === 'anime').length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'movie' ? 'filter-pill-active' : ''}`}
                  onClick={() => setActiveFilter('movie')}
                >
                  Movies & Series (
                  {
                    availableProviders.filter(
                      (p) => p.type === 'movie' || p.type === 'all'
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'installed' ? 'filter-pill-active' : ''}`}
                  onClick={() => setActiveFilter('installed')}
                >
                  Installed ({installedProviders.length})
                </button>
              </div>
            </div>

            <div className="filter-controls-right">
              <div className="providers-search-input-wrap">
                <SearchIcon size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter by name, language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="providers-search-field"
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    type="button"
                  >
                    <CloseIcon size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Extensions Cards Grid */}
        {isLoadingManifest ? (
          <div className="loading-skeleton-container" style={{ padding: '2rem 0' }}>
            <div className="skeleton-row">
              <div className="skeleton-title" />
              <div className="skeleton-cards">
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <div key={m} className="skeleton-card" />
                ))}
              </div>
            </div>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="catalog-empty-state">
            <h3 className="catalog-empty-title">No extensions match your filter</h3>
            <p className="catalog-empty-copy">
              Try switching tabs or clear your search query to view all available providers.
            </p>
            <button
              className="home-empty-action"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              type="button"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="extensions-cards-grid">
            {filteredSources.map((source) => {
              const installed = installedProviders.find((p) => p.id === source.id);
              const isInstalled = !!installed;
              const isEnabled = installed?.isEnabled ?? false;
              const isTesting = testingId === source.id;
              const testResult = testResults[source.id];

              return (
                <div
                  key={source.id}
                  className={`extension-item-card ${isInstalled ? 'installed' : ''}`}
                >
                  <div className="extension-card-header">
                    <div className="extension-icon-box">
                      <img
                        src={source.logo}
                        alt={source.name}
                        className="extension-icon-img"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="extension-icon-fallback">
                        <PuzzleIcon size={18} />
                      </div>
                    </div>

                    <div className="extension-header-meta">
                      <div className="extension-name-row">
                        <h3 className="extension-name">{source.name}</h3>
                        <span className="extension-version">v{source.version}</span>
                      </div>
                      <div className="extension-tags-row">
                        <span className="extension-tag-pill">{source.type.toUpperCase()}</span>
                        <span className="extension-tag-pill">{source.lang.toUpperCase()}</span>
                        {isInstalled && (
                          <span
                            className={`extension-status-dot ${
                              isEnabled ? 'active' : 'disabled'
                            }`}
                          >
                            {isEnabled ? 'Active' : 'Disabled'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle switch for installed extensions */}
                    {isInstalled && (
                      <label className="extension-toggle-switch" title={isEnabled ? 'Disable' : 'Enable'}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleProvider(source.id)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    )}
                  </div>

                  <p className="extension-description">
                    {source.description || `${source.name} streaming provider extension.`}
                  </p>

                  {/* Test Status feedback */}
                  {testResult && (
                    <div
                      className={`extension-test-status ${
                        testResult.success ? 'success' : 'failed'
                      }`}
                    >
                      {testResult.msg}
                    </div>
                  )}

                  <div className="extension-card-actions">
                    {isInstalled ? (
                      <>
                        <button
                          className="filter-pill"
                          onClick={() => handleTestConnection(source)}
                          disabled={isTesting}
                          type="button"
                          style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                        >
                          {isTesting ? 'Testing...' : 'Test Scraper'}
                        </button>
                        <button
                          className="extension-remove-btn"
                          onClick={() => uninstallProvider(source.id)}
                          type="button"
                        >
                          Uninstall
                        </button>
                      </>
                    ) : (
                      <button
                        className="modal-btn-play"
                        onClick={() => installProvider(source)}
                        type="button"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                      >
                        <PlusIcon size={15} />
                        <span>Install Extension</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Custom Repo Modal */}
      {showAddRepoModal && (
        <div className="modal-backdrop" onClick={() => setShowAddRepoModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowAddRepoModal(false)}
              aria-label="Close"
              type="button"
            >
              <CloseIcon size={18} />
            </button>

            <div style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
                Add Custom Manifest
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Provide a raw URL pointing to an <code>index.json</code> provider repository:
              </p>

              <form onSubmit={handleAddRepoSubmit}>
                <input
                  type="url"
                  placeholder="https://raw.githubusercontent.com/.../index.json"
                  value={repoUrlInput}
                  onChange={(e) => setRepoUrlInput(e.target.value)}
                  required
                  className="providers-search-field"
                  style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '8px' }}
                />

                {repoError && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem' }}>
                    {repoError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="filter-pill"
                    onClick={() => setShowAddRepoModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn-play"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
                    disabled={isAddingRepo || !repoUrlInput.trim()}
                  >
                    <span>{isAddingRepo ? 'Verifying...' : 'Add Manifest'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
