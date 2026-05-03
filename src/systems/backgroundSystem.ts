import { environmentSystem, EnvironmentTheme } from './environmentSystem';
import { ScrollDirection } from '../core/Types';
import { modeSystem } from './modeSystem';

interface ParallaxLayer {
    image?: HTMLImageElement;
    color?: string;
    speed: number;
    opacity: number;
    tiling: boolean;
    offset: { x: number, y: number };
}

class BackgroundSystem {
    private layers: ParallaxLayer[] = [];
    private initialized: boolean = false;
    private bgTime: number = 0;
    private images: Record<string, any> = {};
    
    // Smooth transition state
    private currentColors: { 
        bg1: {r:number, g:number, bl:number, al:number}, 
        bg2: {r:number, g:number, bl:number, al:number}, 
        n1: {r:number, g:number, bl:number, al:number}, 
        n2: {r:number, g:number, bl:number, al:number} 
    } | null = null;
    private targetThemeId: string | null = null;

    init() {
        if (this.initialized) return;
        this.initialized = true;
        const themes = ['stage1', 'ocean', 'desert', 'lava', 'deep_space', 'forest'];
        const layers = ['space_nebula_bg.png', 'starfield_bg.png'];

        for (const theme of themes) {
            this.images[theme] = {};
            for (const file of layers) {
                const img = new Image();
                img.src = `/assets/backgrounds/${theme}/${file}`;
                img.onload = () => { 
                    if (!this.images[theme]) this.images[theme] = {};
                    this.images[theme][file] = img; 
                };
            }
        }

        // Add base global assets as fallback
        const globalFiles = ['space_nebula_bg.png', 'starfield_bg.png'];
        for (const file of globalFiles) {
            const img = new Image();
            img.src = `/assets/backgrounds/${file}`;
            img.onload = () => { this.images[file] = img; };
        }

        // Define default layers
        // Layer 0: Deep Gradient (Static)
        this.layers.push({
            speed: 0,
            opacity: 1,
            tiling: false,
            offset: { x: 0, y: 0 }
        });

        // Layer 1: Distant Stars (Very Slow)
        this.layers.push({
            speed: 0.05,
            opacity: 0.6, // Increased
            tiling: true,
            offset: { x: 0, y: 0 }
        });

        // Layer 2: Nebulas / Clouds (Medium)
        this.layers.push({
            speed: 0.12,
            opacity: 0.5, // Increased
            tiling: true,
            offset: { x: 0, y: 0 }
        });

        // Layer 3: Close Detritus / Stars (Fast)
        this.layers.push({
            speed: 0.35,
            opacity: 0.8, // Increased
            tiling: true,
            offset: { x: 0, y: 0 }
        });

        this.initialized = true;
    }

