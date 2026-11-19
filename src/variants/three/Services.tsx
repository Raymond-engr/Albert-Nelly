"use client";

import type { ReactElement } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { copy } from "@/data/copy";
import { services } from "@/data/services";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { useScene } from "@/providers/SceneProvider";
import type { Service } from "@/types/content";
import type { SceneId } from "@/types/scene";
import s from "./Services.module.css";

// Same event name as HL_EVENT in ./scenes. Repeated here so this part stays self-contained.
const lightUp = (id: SceneId | null) => window.dispatchEvent(new CustomEvent("albert:hl", { detail: id }));

const ICONS: Record<SceneId, ReactElement> = {
  cv: <path d="M6 28c4-14 12-20 22-22-2 10-8 18-22 22z" />,
  wire: <><rect x="4" y="5" width="26" height="6" rx="2" /><rect x="4" y="15" width="11" height="14" rx="3" /><rect x="19" y="15" width="11" height="14" rx="3" /></>,
  dev: <><rect x="3" y="7" width="20" height="14" rx="3" /><rect x="22" y="12" width="9" height="18" rx="3" /></>,
  shp: <><circle cx="11" cy="12" r="6" /><rect x="18" y="18" width="12" height="12" rx="2" /><path d="M4 28c4-6 6 2 10-3" /></>,
  sch: <path d="M17 4l12 6v6c0 8-5 12-12 14C10 28 5 24 5 16v-6z" />,
  net: <circle cx="17" cy="17" r="9" />,
  bub: <circle cx="17" cy="17" r="9" />,
};

function Card({ sv }: { sv: Service }) {
  const { setScene } = useScene();
  // Hovered (desktop) or in view (phones): this card's 3D object lights up.
  const ref = useSceneOnView<HTMLElement>(sv.scene, { onEnter: () => { if (matchMedia("(pointer: coarse)").matches) lightUp(sv.scene); } });
  return (
    <article ref={ref} className={s.cd} onMouseEnter={() => { setScene(sv.scene); lightUp(sv.scene); }} onMouseLeave={() => lightUp(null)}>
      <svg viewBox="0 0 34 34" aria-hidden="true">{ICONS[sv.scene]}</svg>
      <h3>{sv.title}</h3>
      <p>{sv.description}</p>
      <p className={s.fr}>For: {sv.audience}</p>
      {sv.badge && <span className={s.bd}>{sv.badge}</span>}
      {sv.price && <p className={s.pr}>{sv.price}</p>}
      <OpenButton type="hire" ctx={sv.title} className={s.b}>Talk to us</OpenButton>
    </article>
  );
}

export default function Services() {
  // The Stage walks wireframe, devices, shapes while this section scrolls by.
  return (
    <section id="services" data-scene="wire" data-scene-path="wire dev shp" className={s.sec}>
      <div className={`${s.w} ${s.pan}`}>
        <h2>{copy.services.title}</h2>
        <p className={s.lead}>{copy.services.lead}</p>
        <div className={s.gr}>{services.map((sv) => <Card key={sv.title} sv={sv} />)}</div>
      </div>
    </section>
  );
}
