"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Video, ChartNoAxesCombined, MessageSquare, ListVideo, Radio, Captions, Settings, ExternalLink, Upload, Plug } from "lucide-react";
import { studioTabs, youtubeObject, youtubeString, type StudioTab } from "@/lib/data/youtube-studio";
import { useYoutubeResource, YoutubeFeedback, type StudioContext } from "./youtube-ui";
import YouTubeConnection from "./YouTubeConnection";
import YouTubeContent from "./YouTubeContent";
import YouTubeAnalytics from "./YouTubeAnalytics";
import { YouTubeComments, YouTubePlaylists } from "./YouTubeCommunity";
import YouTubeLive from "./YouTubeLive";
import { YouTubeChannel, YouTubeSubtitles } from "./YouTubeChannel";
import YouTubeUpload from "./YouTubeUpload";
const icons = { overview: LayoutDashboard, content: Video, analytics: ChartNoAxesCombined, comments: MessageSquare, playlists: ListVideo, live: Radio, subtitles: Captions, channel: Settings, tools: ExternalLink };
const studioTools = [{ id: "copyright", path: "copyright" }, { id: "monetization", path: "monetization" }, { id: "customization", path: "customization" }, { id: "audioLibrary", path: "music" }, { id: "editor", path: "videos" }, { id: "settings", path: "" }];
export default function YouTubeWorkspace({ onExpired }: StudioContext) {
  const y = useTranslations("youtubeStudio"), state = useYoutubeResource("status", { onExpired }), [tab, setTab] = useState<StudioTab>("overview"), [connection, setConnection] = useState(false), [upload, setUpload] = useState(false), [revision, setRevision] = useState(0);
  const channel = youtubeObject(state.data?.channel), id = youtubeString(channel.id);
  return <section className="yt-workspace"><div className="dash-section-heading"><div><p className="dash-eyebrow">ZO7AL PROJECTS</p><h1>YouTube Studio</h1><p className="dash-help" dir="auto">{youtubeString(channel.title) || y("workspaceHint")}</p></div><div className="dash-actions"><button type="button" className="dash-icon-button" aria-label={y("connection")} onClick={() => setConnection(!connection)}><Plug size={18} /></button>{state.data?.connected === true && <button type="button" className="dash-button dash-button-primary" onClick={() => setUpload(true)}><Upload size={16} />{y("uploadVideo")}</button>}<a className="dash-button" href="https://studio.youtube.com/" target="_blank" rel="noopener noreferrer">{y("openStudio")}<ExternalLink size={16} /></a></div></div><YoutubeFeedback message={state.error} />
    {connection || state.data && !state.data.connected ? <YouTubeConnection onExpired={onExpired} onChanged={() => void state.reload()} /> : null}
    {state.loading && !state.data && <div className="dash-panel card-glow dash-empty" aria-busy="true">{y("loading")}</div>}
    {state.data?.connected === true && <><nav className="pelican-tabs yt-tabs" aria-label="YouTube Studio">{studioTabs.map(value => { const Icon = icons[value]; return <button type="button" key={value} aria-current={tab === value ? "page" : undefined} onClick={() => setTab(value)}><Icon size={16} />{y(value)}</button>; })}</nav><div key={tab + ":" + revision}>
      {tab === "overview" || tab === "content" ? <YouTubeContent onExpired={onExpired} overview={tab === "overview"} /> : tab === "analytics" ? <YouTubeAnalytics onExpired={onExpired} /> : tab === "comments" ? <YouTubeComments onExpired={onExpired} /> : tab === "playlists" ? <YouTubePlaylists onExpired={onExpired} /> : tab === "live" ? <YouTubeLive onExpired={onExpired} /> : tab === "subtitles" ? <YouTubeSubtitles onExpired={onExpired} /> : tab === "channel" ? <YouTubeChannel onExpired={onExpired} /> : <><p className="dash-help yt-tools-hint">{y("studioToolsHint")}</p><div className="yt-tools-grid">{studioTools.map(tool => <a key={tool.id} className="dash-panel card-glow yt-tool" href={"https://studio.youtube.com/channel/" + id + (tool.path ? "/" + tool.path : "")} target="_blank" rel="noopener noreferrer"><h3>{y(tool.id)}</h3><ExternalLink size={20} /></a>)}</div></>}
    </div></>}
    {upload && <YouTubeUpload onExpired={onExpired} onClose={() => setUpload(false)} onDone={() => setRevision(value => value + 1)} />}
  </section>;
}
