// ═══════════════════════════════════════════════════════════
// AVATAR STATE
// ═══════════════════════════════════════════════════════════
const S = {
    skin: 3, face: 0, eyeShape: 0, eyeColor: 2, brow: 0,
    nose: 0, mouth: 0, hair: 1, hairColor: 1,
    facialHair: 0, glasses: 0,
    top: 0, topColor: 0, bottom: 0, bottomColor: 0,
    shoe: 0, shoeColor: 0, acc: 0
};

// ═══════════════════════════════════════════════════════════
// COLOR PALETTES
// ═══════════════════════════════════════════════════════════
const SKIN = ['#FDEBD0', '#F5CBA7', '#EDBB99', '#D4A574', '#C68E5B', '#A0674B', '#7D4F2E', '#5C3A1E', '#3D2314'];
const EYEC = ['#2B6CB0', '#2F855A', '#4A3200', '#6B46C1', '#1A202C', '#9B8258', '#1E90FF', '#228B22'];
const HAIRC = ['#1A1A1A', '#3D2314', '#8B4513', '#CD853F', '#DAA520', '#C0392B', '#E91E90', '#4169E1', '#E8E8E8', '#FF6B00'];
const TOPC = ['#1A1A1A', '#F5F5F5', '#2D3748', '#C53030', '#2B6CB0', '#38A169', '#D69E2E', '#805AD5', '#DD6B20', '#E91E63'];
const BOTC = ['#1A202C', '#2D3748', '#4A5568', '#1A365D', '#2C5282', '#4A2C0A', '#2D2D2D', '#0F4C3A'];
const SHOC = ['#F5F5F5', '#1A1A1A', '#C53030', '#2B6CB0', '#38A169', '#D69E2E', '#805AD5', '#E91E63'];

function dk(hex, n = 25) { const h = parseInt(hex.slice(1), 16); return '#' + [h >> 16, (h >> 8) & 255, h & 255].map(c => Math.max(0, c - n).toString(16).padStart(2, '0')).join(''); }
function lt(hex, n = 25) { const h = parseInt(hex.slice(1), 16); return '#' + [h >> 16, (h >> 8) & 255, h & 255].map(c => Math.min(255, c + n).toString(16).padStart(2, '0')).join(''); }

// ═══════════════════════════════════════════════════════════
// SVG DRAWING PARTS
// ═══════════════════════════════════════════════════════════
const CX = 130, HY = 75; // center X, head Y

function drawDefs(sk) {
    return `<defs>
  <radialGradient id="sg" cx="40%" cy="35%"><stop offset="0%" stop-color="${lt(sk, 30)}"/><stop offset="100%" stop-color="${dk(sk, 15)}"/></radialGradient>
  <radialGradient id="sg2" cx="45%" cy="40%"><stop offset="0%" stop-color="${lt(sk, 15)}"/><stop offset="100%" stop-color="${dk(sk, 10)}"/></radialGradient>
  <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter>
  <filter id="sh2"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2"/></filter>
  <linearGradient id="fab" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.08)"/><stop offset="100%" stop-color="rgba(0,0,0,0.1)"/></linearGradient>
  </defs>`;
}

// BODY SHAPE
function drawBody(sk) {
    return `<path d="M${CX} 165 Q${CX} 170 ${CX - 22} 180 L${CX - 22} 175 Q${CX} 168 ${CX} 165Z" fill="url(#sg2)"/>
  <path d="M${CX} 165 Q${CX} 170 ${CX + 22} 180 L${CX + 22} 175 Q${CX} 168 ${CX} 165Z" fill="url(#sg2)"/>
  <rect x="${CX - 25}" y="172" width="50" height="18" rx="4" fill="url(#sg2)"/>`;
}

// LEGS
function drawLegs(sk) {
    return `<rect x="${CX - 22}" y="310" width="18" height="80" rx="6" fill="url(#sg2)"/>
  <rect x="${CX + 4}" y="310" width="18" height="80" rx="6" fill="url(#sg2)"/>`;
}

// FACE SHAPES
const FACES = [
    (sk) => `<ellipse cx="${CX}" cy="${HY + 30}" rx="42" ry="46" fill="url(#sg)" filter="url(#sh)"/>`,
    (sk) => `<ellipse cx="${CX}" cy="${HY + 28}" rx="38" ry="50" fill="url(#sg)" filter="url(#sh)"/>`,
    (sk) => `<rect x="${CX - 38}" y="${HY - 10}" width="76" height="85" rx="20" fill="url(#sg)" filter="url(#sh)"/>`,
    (sk) => `<path d="M${CX} ${HY - 14} C${CX + 48} ${HY - 14} ${CX + 46} ${HY + 35} ${CX + 38} ${HY + 60} Q${CX} ${HY + 78} ${CX - 38} ${HY + 60} C${CX - 46} ${HY + 35} ${CX - 48} ${HY - 14} ${CX} ${HY - 14}Z" fill="url(#sg)" filter="url(#sh)"/>`,
    (sk) => `<path d="M${CX} ${HY - 16} C${CX + 42} ${HY - 8} ${CX + 48} ${HY + 30} ${CX + 36} ${HY + 65} Q${CX} ${HY + 80} ${CX - 36} ${HY + 65} C${CX - 48} ${HY + 30} ${CX - 42} ${HY - 8} ${CX} ${HY - 16}Z" fill="url(#sg)" filter="url(#sh)"/>`,
];

