"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type FABPosition = "right" | "left";

type FABAction = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  color?: "emerald" | "sky" | "amber" | "violet";
};

type FloatingActionButtonProps = {
  actions: FABAction[];
  mainIcon?: React.ReactNode;
  mainLabel?: string;
};

const LS_FAB_POSITION = "fab_position_v1";

export default function FloatingActionButton({ 
  actions, 
  mainIcon = "✚",
  mainLabel = "Menü"
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<FABPosition>("right");
  const [isDragging, setIsDragging] = useState(false);

  // LocalStorage'dan pozisyon yükle
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(LS_FAB_POSITION);
      if (saved === "left" || saved === "right") {
        setPosition(saved);
      }
    } catch {
      // sessiz
    }
  }, []);

  // Pozisyon değiştiğinde kaydet
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_FAB_POSITION, position);
    } catch {
      // sessiz
    }
  }, [position]);

  const togglePosition = () => {
    setPosition(prev => prev === "right" ? "left" : "right");
    setIsOpen(false);
  };

  const colorClasses = {
    emerald: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    sky: "bg-sky-500 hover:bg-sky-400 text-slate-950",
    amber: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    violet: "bg-violet-500 hover:bg-violet-400 text-slate-950",
  };

  const positionClasses = position === "right" 
    ? "right-4 sm:right-6" 
    : "left-4 sm:left-6";

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div className={`fixed bottom-20 sm:bottom-24 z-50 ${positionClasses}`}>
        {/* Action Buttons */}
        {isOpen && (
          <div className={`mb-3 flex flex-col gap-3 ${position === "right" ? "items-end" : "items-start"}`}>
            {actions.map((action, idx) => {
              const colorClass = colorClasses[action.color || "emerald"];
              const button = (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className={`group flex items-center gap-3 rounded-full ${colorClass} px-4 py-3 shadow-lg transition-all hover:shadow-xl ${
                    position === "right" ? "flex-row-reverse" : "flex-row"
                  }`}
                  style={{
                    animation: `fadeInUp 0.2s ease-out ${idx * 0.05}s both`
                  }}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">{action.label}</span>
                </button>
              );

              if (action.href) {
                return (
                  <Link key={idx} href={action.href} onClick={() => setIsOpen(false)}>
                    {button}
                  </Link>
                );
              }

              return button;
            })}

            {/* Pozisyon Değiştir Butonu */}
            <button
              onClick={togglePosition}
              className="flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-xs text-slate-200 shadow-lg transition hover:bg-slate-600"
              style={{
                animation: `fadeInUp 0.2s ease-out ${actions.length * 0.05}s both`
              }}
            >
              <span>{position === "right" ? "←" : "→"}</span>
              <span>{position === "right" ? "Sola Taşı" : "Sağa Taşı"}</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-2xl transition-all hover:bg-emerald-400 hover:scale-110 ${
            isOpen ? "rotate-45" : ""
          }`}
          aria-label={mainLabel}
        >
          <span className="text-2xl font-bold">{mainIcon}</span>
        </button>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
