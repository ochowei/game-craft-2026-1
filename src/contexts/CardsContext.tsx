import React, { createContext, useContext, useEffect, useState } from 'react';
import { Card, CardType, DEFAULT_CARDS } from '../domain/cards';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

interface CardsDoc {
  cards: Card[];
}

type CardsDataAction =
  | { type: 'UPDATE_CARD'; cardId: string; field: keyof Card; value: string }
  | { type: 'ADD_CARD'; deckType: CardType }
  | { type: 'DELETE_CARD'; cardId: string };

type CardsAction =
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'UPDATE_CARD'; cardId: string; field: keyof Card; value: string }
  | { type: 'SET_ACTIVE_DECK'; deckType: CardType }
  | { type: 'ADD_CARD' }
  | { type: 'DELETE_CARD'; cardId: string };

interface CardsContextValue {
  cards: Card[];
  activeDeckType: CardType;
  selectedCardId: string | null;
  dispatch: React.Dispatch<CardsAction>;
}

const CardsContext = createContext<CardsContextValue | null>(null);

function getFirstCardId(cards: Card[], deckType: CardType): string | null {
  return cards.find((c) => c.type === deckType)?.id ?? null;
}

function cardsDataReducer(state: CardsDoc, action: CardsDataAction | RemoteSyncAction<CardsDoc>): CardsDoc {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return { cards: action.value.cards ?? [] };
    case 'UPDATE_CARD':
      return {
        cards: state.cards.map((c) => c.id === action.cardId ? { ...c, [action.field]: action.value } : c),
      };
    case 'ADD_CARD': {
      const prefix = action.deckType === 'chance' ? 'CHN' : 'COM';
      const newCard: Card = {
        id: `${prefix}-${Date.now()}`,
        title: 'NEW CARD',
        description: 'Card description.',
        type: action.deckType,
        icon: 'help',
        accentColor: action.deckType === 'chance' ? 'orange' : 'blue',
      };
      return { cards: [...state.cards, newCard] };
    }
    case 'DELETE_CARD':
      return { cards: state.cards.filter((c) => c.id !== action.cardId) };
    default:
      return state;
  }
}

interface CardsProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function CardsProvider({ children, activeProjectId }: CardsProviderProps) {
  const { state, dispatch: dispatchData, status } = useFirestoreDoc<CardsDoc, CardsDataAction>(
    `projects/${activeProjectId}/design/cards`,
    { defaults: { cards: DEFAULT_CARDS }, reducer: cardsDataReducer },
  );

  const [activeDeckType, setActiveDeckType] = useState<CardType>('chance');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    getFirstCardId(state.cards, 'chance'),
  );

  const { report } = useSyncStatus();
  useEffect(() => { report('cards', status); }, [status, report]);

  // Keep selectedCardId valid when cards change (e.g., after ADD_CARD or DELETE_CARD)
  useEffect(() => {
    if (selectedCardId && state.cards.some((c) => c.id === selectedCardId)) return;
    setSelectedCardId(getFirstCardId(state.cards, activeDeckType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cards]);

  const dispatch: React.Dispatch<CardsAction> = (action) => {
    switch (action.type) {
      case 'SELECT_CARD':
        setSelectedCardId(action.cardId);
        return;
      case 'SET_ACTIVE_DECK':
        setActiveDeckType(action.deckType);
        setSelectedCardId(getFirstCardId(state.cards, action.deckType));
        return;
      case 'ADD_CARD':
        dispatchData({ type: 'ADD_CARD', deckType: activeDeckType });
        return;
      case 'DELETE_CARD':
        dispatchData({ type: 'DELETE_CARD', cardId: action.cardId });
        if (selectedCardId === action.cardId) setSelectedCardId(null);
        return;
      case 'UPDATE_CARD':
        dispatchData({ type: 'UPDATE_CARD', cardId: action.cardId, field: action.field, value: action.value });
        return;
    }
  };

  return (
    <CardsContext.Provider value={{ cards: state.cards, activeDeckType, selectedCardId, dispatch }}>
      {children}
    </CardsContext.Provider>
  );
}

export function useCards(): CardsContextValue {
  const context = useContext(CardsContext);
  if (!context) throw new Error('useCards must be used within a CardsProvider');
  return context;
}
