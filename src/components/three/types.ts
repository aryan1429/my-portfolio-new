import type { IUniform, ShaderMaterial } from "three";

/** A ShaderMaterial whose `uniforms` object has a known, typed shape. */
export type ShaderMat<U> = ShaderMaterial & { uniforms: U };

/** Maps `{ uTime: number }` to `{ uTime: IUniform<number> }`. */
export type UniformsOf<T> = { [K in keyof T]: IUniform<T[K]> };

/** Geometry budget: `low` on touch / small screens, `high` on desktop. */
export type Detail = "high" | "low";
