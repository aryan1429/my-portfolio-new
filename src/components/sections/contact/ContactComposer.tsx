"use client";

import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { HudFrame, MagneticButton, Reveal, SectionHeading } from "@/components/motion";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/cn";
import CopyEmailButton from "./CopyEmailButton";
import { composerMailto, INTENT_OPTIONS, openMailto, type ContactIntent } from "./mail";

type Field = "name" | "email" | "intent" | "message";

interface Values {
  name: string;
  email: string;
  intent: ContactIntent | "";
  message: string;
}

type Errors = Partial<Record<Field, string>>;

const EMPTY: Values = { name: "", email: "", intent: "", message: "" };
const FIELD_ORDER: readonly Field[] = ["name", "email", "intent", "message"];
const MESSAGE_MIN = 20;
// mailto: URLs get unreliable beyond ~2k characters in some clients; keep the draft comfortably below.
const MESSAGE_MAX = 1200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Values): Errors {
  const errors: Errors = {};
  const name = v.name.trim();
  if (!name) errors.name = "Tell me your name.";
  else if (name.length < 2) errors.name = "That name looks too short.";
  const email = v.email.trim();
  if (!email) errors.email = "Add an email so I can reply.";
  else if (!EMAIL_RE.test(email)) errors.email = "That email doesn't look right — check for typos.";
  if (!v.intent) errors.intent = "Pick what this is about.";
  const message = v.message.trim();
  if (!message) errors.message = "Write a short message.";
  else if (message.length < MESSAGE_MIN)
    errors.message = `A little more detail, please — at least ${MESSAGE_MIN} characters.`;
  return errors;
}

const TONE_CHECKED = {
  tech: "peer-checked:border-tech peer-checked:bg-tech/15 peer-checked:text-paper",
  edits: "peer-checked:border-edit peer-checked:bg-edit/15 peer-checked:text-paper",
  neutral: "peer-checked:border-paper/70 peer-checked:bg-paper/10 peer-checked:text-paper",
} as const;

const TONE_DOT = {
  tech: "bg-tech",
  edits: "bg-edit",
  neutral: "bg-paper",
} as const;

const inputBase =
  "w-full rounded-none border-0 border-b bg-transparent px-0 pb-3 pt-2 text-lg text-paper placeholder:text-paper/45 transition-colors duration-300 focus:outline-none focus-visible:outline-none md:text-xl";

/**
 * Backend-free composer: validates on the client (accessible inline errors, focus moves to the first problem)
 * and turns the draft into a mailto: URL opened in the visitor's mail client.
 */