// EARS
function drawEars(sk) {
    return `<ellipse cx="${CX - 42}" cy="${HY + 28}" rx="7" ry="11" fill="url(#sg)" stroke="${dk(sk, 20)}" stroke-width=".8"/>
  <ellipse cx="${CX - 43}" cy="${HY + 28}" rx="3" ry="6" fill="${dk(sk, 10)}"/>
  <ellipse cx="${CX + 42}" cy="${HY + 28}" rx="7" ry="11" fill="url(#sg)" stroke="${dk(sk, 20)}" stroke-width=".8"/>
  <ellipse cx="${CX + 43}" cy="${HY + 28}" rx="3" ry="6" fill="${dk(sk, 10)}"/>`;
}

// EYES
const EYES = [
    (c) => `<ellipse cx="${CX - 16}" cy="${HY + 25}" rx="8" ry="7" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX - 16}" cy="${HY + 25}" r="4.5" fill="${c}"/><circle cx="${CX - 16}" cy="${HY + 25}" r="2.5" fill="#111"/>
  <circle cx="${CX - 18}" cy="${HY + 23}" r="2" fill="white" opacity=".9"/>
  <ellipse cx="${CX + 16}" cy="${HY + 25}" rx="8" ry="7" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX + 16}" cy="${HY + 25}" r="4.5" fill="${c}"/><circle cx="${CX + 16}" cy="${HY + 25}" r="2.5" fill="#111"/>
  <circle cx="${CX + 14}" cy="${HY + 23}" r="2" fill="white" opacity=".9"/>`,
    (c) => `<ellipse cx="${CX - 16}" cy="${HY + 25}" rx="10" ry="6" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX - 15}" cy="${HY + 25}" r="4" fill="${c}"/><circle cx="${CX - 15}" cy="${HY + 25}" r="2" fill="#111"/>
  <circle cx="${CX - 17}" cy="${HY + 23}" r="1.5" fill="white" opacity=".9"/>
  <ellipse cx="${CX + 16}" cy="${HY + 25}" rx="10" ry="6" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX + 17}" cy="${HY + 25}" r="4" fill="${c}"/><circle cx="${CX + 17}" cy="${HY + 25}" r="2" fill="#111"/>
  <circle cx="${CX + 15}" cy="${HY + 23}" r="1.5" fill="white" opacity=".9"/>`,
    (c) => `<ellipse cx="${CX - 16}" cy="${HY + 24}" rx="11" ry="12" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX - 16}" cy="${HY + 26}" r="7" fill="${c}"/><circle cx="${CX - 16}" cy="${HY + 26}" r="4" fill="#111"/>
  <circle cx="${CX - 19}" cy="${HY + 22}" r="3" fill="white" opacity=".85"/>
  <circle cx="${CX - 13}" cy="${HY + 29}" r="1.2" fill="white" opacity=".6"/>
  <ellipse cx="${CX + 16}" cy="${HY + 24}" rx="11" ry="12" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX + 16}" cy="${HY + 26}" r="7" fill="${c}"/><circle cx="${CX + 16}" cy="${HY + 26}" r="4" fill="#111"/>
  <circle cx="${CX + 13}" cy="${HY + 22}" r="3" fill="white" opacity=".85"/>
  <circle cx="${CX + 19}" cy="${HY + 29}" r="1.2" fill="white" opacity=".6"/>`,
    (c) => `<path d="M${CX - 26} ${HY + 27} Q${CX - 16} ${HY + 18} ${CX - 6} ${HY + 27}" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX - 16}" cy="${HY + 25}" r="3" fill="${c}"/><circle cx="${CX - 16}" cy="${HY + 25}" r="1.5" fill="#111"/>
  <path d="M${CX + 6} ${HY + 27} Q${CX + 16} ${HY + 18} ${CX + 26} ${HY + 27}" fill="white" stroke="#444" stroke-width=".8"/>
  <circle cx="${CX + 16}" cy="${HY + 25}" r="3" fill="${c}"/><circle cx="${CX + 16}" cy="${HY + 25}" r="1.5" fill="#111"/>`,
    (c) => `<circle cx="${CX - 16}" cy="${HY + 25}" r="5" fill="${c}"/>
  <circle cx="${CX - 18}" cy="${HY + 23}" r="2" fill="white" opacity=".85"/>
  <circle cx="${CX + 16}" cy="${HY + 25}" r="5" fill="${c}"/>
  <circle cx="${CX + 14}" cy="${HY + 23}" r="2" fill="white" opacity=".85"/>`,
];

