import React, { useState } from 'react';
import { Play, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface GameSetupProps {
  onStart: (config: GameConfig) => void;
}

export interface GameConfig {
  playersPerTeam: number;
  botsPerTeam: number;
  teamCount: number;
  difficulty: 'easy' | 'normal' | 'hard';
}

export default function GameSetup({ onStart }: GameSetupProps) {
  const [playersPerTeam, setPlayersPerTeam] = useState(1);
  const [botsPerTeam, setBotsPerTeam] = useState(4);
  const [teamCount, setTeamCount] = useState(2);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const totalPlayers = playersPerTeam * teamCount + botsPerTeam * teamCount;

  const handleStart = () => {
    onStart({
      playersPerTeam,
      botsPerTeam,
      teamCount,
      difficulty
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="terminal-card p-8 max-w-lg mx-auto bg-[#0a001e]/90 border-2 border-[#00f0ff]/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-[#ff007f]" size={28} />
        <h2 className="text-2xl font-black italic text-[#00f0ff]">GAME SETUP</h2>
      </div>

      <div className="space-y-6">
        {/* Players Per Team */}
        <div>
          <label className="block text-[11px] font-bold text-[#cfd1d4] uppercase tracking-widest mb-3">
            Human Players Per Team: {playersPerTeam}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={playersPerTeam}
            onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff007f]"
          />
          <div className="text-[9px] text-[#cfd1d4]/60 mt-2">
            Số lượng người chơi thực tế trong mỗi đội (mặc định: 1)
          </div>
        </div>

        {/* Bots Per Team */}
        <div>
          <label className="block text-[11px] font-bold text-[#cfd1d4] uppercase tracking-widest mb-3">
            Bots Per Team: {botsPerTeam}
          </label>
          <input
            type="range"
            min="0"
            max="8"
            value={botsPerTeam}
            onChange={(e) => setBotsPerTeam(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff007f]"
          />
          <div className="text-[9px] text-[#cfd1d4]/60 mt-2">
            Số lượng bot trong mỗi đội (mặc định: 4)
          </div>
        </div>

        {/* Team Count */}
        <div>
          <label className="block text-[11px] font-bold text-[#cfd1d4] uppercase tracking-widest mb-3">
            Number of Teams: {teamCount}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setTeamCount(num)}
                className={`flex-1 py-2 font-bold text-[11px] transition-all ${
                  teamCount === num
                    ? 'bg-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                    : 'bg-white/5 text-[#cfd1d4] hover:bg-white/10'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-[11px] font-bold text-[#cfd1d4] uppercase tracking-widest mb-3">
            Difficulty
          </label>
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`flex-1 py-2 font-bold text-[11px] uppercase transition-all ${
                  difficulty === diff
                    ? 'bg-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                    : 'bg-white/5 text-[#cfd1d4] hover:bg-white/10'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white/5 border border-[#00f0ff]/30 p-4 rounded">
          <div className="text-[9px] text-[#cfd1d4]/60 uppercase tracking-widest mb-2">Game Summary</div>
          <div className="space-y-1 text-[11px] text-[#00f0ff] font-mono">
            <div>• Teams: {teamCount}</div>
            <div>• Players per team: {playersPerTeam}</div>
            <div>• Bots per team: {botsPerTeam}</div>
            <div>• Total entities: {totalPlayers}</div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full group relative px-12 py-5 overflow-hidden mt-6"
        >
          <div className="absolute inset-0 bg-[#ff007f] transform skew-x-12 group-hover:bg-[#00f0ff] transition-colors duration-300" />
          <span className="relative flex items-center justify-center gap-3 text-white font-black uppercase italic tracking-tighter text-lg">
            <Play size={20} fill="white" /> START GAME
          </span>
        </button>
      </div>
    </motion.div>
  );
}