export default function ContactComposer() {
  const email = profile.email;
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [opened, setOpened] = useState(false);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  if (!email) return null;

  const id = (f: Field | string) => `${uid}-${f}`;

  const update = (field: Field, value: string) => {
    const next = { ...values, [field]: value } as Values;
    setValues(next);
    setOpened(false);
    // After the first submit attempt, re-validate live so errors clear as soon as they're fixed.
    if (submitted) setErrors(validate(next));
  };

  const onBlur = (field: Field) => {
    if (!submitted) {
      const all = validate(values);
      const value = field === "intent" ? values.intent : values[field].trim();
      // Only nag about a field once the visitor has actually typed something in it.
      if (value) setErrors((prev) => ({ ...prev, [field]: all[field] }));
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next);
    const firstInvalid = FIELD_ORDER.find((f) => next[f]);
    if (firstInvalid) {
      refs.current[firstInvalid]?.focus();
      setOpened(false);
      return;
    }
    openMailto(
      composerMailto(email, {
        name: values.name,
        email: values.email,
        intent: values.intent as ContactIntent,
        message: values.message,
      }),
    );
    setOpened(true);
  };

  const errorCount = FIELD_ORDER.filter((f) => errors[f]).length;
  const messageLength = values.message.length;

  const describedBy = (f: Field, extra?: string) =>
    [errors[f] ? id(`${f}-error`) : null, extra ?? null].filter(Boolean).join(" ") || undefined;

  const lineTone = (f: Field) =>
    errors[f] ? "border-edit focus:border-edit" : "border-line hover:border-paper/30 focus:border-paper";

  return (
    <section aria-labelledby="contact-composer-title" className="relative py-24 md:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <SectionHeading
            id="contact-composer-title"
            index="02"
            eyebrow="Composer"
            title={"Or write it\nfrom scratch."}
            description={
              <p className="max-w-md text-paper/70">
                No inbox black hole: this drafts the email in your own mail app, addressed and ready to send.
              </p>
            }
          />
          <Reveal delay={0.1} blur={0} className="flex flex-col gap-5">
            <p className="eyebrow">Direct line</p>
            <a
              href={`mailto:${email}`}
              className="w-fit break-all font-mono text-base text-paper underline decoration-line underline-offset-8 transition-colors hover:text-accent hover:decoration-paper/60 md:text-lg"
            >
              {email}
            </a>
            <CopyEmailButton email={email} wrapperClassName="w-fit" />
          </Reveal>
        </div>

        <Reveal delay={0.08} blur={0} className="lg:col-span-7">
          <div className="relative rounded-[1.75rem] border border-line bg-ink/85 px-6 pb-12 pt-10 fine:bg-ink/60 fine:backdrop-blur-md sm:p-10 md:p-12">
            <HudFrame label="Draft — mailto" resolution="No backend" size={16} inset={10} />
            <form noValidate onSubmit={onSubmit} aria-describedby={id("hint")} className="relative flex flex-col gap-10">
              <p id={id("hint")} className="sr-only">
                All fields are required. Submitting opens your email app with this message.
              </p>

              {submitted && errorCount > 0 && (
                <p role="alert" className="font-mono text-[11px] uppercase tracking-[0.18em] text-edit">
                  {errorCount === 1 ? "1 field needs a look" : `${errorCount} fields need a look`}
                </p>
              )}

              <div className="grid gap-10 md:grid-cols-2 md:gap-8">
                <FieldShell index="01" label="Name" htmlFor={id("name")} error={errors.name} errorId={id("name-error")}>
                  <input
                    ref={(el) => {
                      refs.current.name = el;
                    }}
                    id={id("name")}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={80}
                    placeholder="Your name"
                    value={values.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("name", e.target.value)}
                    onBlur={() => onBlur("name")}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={describedBy("name")}
                    className={cn(inputBase, lineTone("name"))}
                  />
                </FieldShell>

                <FieldShell index="02" label="Email" htmlFor={id("email")} error={errors.email} errorId={id("email-error")}>
                  <input
                    ref={(el) => {
                      refs.current.email = el;
                    }}
                    id={id("email")}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    maxLength={120}
                    placeholder="you@studio.com"
                    value={values.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => update("email", e.target.value)}
                    onBlur={() => onBlur("email")}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={describedBy("email")}
                    className={cn(inputBase, lineTone("email"))}
                  />
                </FieldShell>
              </div>

              <fieldset
                aria-describedby={describedBy("intent")}
                className="flex flex-col gap-4"
              >
                <legend className="mb-4 flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
                  <span className="text-mute">03</span>
                  What&apos;s it about?
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {INTENT_OPTIONS.map((opt, i) => (
                    <label key={opt.value} className="relative cursor-pointer">
                      <input
                        ref={
                          i === 0
                            ? (el) => {
                                refs.current.intent = el;
                              }
                            : undefined
                        }
                        type="radio"
                        name="intent"
                        value={opt.value}
                        required
                        checked={values.intent === opt.value}
                        onChange={() => update("intent", opt.value)}
                        onBlur={() => onBlur("intent")}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "flex items-center gap-2.5 rounded-full border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 transition-colors duration-300 hover:border-paper/40 hover:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-paper",
                          errors.intent ? "border-edit/60" : "border-line",
                          TONE_CHECKED[opt.tone],
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 rounded-full opacity-40 transition-opacity duration-300",
                            TONE_DOT[opt.tone],
                            values.intent === opt.value && "opacity-100",
                          )}
                        />
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError id={id("intent-error")} message={errors.intent} />
              </fieldset>

              <FieldShell
                index="04"
                label="Message"
                htmlFor={id("message")}
                error={errors.message}
                errorId={id("message-error")}
                aside={
                  <span
                    id={id("message-count")}
                    className={cn(
                      "font-mono text-[10px] tabular-nums tracking-[0.16em]",
                      messageLength >= MESSAGE_MAX ? "text-edit-2" : "text-mute",
                    )}
                  >
                    {String(messageLength).padStart(4, "0")} / {MESSAGE_MAX}
                  </span>
                }
              >
                <textarea
                  ref={(el) => {
                    refs.current.message = el;
                  }}
                  id={id("message")}
                  name="message"
                  required
                  rows={5}
                  minLength={MESSAGE_MIN}
                  maxLength={MESSAGE_MAX}
                  placeholder="What are we making? Links, timeline, budget — whatever helps."
                  value={values.message}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("message", e.target.value)}
                  onBlur={() => onBlur("message")}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={describedBy("message", id("message-count"))}
                  data-lenis-prevent
                  className={cn(inputBase, "min-h-36 resize-y leading-relaxed", lineTone("message"))}
                />
              </FieldShell>

              <div className="flex flex-col-reverse items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p aria-live="polite" className="max-w-xs font-mono text-[11px] leading-relaxed tracking-[0.06em] text-mute">
                  {opened
                    ? "Draft handed to your mail app. Nothing opened? Copy the address and send it from anywhere."
                    : "Opens your default mail app — nothing is stored here."}
                </p>
                <MagneticButton
                  type="submit"
                  strength={0.3}
                  className="group inline-flex items-center gap-3 rounded-full bg-paper px-7 py-4 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-linear-to-r hover:from-tech hover:to-edit hover:text-paper"
                >
                  Draft the email
                  <span className="relative inline-flex size-4 overflow-hidden" aria-hidden="true">
                    <ArrowUpRight className="size-4 transition-transform duration-500 ease-expo group-hover:-translate-y-full group-hover:translate-x-full" />
                    <ArrowUpRight className="absolute size-4 -translate-x-full translate-y-full transition-transform duration-500 ease-expo group-hover:translate-x-0 group-hover:translate-y-0" />
                  </span>
                </MagneticButton>
              </div>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-edit">
      <span aria-hidden="true" className="inline-block size-1 rounded-full bg-edit" />
      {message}
    </p>
  );
}

function FieldShell({
  index,
  label,
  htmlFor,
  error,
  errorId,
  aside,
  children,
}: {
  index: string;
  label: string;
  htmlFor: string;
  error?: string;
  errorId: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
          <span className="text-mute">{index}</span>
          {label}
        </label>
        {aside}
      </div>
      {children}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
