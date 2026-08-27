"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades/slides a section in the first time it enters the viewport. Pure
 * CSS animation triggered by a class toggle — no animation library.
 */
export function ScrollReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        visible
          ? { animation: "reveal-up 500ms ease-out both" }
          : { opacity: 0 }
      }
    >
      {children}
    </div>
  );
}
