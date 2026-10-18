// Generates the 20 level-up rabbit avatars into public/avatars/.
// Run: node scripts/build-avatars.js
import { mkdirSync, writeFileSync } from 'node:fs'
import { LEVELS } from '../src/utils/levels.js'


const r = (n) => Math.round(n * 10) / 10

function star5(x, y, R, fill, extra = '') {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? R * 0.45 : R
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${r(x + rad * Math.cos(a))},${r(y + rad * Math.sin(a))}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke-linejoin="round" ${extra}/>`
}

const sparkle = (x, y, s, fill = '#fff', op = 1) =>
  `<path d="M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s}Z" fill="${fill}" opacity="${op}"/>`

function daisy(x, y, s, petal, center = '#ffcf3f') {
  let out = `<g transform="translate(${x} ${y}) scale(${s})">`
  for (let i = 0; i < 6; i++) out += `<ellipse cx="0" cy="-9" rx="5.5" ry="9" fill="${petal}" transform="rotate(${i * 60})"/>`
  return out + `<circle r="5.5" fill="${center}"/></g>`
}

function gem(x, y, s, color) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,-7 L6,0 L0,7 L-6,0Z" fill="${color}" stroke="#fff6" stroke-width="1"/><path d="M0,-7 L-2,-1 L-6,0Z" fill="#fff" opacity=".55"/></g>`
}

function crown(p, cx, baseY, w, h, gems) {
  const x0 = cx - w / 2
  const step = w / 4
  const pts = [`${x0},${baseY}`]
  for (let i = 0; i <= 4; i++) {
    const px = x0 + i * step
    pts.push(`${r(px)},${baseY - h}`)
    if (i < 4) pts.push(`${r(px + step / 2)},${r(baseY - h * 0.45)}`)
  }
  pts.push(`${x0 + w},${baseY}`)
  let out = `<polygon points="${pts.join(' ')}" fill="url(#${p}gold)" stroke="#b07d12" stroke-width="2" stroke-linejoin="round"/>`
  out += `<rect x="${x0 - 2}" y="${baseY - 2}" width="${w + 4}" height="${h * 0.32}" rx="4" fill="url(#${p}gold)" stroke="#b07d12" stroke-width="2"/>`
  for (let i = 0; i <= 4; i++) out += `<circle cx="${r(x0 + i * step)}" cy="${baseY - h}" r="${r(h * 0.11)}" fill="#fff4c2" stroke="#b07d12" stroke-width="1.5"/>`
  gems.forEach((c, i) => {
    out += gem(r(x0 + ((i + 0.5) * w) / gems.length), r(baseY + h * 0.15), h * 0.018, c)
  })
  return out
}

// ---------- the rabbit ----------
function rabbit(p, { golden = false } = {}) {
  return `
  <g>
    <g transform="rotate(-12 96 106)">
      <path d="M96,106 C70,106 68,60 74,40 C80,20 112,20 118,40 C124,60 122,106 96,106Z" fill="url(#${p}fur)"/>
      <path d="M96,98 C82,98 80,66 84,50 C88,36 104,36 108,50 C112,66 110,98 96,98Z" fill="url(#${p}inner)"/>
    </g>
    <g transform="rotate(30 160 106)">
      <path d="M160,106 C134,106 132,60 138,40 C144,20 176,20 182,40 C188,60 186,106 160,106Z" fill="url(#${p}fur)"/>
      <path d="M160,98 C146,98 144,66 148,50 C152,36 168,36 172,50 C176,66 174,98 160,98Z" fill="url(#${p}inner)"/>
    </g>
    <ellipse cx="128" cy="300" rx="98" ry="72" fill="url(#${p}fur)"/>
    <path d="M128,90 C200,90 232,134 232,178 C232,226 188,246 128,246 C68,246 24,226 24,178 C24,134 56,90 128,90Z" fill="url(#${p}fur)"/>
    <ellipse cx="100" cy="122" rx="40" ry="17" fill="#fff" opacity="${golden ? 0.4 : 0.22}"/>
    <ellipse cx="128" cy="206" rx="40" ry="26" fill="#fff" opacity="${golden ? 0.3 : 0.2}"/>
    <ellipse cx="96" cy="182" rx="13" ry="16" fill="#2b2220"/>
    <ellipse cx="160" cy="182" rx="13" ry="16" fill="#2b2220"/>
    <ellipse cx="96" cy="188" rx="9" ry="7" fill="#5a4640" opacity=".55"/>
    <ellipse cx="160" cy="188" rx="9" ry="7" fill="#5a4640" opacity=".55"/>
    <circle cx="101" cy="175" r="5.4" fill="#fff"/>
    <circle cx="165" cy="175" r="5.4" fill="#fff"/>
    <circle cx="91" cy="189" r="2.3" fill="#fff" opacity=".9"/>
    <circle cx="155" cy="189" r="2.3" fill="#fff" opacity=".9"/>
    <ellipse cx="66" cy="206" rx="22" ry="14" fill="url(#${p}blush)"/>
    <ellipse cx="190" cy="206" rx="22" ry="14" fill="url(#${p}blush)"/>
    <path d="M123.5,197 Q128,194 132.5,197 Q128,203 123.5,197Z" fill="#e5808f"/>
    <path d="M120,204 Q124,209.5 128,204.5 Q132,209.5 136,204" stroke="#4a3832" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`
}

