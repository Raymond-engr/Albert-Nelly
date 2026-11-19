import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import s from "./Hero.module.css";

export default function Hero() {
  return (
    <SceneSection scene="cv" className={s.hero}>
      <div className={s.w}>
        <div className={s.in}>
          <h1>{copy.hero.title}</h1>
          <p>{copy.hero.lead}</p>
          <div className={s.row}>
            <OpenButton variant="sun" className={`${s.b} ${s.sun}`}>{copy.hero.secondary}</OpenButton>
            <a className={s.b} href="#services">{copy.hero.primary}</a>
          </div>
        </div>
      </div>
    </SceneSection>
  );
}
