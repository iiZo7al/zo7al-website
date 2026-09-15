"use client";

import { useCallback, useEffect, useId, useRef, type PointerEvent } from "react";

import { useTranslations } from "next-intl";

interface GameControlsProps {
  onMove: (x: number, y: number) => void;
  onExit: () => void;
}

const DEAD_ZONE = 0.12;

export default function GameControls({ onMove, onExit }: GameControlsProps) {
  const t = useTranslations("game");
  const instructionsId = useId();
  const joystickRef = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const geometryRef = useRef({ x: 0, y: 0, radius: 1 });
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const resetJoystick = useCallback(() => {
    const pointerId = activePointerRef.current;
    activePointerRef.current = null;
    onMoveRef.current(0, 0);

    if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
    const joystick = joystickRef.current;
    if (!joystick) return;
    joystick.dataset.active = "false";

    if (pointerId !== null && joystick.hasPointerCapture(pointerId)) {
      joystick.releasePointerCapture(pointerId);
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) resetJoystick();
    };

    window.addEventListener("blur", resetJoystick);
    window.addEventListener("resize", resetJoystick);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", resetJoystick);
      window.removeEventListener("resize", resetJoystick);
      document.removeEventListener("visibilitychange", handleVisibility);
      resetJoystick();
    };
  }, [resetJoystick]);

  const updateJoystick = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerId !== activePointerRef.current) return;

    const { x, y, radius } = geometryRef.current;
    const rawX = (event.clientX - x) / radius;
    const rawY = (y - event.clientY) / radius;
    const distance = Math.hypot(rawX, rawY);
    const limit = Math.max(1, distance);
    const clampedX = rawX / limit;
    const clampedY = rawY / limit;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${clampedX * radius}px, ${-clampedY * radius}px)`;
    }

    // Preserve analog strength and cap diagonals at the same speed as the axes.
    const strength = Math.max(0, (Math.min(distance, 1) - DEAD_ZONE) / (1 - DEAD_ZONE));
    onMoveRef.current(
      distance > 0 ? (rawX / distance) * strength : 0,
      distance > 0 ? (rawY / distance) * strength : 0,
    );
  };

  const startJoystick = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || activePointerRef.current !== null) return;
    event.preventDefault();
    event.stopPropagation();

    const bounds = event.currentTarget.getBoundingClientRect();
    const knobSize = knobRef.current?.offsetWidth ?? 42;
    geometryRef.current = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
      radius: Math.max(1, (Math.min(bounds.width, bounds.height) - knobSize) / 2 - 6),
    };

    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.active = "true";
    event.currentTarget.focus({ preventScroll: true });
    updateJoystick(event);
  };

  const stopJoystick = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerId === activePointerRef.current) resetJoystick();
  };

  return (
    <div className="game-controls" >
      <div className="movement-controls">
        <div
          className="keyboard-guide"
          role="group"
          aria-label={t("keysHelp")}
        >
          <div className="keys" aria-hidden="true">
            {["W", "A", "S", "D"].map((key) => <kbd key={key}>{key}</kbd>)}
          </div>
          <span className="control-label">{t("move")}</span>
        </div>

        <div className="touch-guide">
          <button
            ref={joystickRef}
            type="button"
            className="joystick"
            aria-label={t("joystick")}
            aria-describedby={instructionsId}
            onPointerDown={startJoystick}
            onPointerMove={updateJoystick}
            onPointerUp={stopJoystick}
            onPointerCancel={stopJoystick}
            onLostPointerCapture={stopJoystick}
            onBlur={resetJoystick}
            onContextMenu={(event) => event.preventDefault()}
          >
            <span className="direction up" aria-hidden="true">↑</span>
            <span className="direction right" aria-hidden="true">→</span>
            <span className="direction down" aria-hidden="true">↓</span>
            <span className="direction left" aria-hidden="true">←</span>
            <span ref={knobRef} className="joystick-knob" aria-hidden="true">
              <span />
            </span>
          </button>
          <span className="control-label">{t("drag")}</span>
          <span id={instructionsId} className="sr-only">
            {t("joystickHelp")}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="exit-button"
        onClick={() => {
          resetJoystick();
          onExit();
        }}
      >
        <span aria-hidden="true">↗</span>
        <span>{t("exit")}</span>
        <kbd aria-hidden="true">Esc</kbd>
      </button>

      <style jsx>{`
        .game-controls {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          z-index: 20;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          padding: 24px;
          padding-left: max(24px, env(safe-area-inset-left));
          padding-right: max(24px, env(safe-area-inset-right));
          padding-bottom: max(24px, env(safe-area-inset-bottom));
          color: white;
          font-family: var(--font-geist-mono, monospace);
          pointer-events: none;
          user-select: none;
        }
        .movement-controls {
          display: flex;
          align-items: flex-end;
          gap: 24px;
        }
        .keyboard-guide, .touch-guide {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .touch-guide { display: none; }
        .keys { display: flex; gap: 6px; }
        .keys kbd {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-bottom-width: 3px;
          border-radius: 7px;
          background: rgba(9, 10, 16, 0.72);
          font-size: 13px;
          font-weight: 600;
        }
        .control-label {
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
          text-shadow: 0 1px 6px #000;
        }
        .joystick {
          position: relative;
          display: grid;
          width: 116px;
          height: 116px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 142, 0, 0.1), rgba(8, 10, 18, 0.78));
          box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.025);
          color: rgba(255, 255, 255, 0.45);
          pointer-events: auto;
          touch-action: none;
          cursor: grab;
          -webkit-tap-highlight-color: transparent;
        }
        .joystick[data-active="true"] {
          border-color: var(--accent);
          cursor: grabbing;
        }
        .joystick-knob {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid var(--accent);
          border-radius: 50%;
          background: #25190f;
          box-shadow: 0 0 18px rgba(255, 142, 0, 0.18);
          pointer-events: none;
          will-change: transform;
        }
        .joystick-knob span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
        }
        .direction { position: absolute; font-size: 13px; pointer-events: none; }
        .up { top: 6px; }
        .right { right: 8px; }
        .down { bottom: 6px; }
        .left { left: 8px; }
        .exit-button {
          display: flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 999px;
          background: rgba(9, 10, 16, 0.75);
          color: rgba(255, 255, 255, 0.85);
          font-size: 11px;
          white-space: nowrap;
          pointer-events: auto;
          cursor: pointer;
        }
        .exit-button kbd { color: rgba(255, 255, 255, 0.45); font-size: 10px; }
        .exit-button:hover { border-color: var(--accent); color: white; }
        .joystick:focus-visible, .exit-button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
        }
        @media (any-pointer: coarse), (max-width: 600px) {
          .touch-guide { display: flex; }
        }
        @media (hover: none) and (pointer: coarse) {
          .keyboard-guide, .exit-button kbd { display: none; }
        }
        @media (max-width: 600px) {
          .keyboard-guide { display: none; }
        }
        @media (max-width: 480px) {
          .game-controls {
            padding-left: max(16px, env(safe-area-inset-left));
            padding-right: max(16px, env(safe-area-inset-right));
            padding-bottom: max(20px, env(safe-area-inset-bottom));
          }
          .movement-controls { gap: 12px; }
          .keys { gap: 3px; }
          .keys kbd { width: 25px; height: 30px; font-size: 11px; }
          .joystick { width: 104px; height: 104px; }
          .exit-button { padding-inline: 12px; gap: 7px; }
        }
        @media (max-height: 500px) and (any-pointer: coarse) {
          .game-controls { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
          .joystick { width: 96px; height: 96px; }
        }
      `}</style>
    </div>
  );
}

