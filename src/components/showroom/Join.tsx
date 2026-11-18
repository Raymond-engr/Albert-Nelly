import { OpenButton } from "@/components/shared/OpenButton";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import { site } from "@/data/site";

export default function Join() {
  return (
    <SceneSection scene="bub" id="join" className="section">
      <div className="wrap">
        <div className="col">
          <h2>{copy.join.title}</h2>
          <p>{copy.join.lead}</p>
          <div className="my-5"><OpenButton variant="sun" big>{copy.join.cta}</OpenButton></div>
          <p className="note">
            WhatsApp {site.whatsappDisplay}<br />
            <a href={`mailto:${site.email}`}>{site.email}</a><br />
            {site.social}
          </p>
        </div>
      </div>
    </SceneSection>
  );
}
