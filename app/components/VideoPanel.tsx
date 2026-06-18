"use client";

import { useEffect, useRef } from "react";

export default function VideoPanel({
  localStream,
  remoteStream,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-zinc-950 animate-[backdropIn_0.3s_ease_forwards]">
      <div className="relative flex-1 overflow-hidden">

        {/* Remote video (full area) */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="h-full w-full bg-zinc-900 object-cover"
        />

        {/* Vignette overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Waiting placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-zinc-500">
              Waiting for stranger&rsquo;s video…
            </span>
          </div>
        )}

        {/* Live status pill — top-left */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-white/70">Live</span>
        </div>

        {/* Local PiP — bottom-right */}
        <div className="absolute bottom-4 right-4">
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="h-40 w-28 rounded-2xl border border-white/15 bg-zinc-800 object-cover shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
          />
          <span className="absolute bottom-2 left-2 text-xs text-white/50">
            You
          </span>
        </div>
      </div>

      {/* Bottom bar — end button */}
      <div className="flex justify-center bg-zinc-950/80 px-6 py-5 backdrop-blur-sm">
        <button
          onClick={onEnd}
          className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_0px_rgba(239,68,68,0)] transition hover:bg-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        >
          <svg
            className="h-4 w-4 rotate-135"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          End video
        </button>
      </div>
    </div>
  );
}
