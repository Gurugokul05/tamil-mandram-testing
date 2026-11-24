import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.resolve(__dirname, '../../public/media');

const palettes = [
  { bg1: '#3B0A16', bg2: '#7A1F2B', accent: '#E7C873', ink: '#FFF6E5' },
  { bg1: '#2A0C12', bg2: '#5C1A26', accent: '#D9A441', ink: '#FBEFD8' },
  { bg1: '#4A1220', bg2: '#8C2A38', accent: '#F0D9A0', ink: '#FFF3E0' },
  { bg1: '#310B14', bg2: '#66202E', accent: '#CBA24E', ink: '#FDF1DC' },
];

const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const kolam = (color, opacity) => `
  <g stroke="${color}" stroke-width="1.5" fill="none" opacity="${opacity}">
    <circle cx="0" cy="0" r="46"/>
    <circle cx="0" cy="0" r="86" stroke-dasharray="4 10"/>
    <circle cx="0" cy="0" r="124" stroke-dasharray="1 14"/>
    <path d="M-46 0 A46 46 0 0 1 0 -46 A46 46 0 0 1 46 0 A46 46 0 0 1 0 46 A46 46 0 0 1 -46 0Z"/>
    <path d="M0 -86 L0 86 M-86 0 L86 0"/>
    <circle cx="61" cy="61" r="4" fill="${color}" stroke="none"/>
    <circle cx="-61" cy="61" r="4" fill="${color}" stroke="none"/>
    <circle cx="61" cy="-61" r="4" fill="${color}" stroke="none"/>
    <circle cx="-61" cy="-61" r="4" fill="${color}" stroke="none"/>
  </g>`;

const dots = (color) => `
  <pattern id="kolamDots" width="64" height="64" patternUnits="userSpaceOnUse">
    <circle cx="8" cy="8" r="2.2" fill="${color}" opacity="0.5"/>
    <circle cx="40" cy="24" r="1.4" fill="${color}" opacity="0.35"/>
    <circle cx="24" cy="48" r="1.8" fill="${color}" opacity="0.4"/>
  </pattern>`;

const poster = ({ file, glyph, titleTa, titleEn, meta, palette = 0 }) => {
  const p = palettes[palette % palettes.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${esc(titleEn)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.bg1}"/>
      <stop offset="1" stop-color="${p.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="34%" r="68%">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.42"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    ${dots(p.accent)}
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect width="800" height="1000" fill="url(#kolamDots)" opacity="0.55"/>
  <rect width="800" height="1000" fill="url(#glow)"/>
  <g transform="translate(640 240)">${kolam(p.accent, 0.45)}</g>
  <g transform="translate(120 900) scale(0.72)">${kolam(p.accent, 0.18)}</g>
  <text x="420" y="600" font-family="'Noto Sans Tamil','Latha',sans-serif" font-size="430" fill="${p.accent}" opacity="0.34" text-anchor="middle">${esc(glyph)}</text>
  <text x="72" y="92" font-family="Georgia,serif" font-size="17" letter-spacing="7" fill="${p.accent}">TAMIL MANDRAM</text>
  <line x1="72" y1="112" x2="250" y2="112" stroke="${p.accent}" stroke-width="2" opacity="0.7"/>
  <text x="728" y="92" font-family="Georgia,serif" font-size="15" letter-spacing="3" fill="${p.ink}" opacity="0.7" text-anchor="end">${esc(meta)}</text>
  <rect x="72" y="912" width="56" height="3" fill="${p.accent}"/>
  <text x="72" y="948" font-family="Georgia,serif" font-size="15" letter-spacing="2" fill="${p.ink}" opacity="0.75">மொழியால் இணைவோம்</text>
</svg>`;
};

const achievementArt = ({ file, glyph, year, palette = 0 }) => {
  const p = palettes[palette % palettes.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="Achievement">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.bg1}"/>
      <stop offset="1" stop-color="${p.bg2}"/>
    </linearGradient>
    ${dots(p.accent)}
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#kolamDots)" opacity="0.5"/>
  <g transform="translate(400 380)">${kolam(p.accent, 0.6)}</g>
  <text x="400" y="470" font-family="'Noto Sans Tamil','Latha',sans-serif" font-size="280" fill="${p.accent}" opacity="0.9" text-anchor="middle">${esc(glyph)}</text>
  <text x="400" y="744" font-family="Georgia,serif" font-size="15" letter-spacing="6" fill="${p.accent}" text-anchor="middle" opacity="0.7">TAMIL MANDRAM</text>
</svg>`;
};

export const ART_FILES = [
  { name: 'poster-muthamizh.svg', glyph: 'மு', titleTa: 'முத்தமிழ் விழா', titleEn: 'Muthamizh Vizha', meta: '14 FEB 2027', palette: 0 },
  { name: 'poster-pattimandram.svg', glyph: 'ப', titleTa: 'பட்டிமன்றம்', titleEn: 'Pattimandram', meta: '12 DEC 2026', palette: 1 },
  { name: 'poster-kavithai.svg', glyph: 'க', titleTa: 'கவிதை இரவு', titleEn: 'Kavithai Iravu', meta: '09 JAN 2027', palette: 2 },
  { name: 'poster-workshop.svg', glyph: 'எ', titleTa: 'எழுத்துப் பயிலரங்கு', titleEn: 'Writing Workshop', meta: '06 MAR 2027', palette: 3 },
  { name: 'poster-quiz.svg', glyph: 'சொ', titleTa: 'சொல்லாடல்', titleEn: 'Tamil Quiz', meta: '19 SEP 2026', palette: 1 },
  { name: 'poster-book.svg', glyph: 'நூ', titleTa: 'நூல் வெளியீடு', titleEn: 'Book Launch', meta: '08 AUG 2026', palette: 0 },
  { name: 'poster-freshers.svg', glyph: 'அ', titleTa: 'அறிமுக நிகழ்வு', titleEn: "Freshers' Meet", meta: '01 AUG 2026', palette: 2 },
];

export const ACHIEVEMENT_ART_FILES = [
  { name: 'achievement-club.svg', glyph: 'வெ', year: '2026', palette: 0 },
  { name: 'achievement-anthology.svg', glyph: 'தொ', year: '2026', palette: 1 },
  { name: 'achievement-pattimandram.svg', glyph: 'ப', year: '2025', palette: 2 },
  { name: 'achievement-reading.svg', glyph: 'வா', year: '2024', palette: 3 },
  { name: 'achievement-poetry.svg', glyph: 'க', year: '2023', palette: 0 },
];

export function generateArt() {
  fs.mkdirSync(mediaDir, { recursive: true });

  ART_FILES.forEach((item) => {
    fs.writeFileSync(path.join(mediaDir, item.name), poster(item), 'utf8');
  });

  ACHIEVEMENT_ART_FILES.forEach((item) => {
    fs.writeFileSync(path.join(mediaDir, item.name), achievementArt(item), 'utf8');
  });

  console.log(`[seed] wrote ${ART_FILES.length + ACHIEVEMENT_ART_FILES.length} artworks to public/media`);
}
