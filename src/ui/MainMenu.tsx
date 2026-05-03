import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../core/GameState';
import { usePlayerState, setGameMode, resetSession, updatePlayerName } from '../core/Store';
import { Zap, Shield, Play, Sword, ShieldAlert, Rocket, Truck, ChevronRight, Sparkles, Trophy, User, X, BrainCircuit, Flame, Snowflake, CloudLightning } from 'lucide-react';
import { modeSystem } from '../systems/modeSystem';
import { stageSystem } from '../systems/stageSystem';
import { bossSystem } from '../systems/bossSystem';
import { enemySystem } from '../systems/enemySystem';
import { GameModeType } from '../core/Types';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';
import { SkillTree } from './SkillTree';
import { RankingsView } from './RankingsView';

type MenuTheme = 'DEFAULT' | 'FIRE' | 'ICE' | 'LIGHTNING';

interface MainMenuProps {
  onNavigate: (state: GameState) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  const [showRanking, setShowRanking] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const playerState = usePlayerState();
  const [tempName, setTempName] = useState(playerState.session.playerName || '');
  const [selectedMode, setSelectedMode] = useState<GameModeType | null>(null);
  
  // Random Theme Selection on Mount
  const [theme] = useState<MenuTheme>(() => {
    const themes: MenuTheme[] = ['DEFAULT', 'FIRE', 'ICE', 'LIGHTNING'];
    return themes[Math.floor(Math.random() * themes.length)];
  });

  const { equippedRunes, equippedRelics, equippedChaosOrbs, inventory, rankings } = playerState;
  const allRunes = (runesData as any).runes;
  const allRelics = (relicsData as any).relics;
  const chaosOrbs = inventory.chaosOrbs || [];
  const modes = modeSystem.getConfigs();

  const themeConfig = (() => {
    switch (theme) {
      case 'FIRE':
        return {
          bg: 'bg-[radial-gradient(circle_at_center,rgba(69,10,10,1)_0%,rgba(2,6,23,1)_100%)]',
          accent: 'orange-500', 
          particleColor: 'bg-orange-500',
          particleBlur: 'blur-[1px]',
          glow: 'logo-vignette-fire',
          title: 'from-orange-300 via-red-500 to-red-800'
        };
      case 'ICE':
        return {
          bg: 'bg-[radial-gradient(circle_at_center,rgba(8,47,73,1)_0%,rgba(2,6,23,1)_100%)]',
          accent: 'cyan-400',
          particleColor: 'bg-cyan-200',
          particleBlur: 'blur-[2px]',
          glow: 'logo-vignette-ice',
          title: 'from-cyan-100 via-cyan-400 to-blue-600'
        };
      case 'LIGHTNING':
        return {
          bg: 'bg-[radial-gradient(circle_at_center,rgba(49,46,129,1)_0%,rgba(2,6,23,1)_100%)]',
          accent: 'indigo-400',
          particleColor: 'bg-white',
          particleBlur: 'blur-none',
          glow: 'logo-vignette-lightning',
          title: 'from-indigo-100 via-indigo-500 to-purple-800'
        };
      default:
        return {
          bg: 'bg-[radial-gradient(circle_at_center,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]',
          accent: 'blue-500',
          particleColor: 'bg-blue-400',
          particleBlur: 'blur-0',
          glow: 'logo-vignette',
          title: 'from-blue-300 via-blue-500 to-blue-700'
        };
    }
  })();

  const handleStartMode = (type: GameModeType) => {
    setSelectedMode(type);
    setShowNameInput(true);
  };

  const confirmStart = () => {
    if (!selectedMode) return;
    updatePlayerName(tempName);
    resetSession();
    modeSystem.setMode(selectedMode);
    setGameMode(selectedMode);
    onNavigate(GameState.POWERUP_SELECTION);
  };

