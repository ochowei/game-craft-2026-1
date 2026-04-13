export type Screen = 'board' | 'cards' | 'rules' | 'tokens' | 'library' | 'settings';

export interface GameConfig {
  startingCash: number;
  salary: number;
  minPlayers: number;
  maxPlayers: number;
  allowAI: boolean;
  spectatorMode: boolean;
  doubleRentOnSets: boolean;
  mandatoryAuctions: boolean;
  instantBankruptcy: boolean;
  auctionStartingBid: number;
  auctionBidIncrement: string;
  auctionTimerDuration: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  type: 'chance' | 'community-chest';
  icon: string;
  accentColor: string;
}
