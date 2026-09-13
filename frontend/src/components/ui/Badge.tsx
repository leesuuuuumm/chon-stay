import { HTMLAttributes } from "react";

type Tone = "clay" | "leaf" | "neutral" | "warn";

const toneClasses: Record<Tone, string> = {
  clay: "bg-clay-100 text-clay-700",
  leaf: "bg-leaf-100 text-leaf-600",
  neutral: "bg-sand-dark text-ink-soft",
  warn: "bg-clay-100 text-clay-700",
};

export default function Badge({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
