/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import UfoShooter from './components/Game/UfoShooter';
import { Target, Trophy, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);

  const startGame = () => {
    setScore(0);
    setMisses(0);
    setGameState('playing');
  };

  const onGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('gameover');
  };

  const MAX_MISSES = 5;

  return (
    <div className="relative w-full h-screen bg-[#0a0b1e] text-white overflow-hidden font-sans select-none">
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a001e]/80 backdrop-blur-md"
          >
            <div className="terminal-card p-10 flex flex-col items-center shadow-[0_0_50px_rgba(255,0,127,0.2)] max-w-lg mx-4">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center"
              >
                <h1 className="text-6xl font-black italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-[#00f0ff] to-[#ff007f]">
                  NEBULA TANK
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-[#00f0ff] to-[#ff007f] mx-auto mb-6" />
              </motion.div>
              
              <div className="text-[11px] font-bold text-[#cfd1d4] text-center mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                <Target size={16} className="text-[#00f0ff] animate-pulse" /> SYSTEM READY // V.2.0
              </div>

              <button
                onClick={startGame}
                className="group relative px-12 py-5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#ff007f] transform skew-x-12 group-hover:bg-[#00f0ff] transition-colors duration-300" />
                <span className="relative flex items-center gap-3 text-white font-black uppercase italic tracking-tighter text-lg">
                  <Play size={20} fill="white" /> START MISSION
                </span>
              </button>

              <div className="mt-10 grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-6">
                <div className="text-[9px] text-[#cfd1d4]/60 font-mono uppercase">
                  [WSAD] MOVEMENT<br/>
                  [SPACE] FIRE
                </div>
                <div className="text-[9px] text-right text-[#cfd1d4]/60 font-mono uppercase">
                  [MOUSE] AIM<br/>
                  [CLICK] FIRE
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-8 text-[10px] text-[#ff007f] animate-bounce md:hidden font-bold tracking-widest px-4 text-center">
              ROTATE DEVICE FOR BEST EXPERIENCE
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1a0033]/90 backdrop-blur-xl"
          >
            <div className="terminal-card p-10 flex flex-col items-center shadow-[0_0_60px_rgba(0,240,255,0.2)] min-w-[320px]">
              <Trophy size={64} className="text-[#00f0ff] mb-6 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
              <h2 className="text-4xl font-black italic tracking-tighter mb-2 text-[#ff007f]">SYSTEM FAILURE</h2>
              <div className="text-xl font-mono text-[#00f0ff] mb-10 tracking-widest border-y border-[#00f0ff]/20 py-2 w-full text-center">
                SCORE: {score.toLocaleString()}
              </div>
              <button
                onClick={startGame}
                className="hud-border px-10 py-4 bg-white/5 text-[#00f0ff] font-black uppercase italic tracking-tighter text-sm hover:bg-[#00f0ff] hover:text-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]"
              >
                REBOOT CORE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0">
        <UfoShooter 
          isPaused={gameState !== 'playing'} 
          onGameOver={onGameOver}
          onScoreUpdate={setScore}
          onMissUpdate={setMisses}
        />
      </div>

      {gameState === 'playing' && (
        <div className="absolute inset-0 z-40 pointer-events-none p-4 md:p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="terminal-card p-4 w-48 shadow-lg hidden sm:block bg-black/20 backdrop-blur-sm">
              <div className="stat-label text-[9px] text-[#ff007f]">Pilot: Agent-01</div>
              <div className="text-[9px] mt-2 leading-relaxed text-[#cfd1d4] font-mono">
                {'>'} FUEL NOMINAL<br/>
                {'>'} SHIELDS ACTIVE<br/>
                {'>'} TURRET: ONLINE
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white/5 p-4 hud-border min-w-[140px] text-right shadow-xl">
                <div className="stat-label text-[9px] text-[#00f0ff]">Kills Core</div>
                <div className="stat-value tracking-tighter text-4xl">{score}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:opacity-20 opacity-40">
             <div className="w-16 h-16 border-2 border-[#00f0ff] rounded-full flex items-center justify-center relative">
               <div className="absolute inset-0 border border-[#ff007f] rounded-full animate-ping opacity-20"></div>
               <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
             </div>
          </div>

          <div className="flex justify-between items-end gap-4">
            <div className="terminal-card p-4 w-full max-w-[280px] bg-black/20">
               <div className="stat-label text-[9px] text-[#00f0ff]">Shield Integrity</div>
               <div className="flex items-center gap-3 mt-2">
                 <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5">
                   <div 
                     className="bg-gradient-to-r from-[#00f0ff] to-[#ff007f] h-full transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                     style={{ width: `${Math.max(0, ((MAX_MISSES - misses) / MAX_MISSES) * 100)}%` }}
                   ></div>
                 </div>
                 <span className="text-[11px] font-bold text-white min-w-[36px]">{Math.max(0, ((MAX_MISSES - misses) / MAX_MISSES) * 100).toFixed(0)}%</span>
               </div>
            </div>

            <div className="flex flex-col gap-2 scale-75 sm:scale-100 origin-bottom-right">
              {misses > 0 && <div className="bg-[#ff007f]/20 border border-[#ff007f]/50 px-4 py-1 text-[#ff007f] text-[9px] font-black italic tracking-tighter animate-pulse text-right">HULL BREACH IMMINENT</div>}
              <div className="flex gap-1.5 justify-end">
                {[...Array(MAX_MISSES)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-1.5 rounded-full shadow-sm transition-all duration-500 ${i < (MAX_MISSES - misses) ? 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

