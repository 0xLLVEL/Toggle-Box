'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MediaItem } from '@/types/media';

interface WatchlistContextType {
  watchlist: string[];
  savedItems: MediaItem[];
  toggleWatchlist: (item: MediaItem) => void;
  isInWatchlist: (id: string) => boolean;
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  selectedMedia: MediaItem | null;
  setSelectedMedia: (item: MediaItem | null) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<MediaItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('togglebox_watchlist');
      const storedItems = localStorage.getItem('togglebox_saved_items');
      if (stored) setWatchlist(JSON.parse(stored));
      if (storedItems) setSavedItems(JSON.parse(storedItems));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const toggleWatchlist = (item: MediaItem) => {
    const isPresent = watchlist.includes(item.id);
    let updatedList: string[];
    let updatedItems: MediaItem[];

    if (isPresent) {
      updatedList = watchlist.filter((id) => id !== item.id);
      updatedItems = savedItems.filter((it) => it.id !== item.id);
      triggerToast(`Removed "${item.title}" from Watchlist`);
    } else {
      updatedList = [...watchlist, item.id];
      updatedItems = [...savedItems.filter((it) => it.id !== item.id), item];
      triggerToast(`Added "${item.title}" to Watchlist`);
    }

    setWatchlist(updatedList);
    setSavedItems(updatedItems);

    try {
      localStorage.setItem('togglebox_watchlist', JSON.stringify(updatedList));
      localStorage.setItem('togglebox_saved_items', JSON.stringify(updatedItems));
    } catch {
      // Ignore storage errors
    }
  };

  const isInWatchlist = (id: string) => watchlist.includes(id);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        savedItems,
        toggleWatchlist,
        isInWatchlist,
        toastMessage,
        triggerToast,
        selectedMedia,
        setSelectedMedia,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
