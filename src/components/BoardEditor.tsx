import React, { useState } from 'react';

export default function BoardEditor() {
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const inspectorContent = (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        <div className="bg-surface-container-high rounded-xl p-4 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500 shadow-lg shadow-yellow-900/20"></div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Selected Tile</p>
              <h4 className="text-sm font-bold text-on-surface">Ventnor Avenue</h4>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-on-surface-variant mb-1">Display Name</label>
              <input className="w-full bg-surface-container text-on-surface px-3 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs" type="text" defaultValue="Ventnor Avenue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-on-surface-variant mb-1">Buy Price</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                  <input className="w-full bg-surface-container text-on-surface pl-6 pr-2 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs" type="number" defaultValue="260" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant mb-1">Mortgage</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                  <input className="w-full bg-surface-container text-on-surface pl-6 pr-2 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs" type="number" defaultValue="130" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Rent Structure</h5>
            <button className="text-primary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-base">auto_fix</span></button>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Base Rent', value: '$22', color: 'text-secondary' },
              { label: '1 House', value: '$110', icon: 'home' },
              { label: '2 Houses', value: '$330', icon: 'home' },
              { label: 'Hotel', value: '$1150', icon: 'domain', color: 'text-error' },
            ].map((rent) => (
              <div key={rent.label} className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  {rent.icon && <span className="material-symbols-outlined text-xs text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>{rent.icon}</span>}
                  <span className="text-on-surface-variant">{rent.label}</span>
                </div>
                <span className={`font-bold ${rent.color || 'text-on-surface'}`}>{rent.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Color Group</h5>
          <div className="flex flex-wrap gap-2">
            {['bg-red-600', 'bg-yellow-500', 'bg-green-600', 'bg-blue-600', 'bg-orange-500', 'bg-purple-600', 'bg-pink-500'].map((color, i) => (
              <button key={color} className={`w-6 h-6 rounded-full ${color} border-2 ${i === 1 ? 'border-on-surface ring-2 ring-yellow-500/20' : 'border-transparent hover:border-on-surface'} transition-all`}></button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-outline-variant/50">
        <button className="w-full py-2 bg-error/10 text-error rounded-lg font-bold hover:bg-error hover:text-on-surface transition-all">Delete Tile</button>
      </div>
    </>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Center Canvas */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-surface-container-lowest">
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #b7c4ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Canvas Controls */}
        <div className="absolute bottom-16 left-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 glass-panel px-4 py-2 rounded-full flex items-center gap-4 z-10 shadow-2xl">
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">zoom_in</span></button>
          <span className="text-xs font-bold text-on-surface">85%</span>
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">zoom_out</span></button>
          <div className="w-px h-4 bg-outline-variant/30"></div>
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">grid_on</span></button>
          <button className="p-2 hover:bg-on-surface/10 rounded-full transition-colors"><span className="material-symbols-outlined text-on-surface-variant">layers</span></button>
        </div>

        {/* The Board Canvas */}
        <div className="relative w-full max-w-[600px] aspect-square bg-surface-container-high rounded-lg shadow-[0_40px_100px_rgba(0,0,0,0.6)] p-2 mx-4 md:mx-0">
          <div className="grid grid-cols-11 grid-rows-11 w-full h-full gap-1">
            {/* Top Row */}
            <div className="bg-surface-container-high rounded-sm flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl">local_parking</span>
            </div>
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`bg-surface-container-high rounded-sm flex flex-col ${i === 8 ? 'border-2 border-primary ring-4 ring-primary/20 z-10' : ''}`}>
                <div className={`h-1/4 rounded-t-sm ${i < 4 ? 'bg-red-500' : i < 6 ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
                <div className="flex-1 p-1 text-[8px] flex flex-col justify-center items-center">
                  {i === 8 && (
                    <>
                      <span className="font-bold">VENTNOR</span>
                      <span>$260</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="bg-surface-container-high rounded-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-3xl">gavel</span>
            </div>

            {/* Center Area */}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-surface-container/50 rounded-lg flex items-center justify-center overflow-hidden relative">
              <div className="relative text-center opacity-20 transform -rotate-45 scale-150 select-none">
                <h1 className="text-8xl font-black tracking-tighter text-primary">MONOPOLY</h1>
                <p className="text-2xl font-bold tracking-widest text-secondary">REVIVE EDITOR</p>
              </div>
              <img 
                src="https://picsum.photos/seed/blueprint/800/800?blur=10" 
                alt="Blueprint background" 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-10 pointer-events-none" 
              />
            </div>

            {/* Bottom Right Corner (GO) */}
            <div className="col-start-11 row-start-11 bg-surface-container-high rounded-sm flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors"></div>
              <span className="text-secondary font-black text-2xl z-10 tracking-tighter">GO</span>
              <span className="material-symbols-outlined text-secondary z-10" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector - Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-surface-container flex-col border-l border-outline-variant/50 shadow-2xl shadow-surface-dim/40 font-body text-xs font-medium">
        <div className="p-4 border-b border-outline-variant/50">
          <h3 className="text-sm font-bold text-on-surface font-headline uppercase tracking-widest">Inspector</h3>
          <p className="text-secondary font-medium">Property Editor</p>
        </div>
        <div className="flex border-b border-outline-variant/50">
          <button className="flex-1 py-3 text-secondary border-r-4 border-secondary bg-secondary/10">Appearance</button>
          <button className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all">Physics</button>
          <button className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all">Logic</button>
        </div>
        {inspectorContent}
      </aside>

      {/* Inspector - Mobile Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        <div className="bg-surface-container rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] border-t border-outline-variant/50 flex flex-col max-h-[70vh] font-body text-xs font-medium">
          {/* Handle bar */}
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="flex items-center justify-between px-4 h-12 shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-outline-variant/50 mx-auto"></div>
              <h3 className="text-sm font-bold text-on-surface font-headline uppercase tracking-widest">Inspector</h3>
            </div>
            <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${sheetExpanded ? 'rotate-180' : ''}`}>expand_less</span>
          </button>
          {sheetExpanded && inspectorContent}
        </div>
      </div>

      {/* Autosave Status */}
      <div className="fixed bottom-16 right-4 md:bottom-6 md:right-80 glass-panel px-4 py-2 rounded-lg border border-secondary/20 flex items-center gap-3 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-secondary"></div>
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Autosaved Just Now</span>
      </div>
    </div>
  );
}
