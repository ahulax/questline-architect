"use client";

import { motion } from "framer-motion";

export const containerVariants = {
    show: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

export const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 20 } }
};

export function DashboardAnimator({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            variants={containerVariants}
            initial={false}
            animate="show"
            className="space-y-8"
        >
            {children}
        </motion.div>
    );
}