    draw(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
        if (!this.initialized) this.init();
        
        const theme = environmentSystem.getTheme();
        const mode = modeSystem.getCurrentMode();
        const isHorizontal = mode.direction === ScrollDirection.HORIZONTAL;

        // --- SMOOTH THEME INTERPOLATION ---
        if (!this.currentColors) {
            this.currentColors = {
                bg1: this.parseHex(theme.bgColor1),
                bg2: this.parseHex(theme.bgColor2),
                n1: this.parseHex(theme.nebulaColor1),
                n2: this.parseHex(theme.nebulaColor2)
            };
            this.targetThemeId = theme.id;
        }

        // Lerp towards target theme
        const lerpFactor = 0.02; 
        this.lerpTo(this.currentColors.bg1, this.parseHex(theme.bgColor1), lerpFactor);
        this.lerpTo(this.currentColors.bg2, this.parseHex(theme.bgColor2), lerpFactor);
        this.lerpTo(this.currentColors.n1, this.parseHex(theme.nebulaColor1), lerpFactor);
        this.lerpTo(this.currentColors.n2, this.parseHex(theme.nebulaColor2), lerpFactor);

        const c_bg1 = `rgba(${this.currentColors.bg1.r}, ${this.currentColors.bg1.g}, ${this.currentColors.bg1.bl}, ${this.currentColors.bg1.al})`;
        const c_bg2 = `rgba(${this.currentColors.bg2.r}, ${this.currentColors.bg2.g}, ${this.currentColors.bg2.bl}, ${this.currentColors.bg2.al})`;
        const c_n1 = `rgba(${this.currentColors.n1.r}, ${this.currentColors.n1.g}, ${this.currentColors.n1.bl}, ${this.currentColors.n1.al})`;
        const c_n2 = `rgba(${this.currentColors.n2.r}, ${this.currentColors.n2.g}, ${this.currentColors.n2.bl}, ${this.currentColors.n2.al})`;

        // 1. Base Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, c_bg1);
        grad.addColorStop(1, c_bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Render Layers
        this.layers.forEach((layer, index) => {
            if (index === 0) return; // Skip base layer (gradient handled)

            const speedMult = layer.speed * 200;
            if (isHorizontal) {
                layer.offset.x = (time * speedMult) % width;
            } else {
                layer.offset.y = (time * speedMult) % height;
            }

            ctx.save();
            ctx.globalAlpha = layer.opacity;
            
            const themeId = theme.id.toLowerCase();
            const themeAssets = this.images[themeId] || {};

            if (index === 1) {
                // Distant Stars / Starfield
                const img = themeAssets['starfield_bg.png'] || this.images['starfield_bg.png'];
                if (img) {
                    this.drawTiledImage(ctx, img, width, height, layer.offset);
                } else {
                    this.drawProceduralStars(ctx, width, height, layer.offset, 150, 1, theme.particleColor);
                }
            } else if (index === 2) {
                // Nebulas
                const img = themeAssets['space_nebula_bg.png'] || this.images['space_nebula_bg.png'];
                ctx.globalCompositeOperation = 'screen';
                if (img) {
                    this.drawTiledImage(ctx, img, width, height, layer.offset);
                } else {
                    // Use interpolated nebula colors
                    this.drawNebulaLayer(ctx, width, height, layer.offset, c_n1, c_n2);
                }
            } else if (index === 3) {
                // Close Dust
                this.drawProceduralStars(ctx, width, height, layer.offset, 50, 2, theme.particleColor);
            }

            ctx.restore();
        });

        // 3. Ambient Elements
        this.drawAmbientEffects(ctx, width, height, time, theme);

        // 5. Vignette Overlay
        this.drawVignette(ctx, width, height);
    }

    private drawAmbientEffects(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, theme: EnvironmentTheme) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = theme.particleColor;
        ctx.fillStyle = theme.particleColor;

        if (theme.ambientEffects === 'bubbles') {
            for(let i=0; i<30; i++) {
                const y = (height + 200) - ((time * 80 + i * 150) % (height + 400));
                const x = (i * 100 + Math.sin(time + i) * 60) % width;
                ctx.beginPath();
                ctx.arc(x, y, 1 + Math.random() * 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (theme.ambientEffects === 'lava') {
             ctx.globalAlpha = 0.4;
             for(let i=0; i<12; i++) {
                const x = (width + 200) - ((time * 120 + i * 250) % (width + 400));
                const y = (i * 100 + Math.cos(time * 0.4 + i) * 120) % height;
                this.drawGlowCircle(ctx, x, y, 50 + Math.random() * 50, '#ef444433');
             }
        } else if (theme.ambientEffects === 'leaves') {
            for(let i=0; i<20; i++) {
                const x = (width + 200) - ((time * 60 + i * 180) % (width + 400));
                const y = (i * 150 + Math.sin(time * 0.2 + i) * 100) % height;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(time + i);
                ctx.fillRect(-5, -2, 10, 4);
                ctx.restore();
            }
        }
        ctx.restore();
    }

    private drawGlowCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawBaseGradient(ctx: CanvasRenderingContext2D, width: number, height: number, theme: EnvironmentTheme) {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, theme.bgColor1);
        grad.addColorStop(1, theme.bgColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    private drawTiledImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvasWidth: number, canvasHeight: number, offset: { x: number, y: number }) {
        const iw = img.width;
        const ih = img.height;
        
        // Calculate how many tiles we need to cover the screen + 1 for scrolling
        const ox = offset.x % iw;
        const oy = offset.y % ih;
        
        const startX = -Math.ceil(canvasWidth / iw) - 1;
        const endX = Math.ceil(canvasWidth / iw) + 1;
        const startY = -Math.ceil(canvasHeight / ih) - 1;
        const endY = Math.ceil(canvasHeight / ih) + 1;

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                ctx.drawImage(img, (x * iw) - ox, (y * ih) - oy, iw, ih);
            }
        }
    }

    private drawProceduralStars(ctx: CanvasRenderingContext2D, width: number, height: number, offset: { x: number, y: number }, count: number, size: number, color: string) {
        ctx.fillStyle = color;
        // Seeded random based on count to keep stars consistent per layer
        for (let i = 0; i < count; i++) {
            const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * width;
            const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * height;
            
            // Apply offset with wrap-around
            const px = (x - offset.x + width) % width;
            const py = (y - offset.y + height) % height;

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawNebulaLayer(ctx: CanvasRenderingContext2D, width: number, height: number, offset: { x: number, y: number }, color1: string, color2: string) {
        // Draw 3 large glowing blobs as nebulas
        for (let i = 0; i < 3; i++) {
            const x = (Math.sin(i * 999) * 0.5 + 0.5) * width;
            const y = (Math.cos(i * 555) * 0.5 + 0.5) * height;
            
            const px = (x - offset.x + width) % width;
            const py = (y - offset.y + height) % height;
            
            const radius = 400 + i * 100;
            const color = i % 2 === 0 ? color1 : color2;
            
            const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad;
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(2, 1);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    private parseHex(hex: string) {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const bl = parseInt(h.substring(4, 6), 16);
        const al = h.length > 6 ? parseInt(h.substring(6, 8), 16) / 255 : 1;
        return { r, g, bl, al };
    }

    private lerpTo(current: {r:number, g:number, bl:number, al:number}, target: {r:number, g:number, bl:number, al:number}, amount: number) {
        current.r += (target.r - current.r) * amount;
        current.g += (target.g - current.g) * amount;
        current.bl += (target.bl - current.bl) * amount;
        current.al += (target.al - current.al) * amount;
    }

    private drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const vignette = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }
}

export const backgroundSystem = new BackgroundSystem();
