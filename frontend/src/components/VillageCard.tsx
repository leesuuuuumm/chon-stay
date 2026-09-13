import Link from "next/link";
import Badge from "@/components/ui/Badge";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import type { Village } from "@/lib/mockData";

export default function VillageCard({ village }: { village: Village }) {
  return (
    <Link href={`/villages/${village.id}`} className="block">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-transform active:scale-[0.99]">
        <PhotoPlaceholder label="village photo" className="h-36" />
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-bold">{village.name}</h3>
          <p className="text-sm text-ink-soft">
            &ldquo;{village.matchTag}&rdquo; · 매칭 {village.matchPercent}%
          </p>
          {village.urgencyLabel && <Badge tone="clay">{village.urgencyLabel}</Badge>}
        </div>
      </div>
    </Link>
  );
}
