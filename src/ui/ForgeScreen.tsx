import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hammer, Zap, Shield, ArrowLeft, Diamond, Info, Sparkles, AlertTriangle, Trash2, X, Coins } from 'lucide-react';
import { usePlayerState, equipRune, unequipRune, equipRelic, unequipRelic, equipChaosOrb, unequipChaosOrb, deductShards, destroyChaosOrb, updatePlayerState, deductGold, updateChaosOrb } from '../core/Store';
import { forgeChaosOrb, evolveOrb, rerollOrb, BONUS_LIST } from '../systems/forgeSystem';
import { Rarity } from '../core/Types';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';

interface ForgeScreenProps {
  onBack: () => void;
}

export const ForgeScreen: React.FC<ForgeScreenProps> = ({ onBack }) => {
  const playerState = usePlayerState();
  const { equippedRunes, equippedRelics, equippedChaosOrbs, inventory, currency } = playerState;
  const [hoveredItem, setHoveredItem] = useState<{ item: any, type?: string, pos: { x: number, y: number }, side?: 'left' | 'right', vertical?: 'top' | 'bottom' } | null>(null);
  const [selectedItemMenu, setSelectedItemMenu] = useState<{ item: any, pos: { x: number, y: number }, type: 'rune' | 'relic' | 'chaos' } | null>(null);
  
  // Selection for forging
  const [selectedRune, setSelectedRune] = useState<any | null>(null);
  const [selectedRelic, setSelectedRelic] = useState<any | null>(null);
  const [selectedOrbToUpgrade, setSelectedOrbToUpgrade] = useState<any | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<'success' | 'failure' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDestruction, setConfirmDestruction] = useState<string | null>(null);

  // Ritual State
  const [ritualPhase, setRitualPhase] = useState<'IDLE' | 'START' | 'ACCUMULATING' | 'CLIMAX' | 'RESULT'>('IDLE');
  const [ritualOrb, setRitualOrb] = useState<any | null>(null);
  const [bonusChanceLevel, setBonusChanceLevel] = useState(0); // 0: 0%, 1: +10%, 2: +15%, 3: +20%

  const allRunes = (runesData as any).runes;
  const allRelics = (relicsData as any).relics;
  const chaosOrbs = inventory.chaosOrbs || [];

  const handleMouseMove = (e: React.MouseEvent, item: any, type?: 'rune' | 'relic' | 'chaos') => {
    if (ritualPhase !== 'IDLE') return; // Disable during ritual
    
    // Determine screen position to decide which way to open the tooltip
    const x = e.clientX;
    const y = e.clientY;
    
    const side: 'left' | 'right' = x > window.innerWidth / 2 ? 'left' : 'right';
    const vertical: 'top' | 'bottom' = y > window.innerHeight / 2 ? 'top' : 'bottom';

    setHoveredItem({
        item,
        type,
        pos: { x, y },
        side,
        vertical
    });
  };

  const onItemClick = (e: React.MouseEvent, item: any, type: 'rune' | 'relic' | 'chaos') => {
      if (ritualPhase !== 'IDLE') return; // Disable during ritual
      e.stopPropagation();
      setHoveredItem(null); // Close tooltip when clicking
      setSelectedItemMenu({
          item,
          pos: { x: e.clientX, y: e.clientY },
          type
      });
  };

  const handleEquipFromMenu = () => {
      if (!selectedItemMenu || ritualPhase !== 'IDLE') return;
      const { item, type } = selectedItemMenu;
      
      if (type === 'rune') {
          const emptySlot = equippedRunes.findIndex(id => id === null);
          if (emptySlot !== -1) equipRune(item.id, emptySlot);
      } else if (type === 'relic') {
          const emptySlot = equippedRelics.findIndex(id => id === null);
          if (emptySlot !== -1) equipRelic(item.id, emptySlot);
      } else if (type === 'chaos') {
          const emptySlot = equippedChaosOrbs.findIndex(id => id === null);
          if (emptySlot !== -1) equipChaosOrb(item.id, emptySlot);
      }
      setSelectedItemMenu(null);
  };

  const handleForgeFromMenu = () => {
    if (!selectedItemMenu || ritualPhase !== 'IDLE') return;
    const { item, type } = selectedItemMenu;
    
    if (type === 'rune') {
        setSelectedRune(item);
        setSelectedOrbToUpgrade(null);
    } else if (type === 'relic') {
        setSelectedRelic(item);
        setSelectedOrbToUpgrade(null);
    } else if (type === 'chaos') {
        setSelectedOrbToUpgrade(item);
        setSelectedRune(null);
        setSelectedRelic(null);
        setBonusChanceLevel(0); // Reset bonus when changing orb
    }
    
    setSelectedItemMenu(null);
};

  const getBonusChanceInfo = (level: number) => {
    switch (level) {
        case 1: return { chance: 0.10, cost: 50 };
        case 2: return { chance: 0.15, cost: 75 };
        case 3: return { chance: 0.20, cost: 100 };
        default: return { chance: 0, cost: 0 };
    }
  };

  const handleEvolveOrb = () => {
      if (!selectedOrbToUpgrade || ritualPhase !== 'IDLE') return;
      
      const orb = selectedOrbToUpgrade;
      let costGold = 0;
      let costShards = 0;

      if (orb.rarity === Rarity.COMMON) {
          costGold = 10000;
          costShards = 10;
      } else if (orb.rarity === Rarity.EPIC) {
          costGold = 15000;
          costShards = 20;
      } else {
          return;
      }

      const bonusInfo = getBonusChanceInfo(bonusChanceLevel);
      const totalCostShards = costShards + bonusInfo.cost;

      if (currency.gold < costGold || currency.primordialShards < totalCostShards) {
          setErrorMessage("Recursos insuficientes para Evolução.");
          setTimeout(() => setErrorMessage(null), 3000);
          return;
      }

      // START RITUAL
      setRitualOrb(orb);
      setRitualPhase('START');
      setUpgradeResult(null);

      // 1. START -> ACCUMULATING (0.5s)
      setTimeout(() => {
          setRitualPhase('ACCUMULATING');
      }, 500);

      // 2. ACCUMULATING -> CLIMAX (3s)
      setTimeout(() => {
          setRitualPhase('CLIMAX');
          
          // Execute logic exactly during climax
          deductGold(costGold);
          deductShards(totalCostShards);

          const result = evolveOrb(orb, bonusInfo.chance);
          if (result.success && result.updatedOrb) {
              updateChaosOrb(result.updatedOrb);
              setSelectedOrbToUpgrade(result.updatedOrb);
              setUpgradeResult('success');
              setBonusChanceLevel(0); // Reset after success
          } else {
              setUpgradeResult('failure');
          }
      }, 3500);

      // 3. CLIMAX -> RESULT (4s total)
      setTimeout(() => {
          setRitualPhase('RESULT');
      }, 4000);

      // 4. RESET (7s total)
      setTimeout(() => {
          setRitualPhase('IDLE');
          setUpgradeResult(null);
      }, 7000);
  };

  const handleRerollOrb = () => {
      if (!selectedOrbToUpgrade || selectedOrbToUpgrade.rarity !== Rarity.MYTHIC) return;

      const costGold = 5000;
      const costShards = 5;

      if (currency.gold < costGold || currency.primordialShards < costShards) {
          setErrorMessage("Recursos insuficientes para Reroll.");
          setTimeout(() => setErrorMessage(null), 3000);
          return;
      }

      setIsUpgrading(true);
      setUpgradeResult(null);

      setTimeout(() => {
          deductGold(costGold);
          deductShards(costShards);

          const updatedOrb = rerollOrb(selectedOrbToUpgrade);
          updateChaosOrb(updatedOrb);
          setSelectedOrbToUpgrade(updatedOrb);
          setUpgradeResult('success');
          setIsUpgrading(false);
          setTimeout(() => setUpgradeResult(null), 3000);
      }, 1000);
  };

  const handleStartForge = () => {
      if (!selectedRune || !selectedRelic) return;
      
      if (chaosOrbs.length >= 6) {
          setErrorMessage("Limite de Orbes atingido. Destrua um Orbe para criar outro.");
          setTimeout(() => setErrorMessage(null), 3000);
          return;
      }

      if (currency.primordialShards < 10) {
          setErrorMessage("Fragmentos Primordiais insuficientes (Necessário 10)");
          setTimeout(() => setErrorMessage(null), 3000);
          return;
      }

      setIsForging(true);
      setSelectedOrbToUpgrade(null); // Clear upgrade slot when starting fresh forge
      setTimeout(() => {
          const result = forgeChaosOrb(selectedRune, selectedRelic);
          if (typeof result === 'string') {
              setErrorMessage(result);
          } else {
              deductShards(10);
              setSelectedRune(null);
              setSelectedRelic(null);
          }
          setIsForging(false);
      }, 2000);
  };

  const handleDestroy = (id: string) => {
      destroyChaosOrb(id);
      // Return 10 shards (resource base)
      updatePlayerState(prev => ({
          ...prev,
          currency: { ...prev.currency, primordialShards: prev.currency.primordialShards + 10 }
      }));
      setConfirmDestruction(null);
  };

  const getRarityColor = (rarity: string) => {
      switch (rarity) {
          case 'MYTHIC': return 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black uppercase';
          case 'EPIC': return 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] font-bold uppercase';
          case 'RARE': return 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] font-bold uppercase';
          case 'LEGENDARY': return 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] font-bold uppercase';
          default: return 'bg-slate-200 text-slate-800 font-bold uppercase';
      }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 text-white p-6 gap-6 font-sans select-none overflow-hidden relative ${ritualPhase === 'ACCUMULATING' ? 'animate-pulse' : ''}`} onMouseLeave={() => setHoveredItem(null)}>
      {/* Ritual Overlay - Darkens screen and focuses on forge */}
      <AnimatePresence>
          {ritualPhase !== 'IDLE' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center overflow-hidden"
              >
                  {/* Energy Vortex Particles */}
                  {ritualPhase === 'ACCUMULATING' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(12)].map((_, i) => (
                              <motion.div
                                  key={i}
                                  initial={{ rotate: i * 30, scale: 0, opacity: 0 }}
                                  animate={{ 
                                      rotate: i * 30 + 360, 
                                      scale: [0.5, 2, 0],
                                      opacity: [0, 0.8, 0],
                                      x: [0, (Math.random()-0.5)*800],
                                      y: [0, (Math.random()-0.5)*800]
                                  }}
                                  transition={{ 
                                      duration: 2, 
                                      repeat: Infinity, 
                                      delay: i * 0.1,
                                      ease: "easeInOut"
                                  }}
                                  className="absolute w-2 h-24 bg-gradient-to-t from-transparent via-purple-500 to-transparent rounded-full blur-xl"
                              />
                          ))}
                      </div>
                  )}

                  {/* Climax Flash */}
                  {ritualPhase === 'CLIMAX' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 bg-white z-[2500]"
                      />
                  )}

                  {/* Ritual Content */}
                  <div className="flex flex-col items-center gap-12 relative z-[2100]">
                      <motion.div 
                        animate={
                            ritualPhase === 'START' ? { y: [-100, -150], scale: 1.2 } :
                            ritualPhase === 'ACCUMULATING' ? { 
                                y: -150, 
                                scale: [1.2, 1.3, 1.2],
                                rotate: [0, 5, -5, 0],
                                filter: ["brightness(1) contrast(1)", "brightness(2) contrast(1.5)", "brightness(1) contrast(1)"]
                            } :
                            ritualPhase === 'CLIMAX' ? { scale: 3, opacity: 0 } :
                            ritualPhase === 'RESULT' ? { scale: 1.5, opacity: 1, y: -100 } :
                            {}
                        }
                        transition={
                            ritualPhase === 'ACCUMULATING' ? { duration: 0.2, repeat: Infinity } :
                            { duration: 0.5 }
                        }
                        className="relative"
                      >
                         <span className={`text-[12rem] drop-shadow-[0_0_50px_rgba(168,85,247,0.8)] ${ritualPhase === 'RESULT' && upgradeResult === 'failure' ? 'grayscale opacity-50' : ''}`}>
                             {ritualOrb?.icon || '🔮'}
                         </span>
                         
                         {/* Energy Pulsing Glow */}
                         {ritualPhase === 'ACCUMULATING' && (
                             <motion.div 
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="absolute inset-0 bg-purple-500 rounded-full blur-[100px] -z-10"
                             />
                         )}

                         {/* Result Particles */}
                         {ritualPhase === 'RESULT' && upgradeResult === 'success' && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 {[...Array(20)].map((_, i) => (
                                     <motion.div
                                        key={i}
                                        initial={{ scale: 0, x: 0, y: 0 }}
                                        animate={{ 
                                            scale: [0, 1, 0], 
                                            x: (Math.random()-0.5)*400, 
                                            y: (Math.random()-0.5)*400 
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
                                        className={`absolute w-3 h-3 rounded-full blur-sm ${ritualOrb?.rarity === Rarity.EPIC ? 'bg-purple-400' : 'bg-amber-400'}`}
                                     />
                                 ))}
                             </div>
                         )}
                      </motion.div>

                      {/* Result Text */}
                      <AnimatePresence mode="wait">
                          {ritualPhase === 'RESULT' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 50, scale: 0.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="flex flex-col items-center gap-4"
                              >
                                  {upgradeResult === 'success' ? (
                                      <>
                                          <h2 className={`text-6xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] ${ritualOrb?.rarity === Rarity.EPIC ? 'text-purple-400' : 'text-amber-400'}`}>
                                              Parabéns, sua Orbe evoluiu!
                                          </h2>
                                          <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-3xl border border-white/20 backdrop-blur-xl">
                                              <span className="text-4xl">{ritualOrb?.icon}</span>
                                              <div className="flex flex-col">
                                                  <span className="text-xl font-black italic uppercase">{ritualOrb?.name}</span>
                                                  <span className={`text-xs font-black uppercase tracking-[0.3em] ${getRarityColor(ritualOrb?.rarity)} px-2 py-0.5 rounded w-fit`}>
                                                    {ritualOrb?.rarity}
                                                  </span>
                                              </div>
                                          </div>
                                      </>
                                  ) : (
                                      <div className="flex flex-col items-center gap-2">
                                          <h2 className="text-8xl font-black italic tracking-tighter uppercase text-slate-600 animate-bounce">
                                              Fracasso.
                                          </h2>
                                          <p className="text-slate-500 font-bold italic">A essência colapsou...</p>
                                      </div>
                                  )}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {hoveredItem && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: hoveredItem.side === 'left' ? -20 : 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed z-[1000] pointer-events-none ${hoveredItem.item.category === 'CHAOS' ? 'min-w-[400px] p-6' : 'p-4 max-w-xs'} bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-200`}
                style={{ 
                    left: hoveredItem.pos.x + (hoveredItem.side === 'left' ? -20 : 20), 
                    top: hoveredItem.pos.y + (hoveredItem.vertical === 'top' ? -20 : 20),
                    transform: `${hoveredItem.side === 'left' ? 'translateX(-100%)' : ''} ${hoveredItem.vertical === 'top' ? 'translateY(-100%)' : ''}`
                }}
            >
                {hoveredItem.item.category === 'CHAOS' ? (
                    /* Chaos Orb Card Style from image */
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-purple-500/30 flex items-center justify-center shadow-inner shrink-0 scale-110">
                                <span className="text-4xl drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{hoveredItem.item.icon}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h4 className="text-2xl font-black italic uppercase tracking-wider text-white leading-tight">
                                    {hoveredItem.item.name}
                                </h4>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${getRarityColor(hoveredItem.item.rarity)}`}>
                                        {hoveredItem.item.rarity}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <p className="text-slate-300 text-[13px] leading-relaxed font-medium italic opacity-80 border-l-2 border-purple-500/30 pl-4 py-1 whitespace-pre-line">
                                {hoveredItem.item.description || "Manifestação energética pura."}
                            </p>

                            {/* Passives from components */}
                            {(() => {
                                const rune = allRunes.find((r:any) => r.id === hoveredItem.item.runeId);
                                const relic = allRelics.find((r:any) => r.id === hoveredItem.item.relicId);
                                return (
                                    <div className="flex flex-col gap-2 bg-black/30 p-3 rounded-xl border border-slate-800/50">
                                        {rune?.passive && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Runa: {rune.name}</span>
                                                <p className="text-[10px] text-slate-400 italic">"{rune.passive}"</p>
                                            </div>
                                        )}
                                        {relic?.passive && (
                                            <div className="flex flex-col gap-1 border-t border-slate-800/50 pt-2">
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Relíquia: {relic.name}</span>
                                                <p className="text-[10px] text-slate-400 italic">"{relic.passive}"</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-1">
                            {hoveredItem.item.tags.map((tag: string) => (
                                <span key={tag} className="text-[10px] font-black uppercase px-3 py-1 bg-slate-800/80 text-slate-400 rounded-lg border border-slate-700/50">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {hoveredItem.item.bonuses && (
                            <div className="mt-2 pt-3 border-t border-slate-800/50 flex flex-col gap-2">
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Atributos Adicionais</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {hoveredItem.item.bonuses.map((b: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] text-amber-400/90 font-black italic bg-amber-500/5 px-2 py-1.5 rounded-lg border border-amber-500/10">
                                            <Sparkles size={10} className="text-amber-500" /> {b}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Standard Tooltip for Runes/Relics */
                    <>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{hoveredItem.item.icon || '✨'}</span>
                            <div>
                                <h4 className="font-black italic uppercase text-sm tracking-tight">{hoveredItem.item.name}</h4>
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${getRarityColor(hoveredItem.item.rarity)}`}>
                                    {hoveredItem.item.rarity}
                                </span>
                            </div>
                        </div>
                        
                        <p className="text-slate-400 text-[10px] leading-relaxed font-mono mb-2">
                            {hoveredItem.item.description}
                        </p>

                        {hoveredItem.item.tags && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {hoveredItem.item.tags.map((tag: string) => (
                                    <span key={tag} className="text-[7px] font-bold uppercase px-1 py-0.5 bg-slate-800 text-slate-400 rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {hoveredItem.item.passive && (
                            <div className="mt-2 pt-2 border-t border-slate-800">
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-1">Passiva</span>
                                <p className="text-[9px] text-cyan-200/70 italic leading-snug">{hoveredItem.item.passive}</p>
                            </div>
                        )}

                        {hoveredItem.item.bonuses && hoveredItem.item.bonuses.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-800">
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">Bônus de Forja</span>
                                {hoveredItem.item.bonuses.map((b: string, i: number) => (
                                    <div key={i} className="flex items-center gap-1 text-[9px] text-amber-400/80 font-mono italic">
                                        <Sparkles size={8} /> {b}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Item Action Menu */}
      <AnimatePresence>
          {selectedItemMenu && (
              <>
                  <div className="fixed inset-0 z-[1500]" onClick={() => setSelectedItemMenu(null)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed z-[1600] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 min-w-[140px] backdrop-blur-xl"
                    style={{ left: selectedItemMenu.pos.x, top: selectedItemMenu.pos.y }}
                  >
                      <button 
                        onClick={handleEquipFromMenu}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-all font-black italic text-[11px] uppercase tracking-wider"
                      >
                          <Zap size={14} className="text-emerald-500" /> {selectedItemMenu.type === 'chaos' ? 'USAR' : 'Equipar'}
                      </button>
                      <button 
                        onClick={handleForgeFromMenu}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all font-black italic text-[11px] uppercase tracking-wider"
                      >
                          <Hammer size={14} className="text-blue-500" /> {selectedItemMenu.type === 'chaos' ? 'FORJA' : 'FORJAR'}
                      </button>

                      {selectedItemMenu.type === 'chaos' && (
                          <button 
                            onClick={() => {
                                setConfirmDestruction(selectedItemMenu.item.id);
                                setSelectedItemMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all font-black italic text-[11px] uppercase tracking-wider"
                          >
                              <Trash2 size={14} className="text-red-500" /> QUEBRAR
                          </button>
                      )}
                      <div className="h-px bg-slate-800 my-1 mx-2" />
                      <button 
                        onClick={() => setSelectedItemMenu(null)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 text-slate-500 rounded-lg transition-all font-black italic text-[11px] uppercase tracking-wider"
                      >
                          <X size={14} /> Cancelar
                      </button>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
          {confirmDestruction && (
              <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full text-center"
                  >
                      <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                      <h2 className="text-2xl font-black italic mb-2 tracking-tighter">DESTRUIR ORBE?</h2>
                      <p className="text-slate-400 text-sm mb-8">Deseja destruir este Orbe? Runas e Relíquias serão perdidas permanentemente. Você receberá 10 Fragmentos de volta.</p>
                      
                      <div className="flex gap-4">
                          <button 
                            onClick={() => setConfirmDestruction(null)}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors"
                          >
                              CANCELAR
                          </button>
                          <button 
                            onClick={() => handleDestroy(confirmDestruction)}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-colors"
                          >
                              DESTRUIR
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Hammer className="text-blue-500" size={32} />
          <h1 className="text-3xl font-black tracking-tighter italic">FORJA CELESTIAL</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg group hover:border-amber-500/50 transition-all">
                <Coins className="text-amber-400 group-hover:animate-pulse" size={18} />
                <span className="font-mono font-bold">{currency.gold.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg group hover:border-blue-500/50 transition-all">
                <Diamond className="text-blue-400 group-hover:animate-pulse" size={18} />
                <span className="font-mono font-bold">{currency.primordialShards}</span>
            </div>
            <button 
                disabled={ritualPhase !== 'IDLE'}
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-slate-300 transition-colors font-bold text-sm tracking-widest"
            >
                <ArrowLeft size={18} /> VOLTAR
            </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 overflow-hidden" onMouseLeave={() => setHoveredItem(null)}>
        {/* Left: Inventory - Relics */}
        <section className="col-span-3 bg-slate-900/40 rounded-2xl p-6 flex flex-col border border-slate-800 shadow-inner overflow-hidden">
            <h2 className="text-[12px] font-black flex items-center gap-2 mb-4 text-emerald-500 italic uppercase tracking-[0.2em]">
              <Shield size={16} /> Relíquias ({inventory.relics.length})
            </h2>
            <div className="grid grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar content-start">
              {allRelics.map((item: any) => {
                  const ownedCount = inventory.relics.filter((id: string) => id === item.id).length;
                  const isSelected = selectedRelic?.id === item.id;
                  return (
                      <div key={item.id} className="relative">
                          <motion.div 
                              onClick={(e) => ownedCount > 0 && onItemClick(e, item, 'relic')}
                              onMouseMove={(e) => handleMouseMove(e, item, 'relic')}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`aspect-square bg-slate-950 border-2 ${isSelected ? 'border-emerald-500 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ownedCount > 0 ? 'border-emerald-900/50 hover:border-emerald-500' : 'border-slate-800/20 opacity-20 grayscale'} rounded-xl flex items-center justify-center transition-all cursor-pointer relative group`}
                          >
                              <span className={ownedCount > 0 ? 'text-3xl' : 'text-2xl'}>{item.icon}</span>
                              {ownedCount > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[10px] font-black px-2 py-0.5 rounded border border-slate-950">
                                      {ownedCount}
                                  </span>
                              )}
                          </motion.div>
                      </div>
                  );
              })}
            </div>
        </section>

        {/* Center: The Altar / Fusion & Chaos Orbs Inventory */}
        <section className="col-span-6 flex flex-col items-center py-6 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_var(--tw-gradient-to)_100%)] from-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-y-auto custom-scrollbar">
          <div className="w-full flex flex-col items-center gap-8 px-12">
              <div className="flex items-center justify-center gap-16 w-full mt-4">
                  {!selectedOrbToUpgrade ? (
                      <>
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-32 h-32 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 relative ${selectedRune ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'border-slate-800 border-dashed bg-black/20'}`}>
                                {selectedRune ? (
                                    <>
                                        <span className="text-6xl">{selectedRune.icon}</span>
                                        <button onClick={() => setSelectedRune(null)} className="absolute -top-3 -right-3 p-2 bg-slate-800 rounded-full border border-slate-700 hover:text-red-400 shadow-xl"><X size={16}/></button>
                                    </>
                                ) : <Zap className="text-slate-800" size={56} />}
                            </div>
                            <span className="text-[12px] font-black text-blue-500 uppercase tracking-[0.2em] italic">Essência Rúnica</span>
                        </div>

                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-slate-700 flex items-center justify-center bg-slate-950 shadow-inner">
                                <Sparkles className={`text-amber-500 ${isForging ? 'animate-spin' : 'animate-pulse'}`} size={40} />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-32 h-32 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 relative ${selectedRelic ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'border-slate-800 border-dashed bg-black/20'}`}>
                                {selectedRelic ? (
                                    <>
                                        <span className="text-6xl">{selectedRelic.icon}</span>
                                        <button onClick={() => setSelectedRelic(null)} className="absolute -top-3 -right-3 p-2 bg-slate-800 rounded-full border border-slate-700 hover:text-red-400 shadow-xl"><X size={16}/></button>
                                    </>
                                ) : <Shield className="text-slate-800" size={56} />}
                            </div>
                            <span className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">Vínculo Relíquia</span>
                        </div>
                      </>
                  ) : (
                      <div className="flex flex-col items-center gap-4 py-8">
                          <h3 className="text-[14px] font-black text-purple-400 uppercase tracking-[0.4em] italic mb-2">Melhoria de Orbe</h3>
                          <div className={`w-40 h-40 rounded-[2.5rem] border-2 flex items-center justify-center transition-all duration-500 relative ${selectedOrbToUpgrade ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_60px_rgba(168,85,247,0.4)]' : 'border-slate-800 border-dashed bg-black/20'}`}>
                              <span className="text-7xl drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse">{selectedOrbToUpgrade.icon}</span>
                              <button onClick={() => { setSelectedOrbToUpgrade(null); setUpgradeResult(null); }} className="absolute -top-3 -right-3 p-2 bg-slate-800 rounded-full border border-slate-700 hover:text-red-400 shadow-xl"><X size={20}/></button>
                              
                              {upgradeResult === 'success' && (
                                  <motion.div 
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 3, opacity: 0 }}
                                      transition={{ duration: 1 }}
                                      className="absolute inset-0 rounded-full border-4 border-amber-400"
                                  />
                              )}
                          </div>
                          <div className="flex flex-col items-center">
                              <span className="text-lg font-black italic text-white uppercase">{selectedOrbToUpgrade.name}</span>
                              <span className={`text-[11px] font-black uppercase tracking-widest ${getRarityColor(selectedOrbToUpgrade.rarity)} w-fit px-3 py-1 mt-1 rounded`}>
                                  {selectedOrbToUpgrade.rarity}
                              </span>
                          </div>
                      </div>
                  )}
              </div>

              <div className="w-full flex flex-col items-center gap-6">
                  {!selectedOrbToUpgrade ? (
                      <button 
                        disabled={!selectedRune || !selectedRelic || isForging}
                        onClick={handleStartForge}
                        className={`relative group px-24 py-5 overflow-hidden rounded-full transition-all duration-500 border-2 ${!selectedRune || !selectedRelic ? 'opacity-30 grayscale cursor-not-allowed border-slate-800' : 'border-amber-500 hover:border-amber-400 active:scale-95 shadow-[0_0_40px_rgba(245,158,11,0.2)]'}`}
                      >
                        <div className="absolute inset-0 bg-amber-500/10 group-hover:bg-amber-500/20 transition-all" />
                        <span className="relative z-10 font-black uppercase italic tracking-[0.3em] text-base flex items-center gap-4">
                            {isForging ? (
                                <>MANIFESTANDO ORBE...</>
                            ) : (
                                <>FORJAR ORBE DO CAOS (10 <Diamond size={18} className="inline"/>)</>
                            )}
                        </span>
                      </button>
                  ) : (
                      <div className="flex flex-col items-center gap-6 w-full max-w-md">
                          {selectedOrbToUpgrade.rarity !== Rarity.MYTHIC ? (
                              <div className="w-full flex flex-col gap-4 bg-slate-900/80 p-6 rounded-2xl border border-purple-500/30">
                                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider text-slate-400 italic">
                                      <span>Próxima Raridade:</span>
                                      <span className={selectedOrbToUpgrade.rarity === Rarity.COMMON ? 'text-purple-400' : 'text-amber-400'}>
                                          {selectedOrbToUpgrade.rarity === Rarity.COMMON ? 'ÉPICA' : 'MÍTICA'}
                                      </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider text-slate-400 italic">
                                      <span>Chance de Sucesso:</span>
                                      <div className="flex items-center gap-2">
                                          <span className="text-emerald-400">
                                              {((selectedOrbToUpgrade.rarity === Rarity.COMMON ? 20 : 10) + (getBonusChanceInfo(bonusChanceLevel).chance * 100))}%
                                          </span>
                                          {bonusChanceLevel > 0 && (
                                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                                  +{getBonusChanceInfo(bonusChanceLevel).chance * 100}%
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  
                                  <div className="flex gap-4 justify-center">
                                      <div className="flex items-center gap-2 text-[12px] font-black italic text-amber-400">
                                          <Coins size={16} /> {selectedOrbToUpgrade.rarity === Rarity.COMMON ? '10.000' : '15.000'}
                                      </div>
                                      <div className="flex items-center gap-2 text-[12px] font-black italic text-blue-400">
                                          <Diamond size={16} /> {(selectedOrbToUpgrade.rarity === Rarity.COMMON ? 10 : 20) + getBonusChanceInfo(bonusChanceLevel).cost}
                                      </div>
                                  </div>

                                  <div className="flex gap-3">
                                      <button 
                                          disabled={isUpgrading}
                                          onClick={handleEvolveOrb}
                                          className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-black italic text-base uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                                      >
                                          {isUpgrading ? 'EVOLUINDO...' : 'EVOLUIR ORBE'}
                                      </button>

                                      <div className="relative group/boost">
                                          <button
                                              disabled={isUpgrading || bonusChanceLevel >= 3}
                                              onClick={(e) => { e.stopPropagation(); setBonusChanceLevel(prev => Math.min(3, prev + 1)); }}
                                              className={`w-20 h-full rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                                                  bonusChanceLevel >= 3 
                                                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                                                  : 'border-blue-500/30 bg-blue-500/10 hover:border-blue-500/60 text-blue-400'
                                              }`}
                                              title="Aumentar Chance"
                                          >
                                              <Sparkles size={16} className={bonusChanceLevel > 0 ? 'animate-pulse' : ''} />
                                              <span className="text-[10px] font-black italic leading-none">
                                                  {bonusChanceLevel < 3 ? `+${(getBonusChanceInfo(bonusChanceLevel + 1).chance * 100)}%` : 'MAX'}
                                              </span>
                                              <span className="text-[8px] font-bold opacity-70">
                                                  {bonusChanceLevel < 3 ? `${getBonusChanceInfo(bonusChanceLevel + 1).cost} 🔷` : 'BOOST'}
                                              </span>
                                          </button>

                                          {bonusChanceLevel > 0 && !isUpgrading && (
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); setBonusChanceLevel(0); }}
                                                className="absolute -top-2 -right-2 p-1 bg-slate-800 rounded-full border border-slate-700 text-slate-400 hover:text-red-400 shadow-lg z-10"
                                                title="Resetar Bônus"
                                              >
                                                  <X size={10} />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="w-full flex flex-col gap-4 bg-slate-900/80 p-6 rounded-2xl border border-amber-500/30">
                                  <span className="text-[12px] font-black uppercase text-amber-400 italic text-center tracking-widest">Nível Máximo de Raridade</span>
                                  
                                  <div className="flex gap-4 justify-center">
                                      <div className="flex items-center gap-2 text-[12px] font-black italic text-amber-400">
                                          <Coins size={16} /> 5.000
                                      </div>
                                      <div className="flex items-center gap-2 text-[12px] font-black italic text-blue-400">
                                          <Diamond size={16} /> 5
                                      </div>
                                  </div>

                                  <button 
                                      disabled={isUpgrading}
                                      onClick={handleRerollOrb}
                                      className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl font-black italic text-base uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
                                  >
                                      {isUpgrading ? 'REROLL EM PROGRESSO...' : 'REROLL DE ATRIBUTOS'}
                                  </button>
                              </div>
                          )}
                      </div>
                  )}
                  
                  {errorMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-red-500 font-bold text-[13px] uppercase p-4 bg-red-500/10 rounded-2xl border border-red-500/20"
                      >
                          <AlertTriangle size={18} /> {errorMessage}
                      </motion.div>
                  )}
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-4" />

              <div className="w-full grid grid-cols-2 gap-12">
                  <div className="flex flex-col items-center gap-6">
                      <h3 className="text-[12px] font-black text-purple-400 uppercase tracking-[0.4em] italic mb-2">Inventário de Orbes ({chaosOrbs.length}/6)</h3>
                      <div className="grid grid-cols-2 gap-5">
                        {chaosOrbs.map((item: any) => {
                            const isEquipped = equippedChaosOrbs.includes(item.id);
                            return (
                                <motion.div 
                                    key={item.id} 
                                    onMouseMove={(e) => handleMouseMove(e, item, 'chaos')}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`w-28 h-28 bg-slate-950 border-2 ${isEquipped ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'border-slate-800 hover:border-purple-500'} rounded-[2rem] flex items-center justify-center transition-all cursor-pointer relative group`}
                                >
                                    <span className="text-5xl drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">{item.icon}</span>
                                    
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity rounded-[2rem] z-10 p-2">
                                        {!isEquipped && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); const emptySlot = equippedChaosOrbs.findIndex((s: any) => s === null); if (emptySlot !== -1) equipChaosOrb(item.id, emptySlot); }}
                                                className="p-2.5 bg-blue-600 rounded-xl hover:bg-blue-500 shadow-2xl transition-transform active:scale-90 flex-1 flex justify-center"
                                                title="Usar"
                                            >
                                                <Zap size={20} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedOrbToUpgrade(item); setSelectedRune(null); setSelectedRelic(null); }}
                                            className="p-2.5 bg-amber-600 rounded-xl hover:bg-amber-500 shadow-2xl transition-transform active:scale-90 flex-1 flex justify-center"
                                            title="Forja"
                                        >
                                            <Hammer size={20} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setConfirmDestruction(item.id); }}
                                            className="p-2.5 bg-red-600 rounded-xl hover:bg-red-500 shadow-2xl transition-transform active:scale-90 flex-1 flex justify-center"
                                            title="Quebrar"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {Array.from({ length: 6 - chaosOrbs.length }).map((_, i) => (
                            <div key={`empty-inv-${i}`} className="w-28 h-28 bg-black/20 border-2 border-slate-800 border-dashed rounded-[2rem] flex items-center justify-center opacity-30">
                                <Sparkles size={24} className="text-slate-800" />
                            </div>
                        ))}
                      </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                      <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-2">Matriz Equipada</h3>
                      
                      <div className="flex flex-col gap-8 w-full">
                          <div className="flex flex-col items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Orbes do Caos</span>
                              <div className="flex gap-4">
                                  {equippedChaosOrbs.map((id, i) => {
                                      const orb = id ? chaosOrbs.find((o:any) => o.id === id) : null;
                                      return (
                                          <motion.div 
                                              key={i} 
                                              initial={id ? { scale: 1.2, filter: "brightness(2)" } : { scale: 1 }}
                                              animate={id ? { scale: 1.1, filter: "brightness(1)" } : { scale: 1 }}
                                              onClick={() => orb && unequipChaosOrb(i)}
                                              onMouseMove={(e) => orb && handleMouseMove(e, orb, 'chaos')}
                                              onMouseLeave={() => setHoveredItem(null)}
                                              className={`w-16 h-16 rounded-[1.25rem] border-2 flex items-center justify-center transition-all ${orb ? 'border-purple-500 bg-purple-500/10 cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'border-slate-800/50 border-dashed bg-black/20'}`}
                                          >
                                              {orb ? <span className="text-4xl animate-pulse drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">{orb.icon}</span> : <div className="w-2 h-2 rounded-full bg-slate-900 shadow-inner" />}
                                          </motion.div>
                                      );
                                  })}
                              </div>
                          </div>

                          <div className="flex justify-center gap-12">
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Runas</span>
                                <div className="flex gap-4">
                                    {equippedRunes.map((id:string | null, i:number) => {
                                        const rune = id ? allRunes.find((r:any) => r.id === id) : null;
                                        return (
                                            <motion.div 
                                                key={i} 
                                                initial={id ? { scale: 1.2, filter: "brightness(2)" } : { scale: 1 }}
                                                animate={id ? { scale: 1.05, filter: "brightness(1)" } : { scale: 1 }}
                                                onClick={() => rune && unequipRune(i)}
                                                onMouseMove={(e) => rune && handleMouseMove(e, rune, 'rune')}
                                                onMouseLeave={() => setHoveredItem(null)}
                                                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${rune ? 'border-blue-500 bg-blue-500/10 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-800/50 border-dashed bg-black/20'}`}
                                            >
                                                {rune ? <span className="text-3xl drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">{rune.icon}</span> : <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Relíquias</span>
                                <div className="flex gap-4">
                                    {equippedRelics.map((id:string | null, i:number) => {
                                        const relic = id ? allRelics.find((r:any) => r.id === id) : null;
                                        return (
                                            <motion.div 
                                                key={i} 
                                                initial={id ? { scale: 1.2, filter: "brightness(2)" } : { scale: 1 }}
                                                animate={id ? { scale: 1.05, filter: "brightness(1)" } : { scale: 1 }}
                                                onClick={() => relic && unequipRelic(i)}
                                                onMouseMove={(e) => relic && handleMouseMove(e, relic, 'relic')}
                                                onMouseLeave={() => setHoveredItem(null)}
                                                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${relic ? 'border-emerald-500 bg-emerald-500/10 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-800/50 border-dashed bg-black/20'}`}
                                            >
                                                {relic ? <span className="text-3xl drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">{relic.icon}</span> : <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </section>

        {/* Right: Inventory - Runes */}
        <section className="col-span-3 bg-slate-900/40 rounded-2xl p-6 flex flex-col border border-slate-800 shadow-inner overflow-hidden">
            <h2 className="text-[12px] font-black flex items-center gap-2 mb-4 text-blue-500 italic uppercase tracking-[0.2em]">
              <Zap size={16} /> Runas ({inventory.runes.length})
            </h2>
            <div className="grid grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar content-start">
              {allRunes.map((item: any) => {
                  const ownedCount = inventory.runes.filter((id: string) => id === item.id).length;
                  const isSelected = selectedRune?.id === item.id;
                  return (
                      <div key={item.id} className="relative">
                          <motion.div 
                              onClick={(e) => ownedCount > 0 && onItemClick(e, item, 'rune')}
                              onMouseMove={(e) => handleMouseMove(e, item, 'rune')}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`aspect-square bg-slate-950 border-2 ${isSelected ? 'border-blue-500 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ownedCount > 0 ? 'border-blue-900/50 hover:border-blue-500' : 'border-slate-800/20 opacity-20 grayscale'} rounded-xl flex items-center justify-center transition-all cursor-pointer relative group`}
                          >
                              <span className={ownedCount > 0 ? 'text-3xl' : 'text-2xl'}>{item.icon}</span>
                              {ownedCount > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded border border-slate-950">
                                      {ownedCount}
                                  </span>
                              )}
                          </motion.div>
                      </div>
                  );
              })}
            </div>
        </section>
      </main>
    </div>
  );
};
