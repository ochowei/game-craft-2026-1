import React, { useState } from 'react';
import { useBoard } from '../contexts/BoardContext';
import { positionToGridCoords, COLOR_GROUP_CSS, ColorGroup, Tile } from '../domain/board';

const ALL_COLOR_GROUPS: ColorGroup[] = ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue'];

const COLOR_GROUP_DISPLAY: Record<ColorGroup, string> = {
  'brown': 'bg-amber-800',
  'light-blue': 'bg-sky-400',
  'pink': 'bg-pink-400',
  'orange': 'bg-orange-500',
  'red': 'bg-red-600',
  'yellow': 'bg-yellow-500',
  'green': 'bg-green-600',
  'dark-blue': 'bg-blue-700',
};

const TileCell: React.FC<{ tile: Tile; isSelected: boolean; onSelect: () => void }> = ({ tile, isSelected, onSelect }) => {
  const { row, col } = positionToGridCoords(tile.position);
  const isCorner = [0, 10, 20, 30].includes(tile.position);
  const isProperty = tile.tileType === 'property';
  const isTopRow = tile.position >= 20 && tile.position <= 30;
  const isBottomRow = tile.position >= 0 && tile.position <= 10;
  const isLeftCol = tile.position >= 11 && tile.position <= 19;
  const isRightCol = tile.position >= 31 && tile.position <= 39;

  // Color bar position depends on which side of the board the tile is on
  const colorBarClass = isProperty && tile.colorGroup ? COLOR_GROUP_CSS[tile.colorGroup] : '';

  return (
    <button
      onClick={onSelect}
      style={{ gridRow: row, gridColumn: col }}
      className={`bg-surface-container-high rounded-sm flex flex-col overflow-hidden relative transition-all ${
        isSelected ? 'border-2 border-primary ring-4 ring-primary/20 z-10' : 'hover:brightness-110'
      } ${isCorner ? 'items-center justify-center' : ''}`}
    >
      {/* Color bar for property tiles */}
      {isProperty && colorBarClass && !isCorner && (
        <div className={`${colorBarClass} ${
          isTopRow ? 'h-1/4 w-full rounded-t-sm' :
          isBottomRow ? 'h-1/4 w-full rounded-b-sm mt-auto' :
          isLeftCol ? 'w-1/4 h-full rounded-l-sm absolute left-0 top-0' :
          isRightCol ? 'w-1/4 h-full rounded-r-sm absolute right-0 top-0' : ''
        }`} />
      )}

      {/* Tile content */}
      {isCorner && tile.icon && (
        <span className={`material-symbols-outlined text-3xl ${
          tile.tileType === 'go' ? 'text-secondary' :
          tile.tileType === 'go-to-jail' ? 'text-error' :
          'text-primary'
        }`} style={tile.tileType === 'go' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          {tile.icon}
        </span>
      )}

      {!isCorner && (
        <div className="flex-1 p-1 text-[6px] flex flex-col justify-center items-center text-center leading-tight">
          {isSelected && (
            <>
              <span className="font-bold truncate w-full">{tile.name.split(' ')[0]}</span>
              {tile.price && <span>${tile.price}</span>}
            </>
          )}
          {!isSelected && tile.icon && !isProperty && (
            <span className="material-symbols-outlined text-on-surface-variant text-sm">{tile.icon}</span>
          )}
        </div>
      )}

      {/* Corner labels */}
      {tile.tileType === 'go' && (
        <span className="text-secondary font-black text-lg z-10 tracking-tighter">GO</span>
      )}
    </button>
  );
}

export default function BoardEditor() {
  const { tiles, selectedTileId, dispatch } = useBoard();
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const selectedTile = selectedTileId !== null ? tiles.find((t) => t.position === selectedTileId) ?? null : null;

  const inspectorContent = selectedTile ? (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        <div className="bg-surface-container-high rounded-xl p-4 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg shadow-lg ${selectedTile.colorGroup ? COLOR_GROUP_DISPLAY[selectedTile.colorGroup] : 'bg-surface-container-highest'} ${!selectedTile.colorGroup ? 'flex items-center justify-center' : ''}`}>
              {!selectedTile.colorGroup && selectedTile.icon && (
                <span className="material-symbols-outlined text-on-surface-variant text-lg">{selectedTile.icon}</span>
              )}
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Selected Tile</p>
              <h4 className="text-sm font-bold text-on-surface">{selectedTile.name}</h4>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-on-surface-variant mb-1">Display Name</label>
              <input
                className="w-full bg-surface-container text-on-surface px-3 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs"
                type="text"
                value={selectedTile.name}
                onChange={(e) => dispatch({ type: 'UPDATE_TILE', position: selectedTile.position, field: 'name', value: e.target.value })}
              />
            </div>
            {selectedTile.price !== undefined && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-on-surface-variant mb-1">Buy Price</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                    <input
                      className="w-full bg-surface-container text-on-surface pl-6 pr-2 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs"
                      type="number"
                      value={selectedTile.price}
                      onChange={(e) => dispatch({ type: 'UPDATE_TILE', position: selectedTile.position, field: 'price', value: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface-variant mb-1">Mortgage</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                    <input
                      className="w-full bg-surface-container text-on-surface pl-6 pr-2 py-2 rounded border-none focus:ring-1 focus:ring-primary-container text-xs"
                      type="number"
                      value={selectedTile.mortgage ?? 0}
                      onChange={(e) => dispatch({ type: 'UPDATE_TILE', position: selectedTile.position, field: 'mortgage', value: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTile.rent && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Rent Structure</h5>
              <button className="text-primary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-base">auto_fix</span></button>
            </div>
            <div className="space-y-2">
              {([
                { key: 'base' as const, label: 'Base Rent', color: 'text-secondary' },
                { key: 'oneHouse' as const, label: '1 House', icon: 'home' },
                { key: 'twoHouses' as const, label: '2 Houses', icon: 'home' },
                { key: 'threeHouses' as const, label: '3 Houses', icon: 'home' },
                { key: 'fourHouses' as const, label: '4 Houses', icon: 'home' },
                { key: 'hotel' as const, label: 'Hotel', icon: 'domain', color: 'text-error' },
              ]).map((rent) => (
                <div key={rent.key} className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    {rent.icon && <span className="material-symbols-outlined text-xs text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>{rent.icon}</span>}
                    <span className="text-on-surface-variant">{rent.label}</span>
                  </div>
                  <div className="relative w-20">
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                    <input
                      className={`w-full bg-transparent text-right border-none p-0 text-xs font-bold focus:ring-0 ${rent.color || 'text-on-surface'}`}
                      type="number"
                      value={selectedTile.rent![rent.key]}
                      onChange={(e) => dispatch({ type: 'UPDATE_RENT', position: selectedTile.position, field: rent.key, value: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTile.tileType === 'property' && (
          <div>
            <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Color Group</h5>
            <div className="flex flex-wrap gap-2">
              {ALL_COLOR_GROUPS.map((color) => (
                <button
                  key={color}
                  onClick={() => dispatch({ type: 'UPDATE_TILE', position: selectedTile.position, field: 'colorGroup', value: color })}
                  className={`w-6 h-6 rounded-full ${COLOR_GROUP_DISPLAY[color]} border-2 ${selectedTile.colorGroup === color ? 'border-on-surface ring-2 ring-primary/20' : 'border-transparent hover:border-on-surface'} transition-all`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-outline-variant/50">
        <button className="w-full py-2 bg-error/10 text-error rounded-lg font-bold hover:bg-error hover:text-on-surface transition-all">Delete Tile</button>
      </div>
    </>
  ) : (
    <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm p-6 text-center">
      Click a tile on the board to inspect and edit it
    </div>
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
            {tiles.map((tile) => (
              <TileCell
                key={tile.position}
                tile={tile}
                isSelected={selectedTileId === tile.position}
                onSelect={() => dispatch({ type: 'SELECT_TILE', position: tile.position })}
              />
            ))}

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
          </div>
        </div>
      </div>

      {/* Inspector - Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-surface-container flex-col border-l border-outline-variant/50 shadow-2xl shadow-surface-dim/40 font-body text-xs font-medium">
        <div className="p-4 border-b border-outline-variant/50">
          <h3 className="text-sm font-bold text-on-surface font-headline uppercase tracking-widest">Inspector</h3>
          <p className="text-secondary font-medium">{selectedTile ? selectedTile.name : 'No tile selected'}</p>
        </div>
        {selectedTile && (
          <div className="flex border-b border-outline-variant/50">
            <button className="flex-1 py-3 text-secondary border-r-4 border-secondary bg-secondary/10">Appearance</button>
            <button className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all">Physics</button>
            <button className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all">Logic</button>
          </div>
        )}
        {inspectorContent}
      </aside>

      {/* Inspector - Mobile Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        <div className="bg-surface-container rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] border-t border-outline-variant/50 flex flex-col max-h-[70vh] font-body text-xs font-medium">
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
