"use client";

import { useEffect, useRef, useState } from "react";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { resolveImageUrl, type ListingImage } from "@/lib/api";

// 대표 사진(is_cover)을 맨 앞으로 정렬한다.
export function orderImages(images: ListingImage[] | undefined) {
  return [...(images ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.id - b.id,
  );
}

/** 카드 위에 들어가는 대표 사진 1장. 사진이 여러 장이면 개수를 함께 표시한다. */
export function CardPhoto({ images, alt }: { images: ListingImage[]; alt: string }) {
  if (images.length === 0) {
    return <PhotoPlaceholder label="사진 준비 중" className="h-36 rounded-xl" />;
  }
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveImageUrl(images[0].image_path)}
        alt={alt}
        className="h-36 w-full rounded-xl object-cover"
      />
      {images.length > 1 && (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          +{images.length - 1}
        </span>
      )}
    </div>
  );
}

/** 사진을 크게 보고 좌우로 넘겨보는 뷰어 (버튼, 방향키, 스와이프 지원) */
export default function PhotoViewer({
  title,
  images,
  onClose,
}: {
  title: string;
  images: ListingImage[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const move = (delta: number) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-black/85"
      role="dialog"
      aria-label={`${title} 사진`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="truncate text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveImageUrl(images[index].image_path)}
          alt={`${title} ${index + 1}`}
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 사진"
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-2xl text-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-2xl text-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1.5 pb-5" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 사진`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
