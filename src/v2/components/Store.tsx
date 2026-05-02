import React, { useState } from 'react';
import { StoreSystem, StoreItem, PlayerStats } from '../game/StoreSystem';
import { ShoppingCart, X } from 'lucide-react';

interface StoreProps {
  storeSystem: StoreSystem;
  onClose: () => void;
  onPurchase: (itemId: string) => void;
}

export default function Store({ storeSystem, onClose, onPurchase }: StoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<'weapon' | 'armor' | 'speed' | 'skin'>('weapon');
  const items = storeSystem.getItems().filter(item => item.category === selectedCategory);
  const playerStats = storeSystem.getPlayerStats();

  const handlePurchase = (itemId: string) => {
    const success = storeSystem.purchaseItem(itemId);
    if (success) {
      onPurchase(itemId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="terminal-card w-full max-w-2xl max-h-[90vh] overflow-auto bg-[#0a0b1e]/95 border-2 border-[#00f0ff]/50">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0b1e] border-b border-[#00f0ff]/30 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-[#ff007f]" size={24} />
            <h2 className="text-2xl font-black italic text-[#00f0ff]">NEBULA STORE</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#ff007f]/20 rounded transition-colors"
          >
            <X className="text-[#ff007f]" size={24} />
          </button>
        </div>

        {/* Credits Display */}
        <div className="bg-[#1a0033]/50 border-b border-[#00f0ff]/20 p-4">
          <div className="text-[11px] text-[#cfd1d4] uppercase tracking-widest mb-1">Available Credits</div>
          <div className="text-3xl font-black text-[#00f0ff]">{playerStats.credits.toLocaleString()}</div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-[#00f0ff]/20 flex-wrap">
          {(['weapon', 'armor', 'speed', 'skin'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 font-bold uppercase text-[11px] tracking-widest transition-all ${
                selectedCategory === cat
                  ? 'bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                  : 'bg-white/5 text-[#cfd1d4] hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {items.map(item => (
            <div
              key={item.id}
              className="border border-[#00f0ff]/30 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[#00f0ff] text-sm">{item.name}</h3>
                <span className="text-[#ff007f] font-black text-lg">{item.price}</span>
              </div>
              <p className="text-[11px] text-[#cfd1d4] mb-3">{item.description}</p>
              <button
                onClick={() => handlePurchase(item.id)}
                disabled={playerStats.credits < item.price || storeSystem.hasPurchased(item.id)}
                className={`w-full py-2 font-bold uppercase text-[10px] tracking-widest transition-all ${
                  storeSystem.hasPurchased(item.id)
                    ? 'bg-white/10 text-[#cfd1d4] cursor-not-allowed'
                    : playerStats.credits < item.price
                    ? 'bg-white/5 text-[#cfd1d4] cursor-not-allowed'
                    : 'bg-[#ff007f] text-white hover:bg-[#ff007f]/80 cursor-pointer'
                }`}
              >
                {storeSystem.hasPurchased(item.id) ? 'OWNED' : 'BUY'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
