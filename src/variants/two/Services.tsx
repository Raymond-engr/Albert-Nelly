"use client";

import { useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { services } from "@/data/services";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { useScene } from "@/providers/SceneProvider";
import type { Service } from "@/types/content";
import s from "./Services.module.css";

/** One scroll chapter per service: the card lights its 3D object when it is hovered or mid-screen. */
function Chapter({ service, lit, onActive }: { service: Service; lit: boolean; onActive: () => void }) {
  const { setScene } = useScene();
  const ref = useSceneOnView<HTMLDivElement>(service.scene, { onEnter: onActive });
  return (
    <div ref={ref} className={s.chap} onMouseEnter={() => { setScene(service.scene); onActive(); }}>
      <article className={`${s.card} ${lit ? s.lit : ""}`}>
        <h3>{service.title}</h3>
        {service.badge && <span className={s.chip}>{service.badge}</span>}
        <p>{service.description}</p>
        <p className={s.note}><b>For:</b> {service.audience}</p>
        {service.price && <p className={s.price}>{service.price}</p>}
        <OpenButton type="hire" ctx={service.title} variant="brand">Talk to us</OpenButton>
      </article>
    </div>
  );
}

export default function Services() {
  const [active, setActive] = useState(-1);
  return (
    <SceneSection scene="cv" id="services" className={s.sec}>
      <h2>{copy.services.title}</h2>
      {services.map((sv, i) => <Chapter key={sv.title} service={sv} lit={active === i} onActive={() => setActive(i)} />)}
    </SceneSection>
  );
}
