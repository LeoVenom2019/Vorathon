import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayerState, setPaused, resetSession } from '../core/Store';
import { GameState } from '../core/GameState';
import { 
  Zap, Shield, BrainCircuit, Rocket, Flame, Snowflake, CloudLightning, 
  Target, Activity, TrendingUp, Cpu, Orbit, X, LogOut, ChevronLeft,
  ChevronRight, CircleDashed, Atom, Sparkles
} from 'lucide-react';
import runesData from '../data/runes.json';
import relicsData from '../data/relics.json';
import { effectSystem } from '../systems/effectSystem';
import { PowerUpClass } from '../core/Types';

interface PauseMenuProps {
  onNavigate: (state: GameState) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onNavigate }) => {
  const [view, setView] = useState<'MAIN' | 'STATUS'>('MAIN');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ type: string; data: any; title: string; color: string } | null>(null);
  const playerState = usePlayerState();
  const mods = effectSystem.getModifiers();

  const handleResume = () => {
    setPaused(false);
    onNavigate(GameState.GAMEPLAY);
    // playSFX('/sounds/ui_click.mp3');
  };

  const handleExit = () => {
    resetSession();
    setPaused(false);
    onNavigate(GameState.MAIN_MENU);
  };

  const handleBack = () => {
      setView('MAIN');
  };

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 pointer-events-auto">
      {/* Dark Blur Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <AnimatePresence mode="wait">
        {view === 'MAIN' && !showExitConfirm && (
          <motion.div 
            key="pause-main"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-slate-900 border border-slate-700 p-10 rounded-3xl flex flex-col items-center gap-8 shadow-2xl w-full max-w-xs"
          >
            <h2 className="text-5xl font-black italic text-white tracking-tighter animate-pulse">PAUSA</h2>
            
            <div className="flex flex-col gap-4 w-full">
              <PauseButton 
                label="CONTINUAR" 
                primary 
                onClick={handleResume} 
                icon={<Rocket size={20} className="fill-current" />}
              />
              <PauseButton 
                label="STATUS" 
                onClick={() => setView('STATUS')} 
                icon={<Activity size={20} />}
              />
              <PauseButton 
                label="MENU PRINCIPAL" 
                onClick={() => setShowExitConfirm(true)} 
                icon={<LogOut size={18} />}
              />
            </div>
          </motion.div>
        )}

        {view === 'STATUS' && (
          <StatusPanel 
            playerState={playerState} 
            mods={mods} 
            onBack={handleBack}
            activeTooltip={activeTooltip}
            setActiveTooltip={setActiveTooltip}
          />
        )}

        {showExitConfirm && (
            <motion.div 
                key="confirm-exit"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-slate-900 border border-red-500/30 p-10 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm text-center"
            >
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                    <LogOut size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">Deseja sair?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                   O progresso da run atual será perdido. Todas as Rune Matrices e Relíquias coletadas nesta run serão eliminadas.
                </p>
                
                <div className="flex gap-4 w-full mt-4">
                    <button 
                        onClick={() => setShowExitConfirm(false)}
                        className="flex-1 py-4 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]"
                    >
                        CANCELAR
                    </button>
                    <button 
                        onClick={handleExit}
                        className="flex-1 py-4 bg-red-600 text-white font-black italic rounded-xl hover:bg-red-500 transition-all shadow-lg active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                        CONFIRMAR SAÍDA
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PauseButton: React.FC<{ label: string; onClick: () => void; primary?: boolean; icon: React.ReactNode }> = ({ label, onClick, primary, icon }) => (
  <motion.button
    whileHover={{ scale: 1.05, x: 5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`w-full py-4 px-6 flex items-center justify-center gap-4 font-black italic rounded-xl transition-all border uppercase tracking-[0.15em] text-sm ${
      primary 
        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
    }`}
  >
    {icon}
    {label}
  </motion.button>
);

const StatusPanel: React.FC<{ 
  playerState: any; 
  mods: any; 
  onBack: () => void;
  activeTooltip: any;
  setActiveTooltip: (val: any) => void;
}> = ({ playerState, mods, onBack, activeTooltip, setActiveTooltip }) => {
  const { equippedRunes, equippedRelics, equippedChaosOrbs, inventory, activePowerUp, skillTree } = playerState;
  const allRunes = (runesData as any).runes;
  const allRelics = (relicsData as any).relics;
  const chaosOrbs = inventory.chaosOrbs || [];

  const getPathInfo = () => {
    switch (activePowerUp.class) {
      case PowerUpClass.FIRE: return { name: 'CAMINHO ÍGNEO', color: 'text-orange-500', icon: <Flame />, desc: '+30% Dano de Fogo, Sinergia com Supernova Primordial', synergy: 'Aumenta o raio da Supernova e o dano de queima por segundo.' };
      case PowerUpClass.ICE: return { name: 'CAMINHO GLACIAL', color: 'text-cyan-400', icon: <Snowflake />, desc: 'Congelamento em área, Sinergia com Zero Absoluto', synergy: 'Inimigos congelados emitem estilhaços ao serem destruídos.' };
      case PowerUpClass.ELECTRIC: return { name: 'CAMINHO VOLTAICO', color: 'text-yellow-400', icon: <CloudLightning />, desc: 'Danos em cadeia, Sinergia com Sobrecarga Celestial', synergy: 'Raios agora saltam para 2 alvos adicionais.' };
      case PowerUpClass.PLASMA: return { name: 'CAMINHO PLASMÁTICO', color: 'text-purple-400', icon: <Atom />, desc: 'Penetração Máxima, Sinergia com Buraco Negro', synergy: 'O Buraco Negro dura 50% mais e causa dano contínuo.' };
      default: return { name: 'CAMINHO NEUTRO', color: 'text-slate-400', icon: <CircleDashed />, desc: 'Nenhum caminho elemental selecionado', synergy: 'Nenhuma sinergia ativa.' };
    }
  };

  const pathInfo = getPathInfo();

  const handleItemClick = (type: string, data: any, title: string, color: string) => {
    if (!data) return;
    if (activeTooltip && activeTooltip.data?.id === data.id && activeTooltip.type === type) {
        setActiveTooltip(null);
    } else {
        setActiveTooltip({ type, data, title, color });
    }
  };

  const closeTooltip = () => setActiveTooltip(null);

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      onClick={closeTooltip}
      className="relative bg-slate-950/90 border border-slate-800 backdrop-blur-xl p-8 rounded-[40px] w-full max-w-5xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col gap-8 overflow-hidden"
    >
      {/* Tooltip Overlay Layer */}
      <AnimatePresence>
        {activeTooltip && (
            <DetailsTooltip 
                {...activeTooltip} 
                onClose={closeTooltip} 
            />
        )}
      </AnimatePresence>
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-blue-500/20 rounded-tl-[40px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-blue-500/20 rounded-br-[40px] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Activity size={28} className="text-blue-500" />
            </div>
            <div>
                <h2 className="text-3xl font-black italic text-white tracking-widest uppercase">Relatório de Status</h2>
                <p className="text-[10px] font-mono text-slate-500 tracking-[0.3em] uppercase">Sincronização Neural // Ativa</p>
            </div>
        </div>
        <button 
           onClick={onBack}
           className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 hover:bg-slate-800 hover:border-slate-700 transition-all group"
        >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">VOLTAR</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Equipment */}
          <div className="col-span-8 flex flex-col gap-6">
              {/* RUNES & RELICS */}
              <div className="grid grid-cols-2 gap-6">
                  <Section title="RUNE MATRIX" icon={<Zap className="text-blue-400" size={14} />}>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                          {equippedRunes.map((id: any, i: number) => {
                              const rune = id ? allRunes.find((r: any) => r.id === id) : null;
                              return (
                                <StatusItemCard 
                                    key={`rune-${i}`} 
                                    item={rune} 
                                    type="Runa" 
                                    color="blue" 
                                    onClick={(e) => { e.stopPropagation(); handleItemClick('Runa', rune, rune?.name, 'blue'); }}
                                />
                              );
                          })}
                      </div>
                  </Section>

                  <Section title="RELIC CACHE" icon={<Shield className="text-emerald-400" size={14} />}>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {equippedRelics.map((id: any, i: number) => {
                            const relic = id ? allRelics.find((r: any) => r.id === id) : null;
                            return (
                                <StatusItemCard 
                                    key={`relic-${i}`} 
                                    item={relic} 
                                    type="Relíquia" 
                                    color="emerald" 
                                    onClick={(e) => { e.stopPropagation(); handleItemClick('Relíquia', relic, relic?.name, 'emerald'); }}
                                />
                            );
                        })}
                    </div>
                  </Section>
              </div>

              {/* CHAOS ORBS */}
              <Section title="ORBES DO CAOS" icon={<Sparkles className="text-purple-400" size={14} />}>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {equippedChaosOrbs.map((id: any, i: number) => {
                        const orb = id ? chaosOrbs.find((o: any) => o.id === id) : null;
                        return (
                            <StatusItemCard 
                                key={`orb-${i}`} 
                                item={orb} 
                                type="Orbe" 
                                color="purple" 
                                isChaos 
                                onClick={(e) => { e.stopPropagation(); handleItemClick('Orbe', orb, orb?.name, 'purple'); }}
                            />
                        );
                    })}
                </div>
              </Section>

              {/* ACTIVE PATH */}
              <div 
                className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:bg-slate-900/60 transition-all"
                onClick={(e) => { e.stopPropagation(); handleItemClick('Caminho', { ...pathInfo, level: activePowerUp.level }, pathInfo.name, activePowerUp.class.toLowerCase()); }}
              >
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 pointer-events-none rounded-full ${pathInfo.color.replace('text', 'bg')}`} />
                  <div className="flex items-center gap-6">
                      <div className={`p-5 rounded-2xl border-2 border-slate-800 bg-black/40 text-2xl ${pathInfo.color} shadow-lg`}>
                          {pathInfo.icon}
                      </div>
                      <div className="flex-grow">
                          <div className="flex justify-between items-end mb-1">
                              <h4 className={`text-xl font-black italic tracking-wider ${pathInfo.color}`}>{pathInfo.name}</h4>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Nível {activePowerUp.level}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed italic">{pathInfo.desc}</p>
                          {/* Progress bar level */}
                          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${pathInfo.color.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${(activePowerUp.level / 4) * 100}%` }} />
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Column: Stats & Companions */}
          <div className="col-span-4 flex flex-col gap-6">
              {/* STATS */}
              <Section title="ATRIBUTOS" icon={<TrendingUp className="text-white" size={14} />}>
                  <div className="flex flex-col gap-3 mt-4">
                      <AttributeRow label="Dano Total" value={Math.floor((playerState.stats.damage + mods.bonusDamage) * mods.damageMult)} icon={<Target size={14} />} />
                      <AttributeRow label="Chance Crítica" value={`${Math.floor(playerState.stats.critChance + mods.critChanceAdd)}%`} icon={<Zap size={14} />} />
                      <AttributeRow label="Dano Crítico" value={`${(playerState.stats.critDamage * mods.critDamageMult).toFixed(1)}x`} icon={<TrendingUp size={14} />} />
                      <AttributeRow label="Vida Máxima" value={Math.floor(playerState.stats.maxHp)} icon={<Activity size={14} />} />
                      <AttributeRow label="Energia Máxima" value={Math.floor(playerState.stats.maxEnergy)} icon={<Zap size={14} />} />
                  </div>
              </Section>

              {/* COMPANIONS */}
              <Section title="COMPANIONS" icon={<Orbit className="text-white" size={14} />}>
                  <div className="flex flex-col gap-4 mt-4">
                      <CompanionRow label="Summoner Bot" level={skillTree.companions.summoner} color="blue" />
                      <CompanionRow label="Shooter Bot" level={skillTree.companions.shooter} color="orange" />
                      <CompanionRow label="Supporter Bot" level={skillTree.companions.supporter} color="emerald" />
                  </div>
              </Section>
          </div>
      </div>
    </motion.div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1 px-1">
            {icon}
            <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-[0.2em]">{title}</span>
        </div>
        {children}
    </div>
);

