export default function ChartPlaceholder() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl relative p-6 mb-8 h-[300px]">
      <div className="absolute left-6 top-6 bottom-6 flex flex-col justify-between text-xs text-gray-400">
        <div>4 kg</div>
        <div>3 kg</div>
        <div>2 kg</div>
        <div>1 kg</div>
        <div>0 kg</div>
      </div>

      {[...Array(5)].map((_, i) => (
        <div key={i} className="absolute left-[60px] right-6 border-t border-dashed border-gray-200" style={{ top: `${i * 25}%` }} />
      ))}

      <div className="absolute bottom-6 left-[60px] right-6 flex justify-between text-xs text-gray-400">
        <div>09 Nov - 15 Nov</div>
        <div>19 Oct - 25 Oct</div>
        <div>28 Sep - 04 Oct</div>
        <div>07 Sep - 13 Sep</div>
        <div>17 Aug - 23 Aug</div>
      </div>
    </div>
  );
}
