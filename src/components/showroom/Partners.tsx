"use client";

import Image from "next/image";
import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { useSiteContent } from "@/providers/SiteContentProvider";
import { getPublicMediaUrl } from "@/lib/media";
import s from "./Partners.module.css";

export default function Partners() {
  const { partnerTiles, partnerLogos } = useSiteContent();

  return (
    <SceneSection scene="net" id="partners" className="section">
      <div className="wrap">
        <div className="col">
          <h2>{copy.partners.title}</h2>
          <p>{copy.partners.lead}</p>
        </div>
        <div className={s.logos}>
          {partnerTiles.map((t) => {
            const logoPath = partnerLogos?.[t];
            const logoUrl = getPublicMediaUrl(logoPath);
            return (
              <div key={t} className={s.logo}>
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={t}
                    width={140}
                    height={40}
                    unoptimized={logoUrl.endsWith(".svg")}
                    className="max-h-8 w-auto object-contain"
                  />
                ) : (
                  t
                )}
              </div>
            );
          })}
        </div>
        <div className={`card ${s.how}`}>
          <div>
            <h3>{copy.partners.howTitle}</h3>
            <p>{copy.partners.howBody}</p>
          </div>
          <div>
            <ul className="ck">{copy.partners.steps.map((t) => <li key={t}>{t}</li>)}</ul>
            <OpenButton type="partner" variant="brand">{copy.partners.cta}</OpenButton>
          </div>
        </div>
      </div>
    </SceneSection>
  );
}
