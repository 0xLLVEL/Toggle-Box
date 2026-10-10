'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDownIcon } from './Icons';

interface LanguageSelectorProps {
  /** `bar` renders the compact navbar trigger, `button` the wider footer trigger. */
  variant?: 'bar' | 'button';
  /** Aligns the panel against its trigger. */
  align?: 'right' | 'left';
  className?: string;
}

const OPTION_ID_PREFIX = 'language-option';

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'bar',
  align = 'right',
  className = '',
}) => {
  const { languages, language, setLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setActiveIndex(0);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    setActiveIndex(Math.max(0, languages.findIndex((lang) => lang.code === language.code)));
  }, [language.code, languages]);

  // Dismiss on outside click and Escape, matching the other navbar dropdowns.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  // Move focus into the list so keyboard users can navigate immediately.
  useEffect(() => {
    if (isOpen) listRef.current?.focus();
  }, [isOpen]);

  // Keep the highlighted option inside the scroll viewport.
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const option = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
    option?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const handleSelect = (code: string) => {
    setLanguage(code);
    closeMenu(true);
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const lastIndex = languages.length - 1;

    // Read the grid's live column count so arrow keys move correctly across
    // both the 3-column desktop grid and the 2-column mobile sheet.
    const columnCount = () => {
      const style = listRef.current ? getComputedStyle(listRef.current) : null;
      const tracks = style?.gridTemplateColumns?.split(' ').filter(Boolean) ?? [];
      return Math.max(1, tracks.length);
    };

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setActiveIndex((prev) => (prev >= lastIndex ? 0 : prev + 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? lastIndex : prev - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(lastIndex, prev + columnCount()));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - columnCount()));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(lastIndex);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect(languages[activeIndex].code);
        break;
      default:
        break;
    }
  };

  return (
    <div className="lang-dropdown-wrapper" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`lang-trigger lang-trigger-${variant}${isOpen ? ' is-open' : ''} ${className}`.trim()}
        onClick={() => (isOpen ? closeMenu(true) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Language: ${language.native}. Select a language`}
        title="Select Language"
      >
        <span className="lang-trigger-code">{language.code}</span>
        <ChevronDownIcon size={12} className="lang-trigger-caret" />
      </button>

      {isOpen && (
        <div
          className={`lang-panel lang-panel-${align}`}
          id="language-listbox"
          role="listbox"
          aria-label="Select a language"
          tabIndex={-1}
          ref={listRef}
          onKeyDown={handleListKeyDown}
        >
          {languages.map((lang, index) => {
            const isSelected = lang.code === language.code;
            const isActive = index === activeIndex;

            return (
              <button
                key={lang.code}
                id={`${OPTION_ID_PREFIX}-${lang.code}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-active={isActive}
                dir={lang.rtl ? 'rtl' : 'ltr'}
                className={`lang-option${isSelected ? ' is-selected' : ''}${
                  isActive ? ' is-active' : ''
                }`}
                onClick={() => handleSelect(lang.code)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="lang-option-native">{lang.native}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
