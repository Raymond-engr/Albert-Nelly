import { SceneSection } from "@/components/shared/SceneSection";
import { oneCopy } from "@/data/one";
import s from "./proto.module.css";

export default function About() {
  const c = oneCopy.about;
  return (
    <div className={s.t}>
      <SceneSection scene="cv" id="about" className={s.sec}>
        <div className={s.about}>
          <div>
            <h2>{c.title}</h2>
            <p>{c.body}</p>
          </div>
          <ul className={s.facts}>{c.facts.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      </SceneSection>
    </div>
  );
}