function defs(p, bg, golden) {
  const fur = golden
    ? ['#fff3c4', '#f2c65a', '#c98f1e']
    : ['#e2d5cc', '#b5a39a', '#8a7870']
  return `<defs>
    <clipPath id="${p}clip"><circle cx="128" cy="128" r="128"/></clipPath>
    <radialGradient id="${p}fur" cx=".38" cy=".3" r=".8">
      <stop offset="0" stop-color="${fur[0]}"/><stop offset=".55" stop-color="${fur[1]}"/><stop offset="1" stop-color="${fur[2]}"/>
    </radialGradient>
    <linearGradient id="${p}inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7c9cc"/><stop offset="1" stop-color="#e595a0"/>
    </linearGradient>
    <radialGradient id="${p}blush">
      <stop offset="0" stop-color="#ff8fa3" stop-opacity=".9"/><stop offset=".6" stop-color="#ff9fb0" stop-opacity=".6"/><stop offset="1" stop-color="#ffb0bd" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${p}gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#f6c63e"/><stop offset="1" stop-color="#d4921a"/>
    </linearGradient>
    <linearGradient id="${p}goldring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2a8"/><stop offset=".3" stop-color="#e9b032"/><stop offset=".55" stop-color="#fff0a0"/><stop offset=".8" stop-color="#cf8c16"/><stop offset="1" stop-color="#ffe680"/>
    </linearGradient>
    <radialGradient id="${p}bg" cx=".5" cy=".42" r=".7">
      ${bg.map((c, i) => `<stop offset="${i / (bg.length - 1)}" stop-color="${c}"/>`).join('')}
    </radialGradient>
  </defs>`
}

