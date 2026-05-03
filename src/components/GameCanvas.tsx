import React, { useEffect, useRef } from 'react';
import { Engine } from '../core/Engine';
import { Player } from '../core/Player';

import { GameState } from '../core/GameState';

export const GameCanvas: React.FC<{ setGameState: (state: GameState) => void }> = ({ setGameState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();

    // Initialize Engine
    const engine = new Engine(ctx, setGameState);
    const player = new Player(canvas.width / 4, canvas.height / 2);
    engine.start(player);
    engineRef.current = engine;

    return () => {
      observer.disconnect();
      engine.stop();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