// EYEBROWS
const BROWS = [
    () => `<path d="M${CX - 26} ${HY + 12} Q${CX - 16} ${HY + 6} ${CX - 6} ${HY + 11}" fill="none" stroke="${HAIRC[S.hairColor]}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M${CX + 6} ${HY + 11} Q${CX + 16} ${HY + 6} ${CX + 26} ${HY + 12}" fill="none" stroke="${HAIRC[S.hairColor]}" stroke-width="2.5" stroke-linecap="round"/>`,
    () => `<path d="M${CX - 26} ${HY + 14} Q${CX - 16} ${HY + 5} ${CX - 6} ${HY + 9}" fill="none" stroke="${HAIRC[S.hairColor]}" stroke-width="3" stroke-linecap="round"/>
  <path d="M${CX + 6} ${HY + 9} Q${CX + 16} ${HY + 5} ${CX + 26} ${HY + 14}" fill="none" stroke="${HAIRC[S.hairColor]}" stroke-width="3" stroke-linecap="round"/>`,
    () => `<path d="M${CX - 26} ${HY + 10} Q${CX - 16} ${HY + 4} ${CX - 6} ${HY + 10}" fill="none" stroke="${HAIRC[S.hairColor]}" stroke-width="2" stroke-linecap="round"/>
  <path d="M${CX + 6} ${HY + 10} Q${CX + 16} ${HY + 4} ${CX + 26} ${HY + 10}" fill="none" stroke="${HAIRC[S.hairColor]}" stroke-width="2" stroke-linecap="round"/>`,
    () => `<line x1="${CX - 26}" y1="${HY + 12}" x2="${CX - 6}" y2="${HY + 12}" stroke="${HAIRC[S.hairColor]}" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="${CX + 6}" y1="${HY + 12}" x2="${CX + 26}" y2="${HY + 12}" stroke="${HAIRC[S.hairColor]}" stroke-width="2.5" stroke-linecap="round"/>`,
];

// NOSES
const NOSES = [
    () => `<path d="M${CX - 2} ${HY + 30} L${CX} ${HY + 42} L${CX + 2} ${HY + 30}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.5" stroke-linecap="round"/>
  <ellipse cx="${CX}" cy="${HY + 42}" rx="5" ry="3" fill="rgba(0,0,0,.06)" stroke="rgba(0,0,0,.12)" stroke-width=".8"/>`,
    () => `<circle cx="${CX}" cy="${HY + 40}" r="3.5" fill="rgba(0,0,0,.1)" stroke="rgba(0,0,0,.12)" stroke-width=".8"/>`,
    () => `<path d="M${CX - 1} ${HY + 28} L${CX - 1} ${HY + 40} Q${CX - 1} ${HY + 44} ${CX + 4} ${HY + 42}" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="1.5" stroke-linecap="round"/>`,
    () => `<path d="M${CX - 5} ${HY + 40} Q${CX} ${HY + 46} ${CX + 5} ${HY + 40}" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1.2" stroke-linecap="round"/>`,
    () => ``,
];

// MOUTHS
const MOUTHS = [
    () => `<path d="M${CX - 12} ${HY + 52} Q${CX} ${HY + 64} ${CX + 12} ${HY + 52}" fill="none" stroke="#B03A3A" stroke-width="2" stroke-linecap="round"/>`,
    () => `<path d="M${CX - 14} ${HY + 50} Q${CX} ${HY + 68} ${CX + 14} ${HY + 50}" fill="#C0392B" stroke="#A93226" stroke-width="1"/>
  <path d="M${CX - 10} ${HY + 51} Q${CX} ${HY + 49} ${CX + 10} ${HY + 51}" fill="${SKIN[S.skin]}"/>
  <path d="M${CX - 8} ${HY + 60} Q${CX} ${HY + 64} ${CX + 8} ${HY + 60}" fill="#E88" opacity=".6"/>`,
    () => `<line x1="${CX - 10}" y1="${HY + 54}" x2="${CX + 10}" y2="${HY + 54}" stroke="#B03A3A" stroke-width="2" stroke-linecap="round"/>`,
    () => `<path d="M${CX - 10} ${HY + 54} Q${CX} ${HY + 54} ${CX + 10} ${HY + 48}" fill="none" stroke="#B03A3A" stroke-width="2" stroke-linecap="round"/>`,
    () => `<ellipse cx="${CX}" cy="${HY + 54}" rx="5" ry="6" fill="#C0392B" stroke="#A93226" stroke-width=".8"/>`,
    () => `<path d="M${CX - 10} ${HY + 52} Q${CX - 5} ${HY + 58} ${CX} ${HY + 52} Q${CX + 5} ${HY + 58} ${CX + 10} ${HY + 52}" fill="none" stroke="#B03A3A" stroke-width="1.8" stroke-linecap="round"/>`,
];

// FACIAL HAIR
const FHAIR = [
    () => ``,
    () => { let d = ''; for (let i = 0; i < 40; i++) { const x = CX - 20 + Math.sin(i * 7.3) * 20, y = HY + 48 + Math.cos(i * 5.1) * 14; d += `<circle cx="${x}" cy="${y}" r=".8" fill="${dk(HAIRC[S.hairColor], 10)}" opacity=".5"/>`; } return d; },
    () => `<path d="M${CX - 18} ${HY + 50} Q${CX - 18} ${HY + 72} ${CX} ${HY + 78} Q${CX + 18} ${HY + 72} ${CX + 18} ${HY + 50}" fill="${HAIRC[S.hairColor]}" opacity=".55" filter="url(#sh2)"/>`,
    () => `<path d="M${CX - 22} ${HY + 46} Q${CX - 24} ${HY + 80} ${CX} ${HY + 90} Q${CX + 24} ${HY + 80} ${CX + 22} ${HY + 46}" fill="${HAIRC[S.hairColor]}" opacity=".6" filter="url(#sh2)"/>`,
    () => `<path d="M${CX - 6} ${HY + 48} Q${CX - 6} ${HY + 58} ${CX} ${HY + 60} Q${CX + 6} ${HY + 58} ${CX + 6} ${HY + 48}" fill="${HAIRC[S.hairColor]}" opacity=".6"/>`,
];

