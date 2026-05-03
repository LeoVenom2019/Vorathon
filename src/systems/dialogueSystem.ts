import { getPlayerState } from '../core/Store';
import { companionSystem, CompanionType } from './companionSystem';

export interface Dialogue {
    id: string;
    text: string;
    sourceId: 'player' | 'summoner' | 'shooter' | 'supporter';
    duration: number;
    timer: number;
    color: string;
    targetX: number;
    targetY: number;
}

class DialogueSystem {
    private dialogues: Dialogue[] = [];
    private lastDialogueTime: Record<string, number> = {
        player: 0,
        summoner: 0,
        shooter: 0,
        supporter: 0
    };
    private globalCooldown = 1.5; // Minimum time between any two dialogues

    private library = {
        player: {
            shockwave: ["TEMPESTADE CELESTIAL!", "Relâmpagos Eternos!", "Poder de Zeus!"],
            explosion: ["SUPERNOVA PRIMORDIAL!", "Calor Absoluto!", "Estrela Cadente!"],
            thunder: ["RUPTURA ASTRAL!", "Fenda dimensional!", "Vazio Cosmico!"],
            blizzard: ["ERA GLACIAL!", "Zero Absoluto!", "Congelamento Total!"],
            random: ["Vorathon neles!", "Velocidade máxima!", "Estou no controle."]
        },
        summoner: ["Pra cima deles!", "Vou puxar tudo!", "Eles não escapam!", "Buraco negro ativo!"],
        shooter: ["Engulam essa!", "Fogo liberado!", "Alvo travado!", "Recarregando... Brincadeira!"],
        supporter: ["Vai uma proteção aí, patrão?", "Escudo ativado!", "Segura firme!", "Sempre alerta!"]
    };

    update(delta: number, entityPositions: Record<string, {x: number, y: number}>) {
        for (let i = this.dialogues.length - 1; i >= 0; i--) {
            const d = this.dialogues[i];
            d.timer -= delta;
            
            // Update position to follow source
            if (entityPositions[d.sourceId]) {
                d.targetX = entityPositions[d.sourceId].x;
                d.targetY = entityPositions[d.sourceId].y;
            }

            if (d.timer <= 0) {
                this.dialogues.splice(i, 1);
            }
        }

        Object.keys(this.lastDialogueTime).forEach(key => {
            this.lastDialogueTime[key] += delta;
        });
    }

