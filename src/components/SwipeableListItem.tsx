import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeableListItemProps {
  children: ReactNode;
  actionLabel: string;
  onAction: () => void;
  className?: string;
  actionClassName?: string;
}

export function SwipeableListItem({
  children,
  actionLabel,
  onAction,
  className,
  actionClassName,
}: SwipeableListItemProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const actionWidth = 112;
  const threshold = actionWidth / 2;

  useEffect(() => {
    if (!isDragging) {
      setOffset(isOpen ? -actionWidth : 0);
      currentOffsetRef.current = isOpen ? -actionWidth : 0;
    }
  }, [isDragging, isOpen]);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A", "LABEL"].includes(target.tagName)) {
      return true;
    }
    return Boolean(target.closest("button, input, textarea, select, a, label"));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    startXRef.current = event.clientX;
    activePointerRef.current = event.pointerId;
    setIsDragging(true);
    currentOffsetRef.current = isOpen ? -actionWidth : 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || activePointerRef.current !== event.pointerId) return;
    const deltaX = event.clientX - startXRef.current;
    const nextOffset = Math.min(0, Math.max(-actionWidth, currentOffsetRef.current + deltaX));
    setOffset(nextOffset);
  };

  const finalizeSwipe = () => {
    const shouldOpen = offset <= -threshold;
    setIsOpen(shouldOpen);
    setOffset(shouldOpen ? -actionWidth : 0);
    currentOffsetRef.current = shouldOpen ? -actionWidth : 0;
    setIsDragging(false);
    activePointerRef.current = null;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    finalizeSwipe();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    finalizeSwipe();
  };

  const handleAction = () => {
    onAction();
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative overflow-hidden", className)}
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className="relative z-10 transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>

      <div className="absolute inset-y-0 right-0 flex w-[112px] items-center justify-center bg-destructive">
        <button
          type="button"
          onClick={handleAction}
          className={cn(
            "h-full w-full text-sm font-bold uppercase tracking-wide text-white",
            actionClassName
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
