import { Reveal, SectionHeading } from "@/components/motion";
import type { Side } from "@/data/types";
import { cn } from "@/lib/cn";
import { pad2, skillGroups } from "./data";

const COLUMN = {
  tech: {
    label: "Tech",
    sub: "Full-stack & engineering",
    index: "text-tech",
    title: "text-tech-2",
    chip: "border-tech/25 bg-tech/[0.06] hover:border-tech/70 hover:bg-tech/15",
    rule: "from-tech",
  },
  edits: {
    label: "Edits",
    sub: "Editing & motion",
    index: "text-edit",
    title: "text-edit-2",
    chip: "border-edit/25 bg-edit/[0.06] hover:border-edit/70 hover:bg-edit/15",
    rule: "from-edit",
  },
} as const;

function SkillColumn({ side }: { side: Side }) {
  const groups = skillGroups(side);
  const tone = COLUMN[side];
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (groups.length === 0) return null;

  return (
    <div>
      <Reveal y={16} blur={0} className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <h3 className="font-display text-3xl font-bold tracking-tight uppercase md:text-4xl">
          <span className={tone.index}>{tone.label}</span>
          <span className="ml-3 align-middle font-mono text-[11px] font-normal tracking-[0.2em] text-mute normal-case">
            {tone.sub}
          </span>
        </h3>
        <span className="font-mono text-[11px] tracking-[0.2em] text-mute tabular-nums">{pad2(total)} items</span>
      </Reveal>

      <ul className="mt-2">
        {groups.map((group, gi) => (
          <Reveal key={group.title} as="li" y={20} blur={0} delay={(gi % 4) * 0.05} className="border-b border-line py-5">
            <div className="mb-3 flex items-center gap-3">
              <span className={cn("font-mono text-[10px] tracking-[0.2em] tabular-nums", tone.index)}>
                {pad2(gi + 1)}/{pad2(groups.length)}
              </span>
              <span aria-hidden="true" className={cn("h-px w-6 bg-linear-to-r to-transparent", tone.rule)} />
              <h4 className={cn("font-mono text-[11px] tracking-[0.2em] uppercase", tone.title)}>{group.title}</h4>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label={`${group.title} skills`}>
              {group.items.map((item) => (
                <li
                  key={item}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[11px] text-paper/85 transition-colors duration-300 md:text-xs",
                    tone.chip,
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

/** 02 — Toolkit: tech groups and edit-suite groups side by side as chip racks. */
export default function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <SectionHeading
          id="skills-title"
          index="02"
          eyebrow="Toolkit"
          title={"Stack &\nsuite"}
          description="The languages, frameworks and platforms I ship with — and the software I cut, grade and animate in."
        />
        <div className="mt-14 grid gap-14 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <SkillColumn side="tech" />
          <SkillColumn side="edits" />
        </div>
      </div>
    </section>
  );
}
