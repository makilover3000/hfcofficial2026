import { useEffect, useRef, useCallback } from 'react';
import type { CoordinationSignal } from '../types';

interface Particle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
  progress: number;
  startTime: number;
  duration: number;
  active: boolean;
}

interface WaveCanvasProps {
  signals: CoordinationSignal[];
  sitePositions: Map<string, { x: number; y: number }>;
  className?: string;
}

export function WaveCanvas({ signals, sitePositions, className = '' }: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const processedSignalsRef = useRef<number>(0);

  const spawnParticle = useCallback((fromId: string, toId: string) => {
    const from = sitePositions.get(fromId);
    const to = sitePositions.get(toId);
    if (!from || !to) return;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const offset = Math.sqrt(dx * dx + dy * dy) * 0.3;

    particlesRef.current.push({
      startX: from.x,
      startY: from.y,
      endX: to.x,
      endY: to.y,
      controlX: midX - dy * 0.3 + (Math.random() - 0.5) * offset * 0.5,
      controlY: midY + dx * 0.3 + (Math.random() - 0.5) * offset * 0.5,
      progress: 0,
      startTime: performance.now(),
      duration: 1500,
      active: true,
    });
  }, [sitePositions]);

  useEffect(() => {
    if (signals.length > processedSignalsRef.current) {
      for (let i = processedSignalsRef.current; i < signals.length; i++) {
        spawnParticle(signals[i].from_site_id, signals[i].to_site_id);
      }
      processedSignalsRef.current = signals.length;
    }
  }, [signals, spawnParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      particlesRef.current = particlesRef.current.filter(p => p.active);

      for (const p of particlesRef.current) {
        const elapsed = now - p.startTime;
        p.progress = Math.min(elapsed / p.duration, 1);

        if (p.progress >= 1) {
          p.active = false;
          // Flash effect at arrival
          ctx.beginPath();
          ctx.arc(p.endX, p.endY, 20, 0, Math.PI * 2);
          const flashGrad = ctx.createRadialGradient(p.endX, p.endY, 0, p.endX, p.endY, 20);
          flashGrad.addColorStop(0, 'rgba(96, 165, 250, 0.8)');
          flashGrad.addColorStop(1, 'rgba(96, 165, 250, 0)');
          ctx.fillStyle = flashGrad;
          ctx.fill();
          continue;
        }

        const t = p.progress;
        // Quadratic bezier position
        const x = (1 - t) * (1 - t) * p.startX + 2 * (1 - t) * t * p.controlX + t * t * p.endX;
        const y = (1 - t) * (1 - t) * p.startY + 2 * (1 - t) * t * p.controlY + t * t * p.endY;

        // Draw trail
        const trailLength = 8;
        for (let i = 0; i < trailLength; i++) {
          const tt = Math.max(0, t - (i * 0.015));
          const tx = (1 - tt) * (1 - tt) * p.startX + 2 * (1 - tt) * tt * p.controlX + tt * tt * p.endX;
          const ty = (1 - tt) * (1 - tt) * p.startY + 2 * (1 - tt) * tt * p.controlY + tt * tt * p.endY;
          const alpha = (1 - i / trailLength) * 0.6;
          const radius = 4 - (i / trailLength) * 2;

          ctx.beginPath();
          ctx.arc(tx, ty, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.fill();
        }

        // Glow head
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 6);
        grad.addColorStop(0, 'rgba(96, 165, 250, 1)');
        grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-20 ${className}`}
    />
  );
}
