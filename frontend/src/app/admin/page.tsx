"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import {
  approveVillageApplication,
  extractErrorMessage,
  fetchVillageDocumentUrl,
  listVillageApplications,
  rejectVillageApplication,
  type VillageApplication,
} from "@/lib/api";

const STATUS_LABEL: Record<VillageApplication["status"], string> = {
  pending: "검토중",
  approved: "승인됨",
  rejected: "거절됨",
};

const STATUS_CLASS: Record<VillageApplication["status"], string> = {
  pending: "bg-clay-100 text-clay-700",
  approved: "bg-leaf-100 text-leaf-600",
  rejected: "bg-red-50 text-red-600",
};

export default function AdminPage() {
  const router = useRouter();
  const { hydrated, accessToken, user } = useAppStore();
  const [applications, setApplications] = useState<VillageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken || !user?.is_admin) {
      router.replace("/login");
    }
  }, [hydrated, accessToken, user, router]);

  useEffect(() => {
    if (!hydrated || !accessToken || !user?.is_admin) return;
    let cancelled = false;
    setLoading(true);
    listVillageApplications(accessToken)
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, "목록을 불러오지 못했어요."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken, user]);

  const handleViewDocument = async (application: VillageApplication) => {
    if (!accessToken) return;
    try {
      const url = await fetchVillageDocumentUrl(application.id, accessToken);
      window.open(url, "_blank");
    } catch (err) {
      setError(extractErrorMessage(err, "서류를 불러오지 못했어요."));
    }
  };

  const handleDecision = async (application: VillageApplication, decision: "approve" | "reject") => {
    if (!accessToken) return;
    setError(null);
    setActioningId(application.id);
    try {
      const updated =
        decision === "approve"
          ? await approveVillageApplication(application.id, accessToken)
          : await rejectVillageApplication(application.id, accessToken);
      setApplications((list) => list.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError(extractErrorMessage(err, "처리에 실패했어요."));
    } finally {
      setActioningId(null);
    }
  };

  if (!hydrated || !accessToken || !user?.is_admin) {
    return null;
  }

  return (
    <Shell size="wide">
      <AppHeader title="마을 대표자 승인 관리" />
      <div className="flex-1 space-y-4 px-5 py-5 md:px-8 md:py-8">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-ink-faint">불러오는 중...</p>
        ) : applications.length === 0 ? (
          <Card className="py-10 text-center text-sm text-ink-faint">
            아직 들어온 가입 신청이 없어요.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {applications.map((application) => (
              <Card key={application.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{application.representative_name}</p>
                    <p className="text-sm text-ink-soft">{application.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[application.status]}`}
                  >
                    {STATUS_LABEL[application.status]}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-ink-soft">
                  <p>연락처: {application.phone}</p>
                  <p>사업자 등록번호: {application.registration_number}</p>
                  <p>신청일: {new Date(application.created_date).toLocaleString("ko-KR")}</p>
                </div>

                <button
                  onClick={() => handleViewDocument(application)}
                  className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sand-dark"
                >
                  대표자 서류 보기
                </button>

                {application.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="accent"
                      size="md"
                      disabled={actioningId === application.id}
                      onClick={() => handleDecision(application, "approve")}
                    >
                      승인
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      disabled={actioningId === application.id}
                      onClick={() => handleDecision(application, "reject")}
                    >
                      거절
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
