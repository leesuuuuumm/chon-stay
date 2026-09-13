export default function PhotoPlaceholder({
  label,
  className = "",
  emoji = "🌾",
}: {
  label?: string;
  className?: string;
  emoji?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-leaf-100 via-clay-100 to-sand-dark ${className}`}
    >
      <div className="flex flex-col items-center gap-1 text-ink-faint">
        <span className="text-2xl">{emoji}</span>
        {label && <span className="text-xs font-medium">{label}</span>}
      </div>
    </div>
  );
}
