import { RentStructure, ColorGroup, TileType } from './board';

export type LibraryItemType = 'card-template' | 'tile-preset' | 'color-palette';

export interface CardTemplateData {
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

export interface TilePresetData {
  tileType: TileType;
  colorGroup?: ColorGroup;
  price?: number;
  rent?: RentStructure;
}

export interface ColorPaletteData {
  colors: string[];
}

export type LibraryItem =
  | { id: string; name: string; itemType: 'card-template'; description: string; createdAt: string; data: CardTemplateData }
  | { id: string; name: string; itemType: 'tile-preset'; description: string; createdAt: string; data: TilePresetData }
  | { id: string; name: string; itemType: 'color-palette'; description: string; createdAt: string; data: ColorPaletteData };

export const DEFAULT_LIBRARY: LibraryItem[] = [
  {
    id: 'seed-card-1',
    name: 'Penalty Card',
    itemType: 'card-template',
    description: 'A card template for penalty/fine actions.',
    createdAt: '2026-04-15T00:00:00Z',
    data: { title: 'PAY FINE', description: 'Pay a fine of $50.', icon: 'gavel', accentColor: 'red' },
  },
  {
    id: 'seed-card-2',
    name: 'Reward Card',
    itemType: 'card-template',
    description: 'A card template for reward/bonus actions.',
    createdAt: '2026-04-15T00:00:00Z',
    data: { title: 'BONUS', description: 'Collect a bonus of $100.', icon: 'celebration', accentColor: 'green' },
  },
  {
    id: 'seed-tile-1',
    name: 'Luxury Property',
    itemType: 'tile-preset',
    description: 'High-value dark-blue property preset.',
    createdAt: '2026-04-15T00:00:00Z',
    data: { tileType: 'property', colorGroup: 'dark-blue', price: 400, rent: { base: 50, oneHouse: 200, twoHouses: 600, threeHouses: 1400, fourHouses: 1700, hotel: 2000 } },
  },
  {
    id: 'seed-tile-2',
    name: 'Budget Property',
    itemType: 'tile-preset',
    description: 'Low-cost brown property preset.',
    createdAt: '2026-04-15T00:00:00Z',
    data: { tileType: 'property', colorGroup: 'brown', price: 60, rent: { base: 2, oneHouse: 10, twoHouses: 30, threeHouses: 90, fourHouses: 160, hotel: 250 } },
  },
  {
    id: 'seed-palette-1',
    name: 'Classic Monopoly',
    itemType: 'color-palette',
    description: 'The standard 8-color Monopoly property palette.',
    createdAt: '2026-04-15T00:00:00Z',
    data: { colors: ['#78350f', '#38bdf8', '#f472b6', '#f97316', '#dc2626', '#eab308', '#16a34a', '#1d4ed8'] },
  },
  {
    id: 'seed-palette-2',
    name: 'Pastel Dream',
    itemType: 'color-palette',
    description: 'Soft pastel color scheme for a lighter theme.',
    createdAt: '2026-04-15T00:00:00Z',
    data: { colors: ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bae6fd', '#c7d2fe', '#e9d5ff', '#fbcfe8'] },
  },
];
