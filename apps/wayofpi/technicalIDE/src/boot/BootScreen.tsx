import { useEffect, useState } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<"init" | "server" | "ready">("init");
  const [log, setLog] = useState<string[]>([
    "[boot] Way of Pi — Technical IDE",
    "[boot] initialising runtime…",
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setLog((p) => [...p, "[boot] connecting to server…"]);
      setPhase("server");
    }, 400);

    const t2 = setTimeout(() => {
      setLog((p) => [...p, "[boot] handshake OK"]);
      setPhase("ready");
    }, 1200);

    const t3 = setTimeout(() => {
      setLog((p) => [...p, "[boot] mounting shell…"]);
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0d0d0d] font-mono text-[#cccccc]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tighter text-[#ea580c] uppercase">
          Way of Pi
        </h1>
        <p className="mt-1 text-[11px] text-[#858585] tracking-widest uppercase">
          Technical IDE
        </p>
      </div>

      <div className="flex flex-col gap-1 text-xs text-[#6a9955]">
        {log.map((line, i) => (
          <span
            key={i}
            className={`${i === log.length - 1 && phase !== "ready" ? "animate-pulse" : ""}`}
          >
            {line}
          </span>
        ))}
        {phase === "init" && <span className="animate-pulse text-[#569cd6]">⟳</span>}
        {phase === "server" && <span className="animate-pulse text-[#ce9178]">⟳ waiting for server…</span>}
        {phase === "ready" && <span className="text-[#6a9955]">✓ ready</span>}
      </div>
    </div>
  );
}
