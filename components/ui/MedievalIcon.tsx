import React, { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

export type MedievalIconName =
  | 'grid-sigil'
  | 'coin-purse'
  | 'upgrade-scroll'
  | 'reset-wheel'
  | 'chronicle'
  | 'hourglass'
  | 'blast-rune'
  | 'artisan-hammer'
  | 'dragon-fire'
  | 'tower'
  | 'horn';

interface MedievalIconProps {
  name: MedievalIconName;
  size?: number;
  color?: string;
  accentColor?: string;
}

const icons: Record<MedievalIconName, (color: string, accent: string) => string> = {
  'grid-sigil': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <rect x="18" y="18" width="28" height="28" rx="6" fill="none" stroke="${color}" stroke-width="4" />
      <path d="M32 18v28M18 32h28" stroke="${color}" stroke-width="4" stroke-linecap="round" />
      <circle cx="32" cy="32" r="4" fill="${color}" />
    </svg>
  `,
  'coin-purse': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M20 20h24l4-6-4-6H20l-4 6z" fill="${color}" />
      <path d="M18 26c-6 4-10 11-10 18 0 11 11 19 24 19s24-8 24-19c0-7-4-14-10-18H18z" fill="${color}" opacity="0.95" />
      <path d="M24 22h16" stroke="#2d1a0c" stroke-width="3" stroke-linecap="round" opacity="0.45" />
      <circle cx="32" cy="40" r="6" fill="${accent}" stroke="#2d1a0c" stroke-width="2" opacity="0.6" />
    </svg>
  `,
  'upgrade-scroll': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M18 22c0-4 3-7 7-7h14c4 0 7 3 7 7v20c0 4-3 7-7 7h-2.5c-1.5 0-2.5-1-2.5-2.5s-1-2.5-2.5-2.5H25c-4 0-7-3-7-7V22z" fill="${color}" />
      <path d="M22 24h20M22 32h16M22 40h14" stroke="#2d1a0c" stroke-width="3" stroke-linecap="round" opacity="0.35" />
      <path d="M43 18c3 0 5 2 5 5s-2 5-5 5" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M21 18c-3 0-5 2-5 5s2 5 5 5" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none" />
    </svg>
  `,
  'reset-wheel': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M23 41c-4-4-4-11 0-15 4-4 11-4 15 0l3 3" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M41 23c4 4 4 11 0 15-4 4-11 4-15 0l-3-3" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M22 23 18 28 16 16" fill="${color}" />
      <path d="M42 41 46 36 48 48" fill="${color}" />
    </svg>
  `,
  'chronicle': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M20 18h18c6 0 10 4 10 10v20H28c-4 0-6 2-6 6V24c0-3 2-6 6-6z" fill="${color}" />
      <path d="M24 26h16M24 34h12" stroke="#2d1a0c" stroke-width="3" stroke-linecap="round" opacity="0.35" />
      <path d="M18 46h6" stroke="${color}" stroke-width="4" stroke-linecap="round" />
    </svg>
  `,
  'hourglass': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <rect x="20" y="16" width="24" height="6" rx="3" fill="${color}" />
      <rect x="20" y="42" width="24" height="6" rx="3" fill="${color}" />
      <path d="M24 22c0 7 8 11 8 18s-8 11-8 18" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M40 22c0 7-8 11-8 18s8 11 8 18" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M26 38h12l-6-8z" fill="${color}" opacity="0.75" />
    </svg>
  `,
  'blast-rune': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M32 10 36 26h16L38 36l4 16-10-8-10 8 4-16-14-10h16z" fill="${color}" />
      <circle cx="32" cy="32" r="5" fill="${accent}" opacity="0.8" />
    </svg>
  `,
  'artisan-hammer': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <rect x="18" y="18" width="28" height="12" rx="4" fill="${color}" />
      <rect x="29" y="26" width="6" height="22" rx="3" fill="${color}" opacity="0.85" />
      <rect x="29" y="28" width="6" height="18" rx="2" fill="#f3e4c4" opacity="0.6" />
      <path d="M32 48l10 10" stroke="${color}" stroke-width="4" stroke-linecap="round" />
    </svg>
  `,
  'dragon-fire': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M32 14c8 6 14 14 14 22 0 9-6 16-14 20-8-4-14-11-14-20 0-8 6-16 14-22z" fill="${color}" />
      <path d="M36 24c2 5-1 11-5 13 0 0 4-1 6 3 2 4-1 8-5 10-4-2-7-6-6-10 1-4 4-5 4-5-2-3-1-7 2-9 3-2 6-1 6-1z" fill="#f3e4c4" opacity="0.45" />
    </svg>
  `,
  'tower': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M24 14h16l2 6-4 4H26l-4-4z" fill="${color}" />
      <rect x="20" y="24" width="24" height="24" rx="3" fill="${color}" />
      <rect x="26" y="30" width="12" height="10" rx="2" fill="#f3e4c4" opacity="0.55" />
      <path d="M18 48h28v6H18z" fill="${color}" />
    </svg>
  `,
  'horn': (color, accent) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="${accent}" />
      <path d="M22 26c10-6 22-6 26 6 1 4-1 10-6 12" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M18 28c0 8 4 14 10 16" stroke="${color}" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <circle cx="20" cy="32" r="4" fill="${color}" />
      <path d="M22 42c2 2 6 4 10 4" stroke="#f3e4c4" stroke-width="3" stroke-linecap="round" opacity="0.5" />
    </svg>
  `,
};

const MedievalIconComponent: React.FC<MedievalIconProps> = ({
  name,
  size = 32,
  color = '#5e3b1a',
  accentColor = '#f8d9a0',
}) => {
  const xmlFactory = icons[name];
  const xml = useMemo(() => (xmlFactory ? xmlFactory(color, accentColor) : null), [xmlFactory, color, accentColor]);

  if (!xml) {
    return null;
  }

  return <SvgXml xml={xml} width={size} height={size} />;
};

export const MedievalIcon = memo(MedievalIconComponent);
