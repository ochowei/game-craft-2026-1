export type TokenCategory = 'pawn' | 'currency' | 'dice' | 'marker';

export interface Token {
  id: string;
  name: string;
  category: TokenCategory;
  icon: string;
  description: string;
  quantity: number;
  value?: number;
  sides?: number;
}

export const DEFAULT_TOKENS: Token[] = [
  // Pawns
  { id: 'pawn-1', name: 'Top Hat', category: 'pawn', icon: 'checkroom', description: 'Classic gentleman\'s top hat piece.', quantity: 1 },
  { id: 'pawn-2', name: 'Race Car', category: 'pawn', icon: 'directions_car', description: 'Speedy race car piece.', quantity: 1 },
  { id: 'pawn-3', name: 'Dog', category: 'pawn', icon: 'pets', description: 'Loyal terrier companion.', quantity: 1 },
  { id: 'pawn-4', name: 'Iron', category: 'pawn', icon: 'iron', description: 'Old-fashioned flat iron.', quantity: 1 },
  { id: 'pawn-5', name: 'Battleship', category: 'pawn', icon: 'sailing', description: 'Mighty battleship piece.', quantity: 1 },
  { id: 'pawn-6', name: 'Boot', category: 'pawn', icon: 'hiking', description: 'Sturdy walking boot.', quantity: 1 },

  // Currency
  { id: 'bill-1', name: '$1 Bill', category: 'currency', icon: 'payments', description: 'One dollar bill.', quantity: 40, value: 1 },
  { id: 'bill-5', name: '$5 Bill', category: 'currency', icon: 'payments', description: 'Five dollar bill.', quantity: 40, value: 5 },
  { id: 'bill-10', name: '$10 Bill', category: 'currency', icon: 'payments', description: 'Ten dollar bill.', quantity: 40, value: 10 },
  { id: 'bill-20', name: '$20 Bill', category: 'currency', icon: 'payments', description: 'Twenty dollar bill.', quantity: 40, value: 20 },
  { id: 'bill-50', name: '$50 Bill', category: 'currency', icon: 'payments', description: 'Fifty dollar bill.', quantity: 40, value: 50 },
  { id: 'bill-100', name: '$100 Bill', category: 'currency', icon: 'payments', description: 'One hundred dollar bill.', quantity: 30, value: 100 },
  { id: 'bill-500', name: '$500 Bill', category: 'currency', icon: 'payments', description: 'Five hundred dollar bill.', quantity: 20, value: 500 },

  // Dice
  { id: 'dice-1', name: 'Standard D6', category: 'dice', icon: 'casino', description: 'Standard six-sided die.', quantity: 2, sides: 6 },

  // Markers
  { id: 'marker-house', name: 'House', category: 'marker', icon: 'home', description: 'Property improvement marker (house).', quantity: 32 },
  { id: 'marker-hotel', name: 'Hotel', category: 'marker', icon: 'domain', description: 'Property improvement marker (hotel).', quantity: 12 },
  { id: 'marker-title', name: 'Title Deed', category: 'marker', icon: 'description', description: 'Property ownership card.', quantity: 28 },
];
