import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import s from "./Hero.module.css";

export default function Hero() {
  return (
    <SceneSection scene="cv" className={s.sec}>
      <div className={s.col}>
        <h1>{copy.hero.title}</h1>
        <p className={s.lead}>{copy.hero.lead}</p>
        <div className={s.row}>
          <OpenButton variant="sun">{copy.hero.secondary}</OpenButton>
          <a className={buttonClass("outline")} href="#services">{copy.hero.primary}</a>
        </div>
      </div>
    </SceneSection>
  );
}