  return (
    <div className={`relative flex h-full ${themeConfig.bg} text-white font-sans overflow-hidden`}>
      {/* Theme Specific Overlays */}
      {theme === 'FIRE' && (
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/fire.png')] opacity-10 mix-blend-overlay pointer-events-none" />
      )}
      {theme === 'ICE' && (
        <div className="absolute inset-0 z-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_0%,transparent_100%)] pointer-events-none" />
      )}
      
      {/* 2. Perspective Grid */}
      <div className={`absolute inset-x-0 bottom-0 h-1/2 perspective-grid z-0 opacity-40 ${theme === 'FIRE' ? 'sepia-[0.5] hue-rotate-[-30deg]' : theme === 'ICE' ? 'hue-rotate-[180deg]' : theme === 'LIGHTNING' ? 'hue-rotate-[240deg]' : ''}`}>
        <div className="grid-plane" />
      </div>

      {/* 3. Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(theme === 'DEFAULT' ? 30 : 60)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute bottom-[-20px] w-1 h-1 ${themeConfig.particleColor}/40 rounded-full ${themeConfig.particleBlur}`}
            animate={{
              y: [-20, -1000],
              x: (Math.random() - 0.5) * 100,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}

        {theme === 'FIRE' && (
          [...Array(15)].map((_, i) => (
            <motion.div
              key={`ember-${i}`}
              className="absolute w-2 h-2 bg-orange-600 rounded-full blur-[2px]"
              animate={{
                y: [800, -100],
                x: [0, (Math.random() - 0.5) * 200],
                opacity: [0, 0.8, 0],
                scale: [1, 1.5, 0.5]
              }}
              transition={{
                duration: 3 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut"
              }}
              style={{ left: `${Math.random() * 100}%`, bottom: '-50px' }}
            />
          ))
        )}

        {theme === 'FIRE' && (
          [...Array(5)].map((_, i) => (
            <motion.div
              key={`lava-${i}`}
              className="absolute w-8 h-8 md:w-12 md:h-12 bg-red-600 rounded-full blur-[10px]"
              animate={{
                y: [-100, 1000],
                x: [0, (Math.random() - 0.5) * 400],
                opacity: [0, 0.4, 0],
                scale: [0.5, 1.5, 2]
              }}
              transition={{
                duration: 8 + Math.random() * 12,
                repeat: Infinity,
                delay: Math.random() * 10,
              }}
              style={{ left: `${Math.random() * 100}%`, top: '-50px' }}
            />
          ))
        )}

        {theme === 'ICE' && (
          [...Array(20)].map((_, i) => (
            <motion.div
              key={`ice-${i}`}
              className="absolute w-4 h-4 bg-white/20 border border-white/30 backdrop-blur-[2px]"
              animate={{
                y: [-100, 1000],
                rotate: [0, 360],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 10 + Math.random() * 15,
                repeat: Infinity,
                delay: Math.random() * 15,
                ease: "linear"
              }}
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: '-50px',
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
              }}
            />
          ))
        )}

        {theme === 'LIGHTNING' && (
            <LightningFlashes />
        )}
      </div>

      {/* 4. Center Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${themeConfig.glow} blur-[100px] opacity-40 pointer-events-none`} />

      {/* --- CONTENT --- */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 z-10">
        
        {/* HUD Frame Decorative Borders */}
        <div className={`absolute inset-16 border border-${themeConfig.accent}/10 pointer-events-none rounded-[40px] shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]`} />
        <div className={`absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-${themeConfig.accent}/40 rounded-tl-3xl opacity-60`} />
        <div className={`absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-${themeConfig.accent}/40 rounded-tr-3xl opacity-60`} />
        <div className={`absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-${themeConfig.accent}/40 rounded-bl-3xl opacity-60`} />
        <div className={`absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-${themeConfig.accent}/40 rounded-br-3xl opacity-60`} />

        <AnimatePresence mode="wait">
          <motion.div 
            key="main"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Central Ship Decoration (Ambient) */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`mb-8 p-6 bg-${themeConfig.accent}/5 rounded-full border border-${themeConfig.accent}/10 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.2)] group`}
            >
              {theme === 'FIRE' ? (
                <Flame size={48} className="text-orange-500/60 group-hover:text-orange-400 Transition-colors drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
              ) : theme === 'ICE' ? (
                <Snowflake size={48} className="text-cyan-300/60 group-hover:text-cyan-200 transition-colors drop-shadow-[0_0_20px_rgba(103,232,249,0.5)]" />
              ) : theme === 'LIGHTNING' ? (
                <CloudLightning size={48} className="text-indigo-400/60 group-hover:text-indigo-300 transition-colors drop-shadow-[0_0_20px_rgba(129,140,248,0.5)]" />
              ) : (
                <Rocket size={48} className="text-blue-500/30 group-hover:text-blue-400/60 transition-colors drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              )}
            </motion.div>

            <div className="relative">
              <h1 className={`text-8xl md:text-9xl font-black mb-16 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${themeConfig.title} italic animate-[logo-glow_4s_easeInOut_infinite] pr-4`}>
                VORATHON
              </h1>
              {/* Horizontal Light Bar behind logo */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-1 ${theme === 'FIRE' ? 'bg-orange-500' : theme === 'ICE' ? 'bg-cyan-300' : theme === 'LIGHTNING' ? 'bg-indigo-400' : 'bg-blue-400'} blur-sm opacity-60 shadow-[0_0_30px_rgba(0,0,0,0.5)]`} />
            </div>

            <div className="flex flex-col gap-6 w-80 z-20">
              <MenuButton 
                label="JOGAR" 
                icon={<Play size={22} className="fill-current" />} 
                onClick={() => handleStartMode(GameModeType.COSMIC_ASCENSION)} 
                primary 
                theme={theme}
              />
              <MenuButton 
                label="RANKING" 
                icon={<Trophy size={20} />} 
                onClick={() => setShowRanking(true)} 
                theme={theme}
              />
              <MenuButton 
                label="HABILIDADES" 
                icon={<BrainCircuit size={20} />} 
                onClick={() => setShowSkillTree(true)} 
                theme={theme}
              />
              <MenuButton 
                label="FORJA CELESTIAL" 
                icon={<Sword size={20} />} 
                onClick={() => onNavigate(GameState.FORGE)} 
                theme={theme}
              />
              <MenuButton 
                label="OPÇÕES" 
                icon={<ChevronRight size={20} />} 
                onClick={() => onNavigate(GameState.OPTIONS)} 
                theme={theme}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* --- NAME INPUT MODAL --- */}
        <AnimatePresence>
          {showNameInput && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-slate-900 border border-blue-500/30 rounded-3xl p-10 w-full max-w-md shadow-[0_0_100px_rgba(59,130,246,0.1)]"
              >
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
                    <User size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter text-blue-100">IDENTIFICAÇÃO DO PILOTO</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Insira seu codinome para registro na rede VORATHON e sincronização de rankings.
                  </p>
                  
                  <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value.toUpperCase().slice(0, 15))}
                    placeholder="PILOTO"
                    className="w-full bg-black/40 border border-blue-500/30 rounded-xl py-4 px-6 text-center text-2xl font-black italic tracking-[0.2em] focus:border-blue-500 focus:outline-none transition-all placeholder:opacity-20"
                    autoFocus
                  />

                  <div className="flex gap-4 w-full mt-4">
                    <button 
                      onClick={() => setShowNameInput(false)}
                      className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                      CANCELAR
                    </button>
                    <button 
                      onClick={confirmStart}
                      className="flex-[2] py-4 bg-blue-600 text-white font-black italic rounded-xl hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                    >
                      INICIAR OPERAÇÃO
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- RANKING MODAL --- */}
        <AnimatePresence>
          {showRanking && (
            <RankingsView onClose={() => setShowRanking(false)} />
          )}

          {showSkillTree && (
            <SkillTree onClose={() => setShowSkillTree(false)} />
          )}
        </AnimatePresence>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-slate-600 font-mono text-[10px] uppercase tracking-[0.5em] opacity-30 select-none">
          V0.2.0-BETA // MULTI-MODE CORE SYSTEM
        </div>
      </div>

      {/* --- SIDEBAR INFO (EQUIPMENT) --- */}
      <div className="relative w-[340px] h-full bg-black/40 backdrop-blur-2xl border-l border-white/5 p-10 flex flex-col items-center justify-center gap-14 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-emerald-500/5 opacity-50" />
          
          <div className="flex flex-col items-center gap-6 relative z-10 w-full">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent to-blue-500/30" />
                <h3 className="text-[10px] font-black italic text-blue-400 uppercase tracking-[0.3em] whitespace-nowrap">Rune Matrix</h3>
                <div className="flex-grow h-[1px] bg-gradient-to-l from-transparent to-blue-500/30" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                  {equippedRunes.map((id: any, i: number) => {
                      const rune = id ? allRunes.find((r: any) => r.id === id) : null;
                      return (
                          <div key={i} className={`group relative w-20 h-20 rounded-2xl bg-black/40 border-2 ${rune ? 'border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.2)]' : 'border-white/5'} flex items-center justify-center transition-all hover:scale-105`}>
                              <div className="absolute inset-2 border border-white/5 rounded-xl" />
                              {rune ? <span className="text-3xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{rune.icon}</span> : <Zap size={22} className="text-slate-900 group-hover:text-blue-900/20 transition-colors" />}
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="flex flex-col items-center gap-6 relative z-10 w-full">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent to-emerald-500/30" />
                <h3 className="text-[10px] font-black italic text-emerald-400 uppercase tracking-[0.3em] whitespace-nowrap">Relic Cache</h3>
                <div className="flex-grow h-[1px] bg-gradient-to-l from-transparent to-emerald-500/30" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                  {equippedRelics.map((id: any, i: number) => {
                      const relic = id ? allRelics.find((r: any) => r.id === id) : null;
                      return (
                          <div key={i} className={`group relative w-20 h-20 rounded-2xl bg-black/40 border-2 ${relic ? 'border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]' : 'border-white/5'} flex items-center justify-center transition-all hover:scale-105`}>
                              <div className="absolute inset-2 border border-white/5 rounded-xl" />
                              {relic ? <span className="text-3xl drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{relic.icon}</span> : <Shield size={22} className="text-slate-900 group-hover:text-emerald-900/20 transition-colors" />}
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="flex flex-col items-center gap-6 relative z-10 w-full mt-4">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent to-purple-500/30" />
                <h3 className="text-[10px] font-black italic text-purple-400 uppercase tracking-[0.3em] whitespace-nowrap">Chaos Orbs</h3>
                <div className="flex-grow h-[1px] bg-gradient-to-l from-transparent to-purple-500/30" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                  {equippedChaosOrbs.map((id: any, i: number) => {
                      const orb = id ? chaosOrbs.find((o: any) => o.id === id) : null;
                      return (
                          <div key={i} className={`group relative w-20 h-20 rounded-2xl bg-black/40 border-2 ${orb ? 'border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.2)]' : 'border-white/5'} flex items-center justify-center transition-all hover:scale-105`}>
                              <div className="absolute inset-2 border border-white/5 rounded-xl" />
                              {orb ? <span className="text-3xl drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse">{orb.icon || '✨'}</span> : <Sparkles size={22} className="text-slate-900 group-hover:text-purple-900/20 transition-colors" />}
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ label: string; onClick: () => void; primary?: boolean; icon?: React.ReactNode; theme?: MenuTheme }> = ({ label, onClick, primary, icon, theme }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 200);
    onClick();
  };

  const getThemeButtonStyles = () => {
    switch (theme) {
      case 'FIRE':
        return primary 
          ? 'bg-orange-600/90 text-white border border-orange-400/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
          : 'bg-slate-950/80 text-orange-100/80 border border-orange-900/50 hover:border-orange-500/50';
      case 'ICE':
        return primary 
          ? 'bg-cyan-600/90 text-white border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
          : 'bg-slate-950/80 text-cyan-100/80 border border-cyan-900/50 hover:border-cyan-500/50';
      case 'LIGHTNING':
        return primary 
          ? 'bg-indigo-600/90 text-white border border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
          : 'bg-slate-950/80 text-indigo-100/80 border border-indigo-900/50 hover:border-indigo-500/50';
      default:
        return primary 
          ? 'bg-blue-600/90 text-white border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
          : 'bg-slate-950/80 text-blue-100/80 border border-blue-900/50 hover:border-blue-500/50';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,0,0,0.3)" }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className={`relative py-5 px-8 text-lg font-black rounded-lg transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] italic overflow-hidden sci-fi-button ${getThemeButtonStyles()}`}
    >
      {/* Click Flash */}
      <AnimatePresence>
        {clicked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/20 z-10"
          />
        )}
      </AnimatePresence>

      {/* Inner decorative light line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[energy-flow_2s_linear_infinite]" />
      
      <span>{icon}</span>
      {label}
    </motion.button>
  );
};

const LightningFlashes: React.FC = () => {
    const [lastFlash, setLastFlash] = useState(0);
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.95 && Date.now() - lastFlash > 1000) {
                setShowFlash(true);
                setLastFlash(Date.now());
                setTimeout(() => setShowFlash(false), 50 + Math.random() * 150);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [lastFlash]);

    return (
        <AnimatePresence>
            {showFlash && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.2, 0.1, 0.3, 0] }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-[1] pointer-events-none"
                />
            )}
        </AnimatePresence>
    );
};
