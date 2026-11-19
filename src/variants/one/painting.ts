/**
 * The hand-painted mark: a 2D canvas that a single green brush writes letter by letter.
 * Browser-only. Call paint(0..1) as often as you like; it only draws what is new.
 */
export type Painting = { canvas: HTMLCanvasElement; paint: (progress: number) => void };

type Pt = { x: number; y: number; start: boolean; f: number };

// Letter strokes in a unit box (0,0 top left to 1,1 bottom right). One array per pen stroke.
const LETTERS: Record<string, number[][][]> = {
  A: [[[0, 1], [0.5, 0], [1, 1]], [[0.2, 0.66], [0.8, 0.66]]],
  N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
};
const GREENS = ["#12B76A", "#10AE64", "#19C474"]; // brand constants, brush bristles

export function makePainting(w: number, h: number, mark = "AN"): Painting {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return { canvas, paint: () => {} };

  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 240; i++) {
    g.fillStyle = `rgba(6,40,30,${Math.random() * 0.04})`; // paper grain
    g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  const lh = h * 0.6;
  const lw = lh * 0.8;
  const gap = lh * 0.2;
  const n = mark.length;
  const x0 = (w - (n * lw + (n - 1) * gap)) / 2;
  const y0 = (h - lh) / 2;
  const pts: Pt[] = [];

  [...mark].forEach((ch, ci) => {
    for (const path of LETTERS[ch] ?? []) {
      const p = path.map(([u, v]) => [x0 + ci * (lw + gap) + u * lw, y0 + v * lh]);
      const len: number[] = [];
      let total = 0;
      for (let k = 1; k < p.length; k++) {
        const d = Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
        len.push(d);
        total += d;
      }
      const steps = Math.ceil(total / 3);
      for (let q = 0; q <= steps; q++) {
        let d = (q / steps) * total;
        let k = 0;
        while (k < len.length - 1 && d > len[k]) {
          d -= len[k];
          k++;
        }
        const a = p[k];
        const b = p[k + 1];
        const f = d / len[k];
        pts.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, start: q === 0, f: q / steps });
      }
    }
  });

  const base = lh * 0.11;
  const hairs = Array.from({ length: 9 }, (_, j) => ({ o: (j / 8 - 0.5) * 1.6, alpha: 0.75 + Math.random() * 0.2, color: GREENS[j % 3] }));
  let ix = 0;
  g.lineCap = "round";

  return {
    canvas,
    paint(progress) {
      const to = Math.min(pts.length - 1, Math.floor(progress * (pts.length - 1)));
      for (; ix < to; ix++) {
        const s = pts[ix];
        const e = pts[ix + 1];
        if (e.start) continue; // the brush lifts between strokes
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        const l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l;
        const ny = dx / l;
        const wd = base * Math.min(1, 0.55 + s.f * 9, 0.45 + (1 - s.f) * 9); // taper at both ends
        for (const hr of hairs) {
          if (s.f > 0.85 && Math.random() < (s.f - 0.85) * 3) continue; // dry brush at the end
          const o = (hr.o * wd) / 2;
          g.strokeStyle = hr.color;
          g.globalAlpha = hr.alpha;
          g.lineWidth = wd * 0.29;
          g.beginPath();
          g.moveTo(s.x + nx * o, s.y + ny * o);
          g.lineTo(e.x + nx * o, e.y + ny * o);
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    },
  };
}

/**
 * Plays the stroke once: it waits 900 ms (so the text appears first), then paints for about 3 seconds.
 * With reduced motion the finished mark is drawn at once. Call the returned function every frame.
 */
export function stepper(p: Painting, reduced: boolean) {
  let fin = reduced;
  if (reduced) p.paint(1.001);
  const start = performance.now() + 900;
  const tick = (ts: number): boolean => {
    if (fin || ts < start) return false;
    const q = Math.min(1, (ts - start) / 3200);
    p.paint(q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2);
    if (q >= 1) fin = true;
    return true;
  };
  return { tick, finished: () => fin };
}
