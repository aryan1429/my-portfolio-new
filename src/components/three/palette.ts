/**
 * Colour constants for the WebGL layer. Mirrors the design tokens in globals.css
 * (`--color-*`) so the 3D scenes and the DOM speak the same palette.
 */
export const PALETTE = {
  ink: "#07070A",
  ink2: "#0E0E13",
  paper: "#F4F4F6",
  tech: "#5B6CFF",
  tech2: "#22D3EE",
  edit: "#FF2E4D",
  edit2: "#FFB020",
} as const;

/** Per-route clear colours: a barely perceptible cool / warm cast under each scene. */
export const BACKGROUND = {
  home: "#07070A",
  contact: "#07070A",
  tech: "#05060D",
  edits: "#0B0608",
} as const;
