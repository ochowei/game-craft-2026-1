import React, { createContext, useContext, useReducer } from 'react';
import { Rules, DEFAULT_RULES } from '../domain/rules';

type RulesAction =
  | { type: 'UPDATE_FIELD'; section: keyof Rules; field: string; value: unknown }
  | { type: 'RESET' };

interface RulesContextValue {
  rules: Rules;
  dispatch: React.Dispatch<RulesAction>;
}

const RulesContext = createContext<RulesContextValue | null>(null);

function rulesReducer(state: Rules, action: RulesAction): Rules {
  switch (action.type) {
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

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, dispatch] = useReducer(rulesReducer, DEFAULT_RULES);

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