// HAIR
const HAIRS = [
    (c) => `<path d="M${CX - 44} ${HY + 10} Q${CX - 44} ${HY - 35} ${CX} ${HY - 40} Q${CX + 44} ${HY - 35} ${CX + 44} ${HY + 10} Q${CX + 40} ${HY - 20} ${CX} ${HY - 26} Q${CX - 40} ${HY - 20} ${CX - 44} ${HY + 10}Z" fill="${c}" filter="url(#sh2)"/>`,
    (c) => `<path d="M${CX - 44} ${HY + 10} Q${CX - 46} ${HY - 42} ${CX} ${HY - 48} Q${CX + 46} ${HY - 42} ${CX + 44} ${HY + 10} Q${CX + 40} ${HY - 28} ${CX} ${HY - 34} Q${CX - 40} ${HY - 28} ${CX - 44} ${HY + 10}Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX - 18} ${HY - 30} Q${CX - 10} ${HY - 55} ${CX + 15} ${HY - 42} Q${CX + 5} ${HY - 32} ${CX - 18} ${HY - 30}Z" fill="${c}"/>`,
    (c) => `<path d="M${CX - 44} ${HY + 10} Q${CX - 48} ${HY - 38} ${CX} ${HY - 42} Q${CX + 44} ${HY - 38} ${CX + 44} ${HY + 10} Q${CX + 40} ${HY - 24} ${CX} ${HY - 30} Q${CX - 40} ${HY - 24} ${CX - 44} ${HY + 10}Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX - 42} ${HY} Q${CX - 44} ${HY - 18} ${CX - 28} ${HY - 26}" fill="none" stroke="${dk(c, 20)}" stroke-width="1.5"/>`,
    (c) => `<path d="M${CX - 48} ${HY + 10} Q${CX - 50} ${HY - 38} ${CX} ${HY - 44} Q${CX + 50} ${HY - 38} ${CX + 48} ${HY + 10} L${CX + 48} ${HY + 70} Q${CX + 35} ${HY + 85} ${CX} ${HY + 88} Q${CX - 35} ${HY + 85} ${CX - 48} ${HY + 70}Z" fill="${c}" filter="url(#sh2)"/>
  <ellipse cx="${CX}" cy="${HY + 30}" rx="40" ry="44" fill="url(#sg)"/>`,
    (c) => {
        let d = ''; const pts = [[CX - 28, HY - 20], [CX - 10, HY - 32], [CX + 8, HY - 34], [CX + 26, HY - 22], [CX + 38, HY - 6], [CX + 42, HY + 10], [CX - 42, HY + 10], [CX - 38, HY - 6]];
        pts.forEach(([x, y]) => d += `<circle cx="${x}" cy="${y}" r="16" fill="${c}"/>`); return `<g filter="url(#sh2)">${d}</g>`;
    },
    (c) => `<path d="M${CX - 42} ${HY + 8} Q${CX - 42} ${HY - 32} ${CX} ${HY - 36} Q${CX + 42} ${HY - 32} ${CX + 42} ${HY + 8} Q${CX + 38} ${HY - 18} ${CX} ${HY - 24} Q${CX - 38} ${HY - 18} ${CX - 42} ${HY + 8}Z" fill="${c}" opacity=".6"/>`,
    (c) => `<path d="M${CX - 8} ${HY - 20} Q${CX - 5} ${HY - 60} ${CX} ${HY - 65} Q${CX + 5} ${HY - 60} ${CX + 8} ${HY - 20} Q${CX + 4} ${HY - 30} ${CX} ${HY - 32} Q${CX - 4} ${HY - 30} ${CX - 8} ${HY - 20}Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX - 42} ${HY + 8} Q${CX - 42} ${HY - 30} ${CX} ${HY - 34} Q${CX + 42} ${HY - 30} ${CX + 42} ${HY + 8} Q${CX + 38} ${HY - 16} ${CX} ${HY - 22} Q${CX - 38} ${HY - 16} ${CX - 42} ${HY + 8}Z" fill="${c}" opacity=".35"/>`,
    () => ``,
    (c) => `<path d="M${CX - 48} ${HY + 10} Q${CX - 50} ${HY - 38} ${CX} ${HY - 44} Q${CX + 50} ${HY - 38} ${CX + 48} ${HY + 10} L${CX + 46} ${HY + 95} Q${CX} ${HY + 120} ${CX - 46} ${HY + 95}Z" fill="${c}" filter="url(#sh2)"/>
  <ellipse cx="${CX}" cy="${HY + 30}" rx="40" ry="44" fill="url(#sg)"/>`,
    (c) => `<path d="M${CX - 44} ${HY + 5} Q${CX - 44} ${HY - 35} ${CX} ${HY - 40} Q${CX + 44} ${HY - 35} ${CX + 44} ${HY + 5}" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round" filter="url(#sh2)"/>`,
];

