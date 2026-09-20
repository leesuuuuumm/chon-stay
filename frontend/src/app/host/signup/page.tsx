"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/ui/Button";
import { extractErrorMessage, fetchMyVillageApplication, signupVillage } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function HostSignupPage() {
  const router = useRouter();
  const { hydrated, accessToken, user } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    representativeName: "",
    phone: "",
    registrationNumber: "",
  });

  useEffect(() => {
    if (!hydrated || !accessToken) {
      setCheckingExisting(false);
      return;
    }
    fetchMyVillageApplication(accessToken)
      .then((application) => {
        if (application) router.replace("/host/onboarding");
      })
      .finally(() => setCheckingExisting(false));
  }, [hydrated, accessToken, router]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateRegistrationNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, registrationNumber: digitsOnly }));
  };

  if (!hydrated || checkingExisting) {
    return null;
  }

  if (!accessToken || !user) {
    return (
      <>
        <AppHeader title="마을 대표자 자격 인증" showBack={false} />
        <div className="flex flex-1 flex-col px-5 py-6 md:my-10 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
          <h2 className="text-2xl font-bold leading-snug">
            먼저 회원가입이나
            <br />
            로그인이 필요해요
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            촌스테이 계정으로 로그인한 뒤, 마을 대표자 자격 인증 서류를 추가로 제출하는 방식이에요.
          </p>
          <div className="mt-8 space-y-2">
            <Link href="/login?redirect=/host/signup">
              <Button variant="accent">로그인</Button>
            </Link>
            <Link href="/signup?redirect=/host/signup">
              <Button variant="outline">회원가입</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="마을 대표자 자격 인증" showBack={false} />
      <div className="flex flex-1 flex-col px-5 py-6 md:my-10 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
        <h2 className="text-2xl font-bold leading-snug">
          마을 대표자
          <br />
          자격 인증
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          {user.username}님 ({user.email}) 계정에 대표자 정보를 추가로 등록해요.
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
            required
            value={form.registrationNumber}
            onChange={updateRegistrationNumber}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            placeholder="사업자 등록번호 (숫자 10자리)"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 rounded-xl border border-dashed border-line bg-white px-4 py-4 text-sm text-ink-soft"
        >
          + {documentFile?.name ?? "마을 대표자 서류 업로드"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
        />

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {submitted && (
          <div className="mt-3 rounded-xl bg-clay-100 px-4 py-3 text-sm text-clay-700">
            상태: 인증 검토중 (1~2일 소요)
          </div>
        )}

        <div className="mt-auto pt-10">
          <Button
            variant="accent"
            disabled={submitting}
            onClick={async () => {
              if (!documentFile) {
                setError("대표자 서류를 업로드해주세요.");
                return;
              }
              setError(null);
              setSubmitting(true);
              try {
                await signupVillage(accessToken, {
                  representativeName: form.representativeName,
                  phone: form.phone,
                  registrationNumber: form.registrationNumber,
                  document: documentFile,
                });
                setSubmitted(true);
                setTimeout(() => router.push("/host/onboarding"), 600);
              } catch (err) {
                setError(extractErrorMessage(err, "가입 신청에 실패했어요. 잠시 후 다시 시도해주세요."));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "제출 중..." : "인증 제출"}
          </Button>
        </div>
      </div>
    </>
  );
}
