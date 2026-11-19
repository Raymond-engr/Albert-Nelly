import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { site } from "@/data/site";
import s from "./Join.module.css";

export default function Join() {
  return (
    <SceneSection scene="bub" id="join" className={s.sec}>
      <div className={s.w}>
        <div className={s.pan}>
          <h2>{copy.join.title}</h2>
          <p className={s.lead}>{copy.join.lead}</p>
          <OpenButton variant="sun" className={`${s.b} ${s.sun}`}>{copy.join.cta}</OpenButton>
          <p className={s.note}>
            WhatsApp {site.whatsappDisplay}<br />
            <a href={`mailto:${site.email}`}>{site.email}</a><br />
            {site.social}
          </p>
        </div>
      </div>
    </SceneSection>
  );
}
