export default function Tabs() {
  const tabs = ["PROGRESS", "EXERCISES", "MEASUREMENTS", "PROGRESS PHOTOS"];

  return (
    <div className="flex border-b border-gray-200 mb-8">
      {tabs.map((tab, i) => (
        <div
          key={tab}
          className={`px-6 py-3 font-medium cursor-pointer relative ${
            i === 0
              ? "text-indigo-600 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:bg-indigo-600 rounded-t-md"
              : "text-gray-500 hover:text-indigo-600"
          }`}
        >
          {tab}
        </div>
      ))}
    </div>
  );
}
