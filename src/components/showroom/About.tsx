import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";

export default function About() {
  return (
    <SceneSection scene="cv" id="about" className="section">
      <div className="wrap">
        <div className="col">
          <h2>{copy.about.title}</h2>
          <p>{copy.about.body}</p>
          <ul className="ck">{copy.about.facts.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      </div>
    </SceneSection>
  );
}
