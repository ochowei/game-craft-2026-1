export interface RulesEconomy {
  startingCash: number;
  salary: number;
}

export interface RulesPlayers {
  minPlayers: number;
  maxPlayers: number;
  allowAI: boolean;
  spectatorMode: boolean;
}

export interface RulesMechanics {
  doubleRentOnSets: boolean;
  mandatoryAuctions: boolean;
  instantBankruptcy: boolean;
}

export type BidIncrement = '$1 Fixed' | '$5 Minimum' | '$10 Scaled';
export type TimerDuration = '15 Seconds' | '30 Seconds' | 'Unlimited';

export interface RulesAuction {
  startingBid: number;
  bidIncrement: BidIncrement;
  timerDuration: TimerDuration;
}

export interface Rules {
  economy: RulesEconomy;
  players: RulesPlayers;
  mechanics: RulesMechanics;
  auction: RulesAuction;
}

export const DEFAULT_RULES: Rules = {
  economy: {
    startingCash: 1500,
    salary: 200,
  },
  players: {
    minPlayers: 2,
    maxPlayers: 8,
    allowAI: true,
    spectatorMode: false,
  },
  mechanics: {
    doubleRentOnSets: true,
    mandatoryAuctions: true,
    instantBankruptcy: false,
  },
  auction: {
    startingBid: 10,
    bidIncrement: '$10 Scaled',
    timerDuration: '30 Seconds',
  },
};
