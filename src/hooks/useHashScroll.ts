import { useEffect } from "react";
import { SECTION_ORDER, isAfterAttack } from "@/lib/sections";

// A global signal read by AttackGate to skip its scroll lock when the user
// arrived via a hash pointing at (or past) a later section.
declare global {
  interface Window {
    __bypassAttackLock?: boolean;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * useHashScroll — scrolls to `window.location.hash` after mount and on
 * hashchange. Polls up to ~2s because the target section may not exist yet
 * on first render. Respects prefers-reduced-motion.
 *
 * Also toggles `window.__bypassAttackLock` when the hash targets a section
 * that lives after the scroll-locked Attack section, so the lock doesn't
 * strand the reader above their intended anchor.
 */
export function useHashScroll() {
  useEffect(() => {
    let cancelled = false;

    const jump = (rawHash: string) => {
      const id = rawHash.replace(/^#/, "");
      if (!id) return;
      // Only act on known section anchors — leave other in-page anchors alone.
      if (!SECTION_ORDER.includes(id)) return;

      // Release the Attack scroll lock for hash-driven nav to any section
      // other than the Attack itself. Landing on #the-attack keeps the
      // normal (locked) initial state.
      if (id !== "the-attack" && isAfterAttack(id)) {
        window.__bypassAttackLock = true;
        // Undo any lock that a mount may already have applied.
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
      } else {
        window.__bypassAttackLock = false;
      }

      const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
      const started = performance.now();
      const DEADLINE = 2000;

      const tick = () => {
        if (cancelled) return;
        const el = document.getElementById(id);
        if (el) {
          // Re-release the lock right before scrolling in case an effect
          // re-applied it between the flag being set and the element mounting.
          if (window.__bypassAttackLock) {
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
          }
          el.scrollIntoView({ behavior, block: "start" });
          return;
        }
        if (performance.now() - started > DEADLINE) return;
        requestAnimationFrame(tick);
      };
      tick();
    };

    // Initial hash on mount.
    if (window.location.hash) jump(window.location.hash);

    const onHash = () => jump(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
}
