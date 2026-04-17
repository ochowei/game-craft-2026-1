import React, { createContext, useContext, useEffect, useState } from 'react';
import { Tile, RentStructure, DEFAULT_BOARD } from '../domain/board';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

interface BoardDoc {
  tiles: Tile[];
}

type BoardDataAction =
  | { type: 'UPDATE_TILE'; position: number; field: string; value: unknown }
  | { type: 'UPDATE_RENT'; position: number; field: keyof RentStructure; value: number };

type BoardAction =
  | { type: 'SELECT_TILE'; position: number }
  | BoardDataAction;

interface BoardContextValue {
  tiles: Tile[];
  selectedTileId: number | null;
  dispatch: React.Dispatch<BoardAction>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

function boardDataReducer(state: BoardDoc, action: BoardDataAction | RemoteSyncAction<BoardDoc>): BoardDoc {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return { tiles: action.value.tiles ?? [] };
    case 'UPDATE_TILE':
      return {
        tiles: state.tiles.map((t) => t.position === action.position ? { ...t, [action.field]: action.value } : t),
      };
    case 'UPDATE_RENT':
      return {
        tiles: state.tiles.map((t) => t.position === action.position && t.rent
          ? { ...t, rent: { ...t.rent, [action.field]: action.value } }
          : t),
      };
    default:
      return state;
  }
}

interface BoardProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function BoardProvider({ children, activeProjectId }: BoardProviderProps) {
  const { state, dispatch: dispatchData, status } = useFirestoreDoc<BoardDoc, BoardDataAction>(
    `projects/${activeProjectId}/design/board`,
    { defaults: { tiles: DEFAULT_BOARD }, reducer: boardDataReducer },
  );

  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const { report } = useSyncStatus();
  useEffect(() => { report('board', status); }, [status, report]);

  const dispatch: React.Dispatch<BoardAction> = (action) => {
    if (action.type === 'SELECT_TILE') {
      setSelectedTileId(action.position);
      return;
    }
    dispatchData(action);
  };

  return (
    <BoardContext.Provider value={{ tiles: state.tiles, selectedTileId, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within a BoardProvider');
  return context;
}
