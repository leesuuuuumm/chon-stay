"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/ui/Button";

export default function HostSignupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <AppHeader title="마을 계정 가입·인증" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6">
        <h2 className="text-2xl font-bold leading-snug">
          마을 대표자
          <br />
          자격 인증
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          일반 회원과 분리된 별도 가입.
          <br />
          신뢰를 위해 검증이 필수입니다.
        </p>

        <div className="mt-8 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5">
          <span className="text-sm font-medium">농어촌공사 등록마을 조회</span>
          <span className="text-leaf-500">✓</span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 rounded-xl border border-dashed border-line bg-white px-4 py-4 text-sm text-ink-soft"
        >
          + {fileName ?? "마을 대표자 서류 업로드"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />

        {submitted && (
          <div className="mt-3 rounded-xl bg-clay-100 px-4 py-3 text-sm text-clay-700">
            상태: 인증 검토중 (1~2일 소요)
          </div>
        )}

        <div className="mt-auto pt-10">
          <Button
            variant="accent"
            onClick={() => {
              setSubmitted(true);
              setTimeout(() => router.push("/host/onboarding"), 600);
            }}
          >
            인증 제출
          </Button>
        </div>
      </div>
    </>
  );
}
