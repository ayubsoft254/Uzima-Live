"use client";

import { useState, useEffect } from "react";
import { Activity, Radio, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveHealthFeed() {
  const [alerts, setAlerts] = useState([
    "Malaria screening clinic open in Kibera tomorrow.",
    "Mesh nodes stable. 42 community health workers online.",
    "Health trend: Flu symptoms reported in Eastleigh.",
    "Nutrition program: Vitamin A distribution starts Friday.",
    "Clinic Alert: High demand for maternity services in Githurai.",
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  return (
    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 overflow-hidden shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Mesh Status</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-green-600 uppercase">Real-time</span>
        </div>
      </div>
      
      <div className="relative h-6 overflow-hidden">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 flex items-center gap-2 transition-all duration-1000 transform",
              i === currentIndex 
                ? "translate-y-0 opacity-100" 
                : "translate-y-4 opacity-0"
            )}
          >
            <Radio className="w-3 h-3 text-primary/40 shrink-0" />
            <p className="text-[11px] font-bold text-foreground/80 truncate">
              {alert}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-primary/5 flex items-center justify-between">
        <div className="flex gap-3">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold text-muted-foreground">Region</span>
            <span className="text-[9px] font-black text-primary">Nairobi Cluster</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold text-muted-foreground">Grounding</span>
            <span className="text-[9px] font-black text-secondary">Uzima Verified</span>
          </div>
        </div>
        <Info className="w-3 h-3 text-muted-foreground opacity-30" />
      </div>
    </div>
  );
}
