import React, { useState } from 'react';
import { useCards } from '../contexts/CardsContext';

export default function CardDesigner() {
  const { cards, activeDeckType, selectedCardId, dispatch } = useCards();
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const deckCards = cards.filter((c) => c.type === activeDeckType);
  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  const inspectorContent = selectedCard ? (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Live Preview Section */}
        <div className="p-6 bg-surface-container-low">
          <div className="aspect-[5/7] w-48 mx-auto bg-[#fdfcf0] rounded-2xl p-6 flex flex-col items-center justify-between text-[#1a1c1e] shadow-2xl relative overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500">
            <div className="w-full text-center relative z-10">
              <div className="w-10 h-10 bg-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center text-[#fdfcf0] shadow-lg">
                <span className="material-symbols-outlined text-2xl">question_mark</span>
              </div>
              <h3 className="font-headline font-black text-lg uppercase tracking-tight leading-[0.9]">{selectedCard.title}</h3>
            </div>
            <div className="relative z-10 py-4">
              <span className="material-symbols-outlined text-8xl text-orange-600/90 drop-shadow-sm" style={{ fontVariationSettings: "'wght' 200" }}>{selectedCard.icon}</span>
            </div>
            <div className="w-full border-t border-[#e2e8f0] pt-4 text-center relative z-10">
              <p className="text-[10px] font-bold text-[#1e293b] uppercase tracking-tighter mb-1">Instructions:</p>
              <p className="text-[11px] font-medium leading-tight text-[#475569] italic">{selectedCard.description}</p>
            </div>
          </div>
          <p className="text-[10px] text-center text-on-surface-variant mt-4 italic font-medium">Physical Card Preview (Tilt to Rotate)</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-1 p-1 bg-surface-container-high/50 rounded-lg">
            <button className="flex-1 py-2 text-secondary border-r-4 border-secondary bg-secondary/10 text-xs font-medium">Content</button>
            <button className="flex-1 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all text-xs font-medium">Visuals</button>
            <button className="flex-1 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all text-xs font-medium">Logic</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Card Title</label>
              <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
                <input
                  className="w-full bg-transparent border-none p-0 text-sm font-bold text-on-surface focus:ring-0"
                  type="text"
                  value={selectedCard.title}
                  onChange={(e) => dispatch({ type: 'UPDATE_CARD', cardId: selectedCard.id, field: 'title', value: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Action Description</label>
              <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
                <textarea
                  className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface-variant focus:ring-0 leading-relaxed h-20 resize-none"
                  value={selectedCard.description}
                  onChange={(e) => dispatch({ type: 'UPDATE_CARD', cardId: selectedCard.id, field: 'description', value: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Illustration Choice</label>
              <div className="grid grid-cols-4 gap-2">
                {['rocket_launch', 'payments', 'apartment', 'gavel', 'train', 'mood_bad', 'celebration'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => dispatch({ type: 'UPDATE_CARD', cardId: selectedCard.id, field: 'icon', value: icon })}
                    className={`aspect-square rounded flex items-center justify-center transition-colors ${selectedCard.icon === icon ? 'bg-secondary/20 border border-secondary/40 text-secondary' : 'bg-surface-container-high hover:bg-surface-bright text-on-surface-variant'}`}
                  >
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                  </button>
                ))}
                <button className="aspect-square border border-dashed border-outline-variant rounded flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-surface-container-low border-t border-outline-variant/50">
        <button className="w-full py-3 bg-gradient-to-br from-primary-container to-primary text-on-primary-container text-xs font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95">Save Changes</button>
      </div>
    </>
  ) : (
    <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
      No card selected
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-8 pb-16 md:pb-8 overflow-y-auto custom-scrollbar">
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Card Deck Designer</h1>
            <p className="text-on-surface-variant font-body">Refine your Chance and Community Chest encounters.</p>
          </div>
          <div className="flex gap-2 p-1 bg-surface-container rounded-full">
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_DECK', deckType: 'chance' })}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeDeckType === 'chance' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Chance
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_DECK', deckType: 'community-chest' })}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${activeDeckType === 'community-chest' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Community Chest
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {deckCards.map((card) => (
            <div
              key={card.id}
              onClick={() => dispatch({ type: 'SELECT_CARD', cardId: card.id })}
              className={`group relative bg-surface-container rounded-2xl p-6 cursor-pointer transition-all ${
                selectedCardId === card.id
                  ? 'border-2 border-primary/40 shadow-2xl shadow-primary/5'
                  : 'hover:bg-surface-container-high'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                  selectedCardId === card.id
                    ? 'bg-tertiary/10 text-tertiary'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {card.type === 'chance' ? 'Chance' : 'Comm. Chest'} #{card.id.split('-')[1]}
                </span>
                {selectedCardId === card.id && (
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </div>
              <div className={`aspect-[5/7] w-full bg-[#fdfcf0] rounded-xl overflow-hidden p-6 flex flex-col items-center justify-between text-[#1a1c1e] shadow-inner relative ${
                selectedCardId !== card.id ? 'opacity-60 group-hover:opacity-100' : ''
              } transition-opacity`}>
                <div className="w-full text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    selectedCardId === card.id
                      ? 'bg-orange-500 text-[#fdfcf0]'
                      : 'border-2 border-orange-500 text-orange-500'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">question_mark</span>
                  </div>
                  <h3 className="font-headline font-black text-lg uppercase leading-tight">{card.title}</h3>
                </div>
                <span className={`material-symbols-outlined text-7xl ${selectedCardId === card.id ? 'text-orange-600' : 'text-[#94a3b8]'}`} style={{ fontVariationSettings: "'wght' 200" }}>{card.icon}</span>
                <p className="text-[10px] font-medium text-center italic text-[#64748b]">{card.description}</p>
              </div>
              {selectedCardId === card.id && (
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">{card.title}</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">ID: {card.id}</span>
                </div>
              )}
            </div>
          ))}

          {/* Add New Card Slot */}
          <div
            onClick={() => dispatch({ type: 'ADD_CARD' })}
            className="group relative border-2 border-dashed border-outline-variant/30 bg-transparent rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl">add</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-on-surface">Add New {activeDeckType === 'chance' ? 'Chance' : 'Community Chest'} Card</p>
              <p className="text-[10px] text-on-surface-variant font-medium">{deckCards.length} Cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Inspector - Desktop Sidebar */}
      <aside className="hidden md:flex w-80 bg-surface-container flex-col border-l border-outline-variant/50 shadow-2xl shadow-surface-dim/40 z-50">
        <div className="p-6 border-b border-outline-variant/50 bg-surface-container-low">
          <h2 className="text-sm font-bold text-secondary font-body mb-1">Card Inspector</h2>
          <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
            {selectedCard ? `Editing: ${selectedCard.title}` : 'No card selected'}
          </p>
        </div>
        {inspectorContent}
      </aside>

      {/* Card Inspector - Mobile Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        <div className="bg-surface-container rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] border-t border-outline-variant/50 flex flex-col max-h-[70vh]">
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="flex items-center justify-between px-4 h-12 shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-outline-variant/50 mx-auto"></div>
              <h2 className="text-sm font-bold text-secondary font-body">Card Inspector</h2>
            </div>
            <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${sheetExpanded ? 'rotate-180' : ''}`}>expand_less</span>
          </button>
          {sheetExpanded && inspectorContent}
        </div>
      </div>

      {/* Floating Action Palette */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 p-2 bg-surface-container/80 backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-2xl z-50">
        <button className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-on-primary shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">edit</span>
        </button>
        <div className="w-px h-8 bg-outline-variant/30 mx-2"></div>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">zoom_in</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">auto_fix_high</span>
        </button>
        <button className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">content_copy</span>
        </button>
        <button
          onClick={() => selectedCardId && dispatch({ type: 'DELETE_CARD', cardId: selectedCardId })}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-colors"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}
