export default function ChatbotBubble({ name = "Chetna" }) {
  return (
    <aside className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      <button
        aria-label={`Open chat with ${name}`}
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-indigo-100 shadow-lg ring-1 ring-gray-200"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-900 text-xl font-bold text-white">
          {name[0]}
        </span>
      </button>
      <p className="rounded bg-white px-3 py-1.5 text-sm shadow-card">
        Hi, I am <b className="text-blue-700">{name}</b>, your{" "}
        <span className="text-blue-600">AI Assistant.</span>
      </p>
    </aside>
  );
}
