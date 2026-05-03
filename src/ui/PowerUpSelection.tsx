import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Snowflake, Zap, ArrowRight, Atom, Info } from 'lucide-react';
import { PowerUpClass } from '../core/Types';
import { setPowerUpClass } from '../core/Store';
import { SYNERGY_MAP } from '../systems/synergySystem';

interface PowerUpSelectionProps {
    onSelect: () => void;
}

export const PowerUpSelection: React.FC<PowerUpSelectionProps> = ({ onSelect }) => {
    const [selectedPath, setSelectedPath] = useState<PowerUpClass | null>(null);

    const options = [
        {
            id: PowerUpClass.FIRE,
            name: 'Caminho Ígneo',
            icon: <Flame size={32} />,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30',
            hover: 'hover:border-orange-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]',
            description: 'Ataques que incineram os inimigos com calor intenso.'
        },
        {
            id: PowerUpClass.ICE,
            name: 'Caminho Glacial',
            icon: <Snowflake size={32} />,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/30',
            hover: 'hover:border-blue-400 hover:shadow-[0_0_40px_rgba(96,165,250,0.2)]',
            description: 'Ataques criogênicos que cristalizam a matéria.'
        },
        {
            id: PowerUpClass.ELECTRIC,
            name: 'Caminho Tempestuoso',
            icon: <Zap size={32} />,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
            border: 'border-yellow-400/30',
            hover: 'hover:border-yellow-400 hover:shadow-[0_0_40px_rgba(250,204,21,0.2)]',
            description: 'Ataques energéticos de alta voltagem e velocidade.'
        },
        {
            id: PowerUpClass.PLASMA,
            name: 'Caminho Plasmático',
            icon: <Atom size={32} />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            hover: 'hover:border-blue-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]',
            description: 'Infunde seus tiros com plasma azul instável e descargas energéticas.'
        }
    ];

    const handleConfirm = () => {
        if (selectedPath) {
            setPowerUpClass(selectedPath);
            onSelect();
        }
    };

    const synergy = selectedPath ? SYNERGY_MAP[selectedPath] : null;
    const selectedOpt = options.find(o => o.id === selectedPath);

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-10 text-white font-sans overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(30,41,59,1)_0%,rgba(2,6,23,1)_100%)]">
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-16"
            >
                <h2 className="text-5xl font-black italic tracking-tighter mb-4 uppercase drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]">ESCOLHA SEU CAMINHO</h2>
                <div className="h-1 w-24 bg-blue-600 mx-auto rounded-full mb-6 relative overflow-hidden">
                    <motion.div 
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    />
                </div>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Selecione uma especialização elemental para esta run</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
                {options.map((opt, idx) => (
                    <motion.button
                        key={opt.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPath(opt.id)}
                        className={`flex flex-col items-center text-center p-10 rounded-3xl border ${opt.border} ${opt.bg} ${opt.hover} transition-all group`}
                    >
                        <div className={`p-6 rounded-2xl bg-black/40 mb-8 ${opt.color} group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
                            {opt.icon}
                            {/* Elemental Particles on hover */}
                            <motion.div 
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                            >
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`absolute w-1 h-1 rounded-full ${opt.color.replace('text', 'bg')}`}
                                        animate={{
                                            y: [-10, -40],
                                            x: [0, (i - 2.5) * 15],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 1 + Math.random(),
                                            repeat: Infinity,
                                            delay: i * 0.2
                                        }}
                                        style={{
                                            left: `${20 + Math.random() * 60}%`,
                                            top: '100%'
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </div>
                        <h3 className={`text-2xl font-black mb-4 ${opt.color}`}>{opt.name}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-8 flex-1">{opt.description}</p>
                        
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/50 group-hover:text-white transition-colors uppercase tracking-widest">
                            Selecionar <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {selectedPath && synergy && selectedOpt && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-900 border-2 border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${selectedOpt.bg.replace('/10', '')}`} />
                            
                            <h3 className={`text-3xl font-black italic mb-2 ${selectedOpt.color} uppercase`}>Sinergia Descoberta</h3>
                            <div className="h-1 w-12 bg-white/20 rounded-full mb-6" />
                            
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Ao escolher o <span className={`font-bold ${selectedOpt.color}`}>{selectedOpt.name}</span>, você desbloqueia uma sinergia única com a habilidade:
                            </p>
                            
                            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8 relative group">
                                <div className="absolute top-4 right-4 text-emerald-400 flex items-center gap-1">
                                    <Info size={14} />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">Sinergia Ativa</span>
                                </div>
                                
                                <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="p-2 bg-white/5 rounded-lg">{selectedOpt.icon}</span>
                                    {synergy.specialName}
                                </h4>
                                
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-slate-200 text-sm font-medium">+{synergy.durationBonus}s de Duração Adicional</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-slate-200 text-sm font-medium">+{(synergy.sizeMult * 100 - 100).toFixed(0)}% Tamanho do Raio/Raio Principal</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-slate-200 text-sm font-medium">+50% de Dano da Habilidade</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setSelectedPath(null)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    className={`flex-1 py-4 ${selectedOpt.bg.replace('/10', '')} text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:brightness-110 transition-all`}
                                >
                                    Confirmar Caminho
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-20 flex gap-12 text-slate-500 font-mono text-[10px] uppercase tracking-widest opacity-30">
                <span>// IDENTIDADE ELEMENTAL</span>
                <span>// PROTOCOLO DE RUN</span>
                <span>// VORATHON CORE</span>
            </div>
        </div>
    );
};

