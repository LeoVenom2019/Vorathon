import { triggerFeedback, handlePlayerDeath } from '../core/Store';
import { GameState } from '../core/GameState';
import { visualEffectSystem } from './visualEffectSystem';

export enum GameOverStep {
    NONE,
    SLOW_MO,
    ZOOMING,
    EXPLODING,
    FREEZE_STAY,
    SHOW_TEXT,
    FINISHED
}

export class GameOverSystem {
    step: GameOverStep = GameOverStep.NONE;
    timer: number = 0;
    timeScale: number = 1.0;
    zoom: number = 1.0;
    cameraTarget = { x: 0, y: 0 };
    overlayAlpha = 0;
    showMenu: boolean = false;

    start(playerX: number, playerY: number) {
        if (this.step !== GameOverStep.NONE) return;
        
        this.step = GameOverStep.SLOW_MO;
        this.timer = 0;
        this.timeScale = 0.3; 
        this.zoom = 1.0;
        this.cameraTarget = { x: playerX, y: playerY };
        this.overlayAlpha = 0;
        this.showMenu = false;
    }

    update(delta: number, playerX: number, playerY: number) {
        if (this.step === GameOverStep.NONE) return;

        // Use raw delta for some timers to ensure they progress even during freeze? 
        // No, we want absolute control. But if timeScale is 0, this update won't progress timer unless we use a raw delta here.
        // Engine.ts passes the SCALED delta. I should use the delta passed but be aware of timeScale.
        // Actually, I'll pass rawDelta to gameOverSystem.update from Engine loop.
        
        this.timer += delta;

        switch (this.step) {
            case GameOverStep.SLOW_MO:
                if (this.timer > 0.6) {
                    this.step = GameOverStep.ZOOMING;
                    this.timer = 0;
                }
                break;

            case GameOverStep.ZOOMING:
                // Smooth zoom towards ship
                this.zoom = Math.min(2.0, 1.0 + this.timer * 1.5);
                if (this.timer > 1.0) {
                    this.step = GameOverStep.EXPLODING;
                    this.timer = 0;
                    this.timeScale = 1.0; // Explosion at normal speed for impact
                    visualEffectSystem.emitExplosion(playerX, playerY, '#ef4444', 150);
                    visualEffectSystem.emitExplosion(playerX, playerY, '#f59e0b', 80);
                    triggerFeedback('flash', 1.0);
                }
                break;

            case GameOverStep.EXPLODING:
                if (this.timer > 0.5) {
                    this.step = GameOverStep.FREEZE_STAY;
                    this.timer = 0;
                    this.timeScale = 0; // FREEZE
                }
                break;

            case GameOverStep.FREEZE_STAY:
                // Gradually increase red overlay
                this.overlayAlpha = Math.min(0.6, this.overlayAlpha + delta * 1.5);
                if (this.timer > 0.8) {
                    this.step = GameOverStep.SHOW_TEXT;
                    this.timer = 0;
                }
                break;

            case GameOverStep.SHOW_TEXT:
                this.overlayAlpha = Math.min(0.7, this.overlayAlpha + delta);
                if (this.timer > 1.2) {
                    this.step = GameOverStep.FINISHED;
                    this.showMenu = true;
                }
                break;
        }
    }

    reset() {
        this.step = GameOverStep.NONE;
        this.timer = 0;
        this.timeScale = 1.0;
        this.zoom = 1.0;
        this.overlayAlpha = 0;
        this.showMenu = false;
    }
}

export const gameOverSystem = new GameOverSystem();
