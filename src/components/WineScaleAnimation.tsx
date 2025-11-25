import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";

type Grape = {
  id: number;
  name: string;
  tinto?: 0 | 1 | boolean;
  branco?: 0 | 1 | boolean;
  intensidade?: "leve" | "medio" | "encorpado" | null;
};

export function WineScaleAnimation() {
  const [replayKey, setReplayKey] = useState(0);
  const [grapes, setGrapes] = useState<Grape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"tintos" | "brancos" | "ambos">("brancos");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rows = await api.getGrapes();
        setGrapes(rows || []);
      } catch (e: any) {
        setError(e?.message || "Falha ao carregar uvas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reds = useMemo(() => grapes.filter(g => (g.tinto === 1 || g.tinto === true)), [grapes]);
  const whites = useMemo(() => grapes.filter(g => (g.branco === 1 || g.branco === true)), [grapes]);

  const groupsTintos = useMemo(() => ([
    { key: "leves", title: "Tintos Leves", color: "#B74C56", height: 140, grapes: reds.filter(g => g.intensidade === "leve").map(g => g.name) },
    { key: "medios", title: "Tintos Médios", color: "#8E1E28", height: 200, grapes: reds.filter(g => g.intensidade === "medio").map(g => g.name) },
    { key: "encorpados", title: "Tintos Encorpados", color: "#6B0F12", height: 260, grapes: reds.filter(g => g.intensidade === "encorpado").map(g => g.name) },
  ]), [reds]);

  const groupsBrancos = useMemo(() => ([
    { key: "leves", title: "Brancos Leves", color: "#E1C16E", height: 140, grapes: whites.filter(g => g.intensidade === "leve").map(g => g.name) },
    { key: "medios", title: "Brancos Médios", color: "#D2B46B", height: 200, grapes: whites.filter(g => g.intensidade === "medio").map(g => g.name) },
    { key: "encorpados", title: "Brancos Encorpados", color: "#C39A4A", height: 240, grapes: whites.filter(g => g.intensidade === "encorpado").map(g => g.name) },
  ]), [whites]);

  const Header = (
    <div
      className="relative pt-12 pb-8 px-6 text-center"
      style={{
        backgroundImage: "url(/image/fundo1.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-bordeaux)] to-[var(--garnet)] opacity-50" />
      <div className="relative">
        <h1 className="text-white font-bold text-3xl">Escala de Intensidade</h1>
        <p className="text-white mt-1">Explore a intensidade por grupos de uvas</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {(["tintos","brancos","ambos"] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setMode(opt)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${mode===opt ? "bg-[var(--gold)] text-white border-[var(--gold)]" : "bg-white text-[var(--garnet)] border-[var(--gold)]/40"}`}
            >
              {opt === "tintos" ? "Tintos" : opt === "brancos" ? "Brancos" : "Ambos"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const Bars = (groups: { key: string; title: string; color: string; height: number; grapes: string[] }[]) => (
    <div
      className="rounded-2xl shadow-sm p-6"
      style={{
        backgroundImage: "url(/image/background-escala.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="grid grid-cols-3 gap-12 px-3 items-end justify-items-center h-[300px] relative">
        <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--gold)]/40" />
        {groups.map((g, idx) => (
          <motion.div
            key={g.key}
            initial={{ height: 0, opacity: 0, scaleY: 0.6 }}
            animate={{ height: g.height, opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.2 + idx * 0.15, type: "spring" }}
            className="w-20 rounded-xl overflow-hidden flex flex-col justify-end relative"
            style={{
              background: `linear-gradient(180deg, ${g.color} 0%, ${g.color}E6 60%, ${g.color}AA 100%)`,
              boxShadow: `0 10px 20px ${g.color}33`,
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 top-0 w-1/2 h-full bg-white/5 blur-xl" />
            </div>
            <div className="absolute inset-0 p-[6px]">
              <img src="/image/WNRA.gif" className="w-full h-full object-cover rounded-md" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        {groups.map((g, gIdx) => (
          <div key={g.key} className="-translate-x-[2%]">
            <h3 className="text-white font-medium mb-2 text-center">{g.title}</h3>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 + gIdx * 0.1 } } }}
              className="space-y-1"
            >
              {g.grapes.map((grape) => (
                <motion.li key={grape} variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }} className="flex items-center gap-2 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-white font-bold">{grape}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cream)] pb-24">
        {Header}
        <div className="px-6 pt-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-6 w-40 bg-[var(--gold)]/20 rounded mb-4" />
            <div className="grid grid-cols-3 gap-6 items-end justify-items-center h-[300px]">
              <div className="w-20 h-40 bg-[var(--gold)]/15 rounded-xl" />
              <div className="w-20 h-60 bg-[var(--gold)]/15 rounded-xl" />
              <div className="w-20 h-72 bg-[var(--gold)]/15 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--cream)] pb-24">
        {Header}
        <div className="px-6 pt-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-24">
      {Header}
      <div className="px-6 pt-6" key={replayKey}>
        {mode === "tintos" && Bars(groupsTintos)}
        {mode === "brancos" && Bars(groupsBrancos)}
        {mode === "ambos" && (
          <div className="space-y-6">
            {Bars(groupsTintos)}
            {Bars(groupsBrancos)}
          </div>
        )}

        <div className="mt-6 text-xs text-white text-center">Em climas quentes, os vinhos tendem a ser mais encorpados; em climas frios, mais leves.</div>

        
      </div>
    </div>
  );
}

export default WineScaleAnimation;