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
    <div className="relative w-full h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0b0d]/90 backdrop-blur-sm"
          >
            <div className="terminal-card p-8 flex flex-col items-center shadow-2xl max-w-lg">
              <motion.h1 
                className="text-5xl font-bold uppercase tracking-tighter mb-4 text-[#00ff9d]"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                NEBULA TANK
              </motion.h1>
              <div className="text-[10px] mt-2 leading-relaxed text-[#8e9299] text-center mb-8 uppercase tracking-widest">
                <Target size={14} className="inline mr-2 text-[#00ff9d]" /> STATUS: READY
              </div>
              <button
                onClick={startGame}
                className="hud-border px-8 py-4 bg-black/60 text-[#00ff9d] font-bold uppercase tracking-widest text-sm hover:bg-[#00ff9d]/20 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Play size={16} /> INITIALIZE SYSTEM
                </span>
              </button>
              <div className="mt-8 text-[10px] text-[#8e9299] font-mono whitespace-pre text-left w-full border-t border-[#00ff9d]/20 pt-4">
                {'>'} A / D OR ARROWS .. MOBILITY{'\n'}
                {'>'} SPACE ............ KINETIC STRIKE
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0b0d]/90 backdrop-blur-md"
          >
            <div className="terminal-card p-8 flex flex-col items-center shadow-2xl min-w-[300px]">
              <div className="text-red-500 mb-4 animate-pulse">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-bold uppercase mb-2 text-[#00ff9d]">MISSION COMPLETE</h2>
              <div className="text-[10px] text-[#8e9299] mb-8 uppercase tracking-[0.2em] border-b border-[#00ff9d]/20 pb-4 w-full text-center">FINAL SCORE: {score}</div>
              <button
                onClick={startGame}
                className="hud-border px-8 py-3 bg-black/60 text-[#00ff9d] font-bold uppercase tracking-widest text-xs hover:bg-[#00ff9d]/20 transition-colors"
              >
                REBOOT SEQUENCE
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
        <div className="absolute inset-0 z-40 pointer-events-none p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="terminal-card p-4 w-64 shadow-2xl hidden md:block">
              <div className="stat-label">System Status</div>
              <div className="text-[9px] mt-2 leading-relaxed text-[#8e9299]">
                {'>'} RADAR ACTIVE<br/>
                {'>'} KINETIC CANNONS HOT<br/>
                {'>'} ENGAGING HOSTILES
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-black/60 p-3 hud-border min-w-[120px] text-right">
                <div className="stat-label">Combats</div>
                <div className="stat-value tracking-tighter">{score}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-12 opacity-40">
             <div className="w-12 h-12 border-2 border-[#00ff9d] rounded-full flex items-center justify-center">
               <div className="w-1 h-1 bg-[#00ff9d]"></div>
             </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="terminal-card p-4 w-72">
               <div className="stat-label">Hull Integrity</div>
               <div className="flex items-center gap-2 mt-2">
                 <div className="w-full bg-gray-800 h-2">
                   <div 
                     className="bg-[#00ff9d] h-full transition-all duration-300"
                     style={{ width: `${Math.max(0, ((MAX_MISSES - misses) / MAX_MISSES) * 100)}%` }}
                   ></div>
                 </div>
                 <span className="text-[10px] text-[#00ff9d]">{Math.max(0, ((MAX_MISSES - misses) / MAX_MISSES) * 100).toFixed(0)}%</span>
               </div>
            </div>

            <div className="flex flex-col gap-2">
              {misses > 0 && <div className="bg-red-900/20 border border-red-500/30 px-4 py-2 text-red-500 text-[10px] animate-pulse">WARNING: HOSTILE PASS</div>}
              <div className="flex gap-2 justify-end">
                {[...Array(MAX_MISSES)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-8 h-2 transition-colors duration-500 ${i < (MAX_MISSES - misses) ? 'bg-[#00ff9d]' : 'bg-gray-700'}`}
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

