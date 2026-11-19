import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import { OpenBtn } from "./OpenBtn";
import s from "./proto.module.css";

export default function Hero() {
  const c = oneCopy.hero;
  return (
    <div className={s.t}>
      <SceneSection scene="cv" className={s.hero}>
        <div className={s.hcopy}>
          <h1>{c.title}</h1>
          <p className={s.lede}>{c.lede}</p>
          <div className={s.row}>
            <OpenBtn className={`${s.btn} ${s.sun}`}>{c.primary}</OpenBtn>
            <a className={`${s.btn} ${s.ghost}`} href="#services">{c.secondary}</a>
          </div>
        </div>
        <div className={s.stage} data-stage="cv" aria-hidden="true" />
      </SceneSection>
    </div>
  );
}