// TOPS (clothing)
const TOPS = [
    (c) => `<path d="M${CX - 42} 190 L${CX - 55} 200 L${CX - 55} 310 L${CX + 55} 310 L${CX + 55} 200 L${CX + 42} 190 Q${CX} 185 ${CX - 42} 190Z" fill="${c}" filter="url(#sh)"/>
  <path d="M${CX - 42} 190 L${CX - 55} 200 L${CX - 55} 310 L${CX + 55} 310 L${CX + 55} 200 L${CX + 42} 190 Q${CX} 185 ${CX - 42} 190Z" fill="url(#fab)"/>
  <path d="M${CX - 20} 190 Q${CX} 200 ${CX + 20} 190" fill="none" stroke="${dk(c, 20)}" stroke-width="1.5"/>`,
    (c) => `<path d="M${CX - 42} 190 L${CX - 65} 210 L${CX - 60} 280 L${CX - 55} 310 L${CX + 55} 310 L${CX + 60} 280 L${CX + 65} 210 L${CX + 42} 190 Q${CX} 185 ${CX - 42} 190Z" fill="${c}" filter="url(#sh)"/>
  <path d="M${CX - 42} 190 L${CX - 65} 210 L${CX - 60} 280 L${CX - 55} 310 L${CX + 55} 310 L${CX + 60} 280 L${CX + 65} 210 L${CX + 42} 190Z" fill="url(#fab)"/>
  <path d="M${CX - 20} 190 Q${CX} 200 ${CX + 20} 190" fill="none" stroke="${dk(c, 20)}" stroke-width="1.5"/>
  <text x="${CX}" y="258" text-anchor="middle" font-size="11" font-weight="800" fill="${lt(c, 60)}" font-family="sans-serif" opacity=".7">NIKE</text>`,
    (c) => `<path d="M${CX - 42} 190 L${CX - 70} 215 L${CX - 65} 310 L${CX + 65} 310 L${CX + 70} 215 L${CX + 42} 190 Q${CX} 185 ${CX - 42} 190Z" fill="${c}" filter="url(#sh)"/>
  <path d="M${CX - 42} 190 L${CX - 70} 215 L${CX - 65} 310 L${CX + 65} 310 L${CX + 70} 215 L${CX + 42} 190Z" fill="url(#fab)"/>
  <rect x="${CX - 20}" y="192" width="40" height="118" rx="2" fill="${dk(c, 15)}"/>
  <path d="M${CX - 20} 190 Q${CX} 200 ${CX + 20} 190" fill="none" stroke="${dk(c, 25)}" stroke-width="1.5"/>
  <circle cx="${CX}" cy="230" r="4" fill="none" stroke="${lt(c, 40)}" stroke-width="1"/>
  <circle cx="${CX}" cy="250" r="4" fill="none" stroke="${lt(c, 40)}" stroke-width="1"/>
  <circle cx="${CX}" cy="270" r="4" fill="none" stroke="${lt(c, 40)}" stroke-width="1"/>`,
    (c) => `<path d="M${CX - 42} 190 L${CX - 68} 215 L${CX - 65} 310 L${CX + 65} 310 L${CX + 68} 215 L${CX + 42} 190 Q${CX} 185 ${CX - 42} 190Z" fill="${c}" filter="url(#sh)"/>
  <path d="M${CX - 42} 190 L${CX - 68} 215 L${CX - 65} 310 L${CX + 65} 310 L${CX + 68} 215 L${CX + 42} 190Z" fill="url(#fab)"/>
  <path d="M${CX - 22} 190 Q${CX} 206 ${CX + 22} 190" fill="none" stroke="${dk(c, 20)}" stroke-width="2"/>
  <path d="M${CX - 18} 192 L${CX - 18} 310" fill="none" stroke="${dk(c, 12)}" stroke-width="1.5"/>
  <text x="${CX}" y="260" text-anchor="middle" font-size="9" font-weight="800" fill="${lt(c, 50)}" font-family="sans-serif" opacity=".6">ADIDAS</text>
  <line x1="${CX - 12}" y1="266" x2="${CX + 12}" y2="266" stroke="${lt(c, 40)}" stroke-width="1" opacity=".5"/>
  <line x1="${CX - 10}" y1="270" x2="${CX + 10}" y2="270" stroke="${lt(c, 40)}" stroke-width="1" opacity=".4"/>
  <line x1="${CX - 8}" y1="274" x2="${CX + 8}" y2="274" stroke="${lt(c, 40)}" stroke-width="1" opacity=".3"/>`,
    (c) => `<path d="M${CX - 42} 190 L${CX - 55} 200 L${CX - 55} 310 L${CX + 55} 310 L${CX + 55} 200 L${CX + 42} 190 Q${CX} 185 ${CX - 42} 190Z" fill="${c}" filter="url(#sh)"/>
  <path d="M${CX - 42} 190 L${CX - 55} 200 L${CX - 55} 310 L${CX + 55} 310 L${CX + 55} 200 L${CX + 42} 190Z" fill="url(#fab)"/>
  <text x="${CX}" y="248" text-anchor="middle" font-size="16" font-weight="800" fill="${lt(c, 70)}" font-family="sans-serif" opacity=".65">BAUDR</text>
  <path d="M${CX - 20} 190 Q${CX} 200 ${CX + 20} 190" fill="none" stroke="${dk(c, 20)}" stroke-width="1.5"/>`,
];

