import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// When FIRESTORE_EMULATOR_HOST is set, the Admin SDK connects to the emulator
// automatically — no credentials needed.
const app = initializeApp({ projectId: 'fiery-splice-321104' });
const db = getFirestore(app);

async function seed() {
  console.log('Seeding Firestore emulator...');

  // Seed a test user profile
  const testUserId = 'test-user-001';
  await db.doc(`users/${testUserId}/profile/main`).set({
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.png',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  });
  console.log('  ✓ User profile');

  // Seed user settings
  await db.doc(`users/${testUserId}/settings/preferences`).set({
    language: 'en',
    theme: 'dark',
    autosave: true,
    gridSnap: true,
    highPerformance: false,
    updatedAt: new Date(),
  });
  console.log('  ✓ User settings');

  // Seed board data (first 10 tiles as sample)
  const sampleTiles = [
    { position: 0, name: 'GO', tileType: 'go', icon: 'arrow_back', effect: { type: 'collectSalary', amount: 200 } },
    { position: 1, name: 'Mediterranean Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 2, oneHouse: 10, twoHouses: 30, threeHouses: 90, fourHouses: 160, hotel: 250 } },
    { position: 2, name: 'Community Chest', tileType: 'community-chest', icon: 'inventory_2', effect: { type: 'drawCard', deckType: 'community-chest' } },
    { position: 3, name: 'Baltic Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 4, oneHouse: 20, twoHouses: 60, threeHouses: 180, fourHouses: 320, hotel: 450 } },
    { position: 4, name: 'Income Tax', tileType: 'tax', icon: 'account_balance', effect: { type: 'payTax', amount: 200 } },
  ];

  const boardRef = db.doc(`users/${testUserId}/gameData/board`);
  await boardRef.set({ tiles: sampleTiles });
  console.log('  ✓ Board data (5 sample tiles)');

  // Seed cards
  const sampleCards = [
    { id: 'CHN-004', title: 'ADVANCE TO GO', description: 'Collect $200 salary as you pass through start.', type: 'chance', icon: 'rocket_launch', accentColor: 'orange' },
    { id: 'COM-001', title: 'BANK ERROR IN YOUR FAVOR', description: 'Collect $200.', type: 'community-chest', icon: 'payments', accentColor: 'blue' },
  ];

  const cardsRef = db.doc(`users/${testUserId}/gameData/cards`);
  await cardsRef.set({ cards: sampleCards });
  console.log('  ✓ Cards data');

  // Seed rules
  const rules = {
    economy: { startingCash: 1500, salary: 200 },
    players: { minPlayers: 2, maxPlayers: 8, allowAI: true, spectatorMode: false },
    mechanics: { doubleRentOnSets: true, mandatoryAuctions: true, instantBankruptcy: false },
    auction: { startingBid: 10, bidIncrement: '$10 Scaled', timerDuration: '30 Seconds' },
  };

  const rulesRef = db.doc(`users/${testUserId}/gameData/rules`);
  await rulesRef.set(rules);
  console.log('  ✓ Rules data');

  // Seed tokens
  const sampleTokens = [
    { id: 'pawn-1', name: 'Top Hat', category: 'pawn', icon: 'checkroom', description: 'Classic gentleman\'s top hat piece.', quantity: 1 },
    { id: 'pawn-2', name: 'Race Car', category: 'pawn', icon: 'directions_car', description: 'Speedy race car piece.', quantity: 1 },
    { id: 'dice-1', name: 'Standard D6', category: 'dice', icon: 'casino', description: 'Standard six-sided die.', quantity: 2, sides: 6 },
  ];

  const tokensRef = db.doc(`users/${testUserId}/gameData/tokens`);
  await tokensRef.set({ tokens: sampleTokens });
  console.log('  ✓ Tokens data');

  console.log('\nDone! View data at http://localhost:4000/firestore');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
