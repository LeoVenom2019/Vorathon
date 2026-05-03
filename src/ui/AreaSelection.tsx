import React from 'react';
import { motion } from 'motion/react';
import { Lock, Map, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import { usePlayerState, setSelectedArea } from '../core/Store';
import areasData from '../data/areas.json';
import { Area } from '../core/Types';

interface AreaSelectionProps {
    onSelect: () => void;
    onBack: () => void;
}

export const AreaSelection: React.FC<AreaSelectionProps> = ({ onSelect, onBack }) => {
    const playerState = usePlayerState();
    const { unlockedAreas, areaStars } = playerState.progressionAreas;
    const areas = areasData.areas as Area[];

    const handleSelectArea = (area: Area, isLocked: boolean) => {
        if (isLocked) return;
        setSelectedArea(area.id);
        onSelect();
    };

    const getStarColor = (starCount: number) => {
        switch (starCount) {
            case 1: return 'text-yellow-400';
            case 2: return 'text-blue-400';
            case 3: return 'text-emerald-400';
            case 4: return 'text-orange-500';
            case 5: return 'text-red-500';
            case 6: return 'text-white shadow-[0_0_10px_white]';
            default: return 'text-slate-700';
        }
    };

    const getAreaTheme = (areaId: string) => {
        switch (areaId) {
            case 'area_1': return 'from-blue-500/20 to-indigo-600/5 border-blue-500/30';
            case 'area_2': return 'from-cyan-500/20 to-blue-600/5 border-cyan-500/30';
             case 'area_3': return 'from-yellow-500/20 to-orange-600/5 border-yellow-500/30';
            case 'area_4': return 'from-red-600/20 to-orange-600/5 border-red-600/30';
            case 'area_5': return 'from-purple-600/20 to-indigo-600/5 border-purple-600/30';
            default: return 'from-slate-500/20 to-slate-600/5 border-slate-500/30';
        }
    };

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-10 text-white font-sans overflow-hidden bg-[radial-gradient(circle_at_50%_100%,rgba(2,6,23,1)_0%,rgba(15,23,42,1)_100%)]">
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-16"
            >
                <h2 className="text-5xl font-black italic tracking-tighter mb-4 uppercase">MAPEAMENTO DE SETOR</h2>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Defina o destino da frota para esta operação</p>
            </motion.div>

            <div className="grid grid-cols-5 gap-6 w-full max-w-7xl">
                {areas.map((area, idx) => {
                    const isUnlocked = unlockedAreas.includes(area.id);
                    const stars = areaStars[area.id] || 0;
                    const themeClass = getAreaTheme(area.id);
                    const starColor = getStarColor(stars);

                    return (
                        <motion.button
                            key={area.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={isUnlocked ? { y: -10, scale: 1.05 } : {}}
                            whileTap={isUnlocked ? { scale: 0.98 } : {}}
                            onClick={() => handleSelectArea(area, !isUnlocked)}
                            className={`relative h-[420px] flex flex-col items-center justify-between p-8 rounded-[3rem] border-2 bg-gradient-to-b ${isUnlocked ? themeClass : 'from-slate-900/50 to-black/50 border-white/5 opacity-60 grayscale'} transition-all group overflow-hidden`}
                        >
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                            
                            {/* Star Display */}
                            <div className="flex flex-col items-center gap-1 relative z-10">
                                <div className="flex gap-0.5">
                                    {[...Array(6)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={12} 
                                            className={`${i < stars ? starColor : 'text-white/10'} ${stars === 6 && i < stars ? 'animate-pulse' : ''}`}
                                            fill={i < stars ? 'currentColor' : 'none'}
                                        />
                                    ))}
                                </div>
                                {stars > 0 && (
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${starColor} opacity-80`}>Concluído</span>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-4 relative z-10 text-center">
                                <div className={`p-5 rounded-full bg-black/40 border border-white/10 ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                                    {isUnlocked ? <Map size={32} /> : <Lock size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase leading-none mb-1 group-hover:text-white transition-colors">{area.name}</h3>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{area.subtitle}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed px-2">
                                    {isUnlocked ? area.description : 'Sinal codificado. Setor anterior viavel.'}
                                </p>
                            </div>

                            <div className="w-full relative z-10 flex flex-col items-center gap-4">
                                <div className="w-full h-px bg-white/5" />
                                {isUnlocked ? (
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-400 group-hover:text-white transition-colors tracking-widest">
                                        Explorar <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[8px] font-mono text-red-500/60 uppercase">Bloqueado</span>
                                        <span className="text-[7px] font-mono text-slate-600 uppercase text-center leading-tight">Complete a área anterior</span>
                                    </div>
                                )}
                            </div>

                            {/* Background Decorations */}
                            {isUnlocked && (
                                <>
                                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all" />
                                </>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <motion.button 
                whileHover={{ x: -10 }}
                onClick={onBack}
                className="mt-16 text-slate-600 hover:text-white font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center gap-4 group"
            >
                <div className="w-8 h-[1px] bg-slate-800 group-hover:w-12 transition-all" />
                VOLTAR PARA DIFICULDADE
            </motion.button>
        </div>
    );
};
