"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Trophy } from "lucide-react";

interface VictoryCeremonyProps {
    show: boolean;
    onComplete: () => void;
}

export function VictoryCeremony({ show, onComplete }: VictoryCeremonyProps) {
    const [phase, setPhase] = useState<"idle" | "flash" | "text" | "fade">("idle");

    useEffect(() => {
        if (show) {
            setPhase("flash");
            const t1 = setTimeout(() => setPhase("text"), 100);
            const t2 = setTimeout(() => setPhase("fade"), 1500);
            const t3 = setTimeout(() => {
                setPhase("idle");
                onComplete();
            }, 2000);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
                    {/* Screen Flash */}
                    {phase === "flash" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white"
                        />
                    )}

                    {/* Shake & Scale Container */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            x: [0, -10, 10, -10, 10, 0],
                            y: [0, 5, -5, 5, -5, 0]
                        }}
                        transition={{
                            scale: { type: "spring", stiffness: 400, damping: 10 },
                            x: { duration: 0.2, repeat: 2 },
                            y: { duration: 0.2, repeat: 2 }
                        }}
                        className="relative"
                    >
                        <div className="flex flex-col items-center">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="mb-4 text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                            >
                                <Trophy size={80} />
                            </motion.div>

                            <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex gap-2">
                                <motion.span
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    VIC
                                </motion.span>
                                <motion.span
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-accent"
                                >
                                    TORY
                                </motion.span>
                                <motion.span
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    !
                                </motion.span>
                            </h1>

                            <div className="flex gap-4 mt-4">
                                <Sparkles className="text-accent animate-pulse" size={24} />
                                <span className="text-white font-mono uppercase tracking-[0.3em] text-sm">Monster Slain</span>
                                <Sparkles className="text-accent animate-pulse" size={24} />
                            </div>
                        </div>

                        {/* Particle Burst Simulation */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    x: (Math.random() - 0.5) * 600,
                                    y: (Math.random() - 0.5) * 600,
                                    opacity: 0,
                                    scale: 0.5
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute left-1/2 top-1/2 w-2 h-2 bg-accent rounded-full"
                                style={{ transform: 'translate(-50%, -50%)' }}
                            />
                        ))}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
