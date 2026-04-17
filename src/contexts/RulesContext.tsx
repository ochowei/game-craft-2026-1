import React, { createContext, useContext, useEffect } from 'react';
import { Rules, DEFAULT_RULES } from '../domain/rules';
import { useFirestoreDoc, type RemoteSyncAction } from '../hooks/useFirestoreDoc';
import { useSyncStatus } from './SyncStatusContext';

type RulesAction =
  | { type: 'UPDATE_FIELD'; section: keyof Rules; field: string; value: unknown }
  | { type: 'RESET' };

interface RulesContextValue {
  rules: Rules;
  dispatch: React.Dispatch<RulesAction>;
}

const RulesContext = createContext<RulesContextValue | null>(null);

function rulesReducer(state: Rules, action: RulesAction | RemoteSyncAction<Rules>): Rules {
  switch (action.type) {
    case '__REMOTE_SYNC__':
      return action.value;
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.section]: {
          ...state[action.section],
          [action.field]: action.value,
        },
      };
    case 'RESET':
      return DEFAULT_RULES;
    default:
      return state;
  }
}

interface RulesProviderProps {
  children: React.ReactNode;
  activeProjectId: string;
}

export function RulesProvider({ children, activeProjectId }: RulesProviderProps) {
  const { state: rules, dispatch, status } = useFirestoreDoc<Rules, RulesAction>(
    `projects/${activeProjectId}/design/rules`,
    { defaults: DEFAULT_RULES, reducer: rulesReducer },
  );

  const { report } = useSyncStatus();
  useEffect(() => { report('rules', status); }, [status, report]);

  return (
    <RulesContext.Provider value={{ rules, dispatch }}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules(): RulesContextValue {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules must be used within a RulesProvider');
  }
  return context;
}
