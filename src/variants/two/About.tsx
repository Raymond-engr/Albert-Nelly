"use client";

import { useEffect, useRef, useState } from "react";
import { SceneSection } from "@/components/shared/SceneSection";
import { copy } from "@/data/copy";
import s from "./About.module.css";

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setSeen(true));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <SceneSection scene="cv" id="about" className={s.sec}>
      <div ref={ref} className={`${s.card} ${seen ? s.in : ""}`}>
        <h2>{copy.about.title}</h2>
        <p>{copy.about.body}</p>
        <ul className={s.facts}>{copy.about.facts.map((f) => <li key={f}>{f}</li>)}</ul>
      </div>
    </SceneSection>
  );
}
