"use client";

import { useState } from "react";

const STARS = [
  { top: "10%", left: "8%",  delay: "0s",   dur: "3.2s", large: true  },
  { top: "18%", left: "87%", delay: "0.8s", dur: "4.1s", large: false },
  { top: "33%", left: "13%", delay: "1.5s", dur: "2.9s", large: false },
  { top: "7%",  left: "53%", delay: "0.3s", dur: "3.7s", large: true  },
  { top: "50%", left: "5%",  delay: "2.0s", dur: "4.3s", large: false },
  { top: "63%", left: "93%", delay: "1.1s", dur: "3.0s", large: true  },
  { top: "80%", left: "77%", delay: "1.7s", dur: "2.7s", large: false },
  { top: "87%", left: "18%", delay: "0.5s", dur: "3.9s", large: false },
  { top: "23%", left: "40%", delay: "2.3s", dur: "4.6s", large: false },
  { top: "72%", left: "32%", delay: "1.3s", dur: "3.4s", large: false },
  { top: "56%", left: "67%", delay: "0.7s", dur: "2.5s", large: true  },
  { top: "14%", left: "60%", delay: "1.8s", dur: "4.0s", large: false },
];

export default function EntryGate({
  onReady,
}: {
  onReady: (lat: number, lng: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string>("");

  function enter() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => onReady(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is required to place you on the map."
            : "Couldn't get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950 p-6 text-zinc-100">

      {/* ── Atmospheric background layers ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Emerald glow bleeding down from top-center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(52,211,153,0.11),transparent_70%)]" />
        {/* Faint indigo depth from bottom-right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_105%,rgba(99,102,241,0.07),transparent_70%)]" />
        {/* Vignette — darkens the edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ── Ambient orbit rings ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[700px] w-[700px] rounded-full border border-white/[0.025]" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[460px] w-[460px] rounded-full border border-white/[0.03]" />
      </div>

      {/* ── Star field ── */}
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: s.large ? "2px" : "1px",
              height: s.large ? "2px" : "1px",
              animationDuration: s.dur,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-7 text-center">

        {/* Eyebrow */}
        <div className="entry-fade flex items-center gap-3" style={{ animationDelay: "0.15s" }}>
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-emerald-400/60" />
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium tracking-[0.25em] text-emerald-400 uppercase">
              Live · Worldwide
            </span>
          </div>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-emerald-400/60" />
        </div>

        {/* Title */}
        <div className="entry-fade-up" style={{ animationDelay: "0s" }}>
          <h1 className="text-glow-emerald text-7xl font-bold tracking-[0.2em] text-white sm:text-8xl">
            PULSE
          </h1>
          <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
        </div>

        {/* Tagline */}
        <p
          className="entry-fade max-w-[260px] text-sm leading-7 tracking-wide text-zinc-400"
          style={{ animationDelay: "0.4s" }}
        >
          A living globe of anonymous strangers.
          <br />
          Drop onto the map and connect.
        </p>

        {/* CTA */}
        <button
          onClick={enter}
          disabled={status === "locating"}
          className="entry-fade mt-1 rounded-full bg-emerald-400 px-10 py-3.5 text-sm font-semibold tracking-widest text-zinc-950 uppercase transition-all duration-300 hover:bg-emerald-300 hover:shadow-[0_0_32px_rgba(52,211,153,0.45)] disabled:opacity-50"
          style={{ animationDelay: "0.65s" }}
        >
          {status === "locating" ? "Locating…" : "Enter Pulse"}
        </button>

        {status === "error" && (
          <p className="max-w-sm text-center text-sm text-red-400">{error}</p>
        )}

        {/* Privacy disclaimer */}
        <p
          className="entry-fade max-w-[260px] text-center text-xs leading-relaxed text-zinc-600"
          style={{ animationDelay: "0.9s" }}
        >
          No sign-up. Your dot is placed 1–3&nbsp;km from your real location.
          Nothing is stored — closing the tab ends everything.
        </p>
      </div>
    </div>
  );
}
