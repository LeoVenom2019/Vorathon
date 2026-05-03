import React from 'react';
import { motion } from 'motion/react';
import { Shield, Skull, Zap, Flame, Radiation, Star, ArrowRight, Lock } from 'lucide-react';
import { Difficulty } from '../core/Types';
import { setSelectedDifficulty, usePlayerState } from '../core/Store';

interface DifficultySelectionProps {
    onSelect: () => void;
    onBack: () => void;
}

export const DifficultySelection: React.FC<DifficultySelectionProps> = ({ onSelect, onBack }) => {
    const playerState = usePlayerState();
    const { maxDifficultyUnlocked } = playerState.progressionAreas;

    const difficultiesList: Difficulty[] = [
        Difficulty.NORMAL, Difficulty.HARD, Difficulty.NIGHTMARE, 
        Difficulty.APOCALYPSE, Difficulty.INFERNO, Difficulty.CHAOS
    ];

    const currentMaxIdx = difficultiesList.indexOf(maxDifficultyUnlocked as Difficulty);

    const difficulties = [
        {
            id: Difficulty.NORMAL,
            name: 'Normal',
            icon: <Shield size={24} />,
            color: 'text-yellow-400',
            borderColor: 'border-yellow-500/30',
            bgColor: 'bg-yellow-500/10',
            stars: 1,
            starColor: 'text-yellow-400',
            description: 'Experiência padrão. Inimigos balanceados.',
            multiplier: '1.0x XP/Ouro'
        },
        {
            id: Difficulty.HARD,
            name: 'Difícil',
            icon: <Zap size={24} />,
            color: 'text-blue-400',
            borderColor: 'border-blue-500/30',
            bgColor: 'bg-blue-500/10',
            stars: 2,
            starColor: 'text-blue-400',
            description: 'Vida e dano aumentados em ~60%. Mais inimigos.',
            multiplier: '1.5x Recompensas'
        },
        {
            id: Difficulty.NIGHTMARE,
            name: 'Pesadelo',
            icon: <Skull size={24} />,
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500/30',
            bgColor: 'bg-emerald-500/10',
            stars: 3,
            starColor: 'text-emerald-400',
            description: 'Inimigos reagem mais rápido. Bosses ganham +150% HP.',
            multiplier: '2.5x Recompensas'
        },
        {
            id: Difficulty.APOCALYPSE,
            name: 'Apocalipse',
            icon: <Radiation size={24} />,
            color: 'text-orange-500',
            borderColor: 'border-orange-500/30',
            bgColor: 'bg-orange-500/10',
            stars: 4,
            starColor: 'text-orange-500',
            description: 'Dano massivo (+120%). Spawn de inimigos +80%.',
            multiplier: '4.0x Recompensas'
        },
        {
            id: Difficulty.INFERNO,
            name: 'Inferno',
            icon: <Flame size={24} />,
            color: 'text-red-500',
            borderColor: 'border-red-500/30',
            bgColor: 'bg-red-500/10',
            stars: 5,
            starColor: 'text-red-500',
            description: 'Vida inimiga +300%. O inferno se manifesta.',
            multiplier: '7.0x Recompensas'
        },
        {
            id: Difficulty.CHAOS,
            name: 'Caos',
            icon: <Star size={24} className="animate-pulse" />,
            color: 'text-white',
            borderColor: 'border-white/30',
            bgColor: 'bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-red-500/20',
            stars: 6,
            starColor: 'text-white shadow-[0_0_10px_white]',
            description: 'Insanidade total. Vida e Dano +800%.',
            multiplier: '15.0x Recompensas',
            isSpecial: true
        }
    ];

    const handleSelect = (diff: Difficulty, isLocked: boolean) => {
        if (isLocked) return;
        setSelectedDifficulty(diff);
        onSelect();
    };

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-10 text-white font-sans overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]">
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12"
            >
                <h2 className="text-5xl font-black italic tracking-tighter mb-4 uppercase">INTENSIDADE DA OPERAÇÃO</h2>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Defina o nível de desafio e recompensas</p>
            </motion.div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-6xl">
                {difficulties.map((diff, idx) => {
                    const diffIdx = difficultiesList.indexOf(diff.id as Difficulty);
                    const isLocked = diff.id !== Difficulty.NORMAL && diffIdx > currentMaxIdx;

                    return (
                        <motion.button
                            key={diff.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={!isLocked ? { y: -10, scale: 1.02 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}
                            onClick={() => handleSelect(diff.id as Difficulty, isLocked)}
                            className={`relative flex flex-col items-center p-8 rounded-[2rem] border-2 transition-all group overflow-hidden ${isLocked ? 'border-white/5 bg-white/5 opacity-40 grayscale pointer-events-none' : `${diff.borderColor} ${diff.bgColor}`}`}
                        >
                            {isLocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-sm">
                                    <Lock className="text-slate-500 mb-2" size={48} />
                                    <span className="absolute bottom-4 text-[8px] font-mono text-slate-400 uppercase tracking-widest px-4 text-center leading-tight">Complete a dificuldade anterior para desbloquear</span>
                                </div>
                            )}

                            {diff.isSpecial && !isLocked && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-blue-500/10 to-red-500/10 animate-[energy-flow_3s_linear_infinite] opacity-50" />
                            )}
                            
                            <div className={`p-4 rounded-2xl bg-black/40 mb-6 ${diff.color} shadow-lg relative z-10`}>
                                {diff.icon}
                            </div>

                            <div className="flex gap-1 mb-2 relative z-10">
                                {[...Array(6)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={10} 
                                        className={`${i < diff.stars ? diff.starColor : 'text-white/5'} ${diff.isSpecial && i < diff.stars ? 'animate-pulse' : ''}`}
                                        fill={i < diff.stars ? 'currentColor' : 'none'}
                                    />
                                ))}
                            </div>

                            <h3 className={`text-2xl font-black italic mb-3 uppercase ${diff.color} relative z-10`}>{diff.name}</h3>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-6 h-8 relative z-10">{diff.description}</p>
                            
                            <div className="w-full h-px bg-white/10 mb-6 relative z-10" />

                            <div className="flex justify-between items-center w-full relative z-10">
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">{diff.multiplier}</span>
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <motion.button 
                whileHover={{ x: -5 }}
                onClick={onBack}
                className="mt-12 text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center gap-3"
            >
                <div className="w-6 h-px bg-slate-800" />
                VOLTAR AO CAMINHO
            </motion.button>
        </div>
    );
};
