"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import { HOST_VILLAGE, COMMUNITY_POSTS, type Review } from "@/lib/mockData";

export default function HostCommunityPage() {
  const [reviews, setReviews] = useState<Review[]>(HOST_VILLAGE.reviews);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<string[]>([]);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState("");

  const sendReply = (id: string) => {
    const draft = replyDrafts[id]?.trim();
    if (!draft) return;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, reply: draft } : r)));
    setReplyDrafts((d) => ({ ...d, [id]: "" }));
  };

  return (
    <>
      <AppHeader title="리뷰·커뮤니티 관리" showBack={false} />
      <div className="space-y-5 px-5 py-5 md:px-8 md:py-8 lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-8 lg:space-y-0">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-soft">리뷰·게시판</p>
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <p className="text-sm font-semibold">
                  {"★".repeat(r.rating)} · {r.author}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{r.content}</p>
                {r.reply ? (
                  <p className="mt-2 rounded-lg bg-sand-dark px-3 py-2 text-xs text-ink-soft">
                    ↳ {r.reply}
                  </p>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={replyDrafts[r.id] ?? ""}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                      placeholder="↩ 답글 달기"
                      className="h-9 flex-1 rounded-lg border border-line px-3 text-sm outline-none focus:border-clay-400"
                    />
                    <button
                      onClick={() => sendReply(r.id)}
                      className="rounded-lg bg-ink px-3 text-xs font-semibold text-white"
                    >
                      등록
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-soft">방문자 게시판</p>
            <Card className="flex items-center justify-between">
              <span className="text-sm">재방문자 소통 · 게시글 {COMMUNITY_POSTS[0].count + notices.length}</span>
            </Card>
            {notices.map((n, i) => (
              <Card key={i} className="mt-2 text-sm text-ink-soft">
                {n}
              </Card>
            ))}
          </div>

          {showNoticeForm ? (
            <Card>
              <textarea
                value={noticeDraft}
                onChange={(e) => setNoticeDraft(e.target.value)}
                placeholder="마을 소식을 알려주세요"
                className="h-20 w-full resize-none text-sm outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNoticeForm(false);
                    setNoticeDraft("");
                  }}
                  className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-soft"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (noticeDraft.trim()) setNotices((n) => [noticeDraft.trim(), ...n]);
                    setShowNoticeForm(false);
                    setNoticeDraft("");
                  }}
                  className="rounded-lg bg-clay-500 px-3 py-2 text-xs font-semibold text-white"
                >
                  게시
                </button>
              </div>
            </Card>
          ) : (
            <button
              onClick={() => setShowNoticeForm(true)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-clay-500 text-sm font-semibold text-white"
            >
              + 공지 작성
            </button>
          )}

          <p className="pt-2 text-center text-xs text-ink-faint">게시판 활성화 = 관계인구 전환율 ↑</p>
        </div>
      </div>
    </>
  );
}
