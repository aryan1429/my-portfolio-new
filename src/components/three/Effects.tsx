"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { director } from "./director";
import { lerp } from "./math";

/**
 * Desktop-only post stack: mip-mapped bloom (route-tuned — warmer and hotter on /edits) and a
 * vignette. Film grain comes from the CSS <Grain/> overlay, so there is no noise pass here.
 * `enabled={false}` hands rendering back to R3F without unmounting (no render-target realloc).
 */
export default function Effects({ enabled = true }: { enabled?: boolean }) {
  const bloom = useRef<BloomEffect>(null);

  useFrame(() => {
    const b = bloom.current;
    if (!b || !enabled) return;
    const { presence } = director;
    const target = 0.75 + presence.edits * 0.35 + presence.tech * 0.1 + director.energy * 0.2;
    b.intensity = director.reduced ? target : lerp(b.intensity, target, 0.06);
  });

  return (
    <EffectComposer enabled={enabled} multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.75} luminanceThreshold={0.28} luminanceSmoothing={0.22} radius={0.72} />
      <Vignette eskil={false} offset={0.24} darkness={0.78} />
    </EffectComposer>
  );
}