// ---------- per-level art: back = behind rabbit, front = on top of rabbit ----------
const ART = [
  // 1 小灰兔
  { bg: ['#efebe7', '#ddd6d0'] },
  // 2 发芽兔
  {
    bg: ['#eef8e6', '#cfe9c0'],
    front: `<path d="M128,90 Q125,74 130,60" stroke="#4f9a35" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="117" cy="64" rx="13" ry="6.5" transform="rotate(-28 117 64)" fill="#78c255"/>
      <ellipse cx="142" cy="58" rx="14" ry="7" transform="rotate(22 142 58)" fill="#8fd46a"/>`,
  },
  // 3 蝴蝶结兔
  {
    bg: ['#fff0f4', '#fbd0dc'],
    front: `<g transform="translate(166 100) rotate(14)">
      <path d="M0,0 C-10,-18 -32,-16 -30,0 C-32,16 -10,18 0,0Z" fill="#ff7fa6"/>
      <path d="M0,0 C10,-18 32,-16 30,0 C32,16 10,18 0,0Z" fill="#ff7fa6"/>
      <circle cx="-17" cy="-4" r="3" fill="#fff" opacity=".8"/><circle cx="18" cy="5" r="3" fill="#fff" opacity=".8"/>
      <circle cx="-22" cy="7" r="2.4" fill="#fff" opacity=".8"/><circle cx="21" cy="-6" r="2.4" fill="#fff" opacity=".8"/>
      <circle r="7.5" fill="#f2557f"/></g>`,
  },
  // 4 围巾兔
  {
    bg: ['#eaf4fc', '#c6def3'],
    back: [[40, 50], [212, 70], [30, 150], [226, 160], [60, 230], [200, 236]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" opacity=".8"/>`).join(''),
    front: `<path d="M44,226 Q128,258 212,226 L214,248 Q128,282 42,248Z" fill="#e5504a"/>
      <path d="M44,237 Q128,270 213,237" stroke="#fff" stroke-width="4" opacity=".75" fill="none"/>
      <path d="M168,246 L180,296 L202,290 L192,240Z" fill="#d2423d"/>
      <path d="M173,262 L195,256 M177,278 L199,272" stroke="#fff" stroke-width="3.5" opacity=".75"/>`,
  },
  // 5 小花兔
  {
    bg: ['#fffbe0', '#ffecaa'],
    front: daisy(72, 112, 1.3, '#fff') + daisy(98, 98, 1, '#ffb3c6') + `<ellipse cx="86" cy="122" rx="10" ry="4.5" transform="rotate(-30 86 122)" fill="#78c255"/>`,
  },
  // 6 眼镜兔
  {
    bg: ['#f3effd', '#d9d0f3'],
    ring: 'silver',
    front: `<circle cx="96" cy="182" r="24" fill="#fff" fill-opacity=".18" stroke="#3a3440" stroke-width="4.5"/>
      <circle cx="160" cy="182" r="24" fill="#fff" fill-opacity=".18" stroke="#3a3440" stroke-width="4.5"/>
      <path d="M119,177 Q128,170 137,177" stroke="#3a3440" stroke-width="4" fill="none"/>
      <path d="M84,170 L90,165" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
      <path d="M148,170 L154,165" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  },
  // 7 小画家兔
  {
    bg: ['#fff3ea', '#ffd9bf'],
    ring: 'silver',
    back: `<circle cx="34" cy="70" r="10" fill="#7cc8f2" opacity=".7"/><circle cx="222" cy="110" r="12" fill="#a6e07c" opacity=".7"/><circle cx="40" cy="200" r="9" fill="#ff9ec0" opacity=".7"/><circle cx="214" cy="40" r="7" fill="#ffd34d" opacity=".8"/>`,
    front: `<g transform="rotate(-12 124 98)">
      <ellipse cx="124" cy="98" rx="62" ry="24" fill="#d84848"/>
      <ellipse cx="114" cy="90" rx="30" ry="8" fill="#fff" opacity=".18"/>
      <path d="M124,74 Q126,62 132,60" stroke="#b83636" stroke-width="5" stroke-linecap="round" fill="none"/></g>`,
  },
  // 8 音乐兔
  {
    bg: ['#e9fbf8', '#bfeae4'],
    ring: 'silver',
    back: `<g fill="#3fa69a" opacity=".55"><path d="M30,96 v-34 l18,-5 v34" stroke="#3fa69a" stroke-width="3.5" fill="none"/><circle cx="25" cy="97" r="6"/><circle cx="43" cy="92" r="6"/>
      <path d="M222,70 v-30" stroke="#3fa69a" stroke-width="3.5"/><ellipse cx="217" cy="71" rx="7" ry="5.5"/></g>`,
    front: `<path d="M38,180 Q34,70 128,66 Q222,70 218,180" stroke="#5b7cf0" stroke-width="11" fill="none" stroke-linecap="round"/>
      <rect x="20" y="154" width="32" height="54" rx="15" fill="#5b7cf0"/><rect x="204" y="154" width="30" height="52" rx="14" fill="#5b7cf0"/>
      <rect x="26" y="162" width="8" height="30" rx="4" fill="#fff" opacity=".35"/><rect x="210" y="162" width="8" height="30" rx="4" fill="#fff" opacity=".35"/>`,
  },
  // 9 小厨师兔
  {
    bg: ['#fff6e6', '#ffdca3'],
    ring: 'silver',
    front: `<g><circle cx="102" cy="66" r="24" fill="#fff"/><circle cx="128" cy="54" r="28" fill="#fff"/><circle cx="154" cy="66" r="24" fill="#fff"/>
      <rect x="88" y="66" width="80" height="34" rx="6" fill="#fff"/>
      <rect x="86" y="88" width="84" height="18" rx="6" fill="#eceff3"/>
      <path d="M110,70 v18 M128,70 v18 M146,70 v18" stroke="#e3e6ea" stroke-width="3"/></g>
      <path d="M100,236 L128,248 L156,236 L156,262 L128,250 L100,262Z" fill="#e5504a"/>`,
  },
  // 10 小警长兔
  {
    bg: ['#fff7d6', '#f8dc86'],
    ring: 'silver',
    front: `<path d="M56,114 Q58,50 128,44 Q198,50 200,114Z" fill="#2f4a8a"/>
      <path d="M80,70 Q128,40 176,70" stroke="#fff" stroke-width="6" opacity=".12" fill="none"/>
      <rect x="56" y="104" width="144" height="16" fill="#22396e"/>
      <path d="M56,118 Q128,144 200,118 Q194,136 128,142 Q62,136 56,118Z" fill="#1b2c55"/>
      <path d="M128,64 L146,70 Q146,94 128,102 Q110,94 110,70Z" fill="url(#P_gold)" stroke="#b07d12" stroke-width="2"/>
      ${star5(128, 82, 8, '#fff4c2')}`,
  },
  // 11 魔法兔
  {
    bg: ['#4b4a9c', '#262a63'],
    ring: 'gold',
    back: [[30, 60, 3], [60, 30, 2], [220, 50, 3], [232, 130, 2], [24, 150, 2.5], [200, 200, 2], [50, 220, 2]].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity=".8"/>`).join('') + sparkle(210, 90, 9, '#ffe680') + sparkle(42, 105, 7, '#ffe680'),
    front: `<path d="M70,112 Q112,70 150,4 Q168,60 188,110Z" fill="#7a4fc9"/>
      <path d="M150,4 Q160,50 176,104 L160,106 Q150,60 150,4Z" fill="#5d36a8"/>
      <ellipse cx="128" cy="110" rx="76" ry="15" fill="#6440b0"/>
      <path d="M78,100 Q128,116 182,100" stroke="#ffd34d" stroke-width="6" fill="none"/>
      ${star5(118, 72, 9, '#ffd34d')}${star5(146, 46, 6, '#ffd34d')}${star5(160, 84, 5, '#fff2a8')}`,
  },
  // 12 小船长兔
  {
    bg: ['#e4f4ff', '#93cdf0'],
    ring: 'gold',
    back: `<path d="M0,218 Q32,204 64,218 T128,218 T192,218 T256,218 V256 H0Z" fill="#5fa8dc" opacity=".55"/>`,
    front: `<path d="M58,112 Q52,58 128,50 Q204,58 198,112Z" fill="#fbfdff"/>
      <path d="M70,80 Q128,58 186,80" stroke="#dfe7ef" stroke-width="6" fill="none"/>
      <rect x="58" y="100" width="140" height="18" fill="#1f2a44"/>
      <path d="M58,104 Q128,96 198,104" stroke="url(#P_gold)" stroke-width="4" fill="none"/>
      <path d="M58,116 Q128,140 198,116 Q192,134 128,140 Q64,134 58,116Z" fill="#141c30"/>
      <g stroke="url(#P_gold)" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M128,66 V94"/><path d="M118,74 H138"/><path d="M114,86 Q128,100 142,86"/></g>
      <circle cx="128" cy="64" r="4.5" fill="none" stroke="#e9b032" stroke-width="3"/>`,
  },
  // 13 小博士兔
  {
    bg: ['#e2f7f2', '#9fdccb'],
    ring: 'gold',
    back: `<g transform="translate(26 196) rotate(-10)"><rect width="34" height="10" rx="2" fill="#f07a6a"/><rect y="-10" width="30" height="10" rx="2" fill="#6aa8f0"/><rect x="2" y="-20" width="28" height="10" rx="2" fill="#f5c542"/></g>`,
    front: `<path d="M84,90 L84,114 Q128,130 172,114 L172,90Z" fill="#2b2b33"/>
      <path d="M44,80 L128,50 L212,80 L128,110Z" fill="#33333d"/>
      <path d="M44,80 L128,110 L212,80 L128,104Z" fill="#1d1d24"/>
      <circle cx="128" cy="80" r="5" fill="url(#P_gold)"/>
      <path d="M128,80 Q170,86 190,96 L192,130" stroke="url(#P_gold)" stroke-width="3.5" fill="none"/>
      <path d="M186,128 L198,128 L200,150 L184,150Z" fill="url(#P_gold)"/>
      <g transform="translate(176 206) rotate(-25)"><rect x="-26" y="-9" width="52" height="18" rx="9" fill="#fdf3dc" stroke="#d8c39a" stroke-width="2"/><rect x="-4" y="-10" width="8" height="20" fill="#e5504a"/></g>`,
  },
  // 14 花仙兔
  {
    bg: ['#fff0f7', '#f7c4dc'],
    ring: 'gold',
    back: `<g fill="#ff9ec0" opacity=".55"><ellipse cx="34" cy="80" rx="8" ry="5" transform="rotate(30 34 80)"/><ellipse cx="224" cy="150" rx="8" ry="5" transform="rotate(-20 224 150)"/><ellipse cx="44" cy="190" rx="7" ry="4.5"/><ellipse cx="210" cy="40" rx="7" ry="4.5" transform="rotate(50 210 40)"/></g>`,
    front:
      `<path d="M52,124 Q128,82 204,124" stroke="#5aa83e" stroke-width="5" fill="none"/>` +
      [[56, 122, '#fff'], [78, 108, '#ff9ec0'], [102, 98, '#ffd34d'], [128, 94, '#fff'], [154, 98, '#c9a6ff'], [178, 108, '#ff9ec0'], [200, 122, '#fff']]
        .map(([x, y, c], i) => (i % 2 ? `<ellipse cx="${x + 10}" cy="${y + 6}" rx="8" ry="4" fill="#78c255"/>` : '') + daisy(x, y, 0.95, c, c === '#ffd34d' ? '#f08a3c' : '#ffcf3f'))
        .join('') +
      `<g transform="translate(212 72) rotate(15)"><ellipse cx="-9" cy="-6" rx="10" ry="13" fill="#7cc8f2"/><ellipse cx="9" cy="-6" rx="10" ry="13" fill="#7cc8f2"/><ellipse cx="-7" cy="9" rx="7" ry="8" fill="#a8dcf7"/><ellipse cx="7" cy="9" rx="7" ry="8" fill="#a8dcf7"/><rect x="-2" y="-14" width="4" height="28" rx="2" fill="#3a3440"/></g>`,
  },
  // 15 星星兔
  {
    bg: ['#6a4fb8', '#2e2266'],
    ring: 'gold',
    back:
      [[34, 60, 7], [222, 52, 9], [30, 160, 6], [228, 170, 7], [60, 226, 5], [200, 228, 6]].map(([x, y, s]) => star5(x, y, s, '#ffe680')).join('') +
      sparkle(70, 30, 6) + sparkle(190, 100, 6) + sparkle(20, 110, 5),
    front: `<path d="M74,110 Q128,84 182,110" stroke="#dfe6f2" stroke-width="6" fill="none"/>
      ${star5(128, 72, 22, '#ffe680', 'stroke="#d4921a" stroke-width="2.5"')}
      ${star5(94, 92, 11, '#bfe3ff', 'stroke="#7fa6c9" stroke-width="2"')}${star5(162, 92, 11, '#bfe3ff', 'stroke="#7fa6c9" stroke-width="2"')}
      ${gem(128, 74, 1, '#ff5c8d')}
      ${sparkle(158, 158, 4, '#fff', 0.9)}${sparkle(96, 210, 4, '#fff', 0.9)}`,
  },
  // 16 天使兔
  {
    bg: ['#f5fbff', '#bfe2fb'],
    ring: 'gems',
    back: `<g fill="#fff"><circle cx="30" cy="214" r="22"/><circle cx="58" cy="224" r="18"/><circle cx="226" cy="40" r="16"/><circle cx="206" cy="46" r="12"/></g>
      <g fill="#fff" stroke="#d6e6f4" stroke-width="2">
        <path d="M50,180 Q2,170 6,110 Q22,130 34,128 Q14,104 26,74 Q44,104 60,110 Q48,84 64,62 Q74,100 86,150Z"/>
        <path d="M206,180 Q254,170 250,110 Q234,130 222,128 Q242,104 230,74 Q212,104 196,110 Q208,84 192,62 Q182,100 170,150Z"/>
      </g>`,
    front: `<ellipse cx="128" cy="26" rx="52" ry="12" fill="none" stroke="url(#P_gold)" stroke-width="8"/>
      <ellipse cx="128" cy="26" rx="52" ry="12" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
      ${sparkle(60, 40, 7, '#ffd34d')}${sparkle(200, 96, 6, '#ffd34d')}`,
  },
  // 17 王子兔
  {
    bg: ['#e8efff', '#7f9ff0'],
    ring: 'gems',
    back: `<path d="M20,256 Q40,200 90,222 L166,222 Q216,200 236,256Z" fill="#c8303d"/>`,
    front: `${crown('P_', 128, 100, 76, 40, ['#3f7cf0', '#e5304a', '#3f7cf0'])}
      <path d="M78,232 Q128,252 178,232 L178,250 Q128,270 78,250Z" fill="#c8303d"/>
      <circle cx="128" cy="246" r="9" fill="url(#P_gold)" stroke="#b07d12" stroke-width="1.5"/>
      ${sparkle(208, 64, 7)}${sparkle(48, 70, 6)}`,
  },
  // 18 国王兔
  {
    bg: ['#b06ad6', '#4a1f78'],
    ring: 'gems',
    back:
      Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6
        return `<path d="M128,128 L${r(128 + 200 * Math.cos(a - 0.12))},${r(128 + 200 * Math.sin(a - 0.12))} L${r(128 + 200 * Math.cos(a + 0.12))},${r(128 + 200 * Math.sin(a + 0.12))}Z" fill="#fff" opacity=".07"/>`
      }).join('') + `<path d="M10,256 Q24,190 86,216 L170,216 Q232,190 246,256Z" fill="#c8303d"/>`,
    front: `${crown('P_', 128, 104, 104, 58, ['#e5304a', '#2fb36b', '#3f7cf0', '#e5304a'])}
      <path d="M58,226 Q128,256 198,226 L200,252 Q128,282 56,252Z" fill="#fffaf2"/>
      ${[[74, 238], [100, 248], [128, 252], [156, 248], [182, 238]].map(([x, y]) => `<path d="M${x},${y - 4} l3,7 h-6z" fill="#2b2220"/>`).join('')}
      ${sparkle(216, 70, 9, '#ffe680')}${sparkle(36, 90, 7, '#ffe680')}${sparkle(196, 30, 5)}`,
  },
  // 19 彩虹兔
  {
    bg: ['#ffffff', '#dff3ff'],
    ring: 'gems',
    back:
      ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa']
        .map((c, i) => `<path d="M${-10 + i * 14},200 A${138 - i * 14},${138 - i * 14} 0 0 1 ${266 - i * 14},200" stroke="${c}" stroke-width="14" fill="none"/>`)
        .join('') +
      `<g fill="#fff"><circle cx="18" cy="206" r="22"/><circle cx="42" cy="214" r="18"/><circle cx="238" cy="206" r="22"/><circle cx="214" cy="214" r="18"/></g>`,
    front: `${crown('P_', 128, 102, 92, 48, ['#ff6b6b', '#ffe066', '#4dabf7'])}
      ${[[64, 238, '#ff6b6b'], [92, 248, '#ffa94d'], [120, 252, '#ffe066'], [148, 251, '#69db7c'], [176, 245, '#4dabf7'], [200, 234, '#9775fa']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}" stroke="#fff" stroke-width="2"/>`).join('')}
      ${sparkle(212, 70, 8, '#ffd34d')}${sparkle(44, 72, 7, '#ff9ec0')}${sparkle(196, 130, 5, '#4dabf7')}`,
  },
  // 20 金兔大王
  {
    bg: ['#fff7cf', '#f5b93a'],
    ring: 'grand',
    golden: true,
    back:
      Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8
        return `<path d="M128,128 L${r(128 + 200 * Math.cos(a - 0.1))},${r(128 + 200 * Math.sin(a - 0.1))} L${r(128 + 200 * Math.cos(a + 0.1))},${r(128 + 200 * Math.sin(a + 0.1))}Z" fill="#fff" opacity=".25"/>`
      }).join('') +
      `<ellipse cx="128" cy="20" rx="58" ry="12" fill="none" stroke="#fff6c8" stroke-width="7"/>
      <g fill="#fffaf0" stroke="#f0c75a" stroke-width="2">
        <path d="M50,190 Q0,176 4,110 Q20,132 32,128 Q12,102 24,70 Q44,102 58,108 Q46,80 62,58 Q74,100 86,160Z"/>
        <path d="M206,190 Q256,176 252,110 Q236,132 224,128 Q244,102 232,70 Q212,102 198,108 Q210,80 194,58 Q182,100 170,160Z"/>
      </g>
      <path d="M8,256 Q22,196 86,218 L170,218 Q234,196 248,256Z" fill="#b8202f"/>`,
    front: `${crown('P_', 128, 104, 112, 64, ['#e5304a', '#2fb36b', '#3f7cf0', '#9b4dff', '#e5304a'])}
      ${gem(128, 52, 2.2, '#e5304a')}
      <path d="M56,226 Q128,256 200,226 L202,252 Q128,282 54,252Z" fill="#fffaf2"/>
      <circle cx="128" cy="234" r="17" fill="url(#P_gold)" stroke="#b07d12" stroke-width="2.5"/>
      <text x="128" y="241" font-size="19" font-weight="700" text-anchor="middle" fill="#a3201f" font-family="KaiTi, STKaiti, serif">字</text>
      ${sparkle(218, 66, 10)}${sparkle(38, 60, 8)}${sparkle(208, 138, 6)}${sparkle(48, 150, 6)}${sparkle(96, 124, 4)}`,
  },
]

function ring(p, kind) {
  if (!kind) return `<circle cx="128" cy="128" r="126" fill="none" stroke="#000" stroke-opacity=".06" stroke-width="4"/>`
  if (kind === 'silver')
    return `<circle cx="128" cy="128" r="123" fill="none" stroke="#c9d0da" stroke-width="7"/><circle cx="128" cy="128" r="123" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`
  let out = `<circle cx="128" cy="128" r="122" fill="none" stroke="url(#${p}goldring)" stroke-width="${kind === 'grand' ? 13 : 9}"/>`
  if (kind === 'gems' || kind === 'grand') {
    const n = kind === 'grand' ? 12 : 4
    const colors = ['#e5304a', '#3f7cf0', '#2fb36b', '#9b4dff']
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
      out += gem(r(128 + 122 * Math.cos(a)), r(128 + 122 * Math.sin(a)), kind === 'grand' ? 1.25 : 1.1, colors[i % colors.length])
    }
  }
  return out
}

function avatarSvg(level) {
  const art = ART[level - 1]
  const p = `L${level}_`
  const fix = (s = '') => s.replaceAll('P_', p)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  ${defs(p, art.bg, art.golden)}
  <g clip-path="url(#${p}clip)">
    <rect width="256" height="256" fill="url(#${p}bg)"/>
    ${fix(art.back)}
    <g transform="translate(128 40) scale(.9) translate(-128 -40)">
      ${rabbit(p, { golden: art.golden })}
      ${fix(art.front)}
    </g>
  </g>
  ${ring(p, art.ring)}
</svg>
`
}

const out = new URL('../public/avatars/', import.meta.url)
mkdirSync(out, { recursive: true })
LEVELS.forEach((_, i) => {
  const n = String(i + 1).padStart(2, '0')
  writeFileSync(new URL(`rabbit-${n}.svg`, out), avatarSvg(i + 1))
})
console.log(`wrote ${LEVELS.length} avatars to public/avatars/`)
