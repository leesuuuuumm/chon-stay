import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 disabled:bg-ink/30",
  accent: "bg-clay-500 text-white hover:bg-clay-600 disabled:bg-clay-500/30",
  outline: "bg-white text-ink border border-line hover:bg-sand-dark",
  ghost: "bg-transparent text-ink-soft hover:bg-sand-dark",
};

const sizeClasses: Record<Size, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "lg",
  fullWidth = true,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={`rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${
        fullWidth ? "w-full" : ""
      } ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
