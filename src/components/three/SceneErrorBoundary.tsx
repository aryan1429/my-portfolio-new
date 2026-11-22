"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface SceneErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the children after an error (default: nothing). */
  fallback?: ReactNode;
  onError?: (error: unknown) => void;
}

interface SceneErrorBoundaryState {
  failed: boolean;
}

/**
 * Isolates optional 3D content (thumbnail textures, a whole scene) so a failure degrades to the
 * fallback instead of unmounting the canvas.
 */
export default class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError?.(error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[three] content failed to render; using fallback.", error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
