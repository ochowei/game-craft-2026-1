import React, { useState } from 'react';
import { useTokens } from '../contexts/TokensContext';
import { TokenCategory } from '../domain/tokens';

const CATEGORY_TABS: { id: TokenCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'pawn', label: 'Pawns', icon: 'person' },
  { id: 'currency', label: 'Currency', icon: 'payments' },
  { id: 'dice', label: 'Dice', icon: 'casino' },
  { id: 'marker', label: 'Markers', icon: 'flag' },
];

export default function TokensEditor() {
  const { tokens, activeCategory, selectedTokenId, dispatch } = useTokens();
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const filteredTokens = activeCategory === 'all' ? tokens : tokens.filter((t) => t.category === activeCategory);
  const selectedToken = selectedTokenId ? tokens.find((t) => t.id === selectedTokenId) ?? null : null;

  const inspectorContent = selectedToken ? (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {/* Preview */}
        <div className="flex flex-col items-center gap-3 p-6 bg-surface-container-low rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">{selectedToken.icon}</span>
          </div>
          <h4 className="text-sm font-bold text-on-surface">{selectedToken.name}</h4>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
            selectedToken.category === 'pawn' ? 'bg-primary-container text-on-primary-container' :
            selectedToken.category === 'currency' ? 'bg-secondary-container text-on-secondary-container' :
            selectedToken.category === 'dice' ? 'bg-tertiary-container text-on-tertiary-container' :
            'bg-surface-container-highest text-on-surface-variant'
          }`}>
            {selectedToken.category}
          </span>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Name</label>
            <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
              <input
                className="w-full bg-transparent border-none p-0 text-sm font-bold text-on-surface focus:ring-0"
                type="text"
                value={selectedToken.name}
                onChange={(e) => dispatch({ type: 'UPDATE_TOKEN', tokenId: selectedToken.id, field: 'name', value: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description</label>
            <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
              <textarea
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface-variant focus:ring-0 leading-relaxed h-16 resize-none"
                value={selectedToken.description}
                onChange={(e) => dispatch({ type: 'UPDATE_TOKEN', tokenId: selectedToken.id, field: 'description', value: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {['person', 'directions_car', 'pets', 'checkroom', 'sailing', 'hiking', 'payments', 'casino', 'home', 'domain', 'flag', 'description', 'bolt', 'water_drop', 'help'].map((icon) => (
                <button
                  key={icon}
                  onClick={() => dispatch({ type: 'UPDATE_TOKEN', tokenId: selectedToken.id, field: 'icon', value: icon })}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                    selectedToken.icon === icon
                      ? 'bg-primary/20 border border-primary/40 text-primary'
                      : 'bg-surface-container-high hover:bg-surface-bright text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Quantity</label>
            <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
              <input
                className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-on-surface focus:ring-0"
                type="number"
                min="1"
                value={selectedToken.quantity}
                onChange={(e) => dispatch({ type: 'UPDATE_TOKEN', tokenId: selectedToken.id, field: 'quantity', value: Number(e.target.value) })}
              />
            </div>
          </div>
          {selectedToken.category === 'currency' && (
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Value ($)</label>
              <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
                <input
                  className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-on-surface focus:ring-0"
                  type="number"
                  min="1"
                  value={selectedToken.value ?? 0}
                  onChange={(e) => dispatch({ type: 'UPDATE_TOKEN', tokenId: selectedToken.id, field: 'value', value: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          {selectedToken.category === 'dice' && (
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Sides</label>
              <div className="bg-surface-container-high/50 rounded-lg p-3 focus-within:bg-surface-container-high transition-colors">
                <input
                  className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-on-surface focus:ring-0"
                  type="number"
                  min="2"
                  value={selectedToken.sides ?? 6}
                  onChange={(e) => dispatch({ type: 'UPDATE_TOKEN', tokenId: selectedToken.id, field: 'sides', value: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-outline-variant/50">
        <button
          onClick={() => dispatch({ type: 'DELETE_TOKEN', tokenId: selectedToken.id })}
          className="w-full py-2 bg-error/10 text-error rounded-lg font-bold hover:bg-error hover:text-on-surface transition-all"
        >
          Delete Token
        </button>
      </div>
    </>
  ) : (
    <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm p-6 text-center">
      Select a token to inspect and edit
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-8 pb-16 md:pb-8 overflow-y-auto custom-scrollbar">
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Tokens & Pieces</h1>
            <p className="text-on-surface-variant font-body">Manage player pawns, currency, dice, and game markers.</p>
          </div>
        </header>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-8">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_CATEGORY', category: tab.id })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeCategory === tab.id
                  ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTokens.map((token) => (
            <button
              key={token.id}
              onClick={() => dispatch({ type: 'SELECT_TOKEN', tokenId: token.id })}
              className={`group relative bg-surface-container rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all cursor-pointer ${
                selectedTokenId === token.id
                  ? 'border-2 border-primary/40 shadow-xl shadow-primary/5'
                  : 'border border-transparent hover:bg-surface-container-high'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedTokenId === token.id
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-container-high text-on-surface-variant group-hover:text-on-surface'
              }`}>
                <span className="material-symbols-outlined text-2xl">{token.icon}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-on-surface truncate">{token.name}</h4>
                <p className="text-[10px] text-on-surface-variant">
                  ×{token.quantity}
                  {token.value !== undefined && ` · $${token.value}`}
                  {token.sides !== undefined && ` · ${token.sides}-sided`}
                </p>
              </div>
              {selectedTokenId === token.id && (
                <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </button>
          ))}

          {/* Add New Token */}
          <button
            onClick={() => dispatch({ type: 'ADD_TOKEN' })}
            className="group border-2 border-dashed border-outline-variant/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-2xl">add</span>
            </div>
            <span className="text-xs font-bold text-on-surface">Add Token</span>
          </button>
        </div>
      </div>

      {/* Inspector - Desktop Sidebar */}
      <aside className="hidden md:flex w-80 bg-surface-container flex-col border-l border-outline-variant/50 shadow-2xl shadow-surface-dim/40 z-50">
        <div className="p-5 border-b border-outline-variant/50 bg-surface-container-low">
          <h2 className="text-sm font-bold text-secondary font-body mb-1">Token Inspector</h2>
          <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
            {selectedToken ? `Editing: ${selectedToken.name}` : 'No token selected'}
          </p>
        </div>
        {inspectorContent}
      </aside>

      {/* Inspector - Mobile Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        <div className="bg-surface-container rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] border-t border-outline-variant/50 flex flex-col max-h-[70vh]">
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="flex items-center justify-between px-4 h-12 shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-outline-variant/50 mx-auto"></div>
              <h2 className="text-sm font-bold text-secondary font-body">Token Inspector</h2>
            </div>
            <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${sheetExpanded ? 'rotate-180' : ''}`}>expand_less</span>
          </button>
          {sheetExpanded && inspectorContent}
        </div>
      </div>
    </div>
  );
}
