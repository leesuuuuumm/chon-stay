import { ButtonHTMLAttributes } from "react";

export default function Chip({
  active,
  tone = "ink",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; tone?: "ink" | "clay" }) {
  const activeClasses =
    tone === "clay" ? "bg-clay-500 text-white border-clay-500" : "bg-ink text-white border-ink";
  return (
    <button
      type="button"
      className={`h-10 rounded-full border px-4 text-sm font-medium transition-colors ${
        active ? activeClasses : "bg-white text-ink-soft border-line hover:border-ink-faint"
      } ${className}`}
      {...props}
    />
  );
}
