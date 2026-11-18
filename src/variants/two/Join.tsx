import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { site } from "@/data/site";
import s from "./Join.module.css";

export default function Join() {
  return (
    <SceneSection scene="bub" id="join" className={s.sec}>
      <div className={s.col}>
        <h2>{copy.join.title}</h2>
        <p>{copy.join.lead}</p>
        <OpenButton variant="sun">{copy.join.cta}</OpenButton>
        <p className={s.note}>
          WhatsApp {site.whatsappDisplay}<br />
          <a href={`mailto:${site.email}`}>{site.email}</a> · {site.social}
        </p>
      </div>
    </SceneSection>
  );
}
