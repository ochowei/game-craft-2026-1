import React from 'react';
import { useLibrary } from '../contexts/LibraryContext';
import { LibraryItem, LibraryItemType } from '../domain/library';

const FILTER_TABS: { id: LibraryItemType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'card-template', label: 'Card Templates', icon: 'style' },
  { id: 'tile-preset', label: 'Tile Presets', icon: 'grid_view' },
  { id: 'color-palette', label: 'Color Palettes', icon: 'palette' },
];

const ItemPreview: React.FC<{ item: LibraryItem }> = ({ item }) => {
  switch (item.itemType) {
    case 'card-template':
      return (
        <div className="aspect-[5/7] w-full bg-[#fdfcf0] rounded-xl p-4 flex flex-col items-center justify-between text-[#1a1c1e]">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-lg">{item.data.icon}</span>
          </div>
          <h4 className="font-headline font-black text-sm uppercase text-center leading-tight">{item.data.title}</h4>
          <p className="text-[9px] text-[#64748b] italic text-center">{item.data.description}</p>
        </div>
      );
    case 'tile-preset':
      return (
        <div className="aspect-square w-full bg-surface-container-high rounded-xl flex flex-col items-center justify-center gap-3 p-4">
          {item.data.colorGroup && (
            <div className={`w-12 h-12 rounded-lg shadow-lg ${
              item.data.colorGroup === 'brown' ? 'bg-amber-800' :
              item.data.colorGroup === 'light-blue' ? 'bg-sky-400' :
              item.data.colorGroup === 'pink' ? 'bg-pink-400' :
              item.data.colorGroup === 'orange' ? 'bg-orange-500' :
              item.data.colorGroup === 'red' ? 'bg-red-600' :
              item.data.colorGroup === 'yellow' ? 'bg-yellow-500' :
              item.data.colorGroup === 'green' ? 'bg-green-600' :
              'bg-blue-700'
            }`} />
          )}
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">{item.data.tileType}</span>
          {item.data.price && <span className="text-sm font-mono text-secondary">${item.data.price}</span>}
        </div>
      );
    case 'color-palette':
      return (
        <div className="w-full rounded-xl overflow-hidden flex flex-col gap-1 p-3 bg-surface-container-high">
          <div className="flex gap-1 h-12 rounded-lg overflow-hidden">
            {item.data.colors.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant text-center mt-1">{item.data.colors.length} colors</p>
        </div>
      );
  }
};

export default function Library() {
  const { items, activeFilter, dispatch } = useLibrary();

  const filteredItems = activeFilter === 'all' ? items : items.filter((i) => i.itemType === activeFilter);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-headline font-bold text-on-surface tracking-tight mb-2">My Library</h1>
          <p className="text-on-surface-variant font-medium">Your personal collection of reusable card templates, tile presets, and color palettes.</p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-10">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_FILTER', filter: tab.id })}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              activeFilter === tab.id
                ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
        <div className="ml-auto text-sm text-on-surface-variant font-medium">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Item Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 hover:shadow-xl transition-all">
              <div className="p-4">
                <ItemPreview item={item} />
              </div>
              <div className="px-4 pb-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-on-surface truncate">{item.name}</h3>
                    <p className="text-[10px] text-on-surface-variant truncate">{item.description}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    item.itemType === 'card-template' ? 'bg-secondary-container text-on-secondary-container' :
                    item.itemType === 'tile-preset' ? 'bg-primary-container text-on-primary-container' :
                    'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {item.itemType === 'card-template' ? 'Card' :
                     item.itemType === 'tile-preset' ? 'Tile' : 'Palette'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                  <span className="text-[10px] text-on-surface-variant">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', itemId: item.id })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">inventory_2</span>
          </div>
          <h3 className="font-headline text-xl font-bold mb-2 text-on-surface">No items yet</h3>
          <p className="text-on-surface-variant text-sm max-w-md">
            Save card templates, tile presets, and color palettes from the editors to build your personal library.
          </p>
        </div>
      )}
    </div>
  );
}
