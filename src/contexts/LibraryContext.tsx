import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { LibraryItem, LibraryItemType, DEFAULT_LIBRARY } from '../domain/library';
import { loadState, saveState } from '../lib/storage';

const STORAGE_KEY = 'gamecraft:library';

type LibraryFilter = LibraryItemType | 'all';

interface LibraryState {
  items: LibraryItem[];
  activeFilter: LibraryFilter;
}

type LibraryAction =
  | { type: 'ADD_ITEM'; item: LibraryItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'SET_FILTER'; filter: LibraryFilter };

interface LibraryContextValue extends LibraryState {
  dispatch: React.Dispatch<LibraryAction>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.item] };

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.itemId) };

    case 'SET_FILTER':
      return { ...state, activeFilter: action.filter };

    default:
      return state;
  }
}

function createInitialState(): LibraryState {
  return {
    items: loadState<LibraryItem[]>(STORAGE_KEY, DEFAULT_LIBRARY),
    activeFilter: 'all',
  };
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, null, createInitialState);

  useEffect(() => { saveState(STORAGE_KEY, state.items); }, [state.items]);

  return (
    <LibraryContext.Provider value={{ ...state, dispatch }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
