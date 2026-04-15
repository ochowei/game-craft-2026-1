import { CardType } from './cards';

export type TileType =
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'community-chest'
  | 'go'
  | 'jail'
  | 'free-parking'
  | 'go-to-jail';

export type ColorGroup =
  | 'brown'
  | 'light-blue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark-blue';

export interface RentStructure {
  base: number;
  oneHouse: number;
  twoHouses: number;
  threeHouses: number;
  fourHouses: number;
  hotel: number;
}

export type TileEffect =
  | { type: 'drawCard'; deckType: CardType }
  | { type: 'payTax'; amount: number }
  | { type: 'goToJail' }
  | { type: 'collectSalary'; amount: number };

export interface Tile {
  position: number;
  name: string;
  tileType: TileType;
  colorGroup?: ColorGroup;
  price?: number;
  mortgage?: number;
  rent?: RentStructure;
  effect?: TileEffect;
  icon?: string;
}

// Color group to CSS color mapping for rendering
export const COLOR_GROUP_CSS: Record<ColorGroup, string> = {
  'brown': 'bg-amber-800',
  'light-blue': 'bg-sky-400',
  'pink': 'bg-pink-400',
  'orange': 'bg-orange-500',
  'red': 'bg-red-600',
  'yellow': 'bg-yellow-500',
  'green': 'bg-green-600',
  'dark-blue': 'bg-blue-700',
};

/**
 * Maps a tile position (0-39, clockwise from GO) to CSS grid row/col
 * in an 11x11 grid. Perimeter tiles only.
 *
 * Layout:
 *   Bottom row (positions 0-10): row 11, cols 11→1 (right to left)
 *   Left column (positions 11-19): rows 10→2, col 1
 *   Top row (positions 20-30): row 1, cols 1→11 (left to right)
 *   Right column (positions 31-39): rows 2→10, col 11
 */
export function positionToGridCoords(position: number): { row: number; col: number } {
  if (position <= 10) {
    // Bottom row: GO(0) at bottom-right, moving left
    return { row: 11, col: 11 - position };
  } else if (position <= 19) {
    // Left column: moving up
    return { row: 11 - (position - 10), col: 1 };
  } else if (position <= 30) {
    // Top row: moving right
    return { row: 1, col: position - 19 };
  } else {
    // Right column: moving down
    return { row: position - 29, col: 11 };
  }
}

