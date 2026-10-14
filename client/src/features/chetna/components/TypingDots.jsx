export default function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" role="status" aria-label="Chetna is typing">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-2 w-2 animate-bounce rounded-full bg-gray-400 motion-reduce:animate-none"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}