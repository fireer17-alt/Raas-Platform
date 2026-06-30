import { useEffect, useRef } from 'react';

/**
 * CursorPaint — Watercolor Edition
 * ─────────────────────────────────────────────────────────────────────────
 * Renders soft, translucent watercolor blooms that follow the cursor.
 * Each stroke is made of many overlapping transparent circles with slight
 * positional jitter, mimicking how watercolor pigment spreads and bleeds.
 *
 * The normal system cursor is left untouched.
 */

// ── Watercolor palette (soft, desaturated pastels) ──────────────────────
const PALETTE = [
  { h: 260, s: 60, l: 72 },  // soft lavender
  { h: 200, s: 70, l: 68 },  // sky blue
  { h: 330, s: 55, l: 70 },  // rose
  { h: 170, s: 60, l: 62 },  // mint
  { h: 290, s: 50, l: 70 },  // lilac
  { h: 210, s: 65, l: 65 },  // periwinkle
];

function randomPalette() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

// ── Blob: one watercolor splat that lives for a fixed lifetime ───────────
function createBlob(x, y) {
  const color  = randomPalette();
  const radius = 18 + Math.random() * 22;   // 18–40 px
  const life   = 1.0;                        // 1.0 → 0.0 over time
  const decay  = 0.012 + Math.random() * 0.006;
  // scatter: watercolor bleeds slightly off the cursor path
  const ox = (Math.random() - 0.5) * 14;
  const oy = (Math.random() - 0.5) * 14;
  return { x: x + ox, y: y + oy, radius, color, life, decay };
}

export default function CursorPaint() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── resize ──────────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── state ────────────────────────────────────────────────────────────
    const blobs   = [];
    let   animId;
    let   lastX   = -999;
    let   lastY   = -999;
    let   spawnAcc = 0;    // accumulator: spawn blobs based on distance moved

    // ── mouse tracking ────────────────────────────────────────────────────
    const onMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      spawnAcc += dist;
      // spawn a new blob cluster roughly every 6 px of movement
      while (spawnAcc > 6) {
        spawnAcc -= 6;
        // 2–4 overlapping blobs per spawn = watercolor layering
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) blobs.push(createBlob(x, y));
      }

      lastX = x;
      lastY = y;
    };
    window.addEventListener('mousemove', onMove);

    // ── draw one watercolor blob ──────────────────────────────────────────
    const drawBlob = (b) => {
      const { x, y, radius, color, life } = b;

      // outer soft halo (the "wet edge" of watercolor)
      const halo = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 1.4);
      halo.addColorStop(0,   `hsla(${color.h},${color.s}%,${color.l}%,${life * 0.12})`);
      halo.addColorStop(0.6, `hsla(${color.h},${color.s}%,${color.l}%,${life * 0.07})`);
      halo.addColorStop(1,   `hsla(${color.h},${color.s}%,${color.l}%,0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // inner pigment core (slightly darker, more saturated)
      const core = ctx.createRadialGradient(x, y, 0, x, y, radius);
      core.addColorStop(0,   `hsla(${color.h},${color.s + 15}%,${color.l - 10}%,${life * 0.18})`);
      core.addColorStop(0.5, `hsla(${color.h},${color.s}%,${color.l}%,${life * 0.10})`);
      core.addColorStop(1,   `hsla(${color.h},${color.s}%,${color.l}%,0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();
    };

    // ── render loop ────────────────────────────────────────────────────────
    const draw = () => {
      animId = requestAnimationFrame(draw);

      // clear entire canvas each frame — watercolor persists via blob lifetime
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // soft blur gives the wet, diffuse watercolor look
      ctx.filter = 'blur(5px)';

      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i];
        drawBlob(b);
        b.life -= b.decay;
        if (b.life <= 0) blobs.splice(i, 1);
      }

      ctx.filter = 'none';
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99990,
        mixBlendMode: 'multiply',  // watercolors mix by multiplying pigment
      }}
    />
  );
}
