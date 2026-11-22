// Motion primitives barrel. Every component here is a client component ("use client" in its own file),
// so this barrel can be imported from server components too.

export { default as KineticText } from "./KineticText";
export type { KineticTextProps, KineticMode, KineticTag, KineticTrigger } from "./KineticText";

export { default as ScrambleText } from "./ScrambleText";
export type { ScrambleTextProps, ScrambleTag, ScrambleTrigger } from "./ScrambleText";

export { default as Reveal } from "./Reveal";
export type { RevealProps, RevealTag } from "./Reveal";

export { default as MagneticButton } from "./MagneticButton";
export type { MagneticButtonProps } from "./MagneticButton";

export { default as Marquee } from "./Marquee";
export type { MarqueeProps } from "./Marquee";

export { default as Timecode } from "./Timecode";
export type { TimecodeProps } from "./Timecode";

export { default as SectionHeading } from "./SectionHeading";
export type { SectionHeadingProps } from "./SectionHeading";

export { default as TiltCard } from "./TiltCard";
export type { TiltCardProps } from "./TiltCard";

export { default as ScrollProgress } from "./ScrollProgress";
export type { ScrollProgressProps } from "./ScrollProgress";

export { default as HudFrame } from "./HudFrame";
export type { HudFrameProps } from "./HudFrame";

export { default as Counter } from "./Counter";
export type { CounterProps } from "./Counter";

// Owned by FOUNDATION, re-exported for convenience.
export { default as Cursor } from "./Cursor";
export { default as Grain } from "./Grain";
