"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export default function HostOnboardingPage() {
  const router = useRouter();
  const [manual, setManual] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <AppHeader title="마을 정보 등록" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6">
        <h2 className="text-2xl font-bold leading-snug">
          정보를 어떻게
          <br />
          등록할까요?
        </h2>
        <p className="mt-3 text-sm text-ink-soft">타이핑 대신 편한 방식을 골라주세요</p>

        {!manual ? (
          <div className="mt-6 space-y-3">
            <Card className="border-clay-300 bg-clay-50">
              <div className="flex items-center justify-between">
                <p className="font-semibold">카카오톡 챗봇으로 등록</p>
                <Badge tone="clay">기본</Badge>
              </div>
              <div className="mt-3 space-y-2">
                <div className="w-fit rounded-2xl rounded-tl-none bg-white px-3 py-2 text-sm shadow-card">
                  몇 명까지 잘 수 있나요?
                </div>
                <div className="ml-auto w-fit rounded-2xl rounded-tr-none bg-clay-500 px-3 py-2 text-sm text-white">
                  4명이요
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-faint">질문에 답만 하면 폼이 자동 완성돼요</p>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <p className="font-semibold">사진 찍어 AI 자동 입력</p>
                <Badge>선택</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                방 사진·안내판을 올리면 초안을 만들어드려요 (OCR)
              </p>
            </Card>

            <button
              onClick={() => setManual(true)}
              className="mx-auto block pt-2 text-sm text-ink-faint underline underline-offset-2"
            >
              또는 폼으로 직접 입력
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="마을 이름"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
            />
            <input
              placeholder="최대 수용 인원 (예: 4명)"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
            />
            <textarea
              placeholder="마을 소개"
              className="h-24 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
            />
            <button
              onClick={() => setManual(false)}
              className="text-sm text-ink-faint underline underline-offset-2"
            >
              다른 방식으로 등록할래요
            </button>
          </div>
        )}

        <div className="mt-auto pt-10">
          <Button variant="accent" onClick={() => router.push("/host/dashboard")}>
            {manual ? "정보 저장하고 시작하기" : "카카오톡으로 시작하기"}
          </Button>
        </div>
      </div>
    </>
  );
}
