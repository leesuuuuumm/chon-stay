"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/ui/Button";

// TODO: 백엔드에 마을(Village) 회원가입/로그인 API가 아직 없어 이 폼은 로컬 상태만 채우고
// 백엔드 연동 없이 다음 단계로 넘어간다. ERD 기준 Village 테이블의
// email/password/representativeName/phone/registrationNumber 필드에 대응한다.
export default function HostSignupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    representativeName: "",
    phone: "",
    email: "",
    password: "",
    registrationNumber: "",
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <AppHeader title="마을 계정 가입·인증" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6 md:my-10 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
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

        <div className="mt-6 space-y-3">
          <input
            required
            value={form.representativeName}
            onChange={update("representativeName")}
            placeholder="대표자 성함"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
          />
          <input
            required
            value={form.phone}
            onChange={update("phone")}
            placeholder="연락처"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
          />
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="이메일 (로그인 아이디)"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={update("password")}
            placeholder="비밀번호"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
          />
          <input
            required
            value={form.registrationNumber}
            onChange={update("registrationNumber")}
            placeholder="마을기업·사업자 등록번호"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
          />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5">
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
