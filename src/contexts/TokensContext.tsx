import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Token, TokenCategory, DEFAULT_TOKENS } from '../domain/tokens';
import { loadState, saveState } from '../lib/storage';

const STORAGE_KEY = 'gamecraft:tokens';

type CategoryFilter = TokenCategory | 'all';

interface TokensState {
  tokens: Token[];
  activeCategory: CategoryFilter;
  selectedTokenId: string | null;
}

type TokensAction =
  | { type: 'SELECT_TOKEN'; tokenId: string }
  | { type: 'UPDATE_TOKEN'; tokenId: string; field: keyof Token; value: unknown }
  | { type: 'SET_CATEGORY'; category: CategoryFilter }
  | { type: 'ADD_TOKEN' }
  | { type: 'DELETE_TOKEN'; tokenId: string };

interface TokensContextValue extends TokensState {
  dispatch: React.Dispatch<TokensAction>;
}

const TokensContext = createContext<TokensContextValue | null>(null);

function getFirstTokenId(tokens: Token[], category: CategoryFilter): string | null {
  const first = category === 'all' ? tokens[0] : tokens.find((t) => t.category === category);
  return first?.id ?? null;
}

function tokensReducer(state: TokensState, action: TokensAction): TokensState {
  switch (action.type) {
    case 'SELECT_TOKEN':
      return { ...state, selectedTokenId: action.tokenId };

    case 'UPDATE_TOKEN':
      return {
        ...state,
        tokens: state.tokens.map((t) =>
          t.id === action.tokenId ? { ...t, [action.field]: action.value } : t,
        ),
      };

    case 'SET_CATEGORY': {
      const selectedTokenId = getFirstTokenId(state.tokens, action.category);
      return { ...state, activeCategory: action.category, selectedTokenId };
    }

    case 'ADD_TOKEN': {
      const category = state.activeCategory === 'all' ? 'pawn' : state.activeCategory;
      const newToken: Token = {
        id: `token-${Date.now()}`,
        name: 'New Token',
        category,
        icon: 'help',
        description: 'A new game token.',
        quantity: 1,
      };
      return {
        ...state,
        tokens: [...state.tokens, newToken],
        selectedTokenId: newToken.id,
      };
    }

    case 'DELETE_TOKEN': {
      const tokens = state.tokens.filter((t) => t.id !== action.tokenId);
      const selectedTokenId =
        state.selectedTokenId === action.tokenId
          ? getFirstTokenId(tokens, state.activeCategory)
          : state.selectedTokenId;
      return { ...state, tokens, selectedTokenId };
    }

    default:
      return state;
  }
}

function createInitialState(): TokensState {
  const tokens = loadState<Token[]>(STORAGE_KEY, DEFAULT_TOKENS);
  return {
    tokens,
    activeCategory: 'all',
    selectedTokenId: tokens[0]?.id ?? null,
  };
}

export function TokensProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tokensReducer, null, createInitialState);

  useEffect(() => { saveState(STORAGE_KEY, state.tokens); }, [state.tokens]);

  return (
    <TokensContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TokensContext.Provider>
  );
}

export function useTokens(): TokensContextValue {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokensProvider');
  }
  return context;
}