export const DEFAULT_BOARD: Tile[] = [
  // Bottom row (positions 0-10, right to left visually)
  { position: 0, name: 'GO', tileType: 'go', icon: 'arrow_back', effect: { type: 'collectSalary', amount: 200 } },
  { position: 1, name: 'Mediterranean Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 2, oneHouse: 10, twoHouses: 30, threeHouses: 90, fourHouses: 160, hotel: 250 } },
  { position: 2, name: 'Community Chest', tileType: 'community-chest', icon: 'inventory_2', effect: { type: 'drawCard', deckType: 'community-chest' } },
  { position: 3, name: 'Baltic Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 4, oneHouse: 20, twoHouses: 60, threeHouses: 180, fourHouses: 320, hotel: 450 } },
  { position: 4, name: 'Income Tax', tileType: 'tax', icon: 'account_balance', effect: { type: 'payTax', amount: 200 } },
  { position: 5, name: 'Reading Railroad', tileType: 'railroad', icon: 'train', price: 200, mortgage: 100 },
  { position: 6, name: 'Oriental Avenue', tileType: 'property', colorGroup: 'light-blue', price: 100, mortgage: 50, rent: { base: 6, oneHouse: 30, twoHouses: 90, threeHouses: 270, fourHouses: 400, hotel: 550 } },
  { position: 7, name: 'Chance', tileType: 'chance', icon: 'question_mark', effect: { type: 'drawCard', deckType: 'chance' } },
  { position: 8, name: 'Vermont Avenue', tileType: 'property', colorGroup: 'light-blue', price: 100, mortgage: 50, rent: { base: 6, oneHouse: 30, twoHouses: 90, threeHouses: 270, fourHouses: 400, hotel: 550 } },
  { position: 9, name: 'Connecticut Avenue', tileType: 'property', colorGroup: 'light-blue', price: 120, mortgage: 60, rent: { base: 8, oneHouse: 40, twoHouses: 100, threeHouses: 300, fourHouses: 450, hotel: 600 } },
  { position: 10, name: 'Jail / Just Visiting', tileType: 'jail', icon: 'lock' },

  // Left column (positions 11-19, bottom to top)
  { position: 11, name: 'St. Charles Place', tileType: 'property', colorGroup: 'pink', price: 140, mortgage: 70, rent: { base: 10, oneHouse: 50, twoHouses: 150, threeHouses: 450, fourHouses: 625, hotel: 750 } },
  { position: 12, name: 'Electric Company', tileType: 'utility', icon: 'bolt', price: 150, mortgage: 75 },
  { position: 13, name: 'States Avenue', tileType: 'property', colorGroup: 'pink', price: 140, mortgage: 70, rent: { base: 10, oneHouse: 50, twoHouses: 150, threeHouses: 450, fourHouses: 625, hotel: 750 } },
  { position: 14, name: 'Virginia Avenue', tileType: 'property', colorGroup: 'pink', price: 160, mortgage: 80, rent: { base: 12, oneHouse: 60, twoHouses: 180, threeHouses: 500, fourHouses: 700, hotel: 900 } },
  { position: 15, name: 'Pennsylvania Railroad', tileType: 'railroad', icon: 'train', price: 200, mortgage: 100 },
  { position: 16, name: 'St. James Place', tileType: 'property', colorGroup: 'orange', price: 180, mortgage: 90, rent: { base: 14, oneHouse: 70, twoHouses: 200, threeHouses: 550, fourHouses: 750, hotel: 950 } },
  { position: 17, name: 'Community Chest', tileType: 'community-chest', icon: 'inventory_2', effect: { type: 'drawCard', deckType: 'community-chest' } },
  { position: 18, name: 'Tennessee Avenue', tileType: 'property', colorGroup: 'orange', price: 180, mortgage: 90, rent: { base: 14, oneHouse: 70, twoHouses: 200, threeHouses: 550, fourHouses: 750, hotel: 950 } },
  { position: 19, name: 'New York Avenue', tileType: 'property', colorGroup: 'orange', price: 200, mortgage: 100, rent: { base: 16, oneHouse: 80, twoHouses: 220, threeHouses: 600, fourHouses: 800, hotel: 1000 } },

  // Top row (positions 20-30, left to right)
  { position: 20, name: 'Free Parking', tileType: 'free-parking', icon: 'local_parking' },
  { position: 21, name: 'Kentucky Avenue', tileType: 'property', colorGroup: 'red', price: 220, mortgage: 110, rent: { base: 18, oneHouse: 90, twoHouses: 250, threeHouses: 700, fourHouses: 875, hotel: 1050 } },
  { position: 22, name: 'Chance', tileType: 'chance', icon: 'question_mark', effect: { type: 'drawCard', deckType: 'chance' } },
  { position: 23, name: 'Indiana Avenue', tileType: 'property', colorGroup: 'red', price: 220, mortgage: 110, rent: { base: 18, oneHouse: 90, twoHouses: 250, threeHouses: 700, fourHouses: 875, hotel: 1050 } },
  { position: 24, name: 'Illinois Avenue', tileType: 'property', colorGroup: 'red', price: 240, mortgage: 120, rent: { base: 20, oneHouse: 100, twoHouses: 300, threeHouses: 750, fourHouses: 925, hotel: 1100 } },
  { position: 25, name: 'B&O Railroad', tileType: 'railroad', icon: 'train', price: 200, mortgage: 100 },
  { position: 26, name: 'Atlantic Avenue', tileType: 'property', colorGroup: 'yellow', price: 260, mortgage: 130, rent: { base: 22, oneHouse: 110, twoHouses: 330, threeHouses: 800, fourHouses: 975, hotel: 1150 } },
  { position: 27, name: 'Ventnor Avenue', tileType: 'property', colorGroup: 'yellow', price: 260, mortgage: 130, rent: { base: 22, oneHouse: 110, twoHouses: 330, threeHouses: 800, fourHouses: 975, hotel: 1150 } },
  { position: 28, name: 'Water Works', tileType: 'utility', icon: 'water_drop', price: 150, mortgage: 75 },
  { position: 29, name: 'Marvin Gardens', tileType: 'property', colorGroup: 'yellow', price: 280, mortgage: 140, rent: { base: 24, oneHouse: 120, twoHouses: 360, threeHouses: 850, fourHouses: 1025, hotel: 1200 } },
  { position: 30, name: 'Go To Jail', tileType: 'go-to-jail', icon: 'gavel', effect: { type: 'goToJail' } },

  // Right column (positions 31-39, top to bottom)
  { position: 31, name: 'Pacific Avenue', tileType: 'property', colorGroup: 'green', price: 300, mortgage: 150, rent: { base: 26, oneHouse: 130, twoHouses: 390, threeHouses: 900, fourHouses: 1100, hotel: 1275 } },
  { position: 32, name: 'North Carolina Avenue', tileType: 'property', colorGroup: 'green', price: 300, mortgage: 150, rent: { base: 26, oneHouse: 130, twoHouses: 390, threeHouses: 900, fourHouses: 1100, hotel: 1275 } },
  { position: 33, name: 'Community Chest', tileType: 'community-chest', icon: 'inventory_2', effect: { type: 'drawCard', deckType: 'community-chest' } },
  { position: 34, name: 'Pennsylvania Avenue', tileType: 'property', colorGroup: 'green', price: 320, mortgage: 160, rent: { base: 28, oneHouse: 150, twoHouses: 450, threeHouses: 1000, fourHouses: 1200, hotel: 1400 } },
  { position: 35, name: 'Short Line Railroad', tileType: 'railroad', icon: 'train', price: 200, mortgage: 100 },
  { position: 36, name: 'Chance', tileType: 'chance', icon: 'question_mark', effect: { type: 'drawCard', deckType: 'chance' } },
  { position: 37, name: 'Park Place', tileType: 'property', colorGroup: 'dark-blue', price: 350, mortgage: 175, rent: { base: 35, oneHouse: 175, twoHouses: 500, threeHouses: 1100, fourHouses: 1300, hotel: 1500 } },
  { position: 38, name: 'Luxury Tax', tileType: 'tax', icon: 'diamond', effect: { type: 'payTax', amount: 100 } },
  { position: 39, name: 'Boardwalk', tileType: 'property', colorGroup: 'dark-blue', price: 400, mortgage: 200, rent: { base: 50, oneHouse: 200, twoHouses: 600, threeHouses: 1400, fourHouses: 1700, hotel: 2000 } },
];
