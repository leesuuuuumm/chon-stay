type Size = "narrow" | "medium" | "wide";

const sizeClasses: Record<Size, string> = {
  narrow: "max-w-xl",
  medium: "max-w-3xl",
  wide: "max-w-6xl",
};

export default function Shell({
  children,
  withBottomPadding = false,
  size = "narrow",
}: {
  children: React.ReactNode;
  withBottomPadding?: boolean;
  size?: Size;
}) {
  return (
    <div
      className={`mx-auto flex min-h-screen w-full flex-col bg-sand ${sizeClasses[size]} ${
        withBottomPadding ? "pb-20 lg:pb-10" : ""
      }`}
    >
      {children}
    </div>
  );
}
