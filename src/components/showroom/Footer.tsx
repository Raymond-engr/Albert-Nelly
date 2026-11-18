import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer data-inert-on-modal className="relative z-[1] border-t border-line bg-paper pb-24 pt-10">
      <div className="wrap flex flex-wrap justify-between gap-4 text-sm">
        <span className="font-display text-lg font-bold">{site.name}</span>
        <span className="flex gap-4"><a href="#">Privacy</a><a href="#">Terms</a></span>
      </div>
    </footer>
  );
}
