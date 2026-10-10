import React from 'react';

export const ToggleBoxLogo: React.FC<{ className?: string; height?: number }> = ({
  className = '',
  height = 28,
}) => (
  <svg
    height={height}
    viewBox="0 0 174 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`toggle-box-logo ${className}`}
    aria-label="Toggle Box Logo"
  >
    <defs>
      {/* Box surface - sleek obsidian gradient */}
      <linearGradient id="tbBoxBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22242b" />
        <stop offset="100%" stopColor="#08080a" />
      </linearGradient>

      {/* Metallic chrome border */}
      <linearGradient id="tbBoxBorder" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
        <stop offset="50%" stopColor="rgba(255, 255, 255, 0.12)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.35)" />
      </linearGradient>

      {/* Active knob - platinum white gradient */}
      <linearGradient id="tbKnobGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d1d5db" />
      </linearGradient>

      {/* Active energy conduit glow */}
      <linearGradient id="tbTrackGlow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.06)" />
      </linearGradient>

      {/* Knob depth drop-shadow */}
      <filter id="tbKnobShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.75" />
      </filter>
    </defs>

    {/* ================= ICON MARK (THE TOGGLE BOX) ================= */}
    <g className="tb-logo-icon">
      {/* Outer Squircle Box */}
      <rect
        className="tb-logo-box"
        x="1.5"
        y="1.5"
        width="31"
        height="31"
        rx="8"
        fill="url(#tbBoxBg)"
        stroke="url(#tbBoxBorder)"
        strokeWidth="1.2"
      />

      {/* Curved glass glint highlight */}
      <path
        d="M 6 6 Q 17 3.5 28 6"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner Track (pill) */}
      <rect
        x="5.5"
        y="10.5"
        width="23"
        height="13"
        rx="6.5"
        fill="#000000"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
      />

      {/* Active Energy Fill in Track */}
      <rect
        x="6.5"
        y="11.5"
        width="14"
        height="11"
        rx="5.5"
        fill="url(#tbTrackGlow)"
      />

      {/* Power indicator spark dot */}
      <circle cx="11" cy="17" r="1.4" fill="#ffffff" opacity="0.85" />

      {/* Active Sliding Knob */}
      <circle
        className="tb-logo-knob"
        cx="22"
        cy="17"
        r="4.8"
        fill="url(#tbKnobGrad)"
        filter="url(#tbKnobShadow)"
      />

      {/* Embedded Play Arrow (▶) in Knob */}
      <polygon
        points="21,14.8 24.5,17 21,19.2"
        fill="#050507"
      />
    </g>

    {/* ================= WORDMARK ================= */}
    {/* "TOGGLE" Bold Sans */}
    <text
      x="44"
      y="23.5"
      fill="#ffffff"
      fontFamily="var(--font-outfit), 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="900"
      fontSize="19"
      letterSpacing="-0.03em"
    >
      TOGGLE
    </text>

    {/* "BOX" Streaming Pill Badge */}
    <g className="tb-logo-badge">
      <rect
        className="tb-logo-badge-rect"
        x="124"
        y="6.5"
        width="46"
        height="21"
        rx="5.5"
        fill="rgba(255, 255, 255, 0.08)"
        stroke="rgba(255, 255, 255, 0.28)"
        strokeWidth="1"
      />
      <text
        x="147"
        y="21"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="var(--font-outfit), 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="11"
        letterSpacing="0.12em"
      >
        BOX
      </text>
    </g>
  </svg>
);

export const SearchIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const GridAppsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="3" y="3" width="4" height="4" rx="1" />
    <rect x="10" y="3" width="4" height="4" rx="1" />
    <rect x="17" y="3" width="4" height="4" rx="1" />
    <rect x="3" y="10" width="4" height="4" rx="1" />
    <rect x="10" y="10" width="4" height="4" rx="1" />
    <rect x="17" y="10" width="4" height="4" rx="1" />
    <rect x="3" y="17" width="4" height="4" rx="1" />
    <rect x="10" y="17" width="4" height="4" rx="1" />
    <rect x="17" y="17" width="4" height="4" rx="1" />
  </svg>
);

export const UserIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" clipRule="evenodd" />
  </svg>
);

export const ChevronDownIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ChevronRightIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ChevronLeftIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const PlayIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const PlusIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const CheckIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const ThumbsUpIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

export const CloseIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const VolumeHighIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const VolumeMuteIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

/** Small Amazon-style gold bag badge used across cards and hero labels */
export const ToggleGoldBadgeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M8.35 9.2V8.35C8.35 6.22 10.02 4.55 12.1 4.55C14.18 4.55 15.85 6.22 15.85 8.35V9.2"
      stroke="#FFD86A"
      strokeWidth="1.85"
      strokeLinecap="round"
    />
    <path
      d="M6.55 9.35H17.45C18.01 9.35 18.43 9.86 18.32 10.41L17.45 14.78C17.28 15.65 16.51 16.28 15.63 16.28H8.37C7.49 16.28 6.72 15.65 6.55 14.78L5.68 10.41C5.57 9.86 5.99 9.35 6.55 9.35Z"
      fill="#E6A10E"
    />
    <path
      d="M7.25 9.95H16.75L16.15 13.9C16.03 14.67 15.37 15.23 14.59 15.23H9.41C8.63 15.23 7.97 14.67 7.85 13.9L7.25 9.95Z"
      fill="#F6C13B"
      fillOpacity="0.92"
    />
    <path
      d="M7.15 9.7H16.85"
      stroke="#FFE8A0"
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeOpacity="0.95"
    />
    <path
      d="M9.15 12.15C9.92 12.73 10.9 13.03 12 13.03C13.1 13.03 14.08 12.73 14.85 12.15"
      stroke="#FFF2C4"
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeOpacity="0.95"
    />
    <path
      d="M6.55 9.35H17.45C18.01 9.35 18.43 9.86 18.32 10.41L17.45 14.78C17.28 15.65 16.51 16.28 15.63 16.28H8.37C7.49 16.28 6.72 15.65 6.55 14.78L5.68 10.41C5.57 9.86 5.99 9.35 6.55 9.35Z"
      stroke="#C98605"
      strokeWidth="0.7"
      strokeLinejoin="round"
      strokeOpacity="0.8"
    />
  </svg>
);

export const RefreshIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const InfoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const ThumbsDownIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);

export const ShareIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const ClapperboardIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" />
  </svg>
);

export const GlobeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const SettingsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const BookmarkIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const HelpIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const LogoutIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SparklesIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3l1.912 5.888L19.8 10.8l-5.888 1.912L12 18.6l-1.912-5.888L4.2 10.8l5.888-1.912L12 3z" />
  </svg>
);
