"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100">
      <div className="relative mx-auto w-full max-w-xs">
        {/* Decorative elements with animation */}
        <motion.div
          className="absolute -top-6 -left-6 h-12 w-12 rounded-full bg-yellow-400 opacity-80 shadow-xl blur-sm"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute -right-4 -bottom-4 h-10 w-10 rounded-full bg-blue-500 opacity-70 shadow-lg blur-sm"
          animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/4 -right-8 h-8 w-8 rounded-full bg-red-500 opacity-70 shadow-md blur-sm"
          animate={{ x: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 -left-10 h-14 w-14 rounded-full bg-green-500 opacity-60 shadow-md blur-sm"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Animated Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="relative w-full overflow-hidden border-4 border-dashed border-amber-500 bg-[#fffdf7] shadow-xl">
            <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-red-100 opacity-50"></div>
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-blue-100 opacity-50"></div>

            <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
              {/* Spinner */}
              <div className="relative h-16 w-16">
                {/* Outer spinning circle */}
                <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-amber-300 border-t-amber-500"></div>

                {/* Inner reverse spinning circle */}
                <div className="animate-spin-slow-reverse absolute inset-2 h-12 w-12 rounded-full border-4 border-amber-400 border-b-amber-600"></div>

                {/* Center glowing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-amber-500 shadow-md"></div>
                </div>

                {/* Optional sparkles */}
                <div className="absolute -top-2 left-1 h-2 w-2 animate-ping rounded-full bg-white opacity-70" />
                <div className="absolute -right-2 bottom-1 h-1.5 w-1.5 animate-ping rounded-full bg-yellow-300" />
              </div>

              <motion.p
                className="text-center text-lg font-medium text-amber-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Getting your brush ready...
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
