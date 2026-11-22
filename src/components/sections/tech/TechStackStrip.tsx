import { Marquee } from "@/components/motion";
import { techProjects } from "@/data/portfolio";
import { uniqueStack } from "./utils";

const STACK = uniqueStack(techProjects);

/** Velocity-reactive ticker of every technology used across the projects. */
export default function TechStackStrip() {
  if (STACK.length === 0) return null;
  return (
    <section aria-label="Technologies used across projects" className="relative border-y border-line bg-ink/55">
      <p className="sr-only">{STACK.join(", ")}</p>
      <Marquee
        items={STACK}
        speed={55}
        className="py-5 font-display text-[clamp(1.5rem,4vw,3rem)] font-bold uppercase tracking-[-0.02em] text-paper/85 md:py-7"
        separator={
          <span aria-hidden="true" className="mx-[0.6em] inline-block font-mono text-[0.45em] text-tech-2">
            {"//"}
          </span>
        }
      />
    </section>
  );
}
