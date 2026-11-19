import { oneCopy } from "@/data/one";
import s from "./proto.module.css";

export default function Footer() {
  return (
    <div className={s.t}>
      <footer data-inert-on-modal>{oneCopy.footer}</footer>
    </div>
  );
}