// BOTTOMS
const BOTS = [
    (c) => `<path d="M${CX - 45} 308 L${CX - 40} 392 L${CX - 5} 392 L${CX} 340 L${CX + 5} 392 L${CX + 40} 392 L${CX + 45} 308Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX} 310 L${CX} 340" stroke="${dk(c, 12)}" stroke-width="1"/>
  <path d="M${CX - 45} 308 L${CX + 45} 308" fill="none" stroke="${dk(c, 20)}" stroke-width="1.5"/>`,
    (c) => `<path d="M${CX - 45} 308 L${CX - 42} 360 L${CX - 5} 360 L${CX} 335 L${CX + 5} 360 L${CX + 42} 360 L${CX + 45} 308Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX} 310 L${CX} 335" stroke="${dk(c, 12)}" stroke-width="1"/>`,
    (c) => `<path d="M${CX - 45} 308 L${CX - 38} 395 L${CX - 5} 395 L${CX} 345 L${CX + 5} 395 L${CX + 38} 395 L${CX + 45} 308Z" fill="${c}" filter="url(#sh2)"/>
  <line x1="${CX - 38}" y1="355" x2="${CX - 5}" y2="355" stroke="${lt(c, 15)}" stroke-width=".8" opacity=".5"/>
  <line x1="${CX + 5}" y1="355" x2="${CX + 38}" y2="355" stroke="${lt(c, 15)}" stroke-width=".8" opacity=".5"/>`,
    (c) => `<path d="M${CX - 45} 308 L${CX - 36} 395 L${CX - 5} 395 L${CX} 345 L${CX + 5} 395 L${CX + 36} 395 L${CX + 45} 308Z" fill="${c}" filter="url(#sh2)"/>
  <line x1="${CX - 36}" y1="380" x2="${CX - 5}" y2="380" stroke="${lt(c, 8)}" stroke-width="5" stroke-linecap="round" opacity=".3"/>
  <line x1="${CX + 5}" y1="380" x2="${CX + 36}" y2="380" stroke="${lt(c, 8)}" stroke-width="5" stroke-linecap="round" opacity=".3"/>`,
];

// SHOES
const SHOES = [
    (c) => `<path d="M${CX - 40} 388 L${CX - 42} 410 Q${CX - 42} 420 ${CX - 32} 420 L${CX - 5} 420 Q${CX} 420 ${CX} 415 L${CX - 2} 395 Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX - 40} 392 L${CX} 392" stroke="${lt(c, 30)}" stroke-width="1.5" opacity=".5"/>
  <circle cx="${CX - 22}" cy="402" r="1.5" fill="${lt(c, 50)}"/><circle cx="${CX - 18}" cy="402" r="1.5" fill="${lt(c, 50)}"/>
  <path d="M${CX + 2} 395 L${CX + 40} 388 L${CX + 42} 410 Q${CX + 42} 420 ${CX + 32} 420 L${CX + 5} 420 Q${CX} 420 ${CX} 415Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX + 2} 392 L${CX + 40} 392" stroke="${lt(c, 30)}" stroke-width="1.5" opacity=".5"/>
  <circle cx="${CX + 22}" cy="402" r="1.5" fill="${lt(c, 50)}"/><circle cx="${CX + 18}" cy="402" r="1.5" fill="${lt(c, 50)}"/>`,
    (c) => `<rect x="${CX - 42}" y="390" width="40" height="30" rx="8" fill="${c}" filter="url(#sh2)"/>
  <rect x="${CX - 42}" y="410" width="44" height="10" rx="5" fill="${dk(c, 20)}"/>
  <path d="M${CX - 38}" y1="398" x2="${CX - 6}" y2="398" stroke="${lt(c, 40)}" stroke-width="2" opacity=".4"/>
  <rect x="${CX + 2}" y="390" width="40" height="30" rx="8" fill="${c}" filter="url(#sh2)"/>
  <rect x="${CX}" y="410" width="44" height="10" rx="5" fill="${dk(c, 20)}"/>`,
    (c) => `<path d="M${CX - 42} 390 L${CX - 44} 414 Q${CX - 44} 424 ${CX - 34} 424 L${CX - 2} 424 Q${CX + 2} 424 ${CX + 2} 418 L${CX} 390Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX - 44} 414 L${CX + 2} 414" stroke="white" stroke-width="3" opacity=".6"/>
  <path d="M${CX + 2} 390 L${CX + 44} 390 L${CX + 44} 414 Q${CX + 44} 424 ${CX + 34} 424 L${CX + 2} 424 Q${CX - 2} 424 ${CX - 2} 418Z" fill="${c}" filter="url(#sh2)"/>
  <path d="M${CX - 2} 414 L${CX + 44} 414" stroke="white" stroke-width="3" opacity=".6"/>`,
];

// GLASSES
const GLASS = [
    () => ``,
    () => `<circle cx="${CX - 16}" cy="${HY + 25}" r="14" fill="none" stroke="#333" stroke-width="2.5"/>
  <circle cx="${CX + 16}" cy="${HY + 25}" r="14" fill="none" stroke="#333" stroke-width="2.5"/>
  <line x1="${CX - 2}" y1="${HY + 25}" x2="${CX + 2}" y2="${HY + 25}" stroke="#333" stroke-width="2.5"/>
  <line x1="${CX - 30}" y1="${HY + 22}" x2="${CX - 40}" y2="${HY + 18}" stroke="#333" stroke-width="2"/>
  <line x1="${CX + 30}" y1="${HY + 22}" x2="${CX + 40}" y2="${HY + 18}" stroke="#333" stroke-width="2"/>`,
    () => `<rect x="${CX - 30}" y="${HY + 15}" width="28" height="20" rx="4" fill="rgba(0,0,0,.85)" stroke="#555" stroke-width="2"/>
  <rect x="${CX + 2}" y="${HY + 15}" width="28" height="20" rx="4" fill="rgba(0,0,0,.85)" stroke="#555" stroke-width="2"/>
  <line x1="${CX - 2}" y1="${HY + 25}" x2="${CX + 2}" y2="${HY + 25}" stroke="#555" stroke-width="2.5"/>
  <line x1="${CX - 30}" y1="${HY + 22}" x2="${CX - 42}" y2="${HY + 18}" stroke="#555" stroke-width="2"/>
  <line x1="${CX + 30}" y1="${HY + 22}" x2="${CX + 42}" y2="${HY + 18}" stroke="#555" stroke-width="2"/>`,
    () => `<rect x="${CX - 30}" y="${HY + 16}" width="28" height="18" rx="3" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="${CX + 2}" y="${HY + 16}" width="28" height="18" rx="3" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="${CX - 2}" y1="${HY + 25}" x2="${CX + 2}" y2="${HY + 25}" stroke="#333" stroke-width="2"/>
  <line x1="${CX - 30}" y1="${HY + 22}" x2="${CX - 42}" y2="${HY + 18}" stroke="#333" stroke-width="2"/>
  <line x1="${CX + 30}" y1="${HY + 22}" x2="${CX + 42}" y2="${HY + 18}" stroke="#333" stroke-width="2"/>`,
];

