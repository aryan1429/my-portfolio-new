"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { MagneticButton } from "@/components/motion";
import { cn } from "@/lib/cn";
import { copyText } from "./mail";

type CopyStatus = "idle" | "copied" | "failed";

interface CopyEmailButtonProps {
  email: string;
  className?: string;
  wrapperClassName?: string;
}

/** Magnetic "Copy email" pill with copied / failed feedback (visual + polite live region). */
export default function CopyEmailButton({ email, className, wrapperClassName }: CopyEmailButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    const ok = await copyText(email);
    setStatus(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2200);
  };

  const copied = status === "copied";

  return (
    <>
      <MagneticButton
        onClick={onCopy}
        strength={0.25}
        aria-label={copied ? "Email copied to clipboard" : `Copy email address ${email}`}
        wrapperClassName={wrapperClassName}
        className={cn(
          "group relative inline-flex items-center gap-3 overflow-hidden rounded-full border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300",
          copied
            ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
            : "border-line bg-ink/40 text-paper hover:border-paper/40",
          className,
        )}
      >
        <span className="relative inline-flex size-4 items-center justify-center" aria-hidden="true">
          <Copy
            className={cn(
              "absolute size-4 transition-all duration-300 ease-expo",
              copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Check
            className={cn(
              "absolute size-4 transition-all duration-300 ease-expo",
              copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
        <span>{copied ? "Copied" : status === "failed" ? "Copy failed" : "Copy email"}</span>
      </MagneticButton>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${email} copied to clipboard` : status === "failed" ? "Could not copy. Select the address manually." : ""}
      </span>
    </>
  );
}
