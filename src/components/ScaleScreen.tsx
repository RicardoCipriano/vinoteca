import { motion } from "motion/react";
import { useState } from "react";

// Componente simples que incorpora a taça de vinho via Tenor (iframe)
function TenorGlass() {
  return (
    <iframe
      src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExb293cDc1eG5oZ2NncGZ4MHBkNG51YWZuYTBmN3NsZzJkY3Zwc2R1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/h8seX8nSq9spN7MMKK/giphy.gif"
      frameBorder={0}
      allowTransparency
      allowFullScreen
      scrolling="no"
      className="w-full h-full"
    />
  );
}

export function ScaleScreen() {
  const [replayKey, setReplayKey] = useState(0);
  const groups = [
    {
      key: "leves",
      title: "Tintos Leves",
      color: "#B74C56",
      height: 140,
      grapes: ["Gamay", "Pinot Noir"],
    },
    {
      key: "medios",
      title: "Tintos Médios",
      color: "#8E1E28",
      height: 200,
      grapes: [
        "Garnacha",
        "Valpolicella",
        "Carménère",
        "Cabernet Franc",
        "Sangiovese",
        "Merlot",
        "Zinfandel",
      ],
    },
    {
      key: "encorpados",
      title: "Tintos Encorpados",
      color: "#6B0F12",
      height: 260,
      grapes: [
        "Tempranillo",
        "Malbec",
        "Cabernet Sauvignon",
        "Syrah",
        "Pinotage",
        "Tannat",
      ],
    },
  ];

  // Removido efeito de cachos; substituído pelas taças Tenor

  return (
    <div className="min-h-screen bg-[#F7EFE6] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#4A0D12] to-[#6B0F12] pt-12 pb-8 px-6 text-center">
        <h1 className="text-[#F7EFE6] text-2xl">Escala de Intensidade</h1>
        <p className="text-[#CDA15D] mt-1">Explore a intensidade por grupos de uvas</p>
      </div>

      {/* Animated Chart */}
      <div className="px-6 pt-6" key={replayKey}>
        <div className="bg-white rounded-2xl shadow-sm p-6" id="scale-root">
          <div className="grid grid-cols-3 gap-12 px-3 items-end justify-items-center h-[300px] relative">
            {/* Axis line */}
            <div className="absolute left-0 right-0 bottom-0 h-px bg-[#CDA15D]/40" />

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
                {/* Shine overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 top-0 w-1/2 h-full bg-white/5 blur-xl" />
                </div>
                {/* Tenor wine glass filling the bar */}
                <div className="absolute inset-0">
                  <TenorGlass />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Labels and grapes list */}
          <div className="mt-6 grid grid-cols-3 gap-6">
            {groups.map((g, gIdx) => (
              <div key={g.key}>
                <h3 className="text-white font-medium mb-2 text-center">{g.title}</h3>
                <motion.ul
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 + gIdx * 0.1 } },
                  }}
                  className="space-y-1"
                >
                  {g.grapes.map((grape) => (
                    <motion.li
                      key={grape}
                      variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="text-[#333] font-bold">{grape}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            ))}
          </div>

          <div className="mt-6 text-xs text-[#6B6B6B] text-center">
            Em climas quentes os vinhos tendem a ser mais encorpados; em climas frios, mais leves.
          </div>
        </div>

        
      </div>
    </div>
  );
}