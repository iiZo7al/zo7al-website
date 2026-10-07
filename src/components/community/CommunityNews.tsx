"use client";

import ContentFeed from "@/components/hub/ContentFeed";
import { useCommunity } from "./CommunityProvider";

export default function CommunityNews({ topic }: { topic: "minecraft" | "fortnite" }) {
  const { entries, loading, available } = useCommunity();
  const polls = entries.filter(entry => entry.kind === "poll" && entry.topic === topic);
  return <div id="community-polls" className="scroll-mt-24">
    <ContentFeed kind="news" topic={topic} limit={6} expandable polls={{ entries: polls, loading, available }}/>
  </div>;
}
