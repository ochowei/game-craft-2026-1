import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// When FIRESTORE_EMULATOR_HOST is set, the Admin SDK connects to the emulator
// automatically — no credentials needed.
const app = initializeApp({ projectId: 'fiery-splice-321104' });
const db = getFirestore(app);

async function seed() {
  console.log('Seeding Firestore emulator...');

  const uid = 'test-user-001';
  const projectId = 'p_demo';

  // User profile (with lastOpenedProjectId so the user lands straight in the demo project)
  await db.doc(`users/${uid}/profile/main`).set({
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.png',
    createdAt: new Date(),
    lastLoginAt: new Date(),
    lastOpenedProjectId: projectId,
  });
  console.log('  ✓ User profile (with lastOpenedProjectId)');

  // Public profile (what collection-group email lookup hits)
  await db.doc(`users/${uid}/publicProfile/main`).set({
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.png',
    updatedAt: new Date(),
  });
  console.log('  ✓ Public profile for test-user-001');

  // User settings
  await db.doc(`users/${uid}/settings/preferences`).set({
    language: 'en',
    theme: 'dark',
    autosave: true,
    gridSnap: true,
    highPerformance: false,
    updatedAt: new Date(),
  });
  console.log('  ✓ User settings');

  // Demo project + reverse-index projectRef
  await db.doc(`projects/${projectId}`).set({
    id: projectId,
    ownerId: uid,
    members: { [uid]: 'owner' },
    name: 'Demo Project',
    description: 'Seeded demo for local development.',
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
  });
  await db.doc(`users/${uid}/projectRefs/${projectId}`).set({
    role: 'owner',
    addedAt: new Date(),
    lastOpenedAt: new Date(),
  });
  console.log('  ✓ Project + projectRef');

  // Design subdocuments: board, cards, rules, tokens
  await db.doc(`projects/${projectId}/design/board`).set({
    tiles: [
      { position: 0, name: 'GO', tileType: 'go', icon: 'arrow_back', effect: { type: 'collectSalary', amount: 200 } },
      { position: 1, name: 'Mediterranean Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 2, oneHouse: 10, twoHouses: 30, threeHouses: 90, fourHouses: 160, hotel: 250 } },
      { position: 2, name: 'Community Chest', tileType: 'community-chest', icon: 'inventory_2', effect: { type: 'drawCard', deckType: 'community-chest' } },
      { position: 3, name: 'Baltic Avenue', tileType: 'property', colorGroup: 'brown', price: 60, mortgage: 30, rent: { base: 4, oneHouse: 20, twoHouses: 60, threeHouses: 180, fourHouses: 320, hotel: 450 } },
      { position: 4, name: 'Income Tax', tileType: 'tax', icon: 'account_balance', effect: { type: 'payTax', amount: 200 } },
    ],
  });
  await db.doc(`projects/${projectId}/design/cards`).set({
    cards: [
      { id: 'CHN-004', title: 'ADVANCE TO GO', description: 'Collect $200 salary as you pass through start.', type: 'chance', icon: 'rocket_launch', accentColor: 'orange' },
      { id: 'COM-001', title: 'BANK ERROR IN YOUR FAVOR', description: 'Collect $200.', type: 'community-chest', icon: 'payments', accentColor: 'blue' },
    ],
  });
  await db.doc(`projects/${projectId}/design/rules`).set({
    economy: { startingCash: 1500, salary: 200 },
    players: { minPlayers: 2, maxPlayers: 8, allowAI: true, spectatorMode: false },
    mechanics: { doubleRentOnSets: true, mandatoryAuctions: true, instantBankruptcy: false },
    auction: { startingBid: 10, bidIncrement: '$10 Scaled', timerDuration: '30 Seconds' },
  });
  await db.doc(`projects/${projectId}/design/tokens`).set({
    tokens: [
      { id: 'pawn-1', name: 'Top Hat', category: 'pawn', icon: 'checkroom', description: "Classic gentleman's top hat piece.", quantity: 1 },
      { id: 'pawn-2', name: 'Race Car', category: 'pawn', icon: 'directions_car', description: 'Speedy race car piece.', quantity: 1 },
      { id: 'dice-1', name: 'Standard D6', category: 'dice', icon: 'casino', description: 'Standard six-sided die.', quantity: 2, sides: 6 },
    ],
  });
  console.log('  ✓ Design subdocs (board, cards, rules, tokens)');

  // Second user — shared as editor on the demo project (targets add-by-email flow)
  const uid2 = 'test-user-002';
  await db.doc(`users/${uid2}/profile/main`).set({
    displayName: 'Test Editor',
    email: 'editor@example.com',
    photoURL: 'https://example.com/avatar2.png',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  });
  await db.doc(`users/${uid2}/publicProfile/main`).set({
    displayName: 'Test Editor',
    email: 'editor@example.com',
    photoURL: 'https://example.com/avatar2.png',
    updatedAt: new Date(),
  });
  console.log('  ✓ Second user (test-user-002) + publicProfile');

  await db.doc(`projects/${projectId}`).set(
    { members: { [uid]: 'owner', [uid2]: 'editor' }, updatedAt: new Date() },
    { merge: true },
  );
  await db.doc(`users/${uid2}/projectRefs/${projectId}`).set({
    role: 'editor',
    addedAt: new Date(),
  });
  console.log('  ✓ Demo project shared with test-user-002 as editor');

  console.log('\nDone! View data at http://localhost:4000/firestore');
  console.log(`Log in as ${uid} in the emulator Auth tab, then reload the app.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
