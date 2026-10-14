import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { useChetnaContext } from "../context/ChetnaContext";

export default function ChatView() {
  const { messages } = useChetnaContext();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="space-y-3 p-4" aria-live="polite">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}