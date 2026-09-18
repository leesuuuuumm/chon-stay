"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAppStore } from "@/lib/store";
import {
  createExperience,
  createLodging,
  extractErrorMessage,
  fetchMyListings,
  fetchMyVillageApplication,
  resolveImageUrl,
  updateMyVillageProfile,
  uploadExperienceImages,
  uploadLodgingImages,
  uploadMyVillagePhoto,
  type ExperienceListing,
  type LodgingListing,
  type VillageApplication,
} from "@/lib/api";

type ExperienceDraft = {
  title: string;
  startDate: string;
  endDate: string;
  price: string;
  capacity: string;
  images: File[];
  coverIndex: number;
};
type LodgingDraft = {
  title: string;
  unit: string;
  price: string;
  capacity: string;
  images: File[];
  coverIndex: number;
};

const emptyExperienceDraft: ExperienceDraft = {
  title: "",
  startDate: "",
  endDate: "",
  price: "",
  capacity: "",
  images: [],
  coverIndex: 0,
};
const emptyLodgingDraft: LodgingDraft = {
  title: "",
  unit: "",
  price: "",
  capacity: "",
  images: [],
  coverIndex: 0,
};

function formatDateRange(startDate: string, endDate: string) {
  const format = (iso: string) => {
    const [, month, day] = iso.split("-");
    return `${Number(month)}월 ${Number(day)}일`;
  };
  return `${format(startDate)} ~ ${format(endDate)}`;
}