// ACCESSORIES (hats, chains, watches)
const ACCS = [
    () => ``,
    () => `<path d="M${CX - 46} ${HY - 8} Q${CX - 50} ${HY - 20} ${CX} ${HY - 30} Q${CX + 50} ${HY - 20} ${CX + 46} ${HY - 8} L${CX + 55} ${HY - 5} L${CX - 55} ${HY - 5}Z" fill="#1A1A1A" filter="url(#sh2)"/>
  <path d="M${CX - 46} ${HY - 8} Q${CX - 48} ${HY - 25} ${CX} ${HY - 48} Q${CX + 48} ${HY - 25} ${CX + 46} ${HY - 8}" fill="#1A1A1A"/>
  <rect x="${CX - 15}" y="${HY - 12}" width="30" height="5" rx="1" fill="#C53030"/>`,
    () => `<path d="M${CX - 15} 195 Q${CX - 20} 210 ${CX - 8} 215 Q${CX} 218 ${CX + 8} 215 Q${CX + 20} 210 ${CX + 15} 195" fill="none" stroke="#DAA520" stroke-width="2.5"/>
  <circle cx="${CX}" cy="220" r="5" fill="#DAA520" stroke="#B8860B" stroke-width="1"/>`,
    () => `<ellipse cx="${CX - 16}" cy="${HY + 25}" rx="5" ry="5" fill="none" stroke="#DAA520" stroke-width="1.5"/>
  <circle cx="${CX - 16}" cy="${HY + 30}" r="3" fill="#DAA520"/>`,
];

// ═══════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════
function render() {
    const sk = SKIN[S.skin], hc = HAIRC[S.hairColor], tc = TOPC[S.topColor], bc = BOTC[S.bottomColor], sc = SHOC[S.shoeColor];
    let svg = drawDefs(sk);
    // Back hair layer
    if (S.hair === 3 || S.hair === 8) svg += HAIRS[S.hair](hc);
    // Body/neck
    svg += drawBody(sk);
    // Clothing bottom  
    svg += BOTS[S.bottom](bc);
    // Legs (skin below shorts)
    if (S.bottom === 1) svg += drawLegs(sk);
    // Shoes
    svg += SHOES[S.shoe](sc);
    // Clothing top
    svg += TOPS[S.top](tc);
    // Ears
    svg += drawEars(sk);
    // Face
    svg += FACES[S.face](sk);
    // Eyes
    svg += EYES[S.eyeShape](EYEC[S.eyeColor]);
    // Brows
    svg += BROWS[S.brow]();
    // Nose
    svg += NOSES[S.nose]();
    // Mouth
    svg += MOUTHS[S.mouth]();
    // Facial hair
    svg += FHAIR[S.facialHair]();
    // Front hair layer
    if (S.hair !== 3 && S.hair !== 8) svg += HAIRS[S.hair](hc);
    // Glasses
    svg += GLASS[S.glasses]();
    // Accessories
    svg += ACCS[S.acc]();

    document.getElementById('avatarSvg').innerHTML = svg;
}

