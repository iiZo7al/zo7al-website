import type { CommunityEntry } from "./community";

export type CommunityNewsItem<T> = { type: "content"; item: T } | { type: "poll"; entry: CommunityEntry };

export function communityNewsFeed<T extends { createdAt?: string }>(news: T[], entries: CommunityEntry[], topic: "minecraft" | "fortnite" | "all"): CommunityNewsItem<T>[] {
  const feed: CommunityNewsItem<T>[] = news.map(item => ({ type: "content", item }));
  feed.push(...entries.filter(entry => entry.kind === "poll" && (topic === "all" || entry.topic === topic)).map(entry => ({ type: "poll" as const, entry })));
  const published = (entry: CommunityNewsItem<T>) => Date.parse(entry.type === "poll" ? entry.entry.createdAt : entry.item.createdAt ?? "") || 0;
  return feed.sort((a, b) => published(b) - published(a));
}
