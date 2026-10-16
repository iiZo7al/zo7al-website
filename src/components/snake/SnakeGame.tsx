"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { createPortal } from "react-dom";
import { X, RotateCcw, Pause, Play } from "lucide-react";
import "./snake.css";

type Point = { x: number; y: number };
type Impact = { x: number; y: number; started: number; until: number };

const CELL = 26;
const STEP_MS = 118;

export default function SnakeGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const locale = useLocale();
  const isArabic = locale.toLowerCase().startsWith("ar");
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const pausedRef = useRef(false);
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const queuedDirectionRef = useRef<Point>({ x: 1, y: 0 });
  const snakeRef = useRef<Point[]>([]);
  const appleRef = useRef<Point>({ x: 0, y: 0 });
  const impactRef = useRef<Impact | null>(null);
  const appleImageRef = useRef<HTMLImageElement | null>(null);
  const snakeHeadImageRef = useRef<HTMLImageElement | null>(null);
  const snakeBodyImageRef = useRef<HTMLImageElement | null>(null);
  const impactImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (!portalRoot) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const appleImage = new Image();
    appleImage.src = "/snake/apple.svg";
    appleImageRef.current = appleImage;
    const snakeHeadImage = new Image();
    snakeHeadImage.src = "/snake/head.svg";
    snakeHeadImageRef.current = snakeHeadImage;
    const snakeBodyImage = new Image();
    snakeBodyImage.src = "/snake/body.svg";
    snakeBodyImageRef.current = snakeBodyImage;
    const impactImage = new Image();
    impactImage.src = "/snake/impact.svg";
    impactImageRef.current = impactImage;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let cols = Math.max(8, Math.floor(width / CELL));
    let rows = Math.max(8, Math.floor(height / CELL));
    let lastTime = 0;
    let elapsed = 0;
    let animationFrame = 0;
    let hitCooldown = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(8, Math.floor(width / CELL));
      rows = Math.max(8, Math.floor(height / CELL));
      if (snakeRef.current.length === 0) reset();
      draw();
    };

    const randomApple = (snake: Point[]) => {
      let next: Point;
      let attempts = 0;
      do {
        next = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
        attempts += 1;
      } while (attempts < 500 && snake.some((part) => part.x === next.x && part.y === next.y));
      return next;
    };

    const reset = () => {
      const centerX = Math.floor(cols / 2);
      const centerY = Math.floor(rows * 0.82);
      snakeRef.current = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY },
        { x: centerX - 3, y: centerY },
      ];
      directionRef.current = { x: 1, y: 0 };
      queuedDirectionRef.current = { x: 1, y: 0 };
      appleRef.current = randomApple(snakeRef.current);
      impactRef.current = null;
      hitCooldown = 0;
      scoreRef.current = 0;
      setScore(0);
      gameOverRef.current = false;
      setGameOver(false);
      pausedRef.current = false;
      setPaused(false);
      lastTime = 0;
      elapsed = 0;
    };

    const roundedRect = (x: number, y: number, w: number, h: number, radius: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
    };

    const draw = (now = performance.now()) => {
      ctx.clearRect(0, 0, width, height);
      const snake = snakeRef.current;
      if (!snake.length) return;
      const head = snake[0];

      // Build the snake from the user's uploaded Google Snake eye and body sprites.
      const direction = directionRef.current;
      snake.forEach((part, index) => {
        const centerX = part.x * CELL + CELL / 2;
        const centerY = part.y * CELL + CELL / 2;
        const sprite = index === 0 ? snakeHeadImage : snakeBodyImage;
        const spriteLoaded = sprite?.complete && sprite.naturalWidth;
        ctx.save();
        ctx.filter = "hue-rotate(170deg) saturate(1.15)";
        ctx.shadowColor = index === 0 ? "rgba(255,145,25,.58)" : "rgba(255,122,0,.28)";
        ctx.shadowBlur = index === 0 ? 12 : 6;
        if (index === 0) {
          ctx.translate(centerX, centerY);
          ctx.rotate(Math.atan2(direction.y, direction.x));
          if (spriteLoaded) {
            ctx.drawImage(sprite, -CELL * 0.55, -CELL * 0.55, CELL * 1.1, CELL * 1.1);
          } else {
            ctx.fillStyle = "#ff9f2f";
            ctx.beginPath();
            ctx.arc(0, 0, CELL * 0.44, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (spriteLoaded) {
          ctx.drawImage(sprite, centerX - CELL * 0.43, centerY - CELL * 0.43, CELL * 0.86, CELL * 0.86);
        } else {
          ctx.fillStyle = "#f58b24";
          ctx.beginPath();
          ctx.arc(centerX, centerY, CELL * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      const apple = appleRef.current;
      if (appleImage.complete && appleImage.naturalWidth) {
        ctx.drawImage(appleImage, apple.x * CELL + 1, apple.y * CELL + 1, CELL - 2, CELL - 2);
      } else {
        ctx.fillStyle = "#eb332a";
        ctx.beginPath();
        ctx.arc(apple.x * CELL + CELL / 2, apple.y * CELL + CELL / 2, CELL * 0.37, 0, Math.PI * 2);
        ctx.fill();
      }

      const impact = impactRef.current;
      if (impact && impact.until > now) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const frameIndex = Math.min(20, Math.floor((now - impact.started) / 30));
        if (impactImage.complete && impactImage.naturalWidth) {
          ctx.drawImage(impactImage, frameIndex * 98 + 6, 0, 90, 135, impact.x - 44, impact.y - 53, 88, 106);
        }
        ctx.restore();
        ctx.font = "700 26px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💫", impact.x, impact.y - 12);
      } else if (impact) {
        impactRef.current = null;
      }
    };

    const hitsVisibleText = (point: Point) => {
      const x = point.x * CELL + CELL / 2;
      const y = point.y * CELL + CELL / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || canvas.contains(hit) || hit.closest(".snake-game-overlay")) return false;
      const target = hit.closest('h1,h2,h3,h4,p,a,button,label,li,span,strong,img,svg,video,canvas,[role="button"],[data-cursor]');
      return Boolean(target && (target.matches("img,svg,video,canvas") || target.textContent?.trim()));
    };

    const step = () => {
      if (pausedRef.current || gameOverRef.current) return;
      const snake = snakeRef.current;
      const nextDirection = queuedDirectionRef.current;
      directionRef.current = nextDirection;
      const head = snake[0];
      const next = { x: head.x + nextDirection.x, y: head.y + nextDirection.y };
      if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows ||
          snake.some((part, index) => index > 0 && part.x === next.x && part.y === next.y)) {
        gameOverRef.current = true;
        setGameOver(true);
        return;
      }

      snake.unshift(next);
      const eating = next.x === appleRef.current.x && next.y === appleRef.current.y;
      if (eating) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        appleRef.current = randomApple(snake);
      } else {
        snake.pop();
      }

      if (hitCooldown > 0) hitCooldown -= 1;
      if (hitCooldown === 0 && hitsVisibleText(next)) {
        const started = performance.now();
        impactRef.current = { x: next.x * CELL + CELL / 2, y: next.y * CELL + CELL / 2, started, until: started + 650 };
        hitCooldown = 4;
      }
    };

    const frame = (now: number) => {
      if (!lastTime) lastTime = now;
      const delta = Math.min(80, now - lastTime);
      lastTime = now;
      if (!pausedRef.current && !gameOverRef.current) {
        elapsed += delta;
        while (elapsed >= STEP_MS) {
          step();
          elapsed -= STEP_MS;
        }
      }
      draw(now);
      animationFrame = window.requestAnimationFrame(frame);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };
      if (event.key === "Escape") {
        event.preventDefault();
        onExit();
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        return;
      }
      if (gameOverRef.current && event.key === "Enter") {
        event.preventDefault();
        reset();
        return;
      }
      const direction = keyMap[event.key];
      if (!direction) return;
      event.preventDefault();
      const current = directionRef.current;
      if (direction.x === -current.x && direction.y === -current.y) return;
      queuedDirectionRef.current = direction;
    };

    resize();
    animationFrame = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      appleImageRef.current = null;
      snakeHeadImageRef.current = null;
      snakeBodyImageRef.current = null;
      impactImageRef.current = null;
    };
    // Game state is held in refs so the animation loop stays stable.
  }, [onExit, portalRoot]);

  if (!portalRoot) return null;

  return createPortal(
    <div className="snake-game-overlay" dir={isArabic ? "rtl" : "ltr"} role="application" aria-label={isArabic ? "لعبة الثعبان" : "Snake game"}>
      <canvas ref={canvasRef} className="snake-game-canvas" aria-hidden="true" />
      <section className="snake-game-hud">
        <div className="snake-game-score">
          <span className="snake-game-score-label">{isArabic ? "التفاحات" : "APPLES"}</span>
          <strong>{String(score).padStart(2, "0")}</strong>
        </div>
        <span className="snake-game-hint">{isArabic ? "تحكم بالأسهم · مسافة للإيقاف" : "ARROWS TO MOVE · SPACE TO PAUSE"}</span>
        <div className="snake-game-actions">
          <button type="button" onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }} aria-label={paused ? (isArabic ? "استمرار" : "Resume") : (isArabic ? "إيقاف مؤقت" : "Pause")} className="snake-game-icon-button">
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button type="button" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }))} aria-label={isArabic ? "إعادة اللعب" : "Restart"} className="snake-game-icon-button">
            <RotateCcw size={17} />
          </button>
          <button type="button" onClick={onExit} aria-label={isArabic ? "إغلاق اللعبة" : "Close game"} className="snake-game-icon-button">
            <X size={18} />
          </button>
        </div>
      </section>
      {gameOver && (
        <div className="snake-game-over" role="status">
          <span className="snake-game-over-spark">💫</span>
          <h2>{isArabic ? "اصطدم الثعبان!" : "SNAKE GAME OVER"}</h2>
          <p>{isArabic ? `جمعت ${score} تفاحة` : `You ate ${score} apples`}</p>
          <button type="button" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }))} className="snake-game-restart">{isArabic ? "العب مرة ثانية" : "PLAY AGAIN"}</button>
        </div>
      )}
    </div>,
    portalRoot
  );
}
