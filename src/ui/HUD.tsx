import React from 'react';
import { motion } from 'motion/react';
import { Heart, Zap as ZapIcon, Timer, Coins, Trophy, Flame, Snowflake, Zap, Diamond, Atom, Sparkles } from 'lucide-react';
import { usePlayerState } from '../core/Store';
import { bossSystem } from '../systems/bossSystem';
import { stageSystem } from '../systems/stageSystem';
import { PowerUpClass } from '../core/Types';
import { synergySystem } from '../systems/synergySystem';
import areasData from '../data/areas.json';

export const HUD: React.FC = () => {
  const playerState = usePlayerState();
  const { stats, currency, progression, session, activePowerUp } = playerState;

  const hpPercent = (stats.hp / stats.maxHp) * 100;
  const energyPercent = (stats.energy / stats.maxEnergy) * 100;
  const xpPercent = (progression.exp / (progression.nextLevelExp || 100)) * 100;

  const getPowerUpData = () => {
      if (!activePowerUp || activePowerUp.level === 0 || !activePowerUp.class) return null;
      switch (activePowerUp.class) {
          case PowerUpClass.FIRE: return { icon: <Flame size={18} />, color: 'text-orange-500', bgColor: 'bg-orange-500', label: 'ÍGNEO' };
          case PowerUpClass.ICE: return { icon: <Snowflake size={18} />, color: 'text-cyan-400', bgColor: 'bg-cyan-400', label: 'GLACIAL' };
          case PowerUpClass.ELECTRIC: return { icon: <Zap size={18} />, color: 'text-yellow-400', bgColor: 'bg-yellow-400', label: 'TEMPESTUOSO' };
          case PowerUpClass.PLASMA: return { icon: <Atom size={18} />, color: 'text-blue-500', bgColor: 'bg-blue-600', label: 'PLASMÁTICO' };
          default: return null;
      }
  };

  const puInfo = getPowerUpData();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-8 font-sans overflow-hidden">
      
      {/* Screen Flash Overlay */}
      {playerState.feedback.flash > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: playerState.feedback.flash }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[100] pointer-events-none"
          />
      )}
      
      {/* --- HP & ENERGY SIDEBAR (LEFT) --- */}
      <div className="absolute left-10 inset-y-12 flex flex-col justify-between py-6 pointer-events-none">
        
        {/* HP Bar (Top Left) */}
        <div className="relative w-16 h-[40%] flex flex-col items-center">
            <div className="mb-3 p-1.5 bg-red-950/40 rounded-xl border-2 border-red-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)] relative group cursor-pointer hover:border-red-400 transition-all flex items-center justify-center min-w-[50px] min-h-[50px]">
                <Heart size={34} className="text-red-500 fill-red-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black text-white italic drop-shadow-[0_0_5px_rgba(0,0,0,1)] pr-1">
                        {session.lives}x
                    </span>
                </div>
            </div>
            
            <div className="relative w-8 flex-grow bg-black/60 border border-red-900/50 rounded-lg overflow-hidden p-0.5 shadow-2xl">
                <div className="absolute inset-0 bg-energy-segments-vert opacity-20 z-0" />
                
                <motion.div 
                    initial={false}
                    animate={{ height: `${hpPercent}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-950 via-red-600 to-red-400 rounded-sm"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/10" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white shadow-[0_0_10px_#fff]" />
                </motion.div>

                <div className="absolute inset-0 flex items-center justify-center rotate-90 pointer-events-none">
                    <span className="text-[10px] font-black text-white/80 whitespace-nowrap tracking-tighter drop-shadow-md">
                        {Math.ceil(stats.hp)} / {stats.maxHp}
                    </span>
                </div>
            </div>
        </div>

        {/* Energy Bar (Bottom Left) */}
        <div className="relative w-16 h-[40%] flex flex-col items-center justify-end">
            <div className="relative w-8 flex-grow bg-black/60 border border-cyan-900/50 rounded-lg overflow-hidden p-0.5 shadow-2xl">
                <div className="absolute inset-0 bg-energy-segments-vert opacity-20 z-0" />
                
                <motion.div 
                    initial={false}
                    animate={{ height: `${energyPercent}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-950 via-cyan-500 to-cyan-300 rounded-sm"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/10" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white shadow-[0_0_10px_#fff]" />
                </motion.div>

                <div className="absolute inset-0 flex items-center justify-center rotate-90 pointer-events-none">
                    <span className="text-[10px] font-black text-white/80 whitespace-nowrap tracking-tighter drop-shadow-md">
                        {Math.floor(stats.energy)} / {stats.maxEnergy}
                    </span>
                </div>
            </div>

            <div className="mt-3 p-2 bg-cyan-950/40 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <ZapIcon size={20} className="text-cyan-400 fill-cyan-400/20" />
            </div>
        </div>
      </div>

      {/* --- TOP HUD --- */}
      
      {/* 1. SCORE (Center Top) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[9px] text-slate-500 font-black tracking-[0.4em] uppercase opacity-60">Score Analysis</span>
          <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tabular-nums">
              {session.score.toLocaleString()}
          </span>
      </div>

      {/* 2. PHASE & TIME (Top Left, next to health sidebar) */}
      <div className="absolute top-8 left-40 flex items-center gap-6 px-6 py-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl z-50">
          <div className="flex flex-col min-w-[120px]">
              <span className="text-[8px] text-blue-400 font-black tracking-[0.3em] uppercase mb-0.5 truncate">
                  {areasData.areas.find(a => a.id === session.selectedArea)?.name || 'SETOR DESCONHECIDO'}
              </span>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Phase</span>
                  <span className="text-xl font-black text-white italic">{session.phase}</span>
              </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex items-center gap-3">
              <Timer size={16} className="text-blue-400" />
              <span className="text-xl font-black text-blue-100 font-mono italic">{formatTime(stageSystem.stageTime)}</span>
          </div>
      </div>

      {/* 3. CURRENCIES (Below Power Up / Next to health) */}
      <div className="absolute top-48 left-40 flex flex-col items-start gap-3 pointer-events-auto z-50">
          <div className="flex items-center gap-3 px-5 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-amber-900/50 shadow-xl group hover:border-amber-500/50 transition-colors">
              <div className="p-2 bg-amber-950/50 rounded-lg border border-amber-500/30 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all">
                <Coins size={20} className="text-amber-500" />
              </div>
              <div className="flex flex-col items-start">
                  <span className="text-[8px] text-amber-600 font-black tracking-widest uppercase mb-[-2px]">Credits</span>
                  <span className="text-xl font-black text-amber-100 font-mono tracking-tighter">{currency.gold.toLocaleString()}</span>
              </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-purple-900/50 shadow-xl group hover:border-purple-500/50 transition-colors">
              <div className="p-2 bg-purple-950/50 rounded-lg border border-purple-500/30 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all">
                <Diamond size={18} className="text-purple-400" />
              </div>
              <div className="flex flex-col items-start">
                  <span className="text-[8px] text-purple-600 font-black tracking-widest uppercase mb-[-2px]">Primordial</span>
                  <span className="text-xl font-black text-purple-100 font-mono tracking-tighter">{currency.primordialShards}</span>
              </div>
          </div>
      </div>

      {/* 4. POWER UP INDICATOR (Below Phase/Time) */}
      {puInfo && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-28 left-40 flex items-center gap-3 px-5 py-2.5 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50"
          >
              <div className={`p-2 rounded-xl bg-black/40 border border-${puInfo.bgColor.split('-')[1]}-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                  {React.cloneElement(puInfo.icon as React.ReactElement, { className: puInfo.color })}
              </div>
              <div className="flex flex-col">
                  <span className={`text-[11px] font-black italic tracking-widest ${puInfo.color}`}>{puInfo.label} MODE</span>
                  <div className="flex gap-1.5 mt-1">
                      {[1,2,3,4].map(l => (
                          <div key={l} className={`w-4 h-1.5 rounded-full transition-all duration-300 ${activePowerUp.level >= l ? puInfo.bgColor + ' shadow-[0_0_10px_currentColor]' : 'bg-slate-800'}`} />
                      ))}
                  </div>
              </div>
          </motion.div>
      )}

      {/* --- BOSS PROGRESS BAR (Top Center) --- */}
      {!bossSystem.currentBoss && !stageSystem.stageCompleted && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-xl flex flex-col items-center gap-2 z-50">
              <div className="flex justify-between w-full px-2">
                  <span className={`text-[9px] font-black uppercase tracking-[0.5em] transition-colors ${stageSystem.bossProgress / stageSystem.MAX_PROGRESS > 0.8 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                      {stageSystem.bossProgress >= stageSystem.MAX_PROGRESS ? 'INVOCANDO BOSS' : 'AMEAÇA IMINENTE'}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 tabular-nums">
                      {Math.floor((stageSystem.bossProgress / stageSystem.MAX_PROGRESS) * 100)}%
                  </span>
              </div>
              <div className="w-full h-2.5 bg-black/60 border border-white/5 rounded-full overflow-hidden backdrop-blur-sm shadow-2xl relative">
                  <motion.div 
                      key="boss-progress"
                      initial={false}
                      animate={{ 
                        width: `${(stageSystem.bossProgress / stageSystem.MAX_PROGRESS) * 100}%`,
                        backgroundColor: stageSystem.bossProgress / stageSystem.MAX_PROGRESS > 0.8 ? '#ef4444' : '#f97316'
                      }}
                      className="h-full relative transition-all duration-500"
                  >
                      {/* Pulse effect when high progress */}
                      {stageSystem.bossProgress / stageSystem.MAX_PROGRESS > 0.8 && (
                          <motion.div 
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="absolute inset-0 bg-white"
                          />
                      )}
                      
                      {/* Inner glow/particles */}
                      <div className="absolute inset-0 bg-energy-segments opacity-20" />
                      <div className="absolute top-0 right-0 w-2 h-full bg-white shadow-[0_0_15px_#fff]" />
                      
                      {/* Bubbling effect */}
                      <motion.div 
                        animate={{ y: [-10, -20], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        className="absolute left-1/4 w-1 h-1 bg-white rounded-full blur-[1px]"
                      />
                      <motion.div 
                        animate={{ y: [-5, -15], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        className="absolute left-2/4 w-1 h-1 bg-white rounded-full blur-[1px]"
                      />
                      <motion.div 
                        animate={{ y: [-8, -18], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                        className="absolute left-3/4 w-1 h-1 bg-white rounded-full blur-[1px]"
                      />
                  </motion.div>
                  
                  {/* Marker for milestones */}
                  <div className="absolute left-[25%] top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute left-[50%] top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute left-[75%] top-0 bottom-0 w-px bg-white/20" />
              </div>
          </div>
      )}


      {/* --- BOTTOM HUD: XP BAR & LEVEL --- */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 pointer-events-none scale-100 lg:scale-110">
          <div className="relative flex items-center h-24 w-full px-6">
              
              {/* Main Frame Background */}
              <div className="absolute inset-y-4 inset-x-8 bg-slate-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] border-y border-slate-700/50 flex flex-col justify-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                  {/* Decorative Circuit Lines */}
                  <div className="absolute inset-0 h-px top-0 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                  <div className="absolute inset-0 h-px bottom-0 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                  <div className="absolute top-2 left-10 right-10 flex justify-between">
                      <div className="w-16 h-[1px] bg-emerald-500/40" />
                      <div className="w-16 h-[1px] bg-emerald-500/40" />
                  </div>
              </div>

              {/* LEVEL DIAMOND (LEFT) */}
              <div className="relative z-20 w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-950/90 border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)] rotate-45 rounded-xl" />
                  <div className="absolute inset-1 border border-emerald-400/30 rotate-45 rounded-lg" />
                  <div className="relative flex flex-col items-center select-none">
                      <span className="text-4xl font-black text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{progression.level}</span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Nível</span>
                  </div>
              </div>
              {/* XP TUBE (CENTER) */}
              <div className="flex-grow mx-2 relative h-20 flex flex-col justify-end pb-2">
                  
                  {/* SLOTS & XP TEXT ROW (ABOVE TUBE) */}
                  <div className="flex items-end gap-6 mb-2 ml-4">
                      {/* SPECIAL SLOTS */}
                      <div className="flex gap-2 pointer-events-auto">
                        {[0, 1, 2, 3].map((slot, i) => {
                          const specId = playerState.skillTree?.equippedSpecials[slot];
                          const keys = ['T', 'Y', 'U', 'I'];
                          // Actual checks for HUD feedback
                          const hasEnergy = stats.energy >= 100;
                          const isUnlocked = specId != null;
                          const synergyBonus = isUnlocked && activePowerUp.class ? synergySystem.getSynergyBonus(activePowerUp.class, specId) : null;
                          
                          return (
                            <div key={slot} className="flex flex-col items-center gap-1 group">
                              <motion.div 
                                whileHover={isUnlocked ? { scale: 1.1 } : {}}
                                className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center backdrop-blur-md transition-all relative ${
                                  isUnlocked 
                                  ? (hasEnergy 
                                      ? (synergyBonus ? `bg-black/60 shadow-[0_0_20px_${synergyBonus.color}] scale-110 border-[3px]` : 'bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]') 
                                      : 'bg-slate-800/40 border-slate-600 opacity-60')
                                  : 'bg-black/40 border-white/5'
                                }`}
                                style={synergyBonus && hasEnergy ? { borderColor: synergyBonus.color } : {}}
                              >
                                {isUnlocked ? (
                                  <>
                                    <span className={`font-black text-[10px] uppercase tracking-tighter leading-none select-none ${synergyBonus ? 'text-white' : 'text-white'}`}>{specId?.slice(0, 3)}</span>
                                    {synergyBonus && hasEnergy && (
                                      <motion.div 
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-1 -right-1"
                                      >
                                        <Sparkles size={12} style={{ color: synergyBonus.color, filter: `drop-shadow(0 0 5px ${synergyBonus.color})` }} />
                                      </motion.div>
                                    )}
                                    {!hasEnergy && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                        <Zap size={14} className="text-amber-500/50" />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                                )}
                              </motion.div>
                              <span className={`text-[10px] font-black tracking-tighter transition-colors uppercase select-none ${synergyBonus ? 'text-emerald-400/80' : 'text-white/40 group-hover:text-blue-400/60'}`}>{keys[i]}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* XP TEXT */}
                      <div className="flex-grow flex items-baseline gap-2 mb-2 ml-10">
                        <motion.span 
                            key={progression.exp}
                            initial={{ scale: 1.1, filter: "brightness(2)" }}
                            animate={{ scale: 1, filter: "brightness(1)" }}
                            className="text-3xl font-black italic tracking-tighter tabular-nums text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                        >
                            {progression.exp} 
                        </motion.span>
                        <span className="text-white/30 text-lg font-black italic">/</span> 
                        <span className="text-white/60 text-xl font-black italic">{progression.nextLevelExp}</span>
                        <span className="text-cyan-400 font-mono italic text-xs ml-2 tracking-[0.4em] font-black opacity-80">XP</span>
                      </div>
                  </div>

                  {/* Glass Tube Container */}
                  <div className="w-full h-10 bg-black/90 rounded-full border border-slate-700 p-1 relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
                      <div className="absolute inset-x-4 top-0.5 h-2 bg-gradient-to-b from-white/10 to-transparent rounded-full pointer-events-none z-30" />
                      
                      <motion.div 
                          initial={false}
                          animate={{ width: `${Math.min(100, Math.max(0, xpPercent))}%` }}
                          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                          className="h-full relative rounded-full overflow-hidden"
                          style={{ zIndex: 10 }}
                      >
                          {/* Energy Plasma Base - More vibrant green/emerald */}
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-400 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                          
                          {/* Plasma Waves effect */}
                          <motion.div 
                            animate={{ opacity: [0.4, 0.8, 0.4], x: [-20, 20, -20] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-energy-segments opacity-50 mix-blend-overlay"
                          />

                          {/* Pulsing Energy Core / Shine */}
                          <motion.div 
                            animate={{ x: [-1000, 1000] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 w-64 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                          />
                      </motion.div>

                      {/* Side Metal Caps - Narrower */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-slate-400 to-slate-800 rounded-l-full z-40" />
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-slate-400 to-slate-800 rounded-r-full z-40" />
                  </div>

                  {/* Saving Indicator */}
                  {playerState.isSaving && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-6 right-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,1)]" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Sincronizando Core</span>
                      </motion.div>
                  )}
              </div>

                  {/* MECHANICAL WHEEL CHART (RIGHT) */}
              <div className="relative z-20 w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-950/90 border-2 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)] rotate-45 rounded-2xl" />
                  <div className="absolute inset-2 border border-emerald-400/20 rotate-45 rounded-xl" />
                  
                  {/* Rotating Mechanical Parts */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-emerald-500/10 rounded-full border-dashed"
                  />

                  {/* SVG Wheel Indicator */}
                  <div className="relative w-20 h-20 transform flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                          {/* Inner Mechanical Track */}
                          <circle 
                            cx="50" cy="50" r="44" 
                            fill="none" 
                            stroke="rgba(6, 78, 59, 0.3)" 
                            strokeWidth="10" 
                          />
                          {/* Large Segments */}
                          <circle 
                            cx="50" cy="50" r="44" 
                            fill="none" 
                            stroke="rgba(16, 185, 129, 0.1)" 
                            strokeWidth="10" 
                            strokeDasharray="4 2"
                          />
                          {/* Progress Fill - Thick and Glowing */}
                          <motion.circle 
                            cx="50" cy="50" r="44" 
                            fill="none" 
                            stroke="url(#xp-gradient)" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0 276.46" }}
                            animate={{ strokeDasharray: `${(xpPercent * 2.7646)} 276.46` }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                          />
                          <defs>
                              <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#065f46" />
                                  <stop offset="50%" stopColor="#34d399" />
                                  <stop offset="100%" stopColor="#22d3ee" />
                              </linearGradient>
                          </defs>
                      </svg>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 overflow-hidden">
                          {progression.skillPoints > 0 && (
                            <motion.div 
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex flex-col items-center"
                            >
                              <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1 select-none">PH</span>
                              <span className="text-3xl font-black text-white italic drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] select-none">
                                {progression.skillPoints}
                              </span>
                            </motion.div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Boss Health Bar */}
      {bossSystem.currentBoss && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-3xl flex flex-col items-center gap-2">
              <span className="text-xs font-black text-red-500 uppercase tracking-[1em] drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  CRITICAL THREAT: {bossSystem.currentBoss.name}
              </span>
              <div className="w-full h-4 bg-red-950 border-2 border-red-500/50 rounded-full overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <motion.div 
                      key="boss-hp"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(bossSystem.currentBoss.hp / bossSystem.currentBoss.maxHp) * 100}%` }}
                      className="h-full bg-gradient-to-r from-red-600 to-orange-400 shadow-[0_0_20px_#ef4444]"
                  />
              </div>
          </div>
      )}
    </div>
  );
};

