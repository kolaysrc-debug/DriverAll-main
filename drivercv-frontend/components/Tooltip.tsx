"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactElement<any>;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  delayMs?: number;
  maxWidthClassName?: string;
};

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const hasTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || (navigator as any)?.maxTouchPoints > 0);
    setIsTouch(Boolean(hasTouch));
  }, []);

  return isTouch;
}

export default function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayMs = 350,
  maxWidthClassName = "max-w-[320px]",
}: TooltipProps) {
  const id = useId();
  const isTouch = useIsTouchDevice();

  const disabled = isTouch;

  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  const placementClassName = useMemo(() => {
    const base = "absolute z-50";

    const sideClass =
      side === "top"
        ? "bottom-full mb-2"
        : "top-full mt-2";

    const alignClass =
      align === "start"
        ? "left-0"
        : align === "end"
          ? "right-0"
          : "left-1/2 -translate-x-1/2";

    return [base, sideClass, alignClass].join(" ");
  }, [side, align]);

  const arrowClassName = useMemo(() => {
    const base =
      "pointer-events-none absolute h-2 w-2 rotate-45 border border-slate-700 bg-slate-900";

    const sideClass = side === "top" ? "-bottom-1" : "-top-1";

    const alignClass =
      align === "start"
        ? "left-4"
        : align === "end"
          ? "right-4"
          : "left-1/2 -translate-x-1/2";

    return [base, sideClass, alignClass].join(" ");
  }, [side, align]);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleOpen() {
    if (disabled) return;
    clearTimer();
    setArmed(true);
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, delayMs);
  }

  function closeNow() {
    clearTimer();
    setArmed(false);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    if (disabled) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      closeNow();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", closeNow, true);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", closeNow, true);
    };
  }, [open]);

  const originalProps = (children.props ?? {}) as Record<string, any>;

  const childProps: Record<string, any> = disabled
    ? {
        "aria-describedby": undefined,
      }
    : {
        "aria-describedby": open ? id : undefined,
        onMouseEnter: (e: any) => {
          originalProps.onMouseEnter?.(e);
          scheduleOpen();
        },
        onMouseLeave: (e: any) => {
          originalProps.onMouseLeave?.(e);
          closeNow();
        },
        onFocus: (e: any) => {
          originalProps.onFocus?.(e);
          scheduleOpen();
        },
        onBlur: (e: any) => {
          originalProps.onBlur?.(e);
          closeNow();
        },
      };

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      {React.cloneElement(children, childProps)}

      {!disabled && (open || armed) && (
        <span
          id={id}
          role="tooltip"
          className={placementClassName}
          style={{ display: open ? "block" : "none" }}
        >
          <span
            className={
              "relative block rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-xl " +
              maxWidthClassName
            }
          >
            <span className="whitespace-pre-line leading-relaxed">{content}</span>
            <span className={arrowClassName} />
          </span>
        </span>
      )}
    </span>
  );
}
