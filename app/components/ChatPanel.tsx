"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: number;
  mine: boolean | null;
  text: string;
  ts: number;
  system?: boolean;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatPanel({
  messages,
  connected,
  videoBusy,
  onSend,
  onStartVideo,
  onEnd,
  onBlock,
  onTyping,
  peerTyping = false,
  peerName,
  peerColor,
  peerMood,
  peerEmoji,
}: {
  messages: ChatMessage[];
  connected: boolean;
  videoBusy: boolean;
  onSend: (text: string) => void;
  onStartVideo: () => void;
  onEnd: () => void;
  onBlock?: () => void;
  onTyping?: (v: boolean) => void;
  peerTyping?: boolean;
  peerName?: string;
  peerColor?: string;
  peerMood?: string;
  peerEmoji?: string;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDraft(v);
    if (!onTyping) return;
    if (v) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => onTyping(false), 2000);
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTyping(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !connected) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTyping?.(false);
    onSend(text);
    setDraft("");
  }

  return (
    <div className="chat-slide-in absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-white/10 bg-zinc-950/85 text-zinc-100 shadow-2xl backdrop-blur-xl">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 shrink-0 rounded-full animate-pulse ${
              connected ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {peerEmoji && (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full select-none"
              style={{ background: peerColor }}
            >
              <span className="text-lg leading-none">{peerEmoji}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold tracking-wide">
              {peerName ?? "Stranger"}
            </p>
            <p className="text-xs text-zinc-500">
              {connected ? "Connected" : "Connecting…"}
              {peerMood && (
                <span className="ml-1.5 text-zinc-600">· {peerMood}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onStartVideo}
            disabled={!connected || videoBusy}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-30"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </button>
          {onBlock && (
            <button
              onClick={onBlock}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-white/20 hover:text-zinc-400"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Block
            </button>
          )}
          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-400 hover:shadow-[0_0_16px_rgba(239,68,68,0.4)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C9.44 17.29 7.76 15.57 6.53 13.6a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 10.9" />
              <line x1="23" y1="1" x2="1" y2="23" />
            </svg>
            End
          </button>
        </div>
      </header>

      {/* Message feed */}
      <div className="chat-messages relative flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-center text-sm text-white/30">
              Say hi to your new connection 👋
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => {
            if (m.system) {
              return (
                <div key={m.id} className="msg-appear flex justify-center py-1">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
                    {m.text}
                  </span>
                </div>
              );
            }

            if (m.mine === false) {
              // Avatar sits on the LAST message of a consecutive peer run (Messenger/Discord pattern).
              // The group continues if the next message is also from the peer, or if the peer
              // is currently typing (typing indicator will carry the avatar instead).
              const nextM = i < messages.length - 1 ? messages[i + 1] : null;
              const groupContinues =
                (nextM !== null && !nextM.system && nextM.mine === false) ||
                (nextM === null && peerTyping);
              const isLastInGroup = !groupContinues;

              return (
                <div key={m.id} className="msg-appear flex flex-col items-start gap-1">
                  <div className="flex items-end gap-2">
                    {peerEmoji ? (
                      isLastInGroup ? (
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full select-none"
                          style={{ background: peerColor }}
                        >
                          <span className="text-xs leading-none">{peerEmoji}</span>
                        </div>
                      ) : (
                        <div className="h-6 w-6 shrink-0" />
                      )
                    ) : null}
                    <span className="max-w-[78%] rounded-2xl border border-white/8 bg-zinc-800/70 px-4 py-2.5 text-sm leading-relaxed text-zinc-100 shadow-sm backdrop-blur-sm">
                      {m.text}
                    </span>
                  </div>
                  {/* Offset timestamp to sit under the bubble, not the avatar */}
                  <span className={`px-1 text-xs text-white/30 ${peerEmoji ? "ml-8" : ""}`}>
                    {formatTime(m.ts)}
                  </span>
                </div>
              );
            }

            return (
              <div key={m.id} className="msg-appear flex flex-col items-end gap-1">
                <span className="max-w-[78%] rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-medium leading-relaxed text-zinc-950 shadow-sm">
                  {m.text}
                </span>
                <span className="px-1 text-xs text-white/30">
                  {formatTime(m.ts)}
                </span>
              </div>
            );
          })}

          {/* Typing indicator — always end of peer group, always shows avatar */}
          {peerTyping && (
            <div className="msg-appear flex items-end gap-2">
              {peerEmoji && (
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full select-none"
                  style={{ background: peerColor }}
                >
                  <span className="text-xs leading-none">{peerEmoji}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/8 bg-zinc-800/70 px-4 py-3 backdrop-blur-sm">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: "0ms" }} />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: "200ms" }} />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          )}
        </div>

        <div ref={endRef} />
      </div>

      {/* Input area */}
      <form onSubmit={submit} className="border-t border-white/8 p-4">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={handleDraftChange}
            placeholder={connected ? "Type a message…" : "Connecting…"}
            disabled={!connected}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-emerald-400/50 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!connected || !draft.trim()}
            className="rounded-full bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 hover:shadow-[0_0_16px_rgba(52,211,153,0.35)] disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
