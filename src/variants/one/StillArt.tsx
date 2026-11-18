import s from "./Stage.module.css";

/**
 * The Still version: one designed poster for reduced motion, data saver, no WebGL, and the
 * moment before the 3D has loaded. While 3D is coming it shows the blank canvas only, so the
 * painted mark never appears twice. Without 3D it shows the finished mark.
 */
export default function StillArt({ painted, hidden }: { painted: boolean; hidden: boolean }) {
  return (
    <svg className={`${s.still} ${hidden ? s.gone : ""}`} viewBox="0 0 400 300" aria-hidden="true">
      <rect x="6" y="6" width="388" height="288" rx="10" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
      {painted && <path d="M85 225L135 75L185 225M105 175H165M215 225V75L315 225V75" fill="none" stroke="#12B76A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
