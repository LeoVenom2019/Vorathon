import React from 'react';
import { motion } from 'motion/react';
import { Home, LogOut } from 'lucide-react';
import { resetSession } from '../core/Store';

interface GameOverScreenProps {
    onNavigate: (state: string) => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ onNavigate }) => {
    return (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-10 pointer-events-auto">
            {/* The canvas handles the background overlay and the big GAME OVER text */}
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col gap-4 w-64 mt-48"
            >
                <button 
                    onClick={() => {
                        resetSession();
                        window.location.reload(); // Hard reset for "Sair" feel or just full clean up
                    }}
                    className="group flex items-center justify-center gap-3 w-full py-4 bg-white text-black font-black rounded-lg hover:bg-slate-200 transition-all uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    <LogOut size={16} />
                    Sair do Jogo
                </button>

                <button 
                    onClick={() => {
                        resetSession();
                        onNavigate('MAIN_MENU');
                    }}
                    className="group flex items-center justify-center gap-3 w-full py-4 bg-slate-900 border border-slate-700 text-white font-black rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
                >
                    <Home size={16} />
                    Menu Inicial
                </button>
            </motion.div>
        </div>
    );
};