// 여러 장의 사진을 추가하고, 그 중 하나를 눌러 대표 사진으로 지정하는 입력 필드.
function ImagePickerField({
  images,
  coverIndex,
  onChange,
}: {
  images: File[];
  coverIndex: number;
  onChange: (images: File[], coverIndex: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-dashed border-line bg-white px-4 py-2.5 text-left text-sm text-ink-soft"
      >
        + 사진 추가{images.length > 0 ? ` (${images.length}장)` : ""}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const newFiles = Array.from(e.target.files ?? []);
          if (newFiles.length > 0) onChange([...images, ...newFiles], coverIndex);
          e.target.value = "";
        }}
      />
      {images.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {images.map((file, i) => (
              <div key={i} className="relative">
                <button
                  type="button"
                  onClick={() => onChange(images, i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    i === coverIndex ? "border-clay-400" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                </button>
                {i === coverIndex && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-clay-400 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    대표
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = images.filter((_, idx) => idx !== i);
                    const nextCover =
                      i === coverIndex ? 0 : coverIndex > i ? coverIndex - 1 : coverIndex;
                    onChange(next, nextCover);
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink-soft text-[10px] text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">사진을 눌러 대표 사진으로 지정할 수 있어요.</p>
        </>
      )}
    </div>
  );
}

export default function HostOnboardingPage() {
  const router = useRouter();
  const { hydrated, accessToken } = useAppStore();
  const [village, setVillage] = useState<VillageApplication | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [savedExperiences, setSavedExperiences] = useState<ExperienceListing[]>([]);
  const [savedLodgings, setSavedLodgings] = useState<LodgingListing[]>([]);

  const [villageName, setVillageName] = useState("");
  const [villageDescription, setVillageDescription] = useState("");
  const [villagePhotoFile, setVillagePhotoFile] = useState<File | null>(null);
  const villagePhotoInputRef = useRef<HTMLInputElement>(null);
  const [experienceDrafts, setExperienceDrafts] = useState<ExperienceDraft[]>([]);
  const [lodgingDrafts, setLodgingDrafts] = useState<LodgingDraft[]>([]);
  const [experienceEntry, setExperienceEntry] = useState<ExperienceDraft>(emptyExperienceDraft);
  const [lodgingEntry, setLodgingEntry] = useState<LodgingDraft>(emptyLodgingDraft);
  const [editingExperience, setEditingExperience] = useState(false);
  const [editingLodging, setEditingLodging] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace("/login?redirect=/host/onboarding");
      return;
    }
    fetchMyVillageApplication(accessToken)
      .then(async (application) => {
        if (!application) {
          router.replace("/host/signup");
          return;
        }
        setVillage(application);
        setVillageName(application.name ?? "");
        setVillageDescription(application.description ?? "");
        if (application.status === "approved") {
          const listings = await fetchMyListings(accessToken);
          setSavedExperiences(listings.experiences);
          setSavedLodgings(listings.lodgings);
        }
      })
      .catch((err) => setStatusError(extractErrorMessage(err, "심사 상태를 불러오지 못했어요.")))
      .finally(() => setCheckingStatus(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, accessToken]);

  const addExperienceDraft = () => {
    if (
      !experienceEntry.title ||
      !experienceEntry.startDate ||
      !experienceEntry.endDate ||
      !experienceEntry.price ||
      !experienceEntry.capacity
    ) {
      setFormError("체험 정보를 모두 입력해주세요.");
      return;
    }
    if (experienceEntry.endDate < experienceEntry.startDate) {
      setFormError("종료일은 시작일보다 빠를 수 없어요.");
      return;
    }
    setFormError(null);
    setExperienceDrafts((list) => [...list, experienceEntry]);
    setExperienceEntry(emptyExperienceDraft);
    setEditingExperience(false);
  };

  const addLodgingDraft = () => {
    if (!lodgingEntry.title || !lodgingEntry.unit || !lodgingEntry.price || !lodgingEntry.capacity) {
      setFormError("숙소 정보를 모두 입력해주세요.");
      return;
    }
    setFormError(null);
    setLodgingDrafts((list) => [...list, lodgingEntry]);
    setLodgingEntry(emptyLodgingDraft);
    setEditingLodging(false);
  };

  const editExperienceDraft = (index: number) => {
    setExperienceEntry(experienceDrafts[index]);
    setExperienceDrafts((list) => list.filter((_, i) => i !== index));
    setEditingExperience(true);
  };

  const removeExperienceDraft = (index: number) => {
    setExperienceDrafts((list) => list.filter((_, i) => i !== index));
  };

  const editLodgingDraft = (index: number) => {
    setLodgingEntry(lodgingDrafts[index]);
    setLodgingDrafts((list) => list.filter((_, i) => i !== index));
    setEditingLodging(true);
  };

  const removeLodgingDraft = (index: number) => {
    setLodgingDrafts((list) => list.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    if (!accessToken) return;
    if (!villageName || !villageDescription) {
      setFormError("마을 이름과 소개를 입력해주세요.");
      return;
    }

    // "추가" 버튼을 누르지 않고 입력만 해둔 내용이 있으면, 그냥 무시되지 않도록 자동으로 포함시킨다.
    const experienceEntryStarted =
      experienceEntry.title || experienceEntry.startDate || experienceEntry.endDate ||
      experienceEntry.price || experienceEntry.capacity;
    const experienceEntryComplete =
      experienceEntry.title && experienceEntry.startDate && experienceEntry.endDate &&
      experienceEntry.price && experienceEntry.capacity;
    if (experienceEntryStarted && !experienceEntryComplete) {
      setFormError("작성 중인 체험 정보를 모두 입력하거나 비워주세요.");
      return;
    }
    if (experienceEntryComplete && experienceEntry.endDate < experienceEntry.startDate) {
      setFormError("종료일은 시작일보다 빠를 수 없어요.");
      return;
    }

    const lodgingEntryStarted =
      lodgingEntry.title || lodgingEntry.unit || lodgingEntry.price || lodgingEntry.capacity;
    const lodgingEntryComplete =
      lodgingEntry.title && lodgingEntry.unit && lodgingEntry.price && lodgingEntry.capacity;
    if (lodgingEntryStarted && !lodgingEntryComplete) {
      setFormError("작성 중인 숙소 정보를 모두 입력하거나 비워주세요.");
      return;
    }

    const allExperienceDrafts = experienceEntryComplete
      ? [...experienceDrafts, experienceEntry]
      : experienceDrafts;
    const allLodgingDrafts = lodgingEntryComplete ? [...lodgingDrafts, lodgingEntry] : lodgingDrafts;

    setFormError(null);
    setSubmitting(true);
    try {
      await updateMyVillageProfile(accessToken, { name: villageName, description: villageDescription });
      if (villagePhotoFile) {
        await uploadMyVillagePhoto(accessToken, villagePhotoFile);
      }
      for (const draft of allExperienceDrafts) {
        const experience = await createExperience(accessToken, {
          title: draft.title,
          startDate: draft.startDate,
          endDate: draft.endDate,
          price: Number(draft.price),
          capacity: Number(draft.capacity),
        });
        if (draft.images.length > 0) {
          await uploadExperienceImages(accessToken, experience.id, draft.images, draft.coverIndex);
        }
      }
      for (const draft of allLodgingDrafts) {
        const lodging = await createLodging(accessToken, {
          title: draft.title,
          unit: draft.unit,
          price: Number(draft.price),
          capacity: Number(draft.capacity),
        });
        if (draft.images.length > 0) {
          await uploadLodgingImages(accessToken, lodging.id, draft.images, draft.coverIndex);
        }
      }
      router.push("/host/dashboard");
    } catch (err) {
      setFormError(extractErrorMessage(err, "저장에 실패했어요. 잠시 후 다시 시도해주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || !accessToken) {
    return null;
  }

  if (checkingStatus) {
    return (
      <>
        <AppHeader title="마을 정보 등록" showBack={false} />
        <div className="flex flex-1 items-center justify-center px-5 py-10 text-sm text-ink-faint">
          확인 중...
        </div>
      </>
    );
  }

  if (statusError) {
    return (
      <>
        <AppHeader title="마을 정보 등록" showBack={false} />
        <div className="px-5 py-10 text-sm text-red-600">{statusError}</div>
      </>
    );
  }

  if (village?.status === "pending") {
    return (
      <>
        <AppHeader title="마을 정보 등록" showBack={false} />
        <div className="flex flex-1 flex-col px-5 py-6 md:my-10 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
          <h2 className="text-2xl font-bold leading-snug">
            대표자 인증
            <br />
            검토중이에요
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            제출하신 서류를 확인하고 있어요. 승인되면 마을·체험·숙박 정보를 등록할 수 있어요. (1~2일 소요)
          </p>
        </div>
      </>
    );
  }

  if (village?.status === "rejected") {
    return (
      <>
        <AppHeader title="마을 정보 등록" showBack={false} />
        <div className="flex flex-1 flex-col px-5 py-6 md:my-10 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
          <h2 className="text-2xl font-bold leading-snug">
            인증이
            <br />
            거절됐어요
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            제출하신 서류로는 대표자 자격을 확인할 수 없었어요. 서류를 다시 확인해 재신청해주세요.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="마을 정보 등록" showBack={false} />
      <div className="flex flex-1 flex-col gap-6 px-5 py-6 md:my-10 md:flex-none md:rounded-2xl md:border md:border-line md:bg-white md:px-10 md:py-10 md:shadow-card">
        <div>
          <h2 className="text-2xl font-bold leading-snug">
            마을·체험·숙박
            <br />
            정보를 한 번에 등록해요
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            아래 내용을 모두 채우고 마지막에 한 번에 저장돼요.
          </p>
        </div>

        {formError && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">마을 정보</p>
          <div className="space-y-2">
            <input
              value={villageName}
              onChange={(e) => setVillageName(e.target.value)}
              placeholder="마을 이름 (예: 양지리 마을)"
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
            />
            <textarea
              value={villageDescription}
              onChange={(e) => setVillageDescription(e.target.value)}
              placeholder="마을 소개"
              className="h-24 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-clay-400"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => villagePhotoInputRef.current?.click()}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-white text-xs text-ink-faint"
              >
                {villagePhotoFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(villagePhotoFile)}
                    alt="마을 대표 사진"
                    className="h-full w-full object-cover"
                  />
                ) : village?.image_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageUrl(village.image_path)}
                    alt="마을 대표 사진"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "+ 사진"
                )}
              </button>
              <p className="flex-1 text-xs text-ink-faint">마을을 대표하는 사진 한 장을 올려주세요.</p>
            </div>
            <input
              ref={villagePhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setVillagePhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">체험 프로그램</p>
          {(savedExperiences.length > 0 || experienceDrafts.length > 0) && (
            <div className="mb-3 space-y-2">
              {savedExperiences.map((e) => {
                const cover = e.images.find((img) => img.is_cover) ?? e.images[0];
                return (
                  <Card key={`saved-${e.id}`} className="flex items-center gap-3">
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveImageUrl(cover.image_path)}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-xs text-ink-faint">
                          {formatDateRange(e.start_date, e.end_date)} · 정원 {e.capacity}명
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{e.price.toLocaleString()}원</span>
                    </div>
                  </Card>
                );
              })}
              {experienceDrafts.map((e, i) => {
                const cover = e.images[e.coverIndex];
                return (
                  <Card key={`draft-${i}`} className="flex items-center gap-3 border-dashed">
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(cover)}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-semibold">{e.title} <span className="text-xs font-normal text-ink-faint">(저장 대기)</span></p>
                        <p className="text-xs text-ink-faint">
                          {formatDateRange(e.startDate, e.endDate)} · 정원 {e.capacity}명
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{Number(e.price).toLocaleString()}원</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => editExperienceDraft(i)}
                        className="text-xs text-clay-600 underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExperienceDraft(i)}
                        className="text-xs text-red-500 underline"
                      >
                        삭제
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="space-y-2 rounded-xl border border-dashed border-line p-3">
            <input
              value={experienceEntry.title}
              onChange={(ev) => setExperienceEntry((f) => ({ ...f, title: ev.target.value }))}
              placeholder="체험 이름 (예: 모내기 체험)"
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-clay-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-ink-faint">시작일</span>
                <input
                  type="date"
                  value={experienceEntry.startDate}
                  onChange={(ev) => setExperienceEntry((f) => ({ ...f, startDate: ev.target.value }))}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-ink-faint">종료일</span>
                <input
                  type="date"
                  value={experienceEntry.endDate}
                  min={experienceEntry.startDate || undefined}
                  onChange={(ev) => setExperienceEntry((f) => ({ ...f, endDate: ev.target.value }))}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={experienceEntry.price}
                onChange={(ev) =>
                  setExperienceEntry((f) => ({ ...f, price: ev.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                placeholder="가격"
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
              />
              <input
                value={experienceEntry.capacity}
                onChange={(ev) =>
                  setExperienceEntry((f) => ({ ...f, capacity: ev.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                placeholder="정원"
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
              />
            </div>
            <ImagePickerField
              images={experienceEntry.images}
              coverIndex={experienceEntry.coverIndex}
              onChange={(images, coverIndex) =>
                setExperienceEntry((f) => ({ ...f, images, coverIndex }))
              }
            />
            <Button variant="outline" size="md" onClick={addExperienceDraft}>
              {editingExperience ? "수정 완료" : "체험 추가"}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">숙소</p>
          {(savedLodgings.length > 0 || lodgingDrafts.length > 0) && (
            <div className="mb-3 space-y-2">
              {savedLodgings.map((l) => {
                const cover = l.images.find((img) => img.is_cover) ?? l.images[0];
                return (
                  <Card key={`saved-${l.id}`} className="flex items-center gap-3">
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveImageUrl(cover.image_path)}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-semibold">{l.title}</p>
                        <p className="text-xs text-ink-faint">
                          {l.unit} · 정원 {l.capacity}명
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{l.price.toLocaleString()}원</span>
                    </div>
                  </Card>
                );
              })}
              {lodgingDrafts.map((l, i) => {
                const cover = l.images[l.coverIndex];
                return (
                  <Card key={`draft-${i}`} className="flex items-center gap-3 border-dashed">
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(cover)}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex flex-1 items-center justify-between">
                      <div>
                        <p className="font-semibold">{l.title} <span className="text-xs font-normal text-ink-faint">(저장 대기)</span></p>
                        <p className="text-xs text-ink-faint">
                          {l.unit} · 정원 {l.capacity}명
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{Number(l.price).toLocaleString()}원</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => editLodgingDraft(i)}
                        className="text-xs text-clay-600 underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLodgingDraft(i)}
                        className="text-xs text-red-500 underline"
                      >
                        삭제
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="space-y-2 rounded-xl border border-dashed border-line p-3">
            <input
              value={lodgingEntry.title}
              onChange={(ev) => setLodgingEntry((f) => ({ ...f, title: ev.target.value }))}
              placeholder="숙소 이름 (예: 두레민박)"
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-clay-400"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                value={lodgingEntry.unit}
                onChange={(ev) => setLodgingEntry((f) => ({ ...f, unit: ev.target.value }))}
                placeholder="단위 (예: 1박)"
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
              />
              <input
                value={lodgingEntry.price}
                onChange={(ev) =>
                  setLodgingEntry((f) => ({ ...f, price: ev.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                placeholder="가격"
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
              />
              <input
                value={lodgingEntry.capacity}
                onChange={(ev) =>
                  setLodgingEntry((f) => ({ ...f, capacity: ev.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                placeholder="정원"
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-clay-400"
              />
            </div>
            <ImagePickerField
              images={lodgingEntry.images}
              coverIndex={lodgingEntry.coverIndex}
              onChange={(images, coverIndex) =>
                setLodgingEntry((f) => ({ ...f, images, coverIndex }))
              }
            />
            <Button variant="outline" size="md" onClick={addLodgingDraft}>
              {editingLodging ? "수정 완료" : "숙소 추가"}
            </Button>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button variant="accent" disabled={submitting} onClick={handleSubmitAll}>
            {submitting ? "저장 중..." : "정보 저장하고 시작하기"}
          </Button>
        </div>
      </div>
    </>
  );
}
