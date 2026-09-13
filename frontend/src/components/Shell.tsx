export default function Shell({
  children,
  withBottomPadding = false,
}: {
  children: React.ReactNode;
  withBottomPadding?: boolean;
}) {
  return (
    <div className="min-h-screen bg-sand-dark">
      <div
        className={`mx-auto flex min-h-screen w-full max-w-app flex-col bg-sand ${
          withBottomPadding ? "pb-20" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
