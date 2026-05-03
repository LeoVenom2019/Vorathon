import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerState, updatePlayerState } from '../core/Store';
import { skillTreeSystem, SkillCategory, INITIAL_SKILL_TREE } from '../systems/skillTreeSystem';
import { X, Bot, Rocket, Zap, Shield, ZapOff, Crosshair, Heart, Battery, Snowflake } from 'lucide-react';

export const SkillTree: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const playerState = usePlayerState();
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const tree = playerState.skillTree || INITIAL_SKILL_TREE;
    const { skillPoints } = playerState.progression;

    const renderNode = (
        category: SkillCategory, 
        id: string, 
        name: string, 
        description: string, 
        icon: React.ReactNode, 
        currentLevel: number = 0, 
        maxLevel: number | 'unlimited',
        cost: number = 1
    ) => {
        const isUnlocked = currentLevel > 0;
        const canUpgrade = skillPoints >= cost && (maxLevel === 'unlimited' || currentLevel < maxLevel);

        const handleUpgrade = () => {
            skillTreeSystem.spendPoint(category, id);
            triggerFeedback('flash', 0.2); // Visual feedback
        };

        return (
            <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                    isUnlocked ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800/40 border-white/10'
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${isUnlocked ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        {icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-white text-lg">{name}</h4>
                            <span className="text-xs font-mono text-indigo-400">LVL {currentLevel}{maxLevel !== 'unlimited' && `/${maxLevel}`}</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{description}</p>
                        <button
                            disabled={!canUpgrade}
                            onClick={handleUpgrade}
                            className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                                canUpgrade 
                                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {currentLevel === 0 ? 'DESBLOQUEAR' : 'EVOLUIR'} (1 PH)
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderSpecialNode = (id: string, name: string, description: string, icon: React.ReactNode, currentLevel: number = 0) => {
        const isUnlocked = currentLevel > 0;
        const isEquipped = tree.equippedSpecials?.includes(id);

        return (
            <div className="flex flex-col gap-2">
                {renderNode(SkillCategory.SPECIALS, id, name, description, icon, currentLevel, 3)}
                <div className="flex gap-2">
                    {[0, 1, 2, 3].map(slot => (
                        <button
                            key={slot}
                            onClick={() => skillTreeSystem.equipSpecial(id, slot)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                                tree.equippedSpecials?.[slot] === id 
                                ? 'bg-amber-500 border-amber-400 text-white' 
                                : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            SLOT {slot + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-xl"
        >
            <div className="w-full max-w-6xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter italic">AURORA SKILL TREE</h2>
                        <p className="text-slate-400">Personalize sua nave Aurora para o combate cósmico.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="bg-indigo-500/20 border border-indigo-500/30 px-6 py-3 rounded-2xl flex items-center gap-4">
                            <span className="text-indigo-400 font-bold tracking-widest text-sm">PONTOS DISPONÍVEIS</span>
                            <span className="text-3xl font-black text-white">{skillPoints} PH</span>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-12 custom-scrollbar">
                    {/* Companions */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Bot className="text-indigo-500" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Companions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderNode(SkillCategory.COMPANIONS, 'summoner', 'Summoner Bot', 'Invoca buracos negros que sugam e danificam inimigos.', <Bot />, tree.companions?.summoner, 3)}
                            {renderNode(SkillCategory.COMPANIONS, 'shooter', 'Shooter Bot', 'Dispara bolas de fogo frontais e diagonais.', <Rocket />, tree.companions?.shooter, 3)}
                            {renderNode(SkillCategory.COMPANIONS, 'supporter', 'Supporter Bot', 'Gera um escudo de energia protetor.', <Shield />, tree.companions?.supporter, 3)}
                        </div>
                    </section>

                    {/* Weapon */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Crosshair className="text-rose-500" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Melhoria de Tiro</h3>
                        </div>
                        <div className="max-w-md">
                            {renderNode(SkillCategory.WEAPON, 'weapon', 'Amplificador Plasmático', 'Aumenta permanentemente o dano e tamanho do projétil.', <Zap />, tree.weapon || 0, 4)}
                        </div>
                    </section>

                    {/* Specials */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="text-amber-500" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Habilidades Especiais</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderSpecialNode('shockwave', '⚡ Ruptura Astral', 'Cospe uma explosão de energia ao redor da nave.', <ZapOff />, tree.specials?.shockwave)}
                            {renderSpecialNode('explosion', '💥 Supernova Primordial', 'Cria uma supernova massiva na posição atual.', <Rocket />, tree.specials?.explosion)}
                            {renderSpecialNode('thunder', '⚡ Tempestade Celestial', 'Raios cósmicos caem aleatoriamente sobre os inimigos.', <Zap />, tree.specials?.thunder)}
                            {renderSpecialNode('blizzard', '❄️ Era Glacial', 'Uma nevasca congela e explode inimigos em gelo.', <Snowflake />, tree.specials?.blizzard)}
                        </div>
                    </section>

                    {/* Attributes */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Heart className="text-emerald-500" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Atributos Livres</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {renderNode(SkillCategory.ATTRIBUTES, 'damage', 'Força Bruta', '+10 Dano base por ponto investido.', <Crosshair />, tree.attributes?.damage, 'unlimited')}
                            {renderNode(SkillCategory.ATTRIBUTES, 'hp', 'Blindagem Reforçada', '+20 Vida máxima por ponto investido.', <Heart />, tree.attributes?.hp, 'unlimited')}
                            {renderNode(SkillCategory.ATTRIBUTES, 'energy', 'Núcleo de Energia', '+20 Energia máxima por ponto investido.', <Battery />, tree.attributes?.energy, 10)}
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>
    );
};
