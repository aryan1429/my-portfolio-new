"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, type BloomEffect } from "postprocessing";
import { director } from "./director";
import { lerp } from "./math";

const CA_OFFSET: [number, number] = [0.0007, 0.0005];

/**
 * Desktop-only post stack: mip-mapped bloom (route-tuned — warmer and hotter on /edits), a whisper
 * of radial chromatic aberration, soft film noise and a vignette.
 */
export default function Effects() {
  const bloom = useRef<BloomEffect>(null);

  useFrame(() => {
    const b = bloom.current;
    if (!b) return;
    const { presence } = director;
    const target = 0.75 + presence.edits * 0.35 + presence.tech * 0.1 + director.energy * 0.2;
    b.intensity = director.reduced ? target : lerp(b.intensity, target, 0.06);
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur intensity={0.75} luminanceThreshold={0.28} luminanceSmoothing={0.22} radius={0.72} />
      <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.35} />
      {/* Multiply keeps the grain stable on HDR (>1) pixels, where soft-light / overlay shift hue. */}
      <Noise blendFunction={BlendFunction.MULTIPLY} opacity={0.22} />
      <Vignette eskil={false} offset={0.24} darkness={0.78} />
    </EffectComposer>
  );
}
