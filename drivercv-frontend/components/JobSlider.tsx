"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type JobSliderProps = {
  jobs: any[];
  size: "large" | "medium" | "small";
  autoPlaySpeed?: number; // ms
  title?: string;
};

export default function JobSlider({ jobs, size, autoPlaySpeed = 3000, title }: JobSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const itemsPerView = size === "large" ? 1 : size === "medium" ? 2 : 3;
  const totalSlides = Math.max(1, Math.ceil((jobs || []).length / itemsPerView));

  useEffect(() => {
    if (isPaused || !autoPlaySpeed || totalSlides <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, autoPlaySpeed);

    return () => clearInterval(timer);
  }, [isPaused, autoPlaySpeed, totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  if (!jobs || jobs.length === 0) {
    return null;
  }

  const cardHeight = size === "large" ? "h-64" : size === "medium" ? "h-48" : "h-40";
  const titleSize = size === "large" ? "text-lg" : size === "medium" ? "text-base" : "text-sm";
  const subtitleSize = size === "large" ? "text-sm" : size === "medium" ? "text-xs" : "text-[11px]";

  return (
    <div className="relative">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              aria-label="Önceki"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              aria-label="Sonraki"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div
        ref={sliderRef}
        className="relative overflow-hidden rounded-2xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div key={slideIndex} className="min-w-full">
              <div className={`grid gap-3 ${itemsPerView === 1 ? "grid-cols-1" : itemsPerView === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                {jobs.slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView).map((job: any) => (
                  <Link
                    key={job._id || job.id}
                    href={`/jobs/${job._id || job.id}`}
                    className={`group relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-5 transition hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 ${cardHeight}`}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition group-hover:opacity-100" />

                    <div className="relative flex h-full flex-col">
                      {/* İlan başlığı */}
                      <div className={`font-bold text-slate-100 line-clamp-2 ${titleSize}`}>
                        {job.title || "İlan Başlığı"}
                      </div>

                      {/* Firma */}
                      {job.companyName && (
                        <div className={`mt-1 text-slate-400 ${subtitleSize}`}>
                          {job.companyName}
                        </div>
                      )}

                      {/* Lokasyon */}
                      {(job.cityName || job.location?.cityName) && (
                        <div className={`mt-2 flex items-center gap-1.5 text-slate-400 ${subtitleSize}`}>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{job.cityName || job.location?.cityName}</span>
                        </div>
                      )}

                      {/* Kriterler (badges) */}
                      {job.criteria && Array.isArray(job.criteria) && job.criteria.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.criteria.slice(0, size === "large" ? 6 : size === "medium" ? 4 : 3).map((c: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20"
                            >
                              {c.label || c.key || c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Maaş */}
                      {job.salary && (
                        <div className="mt-auto pt-3">
                          <div className={`font-semibold text-emerald-400 ${size === "large" ? "text-base" : "text-sm"}`}>
                            {job.salary.min && job.salary.max
                              ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ₺`
                              : job.salary.min
                              ? `${job.salary.min.toLocaleString()} ₺+`
                              : "Maaş belirtilmemiş"}
                          </div>
                        </div>
                      )}

                      {/* Görüntüle butonu */}
                      <div className="mt-3">
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:gap-2 transition-all">
                          <span>Detayları Gör</span>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots navigation */}
      {totalSlides > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-8 bg-emerald-500"
                  : "w-2 bg-slate-700 hover:bg-slate-600"
              }`}
              aria-label={`Slayt ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
