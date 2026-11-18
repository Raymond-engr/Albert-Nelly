import s from "./Stage.module.css";

/**
 * The background artwork: seven groups, one per scene (see src/types/scene.ts).
 * It is pure SVG + CSS (about 4 KB). A real 3D scene can replace this file as long as
 * Stage keeps the same contract: show the scene named by data-s, dim when asked.
 */
export function StageArt() {
  return (
    <svg viewBox="0 0 400 500" aria-hidden="true">

  <g className={s.cv}>
  <ellipse cx="200" cy="250" rx="195" ry="235" fill="var(--mint)"/>
  <rect x="50" y="50" width="300" height="400" rx="8" fill="var(--card)" stroke="var(--line)" strokeWidth="2"/>
  <path className={s.brush} pathLength="1" d="M85 360C130 250 170 420 230 310S310 220 318 150"/>
  <path className={`${s.brush} ${s.b2}`} pathLength="1" transform="translate(8 -18)" d="M85 360C130 250 170 420 230 310S310 220 318 150"/>
  </g>

  <g className={s.wire} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round">
  <rect x="50" y="50" width="300" height="400" rx="8"/>
  <rect x="70" y="70" width="260" height="36" rx="6"/>
  <rect x="70" y="124" width="124" height="120" rx="8"/>
  <rect x="206" y="124" width="124" height="120" rx="8"/>
  <rect x="70" y="262" width="260" height="70" rx="8"/>
  <rect x="70" y="356" width="110" height="38" rx="19" stroke="#12B76A" strokeWidth="3"/>
  <path d="M70 416h200M70 430h140" opacity=".5"/>
  </g>

  <g className={s.dev} fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5">
  <rect x="150" y="90" width="210" height="150" rx="10"/>
  <path d="M150 118h210"/>
  <circle cx="166" cy="104" r="3.5" fill="#12B76A" stroke="none"/>
  <rect x="166" y="134" width="84" height="12" rx="3" fill="#12B76A" stroke="none"/>
  <rect x="166" y="158" width="170" height="8" rx="3" fill="var(--line)" stroke="none"/>
  <rect x="166" y="176" width="130" height="8" rx="3" fill="var(--line)" stroke="none"/>
  <rect x="50" y="200" width="104" height="210" rx="18"/>
  <rect x="66" y="228" width="72" height="44" rx="6" fill="var(--mint)" stroke="none"/>
  <rect x="66" y="288" width="72" height="14" rx="7" fill="#12B76A" stroke="none"/>
  </g>

  <g className={s.shp}>
  <circle cx="90" cy="110" r="22" fill="#12B76A"/>
  <path d="M240 410q15-26 30 0t30 0t30 0" fill="none" stroke="#F7B733" strokeWidth="7" strokeLinecap="round"/>
  <rect x="300" y="48" width="34" height="34" rx="6" fill="#FF6F59" transform="rotate(20 317 65)"/>
  <circle cx="84" cy="440" r="16" fill="none" stroke="var(--ink)" strokeWidth="3"/>
  </g>

  <g className={s.sch}>
  <path d="M200 90l120 50-120 50-120-50z" fill="var(--ink)"/>
  <path d="M130 168v36c0 24 140 24 140 0v-36l-70 28z" fill="#12B76A"/>
  <path d="M320 140v58" stroke="#F7B733" strokeWidth="5" strokeLinecap="round"/>
  <rect x="70" y="260" width="260" height="170" rx="10" fill="var(--card)" stroke="var(--ink)" strokeWidth="3"/>
  <path d="M95 302l12 12 22-26M95 342l12 12 22-26M95 382l12 12 22-26" fill="none" stroke="#12B76A" strokeWidth="6" strokeLinecap="round"/>
  <path d="M150 304h150M150 344h150M150 384h110" stroke="var(--line)" strokeWidth="6" strokeLinecap="round"/>
  </g>

  <g className={s.net}>
  <path d="M200 250L90 110M200 250L310 100M200 250L70 250M200 250L330 260M200 250L100 400M200 250L300 410" stroke="#12B76A" strokeWidth="2.5" fill="none"/>
  <g fill="var(--card)" stroke="var(--line)" strokeWidth="2">
  <rect x="55" y="90" width="70" height="40" rx="10"/>
  <rect x="275" y="80" width="70" height="40" rx="10"/>
  <rect x="35" y="230" width="70" height="40" rx="10"/>
  <rect x="295" y="240" width="70" height="40" rx="10"/>
  <rect x="65" y="380" width="70" height="40" rx="10"/>
  <rect x="265" y="390" width="70" height="40" rx="10"/>
  </g>
  <circle cx="182" cy="250" r="30" fill="#12B76A"/>
  <circle cx="218" cy="250" r="30" fill="none" stroke="var(--ink)" strokeWidth="5"/>
  </g>

  <g className={s.bub}>
  <path d="M70 150h260a24 24 0 0 1 24 24v140a24 24 0 0 1-24 24H190l-50 50v-50H70a24 24 0 0 1-24-24V174a24 24 0 0 1 24-24z" fill="#12B76A"/>
  <text x="200" y="258" textAnchor="middle" fontFamily="Sora,Arial,sans-serif" fontWeight="700" fontSize="40" fill="#06281E">Let’s talk</text>
  </g>
</svg>
  );
}
