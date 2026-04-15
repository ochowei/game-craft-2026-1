import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Tile, RentStructure, DEFAULT_BOARD } from '../domain/board';
import { loadState, saveState } from '../lib/storage';

const STORAGE_KEY = 'gamecraft:board';

interface BoardState {
  tiles: Tile[];
  selectedTileId: number | null;
}

type BoardAction =
  | { type: 'SELECT_TILE'; position: number }
  | { type: 'UPDATE_TILE'; position: number; field: string; value: unknown }
  | { type: 'UPDATE_RENT'; position: number; field: keyof RentStructure; value: number };

interface BoardContextValue extends BoardState {
  dispatch: React.Dispatch<BoardAction>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SELECT_TILE':
      return { ...state, selectedTileId: action.position };

    case 'UPDATE_TILE':
      return {
        ...state,
        tiles: state.tiles.map((t) =>
          t.position === action.position ? { ...t, [action.field]: action.value } : t,
        ),
      };

    case 'UPDATE_RENT':
      return {
        ...state,
        tiles: state.tiles.map((t) =>
          t.position === action.position && t.rent
            ? { ...t, rent: { ...t.rent, [action.field]: action.value } }
            : t,
        ),
      };

    default:
      return state;
  }
}

function createInitialState(): BoardState {
  return {
    tiles: loadState<Tile[]>(STORAGE_KEY, DEFAULT_BOARD),
    selectedTileId: null,
  };
}

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, null, createInitialState);

  useEffect(() => { saveState(STORAGE_KEY, state.tiles); }, [state.tiles]);

  return (
    <BoardContext.Provider value={{ ...state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}
