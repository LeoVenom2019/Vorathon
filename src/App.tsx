/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState } from './core/GameState';
import { MainMenu } from './ui/MainMenu';
import { ForgeScreen } from './ui/ForgeScreen';
import { OptionsScreen } from './ui/OptionsScreen';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './ui/HUD';
import { PowerUpSelection } from './ui/PowerUpSelection';
import { DifficultySelection } from './ui/DifficultySelection';
import { AreaSelection } from './ui/AreaSelection';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerState, completeSession, resetSession, startNextPhase, unlockArea, setAreaStars, unlockDifficulty } from './core/Store';
import { Trophy, Target, Coins, Gem, ArrowRight } from 'lucide-react';
import { stageSystem } from './systems/stageSystem';
import { bossSystem } from './systems/bossSystem';
import { enemySystem } from './systems/enemySystem';
import { StageResults } from './ui/StageResults';
import { GameOverScreen } from './ui/GameOverScreen';
import { PauseMenu } from './ui/PauseMenu';
import areasData from './data/areas.json';
import { Difficulty } from './core/Types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MAIN_MENU);
  const playerState = usePlayerState();

  const handleFinishSummary = () => {
      completeSession();
      resetSession();
      setGameState(GameState.MAIN_MENU);
  };

  const renderContent = () => {
    switch (gameState) {
      case GameState.MAIN_MENU:
        return (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative"
          >
            <MainMenu onNavigate={setGameState} />
          </motion.div>
        );
      case GameState.GAMEPLAY:
      case GameState.PAUSED:
      case GameState.GAME_OVER:
        return (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative"
          >
            <GameCanvas setGameState={setGameState} />
            {gameState !== GameState.GAME_OVER && <HUD />}
            
            {gameState === GameState.PAUSED && (
                <PauseMenu onNavigate={setGameState} />
            )}

            {gameState === GameState.GAME_OVER && (
                <GameOverScreen onNavigate={(s) => setGameState(s as GameState)} />
            )}
          </motion.div>
        );
      case GameState.STAGE_RESULTS:
        return (
            <motion.div
                key="stage_results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
            >
                <StageResults onContinue={() => {
                   if (stageSystem.isLastStageInArea()) {
                       // Area Complete!
                       const diff = playerState.session.selectedDifficulty as Difficulty;
                       const starMap: Record<string, number> = {
                           [Difficulty.NORMAL]: 1,
                           [Difficulty.HARD]: 2,
                           [Difficulty.NIGHTMARE]: 3,
                           [Difficulty.APOCALYPSE]: 4,
                           [Difficulty.INFERNO]: 5,
                           [Difficulty.CHAOS]: 6
                       };
                       
                       setAreaStars(playerState.session.selectedArea, starMap[diff] || 1);
                       
                       // Unlock next difficulty if this was the last area
                       if (playerState.session.selectedArea === 'area_5') {
                           const difficulties: Difficulty[] = [
                               Difficulty.NORMAL, Difficulty.HARD, Difficulty.NIGHTMARE, 
                               Difficulty.APOCALYPSE, Difficulty.INFERNO, Difficulty.CHAOS
                           ];
                           const currentIdx = difficulties.indexOf(diff);
                           if (currentIdx !== -1 && currentIdx < difficulties.length - 1) {
                               unlockDifficulty(difficulties[currentIdx + 1]);
                           }
                       }

                       // Unlock next area
                       const currentAreaIdx = areasData.areas.findIndex((a: any) => a.id === playerState.session.selectedArea);
                       if (currentAreaIdx !== -1 && currentAreaIdx < areasData.areas.length - 1) {
                           unlockArea(areasData.areas[currentAreaIdx + 1].id);
                       }
                       
                       setGameState(GameState.STAGE_END);
                   } else {
                       startNextPhase();
                       stageSystem.nextStage();
                       bossSystem.reset();
                       enemySystem.reset();
                       setGameState(GameState.GAMEPLAY);
                   }
                }} />
            </motion.div>
        );
      case GameState.STAGE_END:
        return (
          <motion.div 
            key="stage_end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-10 text-white font-sans overflow-hidden"
          >
            <div className="relative mb-12">
                <motion.div 
                    initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="relative z-10"
                >
                    <Trophy size={120} className="text-yellow-500 drop-shadow-[0_0_50px_rgba(234,179,8,0.5)]" />
                </motion.div>
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                    className="absolute inset-0 bg-yellow-500/10 blur-[100px] rounded-full"
                />
            </div>

            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-7xl font-black italic text-white mb-2 tracking-tighter"
            >
                MISSÃO CONCLUÍDA
            </motion.h1>
            <p className="text-slate-400 font-mono mb-12 uppercase tracking-[0.3em] text-xs">
                Relatório de Combate Primordial // {new Date().toLocaleDateString()}
            </p>

            <div className="grid grid-cols-3 gap-6 w-full max-w-4xl mb-12">
                <SummaryCard 
                    icon={<Target className="text-blue-400" />} 
                    label="PONTUAÇÃO" 
                    value={playerState.session.score.toLocaleString()} 
                    sub={`${playerState.session.kills} Inimigos abatidos`}
                />
                <SummaryCard 
                    icon={<Coins className="text-yellow-400" />} 
                    label="MOEDAS" 
                    value={`+${playerState.session.goldGained.toLocaleString()}`} 
                    sub="Recompensa de batalha"
                />
                <SummaryCard 
                    icon={<Gem className="text-blue-300" />} 
                    label="FRAGMENTOS" 
                    value={`+${playerState.session.shardsGained}`} 
                    sub={`${playerState.session.bossesKilled} Bosses derrotados`}
                />
            </div>

            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-12 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                    <span>ELITES: {playerState.session.elitesKilled}</span>
                    <span>BÔNUS DE VITÓRIA: +10%</span>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFinishSummary}
                    className="group flex items-center gap-3 px-16 py-5 bg-white text-black font-black rounded-full transition-all uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                    RETORNAR AO COMANDO <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
          </motion.div>
        );
      case GameState.FORGE:
        return (
          <motion.div 
            key="forge"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full h-full"
          >
            <ForgeScreen onBack={() => setGameState(GameState.MAIN_MENU)} />
          </motion.div>
        );
      case GameState.OPTIONS:
        return (
          <motion.div 
            key="options"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full"
          >
            <OptionsScreen onBack={() => setGameState(GameState.MAIN_MENU)} />
          </motion.div>
        );
      case GameState.POWERUP_SELECTION:
        return (
          <motion.div 
            key="powerup_selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <PowerUpSelection onSelect={() => setGameState(GameState.DIFFICULTY_SELECTION)} />
          </motion.div>
        );
      case GameState.DIFFICULTY_SELECTION:
        return (
            <motion.div 
                key="difficulty_selection"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="w-full h-full"
            >
                <DifficultySelection 
                    onSelect={() => setGameState(GameState.AREA_SELECTION)} 
                    onBack={() => setGameState(GameState.POWERUP_SELECTION)}
                />
            </motion.div>
        );
      case GameState.AREA_SELECTION:
        return (
            <motion.div 
                key="area_selection"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="w-full h-full"
            >
            <AreaSelection 
                onSelect={() => {
                    stageSystem.reset();
                    bossSystem.reset();
                    enemySystem.reset();
                    setGameState(GameState.GAMEPLAY);
                }} 
                onBack={() => setGameState(GameState.DIFFICULTY_SELECTION)}
            />
            </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}

const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string; sub: string }> = ({ icon, label, value, sub }) => (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl flex flex-col items-center gap-4 text-center group hover:border-white/20 transition-all">
        <div className="p-4 bg-slate-950 rounded-2xl group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-4xl font-black italic tracking-tighter">{value}</span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono italic">{sub}</span>
    </div>
);
