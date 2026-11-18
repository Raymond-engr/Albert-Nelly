import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import s from "./Hero.module.css";

export default function Hero() {
  return (
    <SceneSection scene="cv" className={s.hero}>
      <div className="wrap">
        <div className={`col ${s.in}`}>
          <h1>{copy.hero.title}</h1>
          <p className={s.lead}>{copy.hero.lead}</p>
          <div className={s.acts}>
            <a className={buttonClass("dark")} href="#services">{copy.hero.primary}</a>
            <OpenButton variant="sun">{copy.hero.secondary}</OpenButton>
          </div>
        </div>
      </div>
    </SceneSection>
  );
}
