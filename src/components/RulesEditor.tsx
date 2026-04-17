import React from 'react';
import { useRules } from '../contexts/RulesContext';
import { BidIncrement, TimerDuration } from '../domain/rules';
import { useActiveRole } from '../hooks/useActiveRole';
import ReadOnlyBanner from './ReadOnlyBanner';

export default function RulesEditor() {
  const { rules, dispatch } = useRules();
  const isViewer = useActiveRole() === 'viewer';

  const updateField = (section: 'economy' | 'players' | 'mechanics' | 'auction', field: string, value: unknown) => {
    dispatch({ type: 'UPDATE_FIELD', section, field, value });
  };

  return (
    <>
      {isViewer && <ReadOnlyBanner />}
      <fieldset disabled={isViewer} className="contents">
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Game Rules & Logic</h1>
          <p className="text-on-surface-variant font-medium">Define the core mechanics and economic constraints of your project.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="px-6 py-2 rounded-xl bg-surface-container-high text-on-surface font-semibold text-sm hover:bg-surface-bright transition-colors"
          >
            Reset Defaults
          </button>
          <button className="px-6 py-2 rounded-xl bg-secondary-container text-on-secondary-container font-bold text-sm uppercase tracking-wider shadow-lg shadow-secondary-container/20">Apply Changes</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Economy Card */}
        <section className="p-6 rounded-2xl bg-surface-container border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <h3 className="text-lg font-headline font-bold">Economy</h3>
          </div>
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Starting Cash</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                <input
                  className="w-full pl-8 pr-4 py-3 bg-surface-container-high rounded-lg border-none focus:ring-1 focus:ring-primary text-on-surface font-mono"
                  type="number"
                  value={rules.economy.startingCash}
                  onChange={(e) => updateField('economy', 'startingCash', Number(e.target.value))}
                />
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant italic">Standard tournament starting value is $1,500.</p>
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Salary (Passing Go)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                <input
                  className="w-full pl-8 pr-4 py-3 bg-surface-container-high rounded-lg border-none focus:ring-1 focus:ring-primary text-on-surface font-mono"
                  type="number"
                  value={rules.economy.salary}
                  onChange={(e) => updateField('economy', 'salary', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Player Limits Card */}
        <section className="p-6 rounded-2xl bg-surface-container border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <h3 className="text-lg font-headline font-bold">Player Limits</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Min Players</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none focus:ring-1 focus:ring-primary text-on-surface font-mono"
                type="number"
                value={rules.players.minPlayers}
                onChange={(e) => updateField('players', 'minPlayers', Number(e.target.value))}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Max Players</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-high rounded-lg border-none focus:ring-1 focus:ring-primary text-on-surface font-mono"
                type="number"
                value={rules.players.maxPlayers}
                onChange={(e) => updateField('players', 'maxPlayers', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="mt-8 p-4 rounded-xl bg-surface-container-low border border-outline-variant/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-on-surface">Allow AI Opponents</span>
              <button
                onClick={() => updateField('players', 'allowAI', !rules.players.allowAI)}
                className={`w-10 h-5 rounded-full relative transition-colors ${rules.players.allowAI ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
              >
                <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rules.players.allowAI ? 'right-1' : 'left-1'}`}></span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface">Spectator Mode</span>
              <button
                onClick={() => updateField('players', 'spectatorMode', !rules.players.spectatorMode)}
                className={`w-10 h-5 rounded-full relative transition-colors ${rules.players.spectatorMode ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
              >
                <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rules.players.spectatorMode ? 'right-1' : 'left-1'}`}></span>
              </button>
            </div>
          </div>
        </section>

        {/* Standard Mechanics */}
        <section className="md:col-span-2 p-6 rounded-2xl bg-surface-container border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">rule</span>
            </div>
            <h3 className="text-lg font-headline font-bold">Standard Mechanics</h3>
          </div>
          <div className="space-y-2">
            {([
              { id: 'doubleRentOnSets' as const, icon: 'palette', title: 'Double-Rent on Sets', desc: 'Rent is doubled when a player owns all properties of a color group.' },
              { id: 'mandatoryAuctions' as const, icon: 'sell', title: 'Mandatory Auctions', desc: 'Unpurchased properties must go to immediate auction.' },
              { id: 'instantBankruptcy' as const, icon: 'account_balance', title: 'Instant Bankruptcy', desc: 'Players are eliminated immediately when debts exceed assets.' },
            ]).map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/50 hover:bg-surface-container-high transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">{rule.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface uppercase tracking-tight">{rule.title}</h4>
                    <p className="text-xs text-on-surface-variant">{rule.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateField('mechanics', rule.id, !rules.mechanics[rule.id])}
                  className={`w-11 h-6 rounded-full relative transition-colors ${rules.mechanics[rule.id] ? 'bg-secondary-container' : 'bg-surface-container-highest'}`}
                >
                  <span className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-all ${rules.mechanics[rule.id] ? 'left-[24px]' : 'left-[2px]'}`}></span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Auction Logic */}
        <section className="md:col-span-2 p-6 rounded-2xl bg-surface-container border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <h3 className="text-lg font-headline font-bold">Auction Logic</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-surface-container-low">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Starting Bid</label>
              <div className="flex items-center gap-4">
                <input
                  className="flex-1 accent-tertiary"
                  type="range"
                  min="0"
                  max="100"
                  value={rules.auction.startingBid}
                  onChange={(e) => updateField('auction', 'startingBid', Number(e.target.value))}
                />
                <span className="text-sm font-mono text-tertiary">${rules.auction.startingBid}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Bid Increment</label>
              <select
                value={rules.auction.bidIncrement}
                onChange={(e) => updateField('auction', 'bidIncrement', e.target.value as BidIncrement)}
                className="w-full bg-surface-container-high border-none rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary"
              >
                <option>$1 Fixed</option>
                <option>$5 Minimum</option>
                <option>$10 Scaled</option>
              </select>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Timer Duration</label>
              <select
                value={rules.auction.timerDuration}
                onChange={(e) => updateField('auction', 'timerDuration', e.target.value as TimerDuration)}
                className="w-full bg-surface-container-high border-none rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary"
              >
                <option>15 Seconds</option>
                <option>30 Seconds</option>
                <option>Unlimited</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
      </fieldset>
    </>
  );
}
