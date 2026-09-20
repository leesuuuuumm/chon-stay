"use client";

import { useEffect, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import {
  REVIEW_MAX_LENGTH,
  extractErrorMessage,
  fetchReviews,
  type ReviewList,
} from "@/lib/api";
import { formatKstDate } from "@/lib/dates";

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`text-clay-500 ${className}`} aria-label={`${rating}점`}>
      {"★".repeat(rating)}
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** 화면 가운데에 떠 있는 창. 바깥 영역이나 Esc로 닫는다. */
function FloatingModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <p className="min-w-0 truncate font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-dark text-lg leading-none text-ink-soft"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 별점(1~5)과 짧은 코멘트를 입력하는 리뷰 작성 창. initial을 주면 수정 창으로 쓰인다. */
export function ReviewFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: { rating: number; comment: string };
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = rating > 0 && comment.trim().length > 0 && !submitting;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
    } catch (err) {
      setError(extractErrorMessage(err, "리뷰를 저장하지 못했어요."));
      setSubmitting(false);
    }
  };

  return (
    <FloatingModal title={title} onClose={onClose}>
      <div className="space-y-4 overflow-y-auto px-5 py-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-soft">별점</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n}점`}
                onClick={() => setRating(n)}
                className={`text-3xl leading-none ${n <= rating ? "text-clay-500" : "text-line"}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-ink-soft">{rating > 0 ? `${rating}점` : "점수를 선택해주세요"}</span>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-soft">한줄 리뷰</p>
          <textarea
            value={comment}
            maxLength={REVIEW_MAX_LENGTH}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="다녀온 경험을 남겨주세요"
            className="w-full resize-none rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-ink"
          />
          <p className="mt-1 text-right text-xs text-ink-faint">
            {comment.length} / {REVIEW_MAX_LENGTH}
          </p>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <Button disabled={!canSubmit} onClick={submit}>
          {submitting ? "저장 중..." : initial ? "수정 완료" : "리뷰 등록"}
        </Button>
      </div>
    </FloatingModal>
  );
}

/** 체험/숙박 하나에 달린 리뷰를 보여주는 창 */
export function ReviewListModal({
  title,
  target,
  onClose,
}: {
  title: string;
  target: { experienceId: number } | { lodgingId: number };
  onClose: () => void;
}) {
  const [data, setData] = useState<ReviewList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews(target)
      .then(setData)
      .catch((err) => setError(extractErrorMessage(err, "리뷰를 불러오지 못했어요.")));
    // target은 열릴 때 한 번만 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FloatingModal title={`${title} 리뷰`} onClose={onClose}>
      <div className="space-y-3 overflow-y-auto px-5 py-4">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : data === null ? (
          <p className="py-6 text-center text-sm text-ink-faint">불러오는 중...</p>
        ) : data.count === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">아직 등록된 리뷰가 없어요.</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-semibold">★ {data.average_rating?.toFixed(1)}</span>
              <span className="text-ink-soft"> · 리뷰 {data.count}개</span>
            </p>
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="space-y-1 border-t border-line pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={r.rating} className="text-sm" />
                    <span className="text-xs text-ink-faint">
                      {r.author} · {formatKstDate(r.created_date)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-ink-soft">{r.comment}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </FloatingModal>
  );
}
