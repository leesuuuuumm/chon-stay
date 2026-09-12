export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-2">촌스테이</h1>
      <p className="text-gray-600 text-center max-w-md">
        관심사에 맞는 마을을 매칭해 체류형 농촌 여행을 제안하고, 빈집 체험과
        밭 가꾸기로 자연스러운 재방문을 만드는 서비스입니다.
      </p>
      {/* TODO: 관심사 입력 -> 마을/빈집 매칭 추천 플로우 */}
    </main>
  );
}
