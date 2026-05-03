import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronLeft, Star, Globe, Zap, Flame, Snowflake, Waves, Box } from 'lucide-react';
import { usePlayerState } from '../core/Store';
import { Difficulty, RankingEntry } from '../core/Types';
import areasData from '../data/areas.json';

interface RankingsViewProps {
    onClose: () => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({ onClose }) => {
    const { rankings, session } = usePlayerState();
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [podiumData, setPodiumData] = useState<RankingEntry[]>([]);

    useEffect(() => {
        if (selectedArea) {
            const filtered = (rankings as RankingEntry[] || [])
                .filter(r => r.areaId === selectedArea)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
            setPodiumData(filtered);
        }
    }, [selectedArea, rankings]);

    const getDifficultyColor = (diff: Difficulty) => {
        switch (diff) {
            case Difficulty.HARD: return 'text-orange-400';
            case Difficulty.NIGHTMARE: return 'text-red-500';
            case Difficulty.APOCALYPSE: return 'text-purple-500';
            case Difficulty.INFERNO: return 'text-amber-500';
            case Difficulty.CHAOS: return 'text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]';
            default: return 'text-blue-400';
        }
    };

    const getAreaIcon = (areaId: string) => {
        switch (areaId) {
            case 'area_1': return <Globe className="text-blue-400" size={48} />;
            case 'area_2': return <Waves className="text-cyan-400" size={48} />;
            case 'area_3': return <Zap className="text-yellow-400" size={48} />;
            case 'area_4': return <Flame className="text-red-500" size={48} />;
            case 'area_5': return <Box className="text-purple-500" size={48} />;
            default: return <Globe className="text-blue-400" size={48} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />

            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative bg-slate-950/80 border border-white/10 rounded-[40px] w-full max-w-5xl h-[80vh] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-10 flex justify-between items-center border-b border-white/5 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        {selectedArea ? (
                            <button 
                                onClick={() => setSelectedArea(null)}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        ) : (
                            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                <Trophy size={32} className="text-indigo-400" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <h3 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                                {selectedArea ? areasData.areas.find(a => a.id === selectedArea)?.name : 'RANKINGS DE SETOR'}
                            </h3>
                            <span className="text-[10px] text-indigo-400 font-mono tracking-[0.4em] uppercase">
                                {selectedArea ? 'Elite de Combate' : 'Selecione uma Área para Visualizar o Top 3'}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all text-slate-400 font-black text-xs tracking-widest uppercase border border-white/10"
                    >
                        FECHAR
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-12 relative custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {!selectedArea ? (
                            <motion.div 
                                key="area-selection"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="grid grid-cols-5 gap-8 h-full items-center"
                            >
                                {areasData.areas.map((area, idx) => (
                                    <motion.button
                                        key={area.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ scale: 1.05, y: -10 }}
                                        onClick={() => setSelectedArea(area.id)}
                                        className="group relative h-80 bg-slate-900 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 gap-6 overflow-hidden transition-all hover:border-indigo-500/50 hover:bg-indigo-950/20"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-500/5" />
                                        
                                        {/* Background Glow */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-700" />
                                        
                                        <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                                            {getAreaIcon(area.id)}
                                        </div>

                                        <div className="relative z-10 text-center">
                                            <h4 className="text-xl font-black italic text-white uppercase tracking-tight mb-2">{area.name}</h4>
                                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                                                {area.subtitle}
                                            </p>
                                        </div>

                                        <div className="relative z-10 mt-auto px-4 py-2 bg-white/5 rounded-full text-[9px] font-black text-indigo-400 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver Ranking
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="podium"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="h-full flex flex-col items-center justify-center"
                            >
                                {/* Podium Layout */}
                                <div className="flex items-end gap-8 pb-12">
                                    {/* 2nd Place */}
                                    <PodiumSlot 
                                        entry={podiumData[1]} 
                                        position={2} 
                                        delay={0.2} 
                                        isMe={podiumData[1]?.name === session.playerName}
                                        getDifficultyColor={getDifficultyColor}
                                    />

                                    {/* 1st Place */}
                                    <PodiumSlot 
                                        entry={podiumData[0]} 
                                        position={1} 
                                        delay={0.4}
                                        isMe={podiumData[0]?.name === session.playerName}
                                        getDifficultyColor={getDifficultyColor}
                                    />

                                    {/* 3rd Place */}
                                    <PodiumSlot 
                                        entry={podiumData[2]} 
                                        position={3} 
                                        delay={0}
                                        isMe={podiumData[2]?.name === session.playerName}
                                        getDifficultyColor={getDifficultyColor}
                                    />
                                </div>

                                {podiumData.length === 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20"
                                    >
                                        <div className="w-20 h-20 bg-white/5 rounded-full border border-dashed border-white/20 flex items-center justify-center mx-auto mb-6">
                                            <Trophy size={32} className="text-slate-700" />
                                        </div>
                                        <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Nenhum registro de expedição detectado nesta área</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

const PodiumSlot: React.FC<{ entry: RankingEntry | undefined, position: number, delay: number, isMe: boolean, getDifficultyColor: (d: Difficulty) => string }> = ({ entry, position, delay, isMe, getDifficultyColor }) => {
    const isFirst = position === 1;
    const isSecond = position === 2;
    
    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, duration: 0.8, ease: "easeOut" }}
            className={`flex flex-col items-center gap-6 ${isFirst ? 'w-80' : 'w-64'}`}
        >
            <div className={`relative ${isFirst ? 'h-56' : isSecond ? 'h-40' : 'h-32'} w-full`}>
                <AnimatePresence>
                    {entry && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: delay + 0.3, type: "spring" }}
                            className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full"
                        >
                            {isMe && (
                                <span className="px-3 py-1 bg-indigo-500 text-[9px] font-black italic rounded-full text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-pulse">VOCÊ</span>
                            )}
                            <div className="text-center">
                                <h4 className="text-2xl font-black italic text-white uppercase tracking-tight truncate w-full">{entry.name}</h4>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${getDifficultyColor(entry.difficulty)}`}>
                                        {entry.difficulty}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="text-[10px] font-mono text-slate-500">{entry.mode.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                            <div className={`text-4xl font-black italic italic ${isFirst ? 'text-yellow-400' : 'text-white'} tracking-tighter`}>
                                <AnimatedScore score={entry.score} delay={delay + 0.5} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Base Column */}
                <div 
                    className={`w-full h-full rounded-2xl relative overflow-hidden flex items-start justify-center pt-8 border-t-2 ${
                        isFirst ? 'bg-gradient-to-b from-yellow-500/20 to-slate-900 border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.1)]' :
                        isSecond ? 'bg-gradient-to-b from-slate-400/20 to-slate-900 border-slate-400/50' :
                        'bg-gradient-to-b from-orange-800/20 to-slate-900 border-orange-800/50'
                    }`}
                >
                    {/* Position Glass Blur Effect */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
                    
                    {/* Rank Number */}
                    <div className={`relative z-10 text-6xl font-black italic italic leading-none ${
                        isFirst ? 'text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]' :
                        isSecond ? 'text-slate-400' :
                        'text-orange-800'
                    }`}>
                        {position}º
                    </div>

                    {isFirst && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(10)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                                    initial={{ y: 200, opacity: 0 }}
                                    animate={{ y: -50, opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 2 }}
                                    style={{ left: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const AnimatedScore: React.FC<{ score: number, delay: number }> = ({ score, delay }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let timeout = setTimeout(() => {
            let start = 0;
            const end = score;
            const duration = 2000;
            const startTime = performance.now();

            const update = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 4); // Quart ease out
                
                setCount(Math.floor(eased * end));

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };

            requestAnimationFrame(update);
        }, delay * 1000);

        return () => clearTimeout(timeout);
    }, [score, delay]);

    return <span>{count.toLocaleString()}</span>;
};
