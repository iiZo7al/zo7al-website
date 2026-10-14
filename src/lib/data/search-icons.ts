export type SearchResultIcon = 'home' | 'minecraft' | 'modpacks' | 'fortnite' | 'socials' | 'support' | 'store' | 'game' | 'news' | 'events' | 'player' | 'orders' | 'applications' | 'gallery' | 'faq' | 'errors' | 'modrinth' | 'curseforge' | 'account' | 'security' | 'subscriptions' | 'link';

export function searchResultIcon(entry: { href: string; category?: string }): SearchResultIcon {
  let url: URL;
  try { url = new URL(entry.href, 'https://zo7al.is-a.dev'); } catch { return 'link'; }
  const path = url.pathname;
  if (url.searchParams.has('news') || url.hash === '#news') return 'news';
  if (path === '/events' || url.hash === '#events') return 'events';
  if (path === '/support') return url.searchParams.get('tab') === 'faq' ? 'faq' : url.searchParams.get('tab') === 'errors' ? 'errors' : 'support';
  if (path === '/modpacks') {
    const project = url.searchParams.get('project') ?? '';
    return project.startsWith('modrinth:') ? 'modrinth' : project.startsWith('curseforge:') ? 'curseforge' : 'modpacks';
  }
  if (path === '/account') {
    const tab = url.searchParams.get('tab');
    return tab === 'player' ? 'player' : tab === 'security' || tab === 'password' ? 'security' : tab === 'subscriptions' ? 'subscriptions' : 'account';
  }
  if (path === '/player') return 'player';
  if (path === '/requests') {
    const tabs: Record<string, SearchResultIcon> = { applications: 'applications', support: 'support', events: 'events', gallery: 'gallery', orders: 'orders' };
    return tabs[url.searchParams.get('tab') ?? 'orders'] ?? 'orders';
  }
  const pages: Record<string, SearchResultIcon> = { '/': 'home', '/minecraft': 'minecraft', '/fortnite': 'fortnite', '/socials': 'socials', '/store': 'store', '/game': 'game' };
  return pages[path] ?? 'link';
}
