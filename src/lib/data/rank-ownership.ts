const RANK_ORDER = ['vip', 'vip+', 'vip++', 'mvp', 'mvp+', 'mvp++'] as const;
export function normalizedRank(value: unknown) { return typeof value === 'string' ? value.toLowerCase().trim().replace(/[\[\]\s]/g, '').replace(/rank$/, '') : ''; }
export function ownsRank(current: unknown, offered: unknown) { const a = normalizedRank(current), b = normalizedRank(offered); if (a === 'booster' || b === 'booster')
    return a === b; const held = RANK_ORDER.indexOf(a as typeof RANK_ORDER[number]), tier = RANK_ORDER.indexOf(b as typeof RANK_ORDER[number]); return held >= 0 && tier >= 0 ? tier <= held : !!a && a === b; }
