import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Card, CardType, DEFAULT_CARDS } from '../domain/cards';
import { loadState, saveState } from '../lib/storage';

const STORAGE_KEY = 'gamecraft:cards';

interface CardsState {
  cards: Card[];
  activeDeckType: CardType;
  selectedCardId: string | null;
}

type CardsAction =
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'UPDATE_CARD'; cardId: string; field: keyof Card; value: string }
  | { type: 'SET_ACTIVE_DECK'; deckType: CardType }
  | { type: 'ADD_CARD' }
  | { type: 'DELETE_CARD'; cardId: string };

interface CardsContextValue extends CardsState {
  dispatch: React.Dispatch<CardsAction>;
}

const CardsContext = createContext<CardsContextValue | null>(null);

function getFirstCardId(cards: Card[], deckType: CardType): string | null {
  const first = cards.find((c) => c.type === deckType);
  return first?.id ?? null;
}

function cardsReducer(state: CardsState, action: CardsAction): CardsState {
  switch (action.type) {
    case 'SELECT_CARD':
      return { ...state, selectedCardId: action.cardId };

    case 'UPDATE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.cardId ? { ...c, [action.field]: action.value } : c,
        ),
      };

    case 'SET_ACTIVE_DECK': {
      const selectedCardId = getFirstCardId(state.cards, action.deckType);
      return { ...state, activeDeckType: action.deckType, selectedCardId };
    }

    case 'ADD_CARD': {
      const prefix = state.activeDeckType === 'chance' ? 'CHN' : 'COM';
      const newCard: Card = {
        id: `${prefix}-${Date.now()}`,
        title: 'NEW CARD',
        description: 'Card description.',
        type: state.activeDeckType,
        icon: 'help',
        accentColor: state.activeDeckType === 'chance' ? 'orange' : 'blue',
      };
      return {
        ...state,
        cards: [...state.cards, newCard],
        selectedCardId: newCard.id,
      };
    }

    case 'DELETE_CARD': {
      const cards = state.cards.filter((c) => c.id !== action.cardId);
      const selectedCardId =
        state.selectedCardId === action.cardId
          ? getFirstCardId(cards, state.activeDeckType)
          : state.selectedCardId;
      return { ...state, cards, selectedCardId };
    }

    default:
      return state;
  }
}

const initialState: CardsState = {
  cards: DEFAULT_CARDS,
  activeDeckType: 'chance',
  selectedCardId: getFirstCardId(DEFAULT_CARDS, 'chance'),
};

function createInitialState(): CardsState {
  const cards = loadState<Card[]>(STORAGE_KEY, DEFAULT_CARDS);
  return {
    cards,
    activeDeckType: 'chance',
    selectedCardId: getFirstCardId(cards, 'chance'),
  };
}

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cardsReducer, null, createInitialState);

  useEffect(() => { saveState(STORAGE_KEY, state.cards); }, [state.cards]);

  return (
    <CardsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </CardsContext.Provider>
  );
}

export function useCards(): CardsContextValue {
  const context = useContext(CardsContext);
  if (!context) {
    throw new Error('useCards must be used within a CardsProvider');
  }
  return context;
}
