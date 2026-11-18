"use client";

import { useState } from "react";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { partnerTiles } from "@/data/referral";
import s from "./Partners.module.css";

export default function Partners() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <SceneSection scene="net" id="partners" className={s.sec}>
      <h2>{copy.partners.title}</h2>
      <div className={s.tiles}>
        {partnerTiles.map((t) => <button key={t} type="button" className={s.tile} aria-expanded={sel === t} onClick={() => setSel(t)}>{t}</button>)}
      </div>
      {sel && (
        <div className={`${s.card} ${s.info}`} role="region" aria-live="polite" aria-label={sel}>
          <h3>{sel}</h3>
          <p className={s.note}>{copy.partners.tileNote}</p>
          <a className={s.bl} href="#partners">{copy.partners.tileLink}</a>
        </div>
      )}
      <div className={`${s.card} ${s.how}`}>
        <h3>{copy.partners.howTitle}</h3>
        <p>{copy.partners.howBody}</p>
        <ul className={s.list}>{copy.partners.steps.map((t) => <li key={t}>{t}</li>)}</ul>
        <OpenButton type="partner" variant="brand">{copy.partners.cta}</OpenButton>
      </div>
    </SceneSection>
  );
}