    trigger(source: Dialogue['sourceId'], event?: string) {
        // Handle special player abilities with extra flair
        const isSpecialAbility = source === 'player' && event && ['shockwave', 'explosion', 'thunder', 'blizzard'].includes(event);

        // Redirect to companion system if it's a companion
        if (source !== 'player') {
            const compType = source === 'summoner' ? CompanionType.SUMMONER : 
                           source === 'shooter' ? CompanionType.SHOOTER :
                           CompanionType.SUPPORTER;
            const companion = companionSystem.getCompanion(compType);
            if (companion) {
                let choices = (this.library as any)[source];
                if (Array.isArray(choices)) {
                    companion.say(choices, 2.0);
                }
                return;
            }
        }

        const timeSinceGlobal = Math.max(...Object.values(this.lastDialogueTime));
        // Special abilities bypass most cooldowns
        if (!isSpecialAbility) {
            if (this.dialogues.length > 0 && Math.min(...Object.values(this.lastDialogueTime)) < 0.8) return;
            if (this.lastDialogueTime[source] < this.globalCooldown) return;
        }

        let text = "";
        if (source === 'player' && event) {
            const pool = (this.library.player as any)[event] || this.library.player.random;
            text = pool[Math.floor(Math.random() * pool.length)];
        } else if (source === 'summoner') {
            text = this.library.summoner[Math.floor(Math.random() * this.library.summoner.length)];
        } else if (source === 'shooter') {
            text = this.library.shooter[Math.floor(Math.random() * this.library.shooter.length)];
        } else if (source === 'supporter') {
            text = this.library.supporter[Math.floor(Math.random() * this.library.supporter.length)];
        } else if (source === 'player') {
            text = this.library.player.random[Math.floor(Math.random() * this.library.player.random.length)];
        }

        if (!text) return;

        const colors = {
            player: '#ffffff',
            summoner: '#a855f7', // Purple/Violet
            shooter: '#ef4444',  // Red/Orange (Correction to #ef4444 for Red/Vibrant)
            supporter: '#06b6d4' // Blue/Cyan
        };

        // Specialized colors for player abilities
        let bubbleColor = colors[source];
        if (isSpecialAbility) {
            switch (event) {
                case 'shockwave': bubbleColor = '#eab308'; break; // Yellow
                case 'explosion': bubbleColor = '#f97316'; break; // Orange
                case 'thunder':   bubbleColor = '#a855f7'; break; // Purple
                case 'blizzard':  bubbleColor = '#60a5fa'; break; // Light Blue
            }
        }

        this.dialogues.push({
            id: Math.random().toString(36).substr(2, 9),
            text: isSpecialAbility ? text.toUpperCase() : text,
            sourceId: source,
            duration: isSpecialAbility ? 1.5 : 2.5,
            timer: isSpecialAbility ? 1.5 : 2.5,
            color: bubbleColor,
            targetX: 0,
            targetY: 0
        });

        this.lastDialogueTime[source] = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        const activeDialogues = this.dialogues.map(d => {
            const isSpecial = d.text.endsWith('!') && d.sourceId === 'player';
            const maxT = isSpecial ? 1.5 : 2.5;
            
            // Entry animation: scale 0 -> 1 in 0.2s
            let scale = 1;
            const entryTime = 0.2;
            const timeAlive = maxT - d.timer;
            if (timeAlive < entryTime) {
                scale = timeAlive / entryTime;
                // Add pop + bounce effect
                scale = 1 + Math.sin(timeAlive * Math.PI * 5) * 0.2 * (1 - timeAlive/entryTime);
            }

            // Exit animation: fade + float up in 0.3s
            let alpha = 1;
            let floatY = 0;
            const exitTime = 0.4;
            if (d.timer < exitTime) {
                alpha = d.timer / exitTime;
                floatY = (1 - alpha) * -30;
                scale *= alpha;
            }
            
            const baseSizeMult = isSpecial ? 2.56 : 1.4; // 1.6 * 1.6 = 2.56 (Player special +60%) or +40% bots
            
            const baseY = d.targetY - (isSpecial ? 100 : 60) + floatY;
            
            return {
                ...d,
                scale: scale * baseSizeMult,
                alpha,
                currentY: baseY,
                adjustedY: baseY,
                isSpecial
            };
        });

        // Simple overlap resolution (vertical)
        activeDialogues.sort((a, b) => a.currentY - b.currentY);
        
        const minGap = 50; 
        for (let i = 0; i < activeDialogues.length; i++) {
            for (let j = i + 1; j < activeDialogues.length; j++) {
                const a = activeDialogues[i];
                const b = activeDialogues[j];
                const dx = Math.abs(a.targetX - b.targetX);
                const dy = Math.abs(a.adjustedY - b.adjustedY);
                if (dx < 150 && dy < minGap) {
                    b.adjustedY -= (minGap - dy);
                }
            }
        }

        activeDialogues.forEach(d => {
            ctx.save();
            
            ctx.globalAlpha = d.alpha;
            ctx.translate(d.targetX, d.adjustedY);
            ctx.scale(d.scale, d.scale);

            // Draw balloon
            ctx.font = `black ${d.isSpecial ? 14 : 12}px "Inter", sans-serif`;
            const metrics = ctx.measureText(d.text);
            const padding = 12;
            const w = metrics.width + padding * 2;
            const h = d.isSpecial ? 28 : 24;

            // SHADOW / GLOW
            ctx.shadowBlur = d.isSpecial ? 25 : 12;
            ctx.shadowColor = d.color;

            // Box background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = d.color;
            ctx.lineWidth = d.isSpecial ? 3 : 2;
            
            // Balloon body
            ctx.beginPath();
            ctx.roundRect(-w/2, -h, w, h, 6);
            ctx.fill();
            ctx.stroke();
            
            // Tail
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.text, 0, -h / 2);

            ctx.restore();
        });
        ctx.restore();
    }

    getDialogues() {
        return this.dialogues;
    }
}

export const dialogueSystem = new DialogueSystem();
