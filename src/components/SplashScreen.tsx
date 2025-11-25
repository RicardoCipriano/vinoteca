import { Wine } from "lucide-react";
import { motion } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-b from-[#4A0D12] to-[#6B0F12] flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => setTimeout(onComplete, 2000)}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <Wine className="w-24 h-24 text-[#CDA15D] mb-6" strokeWidth={1.5} />
      </motion.div>
      
      <motion.h1 
        className="text-[#F7EFE6] text-4xl mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Vinoteca
      </motion.h1>
      
      <motion.p 
        className="text-[#CDA15D] text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Sua Coleção Pessoal de Vinhos
      </motion.p>
    </motion.div>
  );
}
