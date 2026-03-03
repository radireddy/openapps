import React, { useState, useMemo } from 'react';
import { Theme } from '@/types';

interface ThemeTokenSearchProps {
  theme: Theme;
  onUpdate: (category: keyof Theme, prop: string, value: string) => void;
}

type TokenEntry = {
  category: keyof Theme;
  prop: string;
  value: string;
  path: string;
};

export const ThemeTokenSearch: React.FC<ThemeTokenSearchProps> = ({ theme, onUpdate }) => {
  const [query, setQuery] = useState('');

  const allTokens = useMemo<TokenEntry[]>(() => {
    const tokens: TokenEntry[] = [];
    for (const category of Object.keys(theme) as Array<keyof Theme>) {
      const section = theme[category];
      if (typeof section === 'object' && section !== null) {
        for (const [prop, value] of Object.entries(section)) {
          tokens.push({
            category,
            prop,
            value: String(value),
            path: `theme.${category}.${prop}`,
          });
        }
      }
    }
    return tokens;
  }, [theme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allTokens.filter(
      (t) =>
        t.path.toLowerCase().includes(lowerQuery) ||
        t.value.toLowerCase().includes(lowerQuery) ||
        t.prop.toLowerCase().includes(lowerQuery)
    );
  }, [query, allTokens]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, TokenEntry[]>();
    for (const token of filtered) {
      const group = map.get(token.category) || [];
      group.push(token);
      map.set(token.category, group);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="relative mb-3">
        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ed-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tokens..."
          className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-ed-bg-secondary border border-ed-border rounded focus:outline-none focus:ring-1 focus:ring-ed-accent text-ed-text"
        />
      </div>

      {query.trim() && filtered.length === 0 && (
        <p className="text-[11px] text-ed-text-tertiary text-center py-3">No tokens match &quot;{query}&quot;</p>
      )}

      {Array.from(grouped.entries()).map(([category, tokens]) => (
        <div key={category} className="mb-3">
          <h5 className="text-[10px] font-semibold text-ed-text-tertiary uppercase tracking-wider mb-1">{category}</h5>
          <div className="space-y-1">
            {tokens.map((token) => (
              <div key={token.path} className="flex items-center gap-2 px-1.5 py-1 rounded bg-ed-bg-secondary">
                {token.category === 'colors' && /^#[0-9a-fA-F]{3,8}$/.test(token.value) && (
                  <div className="w-4 h-4 rounded border border-black/10" style={{ backgroundColor: token.value }} />
                )}
                <span className="text-[10px] text-ed-text-tertiary font-mono flex-1 truncate">
                  {token.path}
                </span>
                <input
                  type="text"
                  value={token.value}
                  onChange={(e) => onUpdate(token.category, token.prop, e.target.value)}
                  className="w-24 text-[10px] font-mono bg-ed-bg border border-ed-border rounded px-1 py-0.5 text-ed-text focus:outline-none focus:ring-1 focus:ring-ed-accent"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