const CompanionRow: React.FC<{ label: string; level: number; color: string }> = ({ label, level, color }) => (
    <div className="flex items-center gap-4 bg-slate-900/30 p-3 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-all">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 group-hover:scale-110 transition-transform`}>
            <Cpu size={20} className={`text-${color}-500`} />
        </div>
        <div className="flex-grow">
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">{label}</span>
                <span className={`text-[10px] font-black italic px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>LVL {level}</span>
            </div>
            {/* Dots representation of level */}
            <div className="flex gap-1 mt-1.5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-1 flex-grow rounded-full ${i < level ? `bg-${color}-500 animate-pulse` : 'bg-slate-800'}`} />
                ))}
            </div>
        </div>
    </div>
);

const AttributeRow: React.FC<{ label: string; value: any; suffix?: string; icon: React.ReactNode }> = ({ label, value, suffix, icon }) => (
    <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
       <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-400 transition-colors">
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <div className="flex items-baseline gap-1">
            <span className="text-lg font-black italic text-white">{value}</span>
            {suffix && <span className="text-[8px] font-mono text-slate-600 uppercase">{suffix}</span>}
       </div>
    </div>
);

const StatusItemCard: React.FC<{ item: any; type: string; color: string; isChaos?: boolean; onClick?: (e: React.MouseEvent) => void }> = ({ item, type, color, isChaos, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative p-4 rounded-2xl bg-slate-900/40 border-2 transition-all flex flex-col gap-2 min-h-[100px] hover:scale-[1.02] ${
        onClick ? 'cursor-pointer' : ''
    } ${
        item ? `border-${color}-500/30 shadow-[0_0_20px_rgba(0,0,0,0.2)]` : 'border-slate-850 opacity-40'
    }`}>
        {item ? (
            <>
                <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black italic ${isChaos ? 'text-purple-400' : `text-${color}-400`} uppercase leading-none`}>{item.name}</span>
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">IDENTIFIED // {type} {item.rarity ? `(${item.rarity})` : ''}</span>
                    </div>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight italic whitespace-pre-line">
                    {item.description}
                </p>
                {isChaos && item.bonuses && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {item.bonuses.map((b: string, i: number) => (
                            <span key={i} className="text-[7px] bg-purple-500/10 text-purple-400 px-1 py-0.5 rounded border border-purple-500/20 uppercase font-mono">{b}</span>
                        ))}
                    </div>
                )}
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-20">
                <CircleDashed size={14} className="animate-spin" />
                <span className="text-[9px] font-mono uppercase tracking-widest">Vazio</span>
            </div>
        )}
    </div>
);

