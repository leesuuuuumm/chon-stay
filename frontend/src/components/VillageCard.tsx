type VillageCardProps = {
  name: string;
  populationIndex?: number; // 생활인구 감소 심각도 지표
  imageUrl?: string;
};

export default function VillageCard({ name, populationIndex, imageUrl }: VillageCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="w-full h-32 object-cover rounded mb-2" />
      )}
      <h3 className="font-semibold">{name}</h3>
      {populationIndex !== undefined && (
        <p className="text-sm text-gray-500">생활인구 지표: {populationIndex}</p>
      )}
      {/* TODO: 빈집/밭 가꾸기 체험 정보 연결 */}
    </div>
  );
}
