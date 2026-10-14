import ChetnaAvatar from "./ChetnaAvatar";
import FlowForm from "./FlowForm";
import TypingDots from "./TypingDots";
import { RESULTS } from "./results";
import { FLOWS } from "../config/flows";
import { useChetnaContext } from "../context/ChetnaContext";

function BotRow({ children }) {
  return (
    <div className="flex items-end gap-2">
      <ChetnaAvatar className="h-7 w-7" />
      <div className="max-w-[85%] flex-1 space-y-2">{children}</div>
    </div>
  );
}

export default function MessageBubble({ message }) {
  const { startFlow, submitFlow } = useChetnaContext();

  if (message.system) {
  return <p className="text-center text-xs text-gray-500">{message.text}</p>;
}

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#2f5db0] px-3 py-2 text-sm text-white">
          {message.text}
        </p>
      </div>
    );
  }

  if (message.kind === "typing") {
    return (
      <BotRow>
        <div className="inline-block rounded-2xl rounded-bl-sm bg-gray-100 px-3"><TypingDots /></div>
      </BotRow>
    );
  }

  if (message.kind === "form") {
    return <BotRow><FlowForm message={message} /></BotRow>;
  }

  if (message.kind === "result") {
    const Result = RESULTS[FLOWS[message.flowId].result];
    return <BotRow><Result data={message.data} /></BotRow>;
  }

  if (message.kind === "text" && message.text === "") {
  return (
    <BotRow>
      <div className="inline-block rounded-2xl rounded-bl-sm bg-gray-100 px-3"><TypingDots /></div>
    </BotRow>
  );
}

  return (
    <BotRow>
      <p className="inline-block rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-dmrc-ink">
        {message.text}
      </p>
      {message.retry && (
        <div>
          <button
            onClick={() => submitFlow(message.retry.flowId, message.retry.values)}
            className="rounded-full border border-dmrc-red px-3 py-1 text-xs font-medium text-dmrc-red hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      )}
      {message.suggestions && (
        <div className="flex flex-wrap gap-2">
          {message.suggestions.map((s) => (
            <button
              key={s.flow}
              onClick={() => startFlow(s.flow)}
              className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs text-blue-800 hover:bg-blue-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </BotRow>
  );
}