"use client";

import { motion } from "motion/react";

export default function LoadingSpinner() {
  const spinnerStyle = {
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #3498db",
    borderRadius: "50%",
  };

  return (
    <motion.div
      style={spinnerStyle}
      animate={{ rotate: 360 }}
      className={"size-8"}
      transition={{
        repeat: Infinity,
        duration: 1,
        ease: "linear",
      }}
    />
  );
}