// ═══════════════════════════════════════════════════════════
// CONTROLS UI
// ═══════════════════════════════════════════════════════════
const TABS = [
    {
        id: 'face', label: '😊 Viso', sections: [
            { title: '🎨 Pelle', type: 'color', colors: SKIN, key: 'skin' },
            { title: 'Forma', type: 'opt', labels: ['Tondo', 'Ovale', 'Quadrato', 'Cuore', 'Diamante'], key: 'face' },
            { title: '👀 Occhi', type: 'opt', labels: ['Tondi', 'Mandorla', 'Anime', 'Assonnati', 'Puntini'], key: 'eyeShape' },
            { title: 'Colore Occhi', type: 'color', colors: EYEC, key: 'eyeColor' },
            { title: 'Sopracciglia', type: 'opt', labels: ['Normali', 'Grinte', 'Alte', 'Piatte'], key: 'brow' },
            { title: '👃 Naso', type: 'opt', labels: ['Classico', 'Bottone', 'Linea', 'Arco', 'Nessuno'], key: 'nose' },
            { title: '👄 Bocca', type: 'opt', labels: ['Sorriso', 'Grande', 'Dritta', 'Sghemba', 'Wow', 'Gatto'], key: 'mouth' },
        ]
    },
    {
        id: 'hair', label: '💇 Capelli', sections: [
            { title: 'Stile', type: 'opt', labels: ['Corti', 'Pompadour', 'Riga', 'Lunghi', 'Ricci', 'Rasati', 'Mohawk', 'Calvo', 'XLungh', 'Fascia'], key: 'hair' },
            { title: 'Colore', type: 'color', colors: HAIRC, key: 'hairColor' },
            { title: '🧔 Barba', type: 'opt', labels: ['Nessuna', 'Barba corta', 'Media', 'Lunga', 'Pizzetto'], key: 'facialHair' },
        ]
    },
    {
        id: 'top', label: '👕 Top', sections: [
            { title: 'Stile', type: 'opt', labels: ['T-Shirt', 'Felpa Nike', 'Giacca Zip', 'Hoodie Adidas', 'Tee Baudr'], key: 'top' },
            { title: 'Colore', type: 'color', colors: TOPC, key: 'topColor' },
        ]
    },
    {
        id: 'bottom', label: '👖 Bottom', sections: [
            { title: 'Stile', type: 'opt', labels: ['Jeans', 'Shorts', 'Joggers', 'Cargo'], key: 'bottom' },
            { title: 'Colore', type: 'color', colors: BOTC, key: 'bottomColor' },
        ]
    },
    {
        id: 'shoes', label: '👟 Scarpe', sections: [
            { title: 'Stile', type: 'opt', labels: ['Sneakers', 'Boots', 'Air Max'], key: 'shoe' },
            { title: 'Colore', type: 'color', colors: SHOC, key: 'shoeColor' },
        ]
    },
    {
        id: 'acc', label: '✨ Extra', sections: [
            { title: 'Occhiali', type: 'opt', labels: ['Nessuno', 'Tondi', 'Sole', 'Quadrati'], key: 'glasses' },
            { title: 'Accessori', type: 'opt', labels: ['Nessuno', 'Cappello', 'Collana', 'Orecchino'], key: 'acc' },
        ]
    },
];

let activeTab = 'face';

function buildUI() {
    const tabsEl = document.getElementById('tabs');
    const panelsEl = document.getElementById('panels');
    tabsEl.innerHTML = ''; panelsEl.innerHTML = '';

    TABS.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'tab' + (t.id === activeTab ? ' active' : '');
        btn.textContent = t.label;
        btn.onclick = () => { activeTab = t.id; buildUI(); };
        tabsEl.appendChild(btn);

        const panel = document.createElement('div');
        panel.className = 'tab-panel' + (t.id === activeTab ? ' active' : '');

        t.sections.forEach(sec => {
            const div = document.createElement('div');
            div.className = 'section';
            div.innerHTML = `<h3>${sec.title}</h3>`;
            const row = document.createElement('div');
            row.className = 'opts';

            if (sec.type === 'color') {
                sec.colors.forEach((c, i) => {
                    const b = document.createElement('button');
                    b.className = 'color-opt' + (S[sec.key] === i ? ' active' : '');
                    b.style.background = c;
                    b.onclick = () => { S[sec.key] = i; render(); buildUI(); };
                    row.appendChild(b);
                });
            } else {
                sec.labels.forEach((l, i) => {
                    const b = document.createElement('button');
                    b.className = 'opt' + (S[sec.key] === i ? ' active' : '');
                    b.textContent = l;
                    b.onclick = () => { S[sec.key] = i; render(); buildUI(); };
                    row.appendChild(b);
                });
            }
            div.appendChild(row);
            panel.appendChild(div);
        });
        panelsEl.appendChild(panel);
    });
}

function randomize() {
    S.skin = Math.floor(Math.random() * SKIN.length);
    S.face = Math.floor(Math.random() * FACES.length);
    S.eyeShape = Math.floor(Math.random() * EYES.length);
    S.eyeColor = Math.floor(Math.random() * EYEC.length);
    S.brow = Math.floor(Math.random() * BROWS.length);
    S.nose = Math.floor(Math.random() * NOSES.length);
    S.mouth = Math.floor(Math.random() * MOUTHS.length);
    S.hair = Math.floor(Math.random() * HAIRS.length);
    S.hairColor = Math.floor(Math.random() * HAIRC.length);
    S.facialHair = Math.floor(Math.random() * FHAIR.length);
    S.glasses = Math.floor(Math.random() * GLASS.length);
    S.top = Math.floor(Math.random() * TOPS.length);
    S.topColor = Math.floor(Math.random() * TOPC.length);
    S.bottom = Math.floor(Math.random() * BOTS.length);
    S.bottomColor = Math.floor(Math.random() * BOTC.length);
    S.shoe = Math.floor(Math.random() * SHOES.length);
    S.shoeColor = Math.floor(Math.random() * SHOC.length);
    S.acc = Math.floor(Math.random() * ACCS.length);
    render(); buildUI();
}

function exportAvatar() {
    const svg = document.getElementById('avatarSvg');
    const data = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 520; canvas.height = 920;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = '#12101f'; ctx.fillRect(0, 0, 520, 920);
        ctx.drawImage(img, 0, 0, 520, 920);
        canvas.toBlob(b => {
            const u = URL.createObjectURL(b);
            const a = document.createElement('a'); a.href = u; a.download = 'baudr-avatar.png'; a.click();
        }, 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
}

// INIT
render();
buildUI();
