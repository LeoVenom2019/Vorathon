import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, ShieldAlert, Timer, ArrowRight, Zap, Box, Sparkles } from 'lucide-react';
import { usePlayerState, updatePlayerState } from '../core/Store';
import { difficultySystem } from '../systems/difficultySystem';
import { stageSystem } from '../systems/stageSystem';
import { bossSystem } from '../systems/bossSystem';
import { enemySystem } from '../systems/enemySystem';
import { Difficulty } from '../core/Types';

interface StageResultsProps {
    onContinue: () => void;
}

const difficultyBonuses: Record<string, number> = {
    'NORMAL': 0,
    'HARD': 0.25,
    'NIGHTMARE': 0.40,
    'APOCALYPSE': 0.75,
    'INFERNO': 1.0,
    'CHAOS': 1.50
};

const areaBonuses: Record<string, number> = {
    'area_1': 0,
    'area_2': 0.25,
    'area_3': 0.40,
    'area_4': 0.75,
    'area_5': 1.0
};

export const StageResults: React.FC<StageResultsProps> = ({ onContinue }) => {
    const playerState = usePlayerState();
    const { session } = playerState;
    const { phaseStats, selectedArea, selectedDifficulty, phase } = session;

    const [step, setStep] = useState(0);
    const [displayScore, setDisplayScore] = useState(0);
    const [currentBonus, setCurrentBonus] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Calculate Bonuses
    const diffBonus = difficultyBonuses[selectedDifficulty] || 0;
    const areaBonusValue = areaBonuses[selectedArea] || 0;
    const combatBonus = (phaseStats.kills * 0.01) + (phaseStats.elitesKilled * 0.02);
    const timeBonus = phaseStats.timeRemaining * 0.01;

    const baseScore = phaseStats.score;
    const totalBonus = diffBonus + areaBonusValue + combatBonus + timeBonus;
    const finalPhaseScore = Math.floor(baseScore * (1 + totalBonus));

    useEffect(() => {
        const timer = setTimeout(() => {
            if (step === 0) {
                // Initial base score show
                const duration = 1200;
                const start = 0;
                const end = baseScore;
                let startTime: number | null = null;

                const animate = (time: number) => {
                    if (!startTime) startTime = time;
                    const progress = Math.min((time - startTime) / duration, 1);
                    setDisplayScore(Math.floor(start + (end - start) * progress));
                    if (progress < 1) requestAnimationFrame(animate);
                    else setStep(1);
                };
                requestAnimationFrame(animate);
            } else if (step === 1) {
                // Difficulty Bonus
                setTimeout(() => {
                    setStep(2);
                }, 800);
            } else if (step === 2) {
                // Area Bonus
                setTimeout(() => {
                    setStep(3);
                }, 800);
            } else if (step === 3) {
                // Combat Bonus
                setTimeout(() => {
                    setStep(4);
                }, 800);
            } else if (step === 4) {
                // Time Bonus
                setTimeout(() => {
                    setStep(5);
                }, 800);
            } else if (step === 5) {
                // Final Calculation Blowout
                const duration = 2000;
                const start = baseScore;
                const end = finalPhaseScore;
                let startTime: number | null = null;

                const animate = (time: number) => {
                    if (!startTime) startTime = time;
                    const progress = Math.min((time - startTime) / duration, 1);
                    
                    // Explosive ease
                    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    
                    setDisplayScore(Math.floor(start + (end - start) * easeProgress));
                    
                    if (progress < 1) requestAnimationFrame(animate);
                    else {
                        setIsComplete(true);
                        // Update global score
                        updatePlayerState(prev => ({
                            ...prev,
                            session: {
                                ...prev.session,
                                score: prev.session.score + (finalPhaseScore - baseScore)
                            }
                        }));
                        
                        // Auto continue
                        setTimeout(() => {
                            onContinue();
                        }, 5000);
                    }
                };
                requestAnimationFrame(animate);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [step]);

    return (
        <div className="w-full h-full bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-10 text-white font-sans overflow-hidden">
            {/* Background Visual Effects */}
            <div className={`absolute inset-0 transition-all duration-1000 opacity-20 pointer-events-none ${
                step === 1 ? 'bg-red-500/20' : 
                step === 2 ? 'bg-blue-500/20' : 
                step === 3 ? 'bg-orange-500/20' : 
                step === 4 ? 'bg-cyan-500/20' : 
                step === 5 ? 'bg-white/10' : ''
            }`} />
            
            <AnimatePresence>
                {step === 5 && isComplete && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.4, scale: 2 }}
                        className="absolute w-[800px] h-[800px] bg-white rounded-full blur-[150px] pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-4xl w-full bg-slate-900/60 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative z-10 overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

                <div className="text-center mb-16">
                    <motion.div
                        animate={{ rotate: isComplete ? [0, 10, -10, 0] : 0 }}
                        className="inline-block p-6 bg-blue-600/10 border border-blue-500/30 rounded-3xl mb-6 shadow-2xl"
                    >
                        <Trophy size={64} className={isComplete ? "text-yellow-400 animate-pulse" : "text-blue-500"} />
                    </motion.div>
                    <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">FASE {phase} CONCLUÍDA</h2>
                    <div className="h-1 w-32 bg-blue-600 mx-auto rounded-full mb-4" />
                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Sincronização de Dados de Combate</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-center">
                    <div className="space-y-6">
                        <BonusRow 
                            visible={step >= 1} 
                            label="Dificuldade" 
                            value={`${(diffBonus * 100).toFixed(0)}%`} 
                            active={step === 1}
                            color="text-red-500"
                            icon={<Zap size={18} />}
                        />
                        <BonusRow 
                            visible={step >= 2} 
                            label="Setor" 
                            value={`${(areaBonusValue * 100).toFixed(0)}%`} 
                            active={step === 2}
                            color="text-blue-400"
                            icon={<Box size={18} />}
                        />
                        <BonusRow 
                            visible={step >= 3} 
                            label="Combate" 
                            value={`${(combatBonus * 100).toFixed(0)}%`} 
                            active={step === 3}
                            color="text-orange-500"
                            icon={<Target size={18} />}
                        />
                        <BonusRow 
                            visible={step >= 4} 
                            label="Tempo" 
                            value={`${(timeBonus * 100).toFixed(0)}%`} 
                            active={step === 4}
                            color="text-cyan-400"
                            icon={<Timer size={18} />}
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: step >= 5 ? 1 : 0 }}
                            className="pt-6 border-t border-white/5"
                        >
                            <div className="flex justify-between items-center px-4">
                                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Multiplicador Final</span>
                                <span className="text-2xl font-black italic text-white">x{(1 + totalBonus).toFixed(2)}</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-[2.5rem] border border-white/5 p-12 h-64 relative group">
                        <span className="absolute top-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Pontuação Final</span>
                        
                        <motion.div 
                            key={displayScore}
                            animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                            className={`text-7xl font-black italic tracking-tighter tabular-nums ${isComplete ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]' : 'text-white'}`}
                        >
                            {displayScore.toLocaleString()}
                        </motion.div>

                        <div className="absolute bottom-6 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">Sincronizado com o Core</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 relative">
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: isComplete ? 1 : 0.5 }}
                        disabled={!isComplete}
                        onClick={onContinue}
                        className={`w-full py-6 transition-all rounded-2xl font-black text-2xl flex items-center justify-center gap-4 relative overflow-hidden group ${
                            isComplete 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_20px_40px_rgba(37,99,235,0.3)]' 
                            : 'bg-slate-800 text-slate-500 pointer-events-none'
                        }`}
                    >
                        {isComplete && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[energy-flow_2s_linear_infinite]" />}
                        PRÓXIMA OPERAÇÃO <ArrowRight className={isComplete ? "group-hover:translate-x-2 transition-transform" : ""} size={28} />
                    </motion.button>
                    
                    <p className="text-center text-[9px] text-slate-600 font-mono uppercase tracking-[0.4em]">
                        Auto-prosseguimento em 4.0s
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

const BonusRow: React.FC<{ visible: boolean; label: string; value: string; active: boolean; color: string; icon: React.ReactNode }> = ({ visible, label, value, active, color, icon }) => (
    <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: visible ? 0 : -20, opacity: visible ? 1 : 0 }}
        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${active ? 'bg-white/5 border border-white/10 scale-105 shadow-xl' : 'bg-transparent border border-transparent opacity-60'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-black/40 ${active ? color : 'text-slate-500'}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-4">
            {active && (
                <motion.div 
                    animate={{ width: [0, 40, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`h-[1px] ${color.replace('text', 'bg')}`}
                />
            )}
            <span className={`text-xl font-mono font-black italic ${visible ? color : 'text-white/10'}`}>+{value}</span>
        </div>
    </motion.div>
);