const DetailsTooltip: React.FC<{ 
  type: string; 
  data: any; 
  title: string; 
  color: string; 
  onClose: () => void 
}> = ({ type, data, title, color, onClose }) => {
  if (!data) return null;

  const getOrbRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'MYTHIC': return 'yellow';
      case 'EPIC': return 'purple';
      default: return 'slate';
    }
  };

  const colorMap: { [key: string]: string } = {
      blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/40 text-blue-400',
      emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/40 text-emerald-400',
      purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/40 text-purple-400',
      orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/40 text-orange-400',
      cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/40 text-cyan-400',
      yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/40 text-yellow-400',
      slate: 'from-slate-500/20 to-slate-600/5 border-slate-500/40 text-slate-400',
      fire: 'from-orange-500/20 to-orange-600/5 border-orange-500/40 text-orange-400',
      ice: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/40 text-cyan-400',
      electric: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/40 text-yellow-400',
      plasma: 'from-purple-500/20 to-purple-600/5 border-purple-500/40 text-purple-400'
  };

  const finalColor = type === 'Orbe' ? getOrbRarityColor(data.rarity) : color;
  const styleClass = colorMap[finalColor] || colorMap.slate;

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`absolute right-8 top-1/2 -translate-y-1/2 w-96 z-[10] bg-gradient-to-br ${styleClass.split(' ').slice(0,2).join(' ')} backdrop-blur-2xl border-2 ${styleClass.split(' ')[2]} p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 overflow-hidden shadow-black/80`}
    >
        {/* Glow header */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${styleClass.split(' ').slice(0,1).join(' ').replace('from-', 'bg-')}`} />

        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <span className="text-3xl">{data.icon || '✨'}</span>
                <div>
                   <h3 className={`font-black italic text-xl uppercase leading-none ${styleClass.split(' ')[3]}`}>{title}</h3>
                   <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{type} {data.rarity ? `(${data.rarity})` : ''} // IDENTIFIED</span>
                </div>
            </div>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </div>

        <div className="h-px bg-slate-800/50 w-full" />

        <div className="flex flex-col gap-4">
            <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Descrição</span>
                <p className="text-xs text-slate-300 leading-relaxed italic whitespace-pre-line border-l-2 border-white/5 pl-3 py-1 bg-white/5 rounded-r-lg">
                    {data.description || data.desc}
                </p>
            </div>

            {type === 'Orbe' && (data.sourceRune || data.sourceRelic) && (
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase text-purple-400 block mb-2">Composição de Fusão</span>
                    <div className="flex flex-col gap-3">
                        {data.sourceRelic && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Shield size={10} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase leading-none">{data.sourceRelic.name}</span>
                                </div>
                                <p className="text-[9px] text-slate-500 italic ml-4">{data.sourceRelic.description}</p>
                            </div>
                        )}
                        {data.sourceRune && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Zap size={10} className="text-blue-400" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase leading-none">{data.sourceRune.name}</span>
                                </div>
                                <p className="text-[9px] text-slate-500 italic ml-4">{data.sourceRune.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {type === 'Caminho' && (
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase text-yellow-400 block mb-2">Sinergia Especial</span>
                    <p className="text-[10px] text-slate-400 italic">
                        {data.synergy}
                    </p>
                </div>
            )}

            {(data.vitals || data.stats || data.bonuses) && (
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Efeitos & Atributos</span>
                    <div className="flex flex-wrap gap-2">
                        {data.bonuses?.map((b: string, i: number) => (
                            <span key={i} className={`text-[9px] px-2 py-0.5 rounded-lg border bg-black/40 ${styleClass.split(' ')[2]} ${styleClass.split(' ')[3]}`}>
                                {b}
                            </span>
                        ))}
                        {data.stats && Object.entries(data.stats).map(([key, val]: any, i: number) => (
                             <span key={i} className={`text-[9px] px-2 py-0.5 rounded-lg border bg-black/40 ${styleClass.split(' ')[2]} ${styleClass.split(' ')[3]}`}>
                                {key.toUpperCase()}: {val > 0 ? '+' : ''}{val}{val < 10 ? '%' : ''}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Footer info */}
        <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-900">
            <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest font-black">Vorathon Bio-OS</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${styleClass.split(' ').slice(0,1).join(' ').replace('from-', 'bg-')}`} />
        </div>
    </motion.div>
  );
};
