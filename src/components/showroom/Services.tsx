"use client";

import { useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { services } from "@/data/services";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import { useScene } from "@/providers/SceneProvider";
import type { Service } from "@/types/content";
import type { SceneId } from "@/types/scene";
import s from "./Services.module.css";

// Same event name as HL_EVENT in ./scenes. The Stage listens for it and lights up the matching 3D object.
const lightUp = (id: SceneId | null) => window.dispatchEvent(new CustomEvent("albert:hl", { detail: id }));

function ServiceCard({ service, index, active, onActive }: { service: Service; index: number; active: boolean; onActive: () => void }) {
  const { setScene } = useScene();
  // In view (phones) or hovered (desktop): light up the matching 3D object.
  const ref = useSceneOnView<HTMLElement>(service.scene, { onEnter: () => { onActive(); if (matchMedia("(pointer: coarse)").matches) lightUp(service.scene); } });
  return (
    <article
      ref={ref}
      className={`card ${s.svc} ${active ? s.act : ""}`}
      onMouseEnter={() => {
        setScene(service.scene);
        onActive();
        lightUp(service.scene);
      }}
      onMouseLeave={() => lightUp(null)}
    >
      <i className={`${s.ic} ${s[`ic${index}`]}`} aria-hidden="true" />
      <h3>{service.title}</h3>
      {service.badge && <span className={s.badge}>{service.badge}</span>}
      <p>{service.description}</p>
      <p className="note">For: {service.audience}</p>
      {service.price && <p className="price">{service.price}</p>}
      <OpenButton type="hire" ctx={service.title} variant="brand">Talk to us</OpenButton>
    </article>
  );
}

export default function Services() {
  const [active, setActive] = useState(-1);
  return (
    <SceneSection scene="wire" path="wire dev shp" id="services" className="section">
      <div className="wrap">
        <div className="col">
          <h2>{copy.services.title}</h2>
          {services.map((sv, i) => (
            <ServiceCard key={sv.title} service={sv} index={i} active={active === i} onActive={() => setActive(i)} />
          ))}
        </div>
      </div>
    </SceneSection>
  );
}
