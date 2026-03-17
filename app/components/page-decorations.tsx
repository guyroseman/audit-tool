"use client";
import { usePathname } from "next/navigation";

export function PageDecorations() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  if (!isHome) return null;
  return (
    <>
      <div className="scanline" aria-hidden="true" />
      <div className="corner-bracket tl" aria-hidden="true" />
      <div className="corner-bracket tr" aria-hidden="true" />
      <div className="corner-bracket bl" aria-hidden="true" />
      <div className="corner-bracket br" aria-hidden="true" />
    </>
  );
}
