/**
 * mailto: helpers shared by the contact sections. No backend: every "send" drafts an email in the
 * visitor's own mail client. Templates are prompts for the sender, not claims about Aryan.
 */

export type ContactIntent = "development" | "video" | "other";

export interface IntentOption {
  value: ContactIntent;
  /** Short label for the composer selector. */
  label: string;
  /** Tag prefixed to the composer subject line. */
  tag: string;
  tone: "tech" | "edits" | "neutral";
}

export const INTENT_OPTIONS: readonly IntentOption[] = [
  { value: "development", label: "Development", tag: "Development", tone: "tech" },
  { value: "video", label: "Video Edit", tag: "Video Edit", tone: "edits" },
  { value: "other", label: "Other", tag: "Hello", tone: "neutral" },
];

/** Build a mailto: URL. encodeURIComponent keeps spaces as %20 (URLSearchParams would use "+"). */
export function buildMailto(email: string, subject: string, body: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`];
  return `mailto:${email}?${params.join("&")}`;
}

/** Prefilled briefs for the two intent cards. */
export const INTENT_TEMPLATES: Record<Exclude<ContactIntent, "other">, { subject: string; body: string }> = {
  development: {
    subject: "Development project — let's build",
    body: [
      "Hi Aryan,",
      "",
      "I'd like to talk about a full-stack / development project.",
      "",
      "- What we're building (web app, mobile app, AI feature, backend...):",
      "- Where it stands today (idea, design, existing codebase + link):",
      "- Stack preferences, if any:",
      "- Timeline:",
      "- Budget range:",
      "",
      "Thanks,",
      "",
    ].join("\n"),
  },
  video: {
    subject: "Video edit / motion project — let's cut",
    body: [
      "Hi Aryan,",
      "",
      "I'd like to talk about a video editing / motion graphics project.",
      "",
      "- Type of piece (cinematic edit, short-form, YouTube video, motion graphics...):",
      "- Footage / assets (link):",
      "- Length and aspect ratio (16:9, 9:16, 1:1):",
      "- Music and reference edits:",
      "- Deadline:",
      "",
      "Thanks,",
      "",
    ].join("\n"),
  },
};

export interface ComposerDraft {
  name: string;
  email: string;
  intent: ContactIntent;
  message: string;
}

export function composerMailto(to: string, draft: ComposerDraft): string {
  const option = INTENT_OPTIONS.find((o) => o.value === draft.intent);
  const name = draft.name.trim();
  const subject = `[${option?.tag ?? "Hello"}] ${name ? `Message from ${name}` : "New message"}`;
  const signature = [name, draft.email.trim(), option ? `Re: ${option.label}` : ""].filter(Boolean);
  const body = `${draft.message.trim()}\n\n—\n${signature.join("\n")}\n`;
  return buildMailto(to, subject, body);
}

/** Open a mailto: URL in the current tab (mail clients take over; the page stays put). */
export function openMailto(url: string): void {
  if (typeof window === "undefined") return;
  window.location.href = url;
}

/** Copy text to the clipboard; falls back to a hidden textarea + execCommand on older / insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  area.style.pointerEvents = "none";
  document.body.appendChild(area);
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  previous?.focus({ preventScroll: true });
  return ok;
}
