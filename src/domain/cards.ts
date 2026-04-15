export type CardType = 'chance' | 'community-chest';

export interface Card {
  id: string;
  title: string;
  description: string;
  type: CardType;
  icon: string;
  accentColor: string;
}

export const DEFAULT_CARDS: Card[] = [
  {
    id: 'CHN-004',
    title: 'ADVANCE TO GO',
    description: 'Collect $200 salary as you pass through start.',
    type: 'chance',
    icon: 'rocket_launch',
    accentColor: 'orange',
  },
  {
    id: 'CHN-012',
    title: 'GO TO JAIL',
    description: 'Go directly to Jail. Do not pass GO, do not collect $200.',
    type: 'chance',
    icon: 'gavel',
    accentColor: 'orange',
  },
  {
    id: 'CHN-009',
    title: 'CHAIRMAN OF THE BOARD',
    description: 'Pay each player $50.',
    type: 'chance',
    icon: 'workspace_premium',
    accentColor: 'orange',
  },
  {
    id: 'COM-001',
    title: 'BANK ERROR IN YOUR FAVOR',
    description: 'Collect $200.',
    type: 'community-chest',
    icon: 'payments',
    accentColor: 'blue',
  },
  {
    id: 'COM-002',
    title: 'DOCTOR\'S FEES',
    description: 'Pay $50.',
    type: 'community-chest',
    icon: 'local_hospital',
    accentColor: 'blue',
  },
];
