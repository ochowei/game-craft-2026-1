import React, { createContext, useContext, useEffect, useState } from 'react';
import { Token, TokenCategory, DEFAULT_TOKENS } from '../domain/tokens';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

type CategoryFilter = TokenCategory | 'all';

interface TokensDoc {
  tokens: Token[];
}

type TokensDataAction =
  | { type: 'UPDATE_TOKEN'; tokenId: string; field: keyof Token; value: unknown }
  | { type: 'ADD_TOKEN'; category: TokenCategory }
  | { type: 'DELETE_TOKEN'; tokenId: string };

type TokensAction =
  | { type: 'SELECT_TOKEN'; tokenId: string }
  | { type: 'SET_CATEGORY'; category: CategoryFilter }
  | { type: 'UPDATE_TOKEN'; tokenId: string; field: keyof Token; value: unknown }
  | { type: 'ADD_TOKEN' }
  | { type: 'DELETE_TOKEN'; tokenId: string };

interface TokensContextValue {
  tokens: Token[];
  activeCategory: CategoryFilter;
  selectedTokenId: string | null;
  dispatch: React.Dispatch<TokensAction>;
}

const TokensContext = createContext<TokensContextValue | null>(null);

function getFirstTokenId(tokens: Token[], category: CategoryFilter): string | null {
  const first = category === 'all' ? tokens[0] : tokens.find((t) => t.category === category);
  return first?.id ?? null;
}

function tokensDataReducer(state: TokensDoc, action: TokensDataAction | RemoteSyncAction<TokensDoc>): TokensDoc {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return { tokens: action.value.tokens ?? [] };
    case 'UPDATE_TOKEN':
      return {
        tokens: state.tokens.map((t) => t.id === action.tokenId ? { ...t, [action.field]: action.value } : t),
      };
    case 'ADD_TOKEN': {
      const newToken: Token = {
        id: `token-${Date.now()}`,
        name: 'New Token',
        category: action.category,
        icon: 'help',
        description: 'A new game token.',
        quantity: 1,
      };
      return { tokens: [...state.tokens, newToken] };
    }
    case 'DELETE_TOKEN':
      return { tokens: state.tokens.filter((t) => t.id !== action.tokenId) };
    default:
      return state;
  }
}

interface TokensProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function TokensProvider({ children, activeProjectId }: TokensProviderProps) {
  const { state, dispatch: dispatchData, status } = useFirestoreDoc<TokensDoc, TokensDataAction>(
    `projects/${activeProjectId}/design/tokens`,
    { defaults: { tokens: DEFAULT_TOKENS }, reducer: tokensDataReducer },
  );

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(state.tokens[0]?.id ?? null);
  const { report } = useSyncStatus();
  useEffect(() => { report('tokens', status); }, [status, report]);

  useEffect(() => {
    if (selectedTokenId && state.tokens.some((t) => t.id === selectedTokenId)) return;
    setSelectedTokenId(getFirstTokenId(state.tokens, activeCategory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tokens]);

  const dispatch: React.Dispatch<TokensAction> = (action) => {
    switch (action.type) {
      case 'SELECT_TOKEN':
        setSelectedTokenId(action.tokenId);
        return;
      case 'SET_CATEGORY':
        setActiveCategory(action.category);
        setSelectedTokenId(getFirstTokenId(state.tokens, action.category));
        return;
      case 'ADD_TOKEN': {
        const cat: TokenCategory = activeCategory === 'all' ? 'pawn' : activeCategory;
        dispatchData({ type: 'ADD_TOKEN', category: cat });
        return;
      }
      case 'DELETE_TOKEN':
        dispatchData({ type: 'DELETE_TOKEN', tokenId: action.tokenId });
        if (selectedTokenId === action.tokenId) setSelectedTokenId(null);
        return;
      case 'UPDATE_TOKEN':
        dispatchData(action);
        return;
    }
  };

  return (
    <TokensContext.Provider value={{ tokens: state.tokens, activeCategory, selectedTokenId, dispatch }}>
      {children}
    </TokensContext.Provider>
  );
}

export function useTokens(): TokensContextValue {
  const context = useContext(TokensContext);
  if (!context) throw new Error('useTokens must be used within a TokensProvider');
  return context;
}
