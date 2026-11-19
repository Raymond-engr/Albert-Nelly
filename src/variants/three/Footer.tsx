import { site } from "@/data/site";
import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer data-inert-on-modal className={s.f}>
      {site.name}. WhatsApp {site.whatsappDisplay}. {site.email}. <a href="#">Privacy</a> and <a href="#">Terms</a>.
    </footer>
  );
}
