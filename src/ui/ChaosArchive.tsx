import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Lock, Music } from 'lucide-react';
import { usePlayerState } from '../core/Store';
import { jukeboxSystem } from '../systems/jukeboxSystem';
import musicData from '../data/music.json';

export const ChaosArchive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const state = usePlayerState();
    const { jukebox } = state;
    const [selectedCategory, setSelectedCategory] = useState(musicData.categories[0].id);
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Visualizer effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;
        const render = () => {
            const data = jukeboxSystem.getFrequencyData();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const activeTrack = musicData.tracks.find(t => t.id === jukebox.activeMusicId);
            const color = activeTrack?.color || '#3b82f6';

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            const sliceWidth = canvas.width / data.length;
            let x = 0;

            for (let i = 0; i < data.length; i++) {
                const v = data[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            animationFrame = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrame);
    }, [jukebox.activeMusicId]);

    const activeTrack = musicData.tracks.find(t => t.id === jukebox.activeMusicId);
    const filteredTracks = musicData.tracks.filter(t => t.categoryId === selectedCategory);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-5xl h-[80vh] bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
                </div>

                {/* Header */}
                <div className="relative z-10 p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Music className="text-indigo-400" size={24} />
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-white">ARQUIVO DO CAOS</h2>
                        </div>
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">Sintonizador de Frequências Cósmicas</p>
                    </div>

                    <div className="flex gap-2">
                        {musicData.categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                    selectedCategory === cat.id 
                                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                                    : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden relative z-10">
                    {/* Left: Orb Grid */}
                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-12">
                            {filteredTracks.map(track => {
                                const isUnlocked = jukebox.unlockedMusic.includes(track.id);
                                const isActive = jukebox.activeMusicId === track.id;
                                const isHovered = hoveredTrack === track.id;

                                return (
                                    <div 
                                        key={track.id}
                                        className="flex flex-col items-center gap-4 group cursor-pointer"
                                        onMouseEnter={() => setHoveredTrack(track.id)}
                                        onMouseLeave={() => setHoveredTrack(null)}
                                        onClick={() => isUnlocked && jukeboxSystem.playTrack(track.id)}
                                    >
                                        <div className="relative">
                                            {/* Glow Effect */}
                                            <AnimatePresence>
                                                {(isActive || isHovered) && isUnlocked && (
                                                    <motion.div 
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1.2, opacity: 1 }}
                                                        exit={{ scale: 0.5, opacity: 0 }}
                                                        className="absolute inset-0 rounded-full blur-2xl"
                                                        style={{ backgroundColor: track.color + '40' }}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Orb Core */}
                                            <div 
                                                className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${
                                                    isUnlocked 
                                                    ? 'border-2 border-white/20' 
                                                    : 'bg-black/60 border-2 border-dashed border-white/10 grayscale'
                                                }`}
                                                style={isUnlocked ? { 
                                                    boxShadow: isActive ? `0 0 30px ${track.color}40, inset 0 0 20px ${track.color}60` : 'none',
                                                    backgroundColor: isActive ? track.color + '20' : 'rgba(255,255,255,0.05)'
                                                } : {}}
                                            >
                                                {isUnlocked ? (
                                                    <motion.div
                                                        animate={isActive ? {
                                                            scale: [1, 1.1, 1],
                                                            rotate: [0, 180, 360],
                                                        } : { scale: 1 }}
                                                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                    >
                                                        {isActive && jukebox.isPlaying ? (
                                                            <Pause className="text-white" size={32} />
                                                        ) : (
                                                            <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                                                        )}
                                                    </motion.div>
                                                ) : (
                                                    <Lock className="text-slate-700" size={32} />
                                                )}

                                                {/* Energy Pulses */}
                                                {isActive && jukebox.isPlaying && (
                                                    <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center pointer-events-none">
                                                        {[1, 2, 3].map(i => (
                                                            <motion.div 
                                                                key={i}
                                                                className="absolute rounded-full border border-white/10"
                                                                initial={{ width: 40, height: 40, opacity: 0.5 }}
                                                                animate={{ width: 140, height: 140, opacity: 0 }}
                                                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <h4 className={`text-sm font-black italic tracking-wide transition-colors ${
                                                isUnlocked ? (isActive ? 'text-white' : 'text-slate-400 group-hover:text-white') : 'text-slate-700'
                                            }`}>
                                                {isUnlocked ? track.name : 'NÚCLEO INSTÁVEL'}
                                            </h4>
                                            {isUnlocked && (
                                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                                                    {track.categoryId}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Info Panels */}
                    <div className="w-80 border-l border-white/5 p-8 flex flex-col gap-6 bg-slate-900/40">
                        <div className="flex-1 flex flex-col gap-8">
                            <section>
                                <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4">Sobre a Categoria</h5>
                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                    {musicData.categories.find(c => c.id === selectedCategory)?.description}
                                </p>
                            </section>

                            {activeTrack && (
                                <section className="mt-auto">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-3">Em Áudio Agora</h5>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeTrack.color }} />
                                            <span className="text-sm font-black italic text-white uppercase">{activeTrack.name}</span>
                                        </div>
                                        <canvas ref={canvasRef} width={200} height={40} className="w-full mt-4 h-10 opacity-50" />
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>

                {/* Player Bar */}
                <div className="relative z-10 h-24 bg-indigo-950/20 border-t border-white/10 backdrop-blur-2xl flex items-center px-12 gap-12">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => jukeboxSystem.prev()}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <SkipBack size={24} />
                        </button>
                        
                        <button 
                            onClick={() => jukebox.isPlaying ? jukeboxSystem.pause() : jukeboxSystem.resume()}
                            className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                        >
                            {jukebox.isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                        </button>

                        <button 
                            onClick={() => jukeboxSystem.next()}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <SkipForward size={24} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <p className="text-xs font-black italic text-indigo-400 uppercase tracking-widest">
                                {activeTrack?.name || "Nenhuma faixa selecionada"}
                            </p>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => jukeboxSystem.toggleShuffle()}
                                    className={`p-1.5 transition-colors ${jukebox.shuffle ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                    <Shuffle size={16} />
                                </button>
                                <button 
                                    onClick={() => jukeboxSystem.toggleLoop()}
                                    className={`p-1.5 transition-colors ${jukebox.loop ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                    <Repeat size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-indigo-500"
                                initial={{ width: "0%" }}
                                animate={{ width: jukebox.isPlaying ? "100%" : "30%" }}
                                transition={{ duration: 120, ease: "linear" }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-48">
                        <Volume2 size={20} className="text-slate-500" />
                        <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={jukebox.volume}
                            onChange={(e) => jukeboxSystem.setVolume(parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-500 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 z-20 text-slate-500 hover:text-white flex items-center gap-2 group transition-colors"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Fechar Arquivo</span>
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-colors">
                        X
                    </div>
                </button>
            </motion.div>
        </div>
    );
};
