import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeableArchiveCardProps {
  children: ReactNode;
  onArchive: () => void;
  className?: string;
  actionClassName?: string;
  revealWidth?: number;
  actionLabel?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function SwipeableArchiveCard({
  children,
  onArchive,
  className,
  actionClassName,
  revealWidth = 80,
  actionLabel = "Archive",
  isOpen,
  onOpenChange,
}: SwipeableArchiveCardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  useEffect(() => {
    if (typeof isOpen === "boolean") {
      setInternalIsOpen(isOpen);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) {
      setOffset(internalIsOpen ? -revealWidth : 0);
      currentOffsetRef.current = internalIsOpen ? -revealWidth : 0;
    }
  }, [isDragging, internalIsOpen, revealWidth]);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A', 'LABEL'].includes(target.tagName)) {
      return true;
    }
    return Boolean(target.closest('button, input, textarea, select, a, label'));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    startXRef.current = event.clientX;
    activePointerRef.current = event.pointerId;
    setIsDragging(true);
    currentOffsetRef.current = isOpen ? -revealWidth : 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || activePointerRef.current !== event.pointerId) return;
    const deltaX = event.clientX - startXRef.current;
    const nextOffset = Math.min(0, Math.max(-revealWidth, currentOffsetRef.current + deltaX));
    setOffset(nextOffset);
  };

  const finalizeSwipe = () => {
    const threshold = revealWidth / 2;
    const shouldOpen = offset <= -threshold;
    setInternalIsOpen(shouldOpen);
    onOpenChange?.(shouldOpen);
    setOffset(shouldOpen ? -revealWidth : 0);
    currentOffsetRef.current = shouldOpen ? -revealWidth : 0;
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
    onArchive();
    setInternalIsOpen(false);
    onOpenChange?.(false);
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
        className="relative z-10 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>

      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{
          width: `${revealWidth}px`,
          opacity: offset === 0 ? 0 : 1,
          pointerEvents: offset === 0 ? "none" : "auto",
          transition: "opacity 150ms ease-out",
        }}
      >
        <button
          type="button"
          onClick={handleAction}
          className={cn(
            "h-12 w-full rounded-l-xl bg-destructive/95 text-xs font-bold uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-destructive",
            actionClassName
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
