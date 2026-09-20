export function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function diffDays(fromIso: string, toIso: string) {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000);
}

// 서버가 내려주는 UTC 시각(타임존 표기 없음)을 한국 날짜로 바꿔 "2027년 9월 21일"로 표시한다.
export function formatKstDate(utcIso: string) {
  const kst = new Date(new Date(`${utcIso.replace(" ", "T")}Z`).getTime() + 9 * 3600 * 1000);
  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
}

export function formatMonthDay(iso: string) {
  const [, month, day] = iso.slice(0, 10).split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}
