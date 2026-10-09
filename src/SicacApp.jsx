import { useState, useRef, useEffect, useCallback } from "react";
import YouTubeOnline from "./components/YouTubeOnline.jsx";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";


// Persistent media storage for SICAC.
const saveMediaFile = async (dataUrl, filename) => {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  // Browser fallback: keep the data URL.
  if (!Capacitor.isNativePlatform()) return dataUrl;

  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Format file tidak valid");

  const result = await Filesystem.writeFile({
    path: `sicac-media/${filename}`,
    data: base64,
    directory: Directory.Data,
    recursive: true,
  });

  return Capacitor.convertFileSrc(result.uri);
};

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const LEVEL_ICONS = {
  Listener: "/Level_Rank/ic_rank_stone.webp",
  Groove: "/Level_Rank/ic_rank_bronze.webp",
  Vibe: "/Level_Rank/ic_rank_silver.webp",
  Sonic: "/Level_Rank/ic_rank_gold.webp",
  Legend: "/Level_Rank/ic_rank_emerald.webp",
};

const LEVELS = [
  { name: "Listener", min: 0,     max: 500,      color: "#6B7280" },
  { name: "Groove",   min: 500,   max: 2000,     color: "#3B82F6" },
  { name: "Vibe",     min: 2000,  max: 5000,     color: "#8B5CF6" },
  { name: "Sonic",    min: 5000,  max: 10000,    color: "#F59E0B" },
  { name: "Legend",   min: 10000, max: Infinity, color: "#EF4444" },
];

function LevelRankIcon({ name, size = 20 }) {
  const src = LEVEL_ICONS[name];
  if (!src) return null;

  return (
    <img
      src={`${import.meta.env.BASE_URL}${src.replace(/^\//, "")}`}
      alt={`${name} rank`}
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden";
      }}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  );
}

const BANNER_PRESETS = [
  { id: "purple", label: "Purple Night",  from: "#1a1a3e", mid: "#2d1b69", to: "#1e3a8a", accent: "var(--accent-soft)" },
  { id: "red",    label: "Deep Red",      from: "#3b0000", mid: "#7f1d1d", to: "#1a0000", accent: "#FFB4A8" },
  { id: "teal",   label: "Ocean",         from: "#042f2e", mid: "#0f766e", to: "#083344", accent: "#2dd4bf" },
  { id: "amber",  label: "Golden",        from: "#292524", mid: "#78350f", to: "#1c1917", accent: "#fbbf24" },
  { id: "pink",   label: "Rose",          from: "#2d0a1e", mid: "#831843", to: "#1a0011", accent: "#f9a8d4" },
  { id: "green",  label: "Forest",        from: "#052e16", mid: "#14532d", to: "#0a0f0a", accent: "#4ade80" },
];

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=DM+Sans:wght@400;500;700&display=swap');
.disp{font-family:'Bricolage Grotesque','DM Sans',system-ui,sans-serif;letter-spacing:-0.02em}
@keyframes spin{to{transform:rotate(360deg)}}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent-soft);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.vinyl{animation:none!important}}
`;
const THEMES = [
  { id: "midnight", name: "Midnight", bg: "#14112A", bgRgb: "20,17,42", panel: "#1B1736", mini: "rgba(38,32,76,0.97)", hero1: "#2A2160", hero2: "#3B2470", glow: "#3A2A7A", deep: "#1E1844", accent: "#FF5A87", soft: "#FF8FAE", accentRgb: "255,90,135" },
  { id: "ocean",    name: "Ocean",    bg: "#0B1B26", bgRgb: "11,27,38",  panel: "#10283A", mini: "rgba(20,52,72,0.97)",  hero1: "#0F4C5C", hero2: "#136F7A", glow: "#14606E", deep: "#0D2F3F", accent: "#0EA5A4", soft: "#5EEAD4", accentRgb: "14,165,164" },
  { id: "forest",   name: "Forest",   bg: "#0E1A12", bgRgb: "14,26,18",  panel: "#14241A", mini: "rgba(26,52,36,0.97)",  hero1: "#1B4A2E", hero2: "#2A6B3F", glow: "#256B3E", deep: "#12301D", accent: "#22A55B", soft: "#6EE7A0", accentRgb: "34,165,91" },
  { id: "sunset",   name: "Sunset",   bg: "#1F1410", bgRgb: "31,20,16",  panel: "#2A1B15", mini: "rgba(58,36,28,0.97)",  hero1: "#5A2A18", hero2: "#8A3A1C", glow: "#7A3418", deep: "#3A1C12", accent: "#E8590C", soft: "#FFA270", accentRgb: "232,89,12" },
];
const themeVars = (t) => ({
  "--bg": t.bg, "--bg-rgb": t.bgRgb, "--panel": t.panel, "--mini": t.mini,
  "--hero1": t.hero1, "--hero2": t.hero2, "--glow": t.glow, "--deep": t.deep,
  "--accent": t.accent, "--accent-soft": t.soft, "--accent-rgb": t.accentRgb,
});

// ─── UTILS ─────────────────────────────────────────────────────────────────
const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
const getLevelInfo = (xp) => {
  const lvl = LEVELS.find((l) => xp >= l.min && xp < l.max) || LEVELS[LEVELS.length - 1];
  const idx = LEVELS.indexOf(lvl);
  const next = LEVELS[idx + 1];
  const pct = next ? Math.round(((xp - lvl.min) / (next.min - lvl.min)) * 100) : 100;
  return { ...lvl, idx: idx + 1, xp, pct, next };
};
const genId = () => Math.random().toString(36).slice(2, 9);

// ─── ICONS ─────────────────────────────────────────────────────────────────
const IcHome     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcSearch   = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcHistory  = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>;
const IcSettings = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IcUser     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcPlay     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcPause    = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const IcNext     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth={2}/></svg>;
const IcPrev     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth={2}/></svg>;
const IcHeart    = ({ s = 20, filled }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IcShuffle  = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>;
const IcRepeat   = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcVolume   = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const IcCamera   = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcStar     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcMusic    = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
const IcUpload   = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcTrash    = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcEdit     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcBell     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcPaint    = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 13.5V20a2 2 0 0 0 2 2h.5"/><path d="M22 13.5V20a2 2 0 0 0-2 2h-.5"/><path d="M2 13.5A10 10 0 0 1 12 4a10 10 0 0 1 10 9.5"/><circle cx="12" cy="13" r="3"/><path d="M12 10V4"/></svg>;
const IcLock     = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcDownload = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcClose    = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcImage    = ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;

// ─── ALBUM ART ─────────────────────────────────────────────────────────────
const GRADIENTS = [
  ["#1a1a2e","#16213e","#0f3460","#533483"],
  ["#1a0a2e","#2d1b4e","#6b2d6b","#a855f7"],
  ["#0a1628","#1e3a5f","#0e76a8","#00c6ff"],
  ["#0d1f0d","#1a3a1a","#2d6a2d","#4ade80"],
  ["#2d0a1e","#831843","#1a0011","#f472b6"],
  ["#292524","#78350f","#1c1917","#f59e0b"],
];
const AlbumArt = ({ song, size = 56, style = {} }) => {
  const idx = song ? (song.title.charCodeAt(0) % GRADIENTS.length) : 0;
  const [c0, c1, c2, c3] = GRADIENTS[idx];
  const letters = song ? song.title.slice(0, 2).toUpperCase() : "SC";
  if (song?.cover) {
    return (
      <div style={{ width: size, height: size, borderRadius: size > 80 ? 18 : 12, overflow: "hidden", flexShrink: 0, ...style }}>
        <img src={song.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size > 80 ? 18 : 12,
      background: `linear-gradient(135deg, ${c0} 0%, ${c1} 40%, ${c2} 70%, ${c3} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.28, fontWeight: 700, color: "rgba(255,255,255,0.85)",
      letterSpacing: 1, flexShrink: 0, position: "relative", overflow: "hidden",
      ...style
    }}>
      <div style={{ position: "absolute", width: "55%", height: "55%", borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: "8%", left: "8%" }} />
      {letters}
    </div>
  );
};

// ─── XP BAR ────────────────────────────────────────────────────────────────
const XPBar = ({ pct, color, height = 4 }) => (
  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 999, height, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
  </div>
);

// ─── TOGGLE ────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{
    width: 44, height: 24, borderRadius: 99,
    background: value ? "var(--accent)" : "rgba(255,255,255,0.12)",
    position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
  }}>
    <div style={{
      position: "absolute", top: 2, left: value ? 22 : 2,
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      transition: "left 0.2s",
    }} />
  </div>
);

// ─── ICON BTN ──────────────────────────────────────────────────────────────
const IconBtn = ({ icon: Icon, onClick, active, size = 20, style: sx = {} }) => (
  <button onClick={onClick} style={{
    background: active ? "rgba(255,255,255,0.15)" : "transparent",
    border: "none", cursor: "pointer", borderRadius: 8, padding: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: active ? "#fff" : "rgba(255,255,255,0.55)", ...sx,
  }}>
    <Icon s={size} />
  </button>
);

// ─── SONG ROW ──────────────────────────────────────────────────────────────
const SongRow = ({ song, index, isActive, onPlay, onLike, onDelete }) => (
  <div onClick={onPlay} style={{
    display: "flex", alignItems: "center", gap: 12, padding: "10px 10px",
    borderRadius: 14, cursor: "pointer",
    background: isActive ? "rgba(var(--accent-rgb),0.12)" : "transparent",
    boxShadow: isActive ? "inset 3px 0 0 var(--accent)" : "none",
    transition: "background 0.15s",
  }}>
    {index !== undefined && (
      <div style={{ width: 20, textAlign: "center", fontSize: 12, color: isActive ? "var(--accent-soft)" : "rgba(255,255,255,0.3)", fontWeight: 600, flexShrink: 0 }}>
        {isActive ? <IcMusic s={13} /> : index}
      </div>
    )}
    <AlbumArt song={song} size={44} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--accent-soft)" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{song.title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{song.artist}</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
      {onLike && (
        <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "rgba(255,255,255,0.5)" }}>
          <IcHeart s={15} filled={song.liked} />
        </button>
      )}
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", minWidth: 30, textAlign: "right" }}>{fmt(song.duration)}</span>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "rgba(255,80,80,0.5)", marginLeft: 2 }}>
          <IcTrash s={14} />
        </button>
      )}
    </div>
  </div>
);

// ─── PLAYER HOOK ───────────────────────────────────────────────────────────
const usePlayer = (songs) => {
  const [currentIdx, setCurrentIdx]   = useState(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [volume, setVolume]           = useState(80);
  const [shuffle, setShuffle]         = useState(false);
  const [repeat, setRepeat]           = useState(false);
  const audioRef = useRef(null);

  const currentSong = currentIdx !== null ? songs[currentIdx] : null;

  // Init audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => {
      if (audio._repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        audio._playNext?.();
      }
    });

    return () => { audio.pause(); audio.src = ""; };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // Load song when currentIdx changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentIdx === null || !songs[currentIdx]) return;
    const song = songs[currentIdx];
    if (!song.url) return;
    audio.src = song.url;
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
  }, [currentIdx, songs]);

  // Sync repeat flag to audio
  useEffect(() => {
    if (audioRef.current) audioRef.current._repeat = repeat;
  }, [repeat]);

  const playNext = useCallback(() => {
    if (!songs.length) return;
    if (shuffle) {
      setCurrentIdx(Math.floor(Math.random() * songs.length));
    } else {
      setCurrentIdx(i => (i === null ? 0 : (i + 1) % songs.length));
    }
    setIsPlaying(true);
  }, [songs, shuffle]);

  const playPrev = useCallback(() => {
    if (!songs.length) return;
    setCurrentIdx(i => (i === null ? 0 : (i - 1 + songs.length) % songs.length));
    setIsPlaying(true);
  }, [songs]);

  // Attach playNext to audio
  useEffect(() => {
    if (audioRef.current) audioRef.current._playNext = playNext;
  }, [playNext]);

  const selectSong = useCallback((idx) => {
    const audio = audioRef.current;
    if (!audio) return;
    const song = songs[idx];
    if (!song?.url) return;
    setCurrentIdx(idx);
    audio.src = song.url;
    audio.load();
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, [songs]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || currentIdx === null) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().catch(() => {}); setIsPlaying(true); }
  }, [isPlaying, currentIdx]);

  const seek = useCallback((t) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  }, []);

  return {
    currentSong, currentIdx, isPlaying, progress, duration,
    volume, setVolume, shuffle, setShuffle, repeat, setRepeat,
    togglePlay, playNext, playPrev, selectSong, seek,
  };
};

// ─── BANNER EDITOR MODAL ───────────────────────────────────────────────────
const BannerEditor = ({ banner, onSave, onClose }) => {
  const [local, setLocal]   = useState({ ...banner });
  const [tab, setTab]       = useState("preset"); // "preset" | "custom" | "image"
  const imgRef              = useRef();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLocal(b => ({ ...b, type: "image", image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const previewStyle = local.type === "image" && local.image
    ? { background: `url(${local.image}) center/cover no-repeat` }
    : { background: `linear-gradient(135deg, ${local.from || "#1a1a3e"} 0%, ${local.mid || "#2d1b69"} 50%, ${local.to || "#1e3a8a"} 100%)` };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: "var(--panel)", borderRadius: "20px 20px 0 0", maxHeight: "90dvh", overflowY: "auto", padding: "0 0 40px" }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Customize banner</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
            <IcClose s={20} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ margin: "0 16px 16px", height: 120, borderRadius: 16, overflow: "hidden", position: "relative", ...previewStyle }}>
          <div style={{ position: "absolute", inset: 0, padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
              {local.title || "My Music"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
              {local.subtitle || "Your personal collection"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, margin: "0 16px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 3 }}>
          {[["preset","Preset"],["custom","Custom"],["image","Image"]].map(([id, label]) => (
            <div key={id} onClick={() => setTab(id)} style={{
              flex: 1, textAlign: "center", padding: "7px 0", fontSize: 12, fontWeight: 600,
              borderRadius: 8, cursor: "pointer",
              background: tab === id ? "rgba(var(--accent-rgb),0.4)" : "transparent",
              color: tab === id ? "var(--accent-soft)" : "rgba(255,255,255,0.4)",
              transition: "all 0.15s",
            }}>{label}</div>
          ))}
        </div>

        <div style={{ padding: "0 16px" }}>
          {/* PRESET TAB */}
          {tab === "preset" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {BANNER_PRESETS.map(p => (
                <div key={p.id} onClick={() => setLocal(b => ({ ...b, type: "gradient", from: p.from, mid: p.mid, to: p.to, accent: p.accent }))}
                  style={{
                    height: 64, borderRadius: 12, cursor: "pointer",
                    background: `linear-gradient(135deg, ${p.from}, ${p.mid}, ${p.to})`,
                    border: `2px solid ${(local.type !== "image" && local.from === p.from) ? p.accent : "transparent"}`,
                    display: "flex", alignItems: "flex-end", padding: "8px 10px",
                    transition: "border 0.15s",
                  }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{p.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* CUSTOM TAB */}
          {tab === "custom" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { key: "from",  label: "Start color" },
                { key: "mid",   label: "Mid color" },
                { key: "to",    label: "End color" },
                { key: "accent", label: "Accent color" },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: local[key] || "#fff", border: "1px solid rgba(255,255,255,0.2)" }} />
                    <input type="color" value={local[key] || "#ffffff"}
                      onChange={e => setLocal(b => ({ ...b, type: "gradient", [key]: e.target.value }))}
                      style={{ width: 36, height: 36, borderRadius: 6, border: "none", cursor: "pointer", background: "none" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IMAGE TAB */}
          {tab === "image" && (
            <div>
              <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              <div onClick={() => imgRef.current?.click()} style={{
                height: 80, borderRadius: 12, border: "2px dashed rgba(255,255,255,0.2)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", gap: 6, color: "rgba(255,255,255,0.4)",
              }}>
                <IcImage s={24} />
                <span style={{ fontSize: 12 }}>Tap to upload banner image</span>
              </div>
              {local.image && (
                <button onClick={() => setLocal(b => ({ ...b, type: "gradient", image: null }))} style={{
                  marginTop: 10, width: "100%", background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
                  padding: "8px 0", fontSize: 12, color: "#FFB4A8", cursor: "pointer",
                }}>Remove image</button>
              )}
            </div>
          )}

          {/* Text fields */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>Banner title</div>
              <input value={local.title || ""} onChange={e => setLocal(b => ({ ...b, title: e.target.value }))}
                placeholder="My Music"
                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>Subtitle</div>
              <input value={local.subtitle || ""} onChange={e => setLocal(b => ({ ...b, subtitle: e.target.value }))}
                placeholder="Your personal collection"
                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          {/* Save */}
          <button onClick={() => { onSave(local); onClose(); }} style={{
            marginTop: 20, width: "100%", background: "var(--accent)",
            border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14,
            fontWeight: 700, color: "#fff", cursor: "pointer",
          }}>Save banner</button>
        </div>
      </div>
    </div>
  );
};

// ─── HOME SCREEN ───────────────────────────────────────────────────────────
const HomeScreen = ({ player, songs, setSongs, profile, banner, onEditBanner }) => {
  const { currentSong, selectSong } = player;
  const levelInfo = getLevelInfo(profile.xp);

  const toggleLike = (id) => setSongs(prev => prev.map(s => s.id === id ? { ...s, liked: !s.liked } : s));

  const bannerBg = banner.type === "image" && banner.image
    ? { background: `url(${banner.image}) center/cover no-repeat` }
    : { background: `linear-gradient(135deg, ${banner.from || "#1a1a3e"} 0%, ${banner.mid || "#2d1b69"} 50%, ${banner.to || "#1e3a8a"} 100%)` };

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* BANNER */}
      <div style={{ borderRadius: 28, overflow: "hidden", ...bannerBg, position: "relative", marginBottom: 16 }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)" }} />
        

        <div style={{ position: "relative", padding: "18px 18px 16px" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0,
              background: profile.avatar ? "transparent" : "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : profile.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Welcome back</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{profile.name}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                <IcStar s={11} />
                <span style={{ fontSize: 10, fontWeight: 700, color: levelInfo.color }}>{levelInfo.name}</span>
              </div>
              <button onClick={onEditBanner} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.7)",
              }}>
                <IcPaint s={14} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="disp" style={{ fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.05, margin: "26px 0 10px" }}>
            {banner.title || "Your Daily"}<br />
            <span style={{ color: banner.accent || "var(--accent-soft)" }}>{banner.subtitle || "Mix"}</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {songs.length} {songs.length === 1 ? "track" : "tracks"} in your library
          </div>
        </div>
      </div>

      {/* LEVEL BAR */}
      <div style={{ background: "rgba(255,255,255,0.055)", borderRadius: 18, padding: "14px 16px", marginBottom: 20, border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: levelInfo.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Level {levelInfo.idx} — {levelInfo.name}</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{levelInfo.xp} XP</span>
        </div>
        <XPBar pct={levelInfo.pct} color={levelInfo.color} height={5} />
        {levelInfo.next && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 5, textAlign: "right" }}>
            {levelInfo.next.min - levelInfo.xp} XP to {levelInfo.next.name}
          </div>
        )}
      </div>

      {/* LIBRARY */}
      {songs.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <>
          <div className="disp" style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            Your library
          </div>
          {songs.map((s, i) => (
            <SongRow
              key={s.id} song={s} index={i + 1}
              isActive={currentSong?.id === s.id}
              onPlay={() => selectSong(i)}
              onLike={() => toggleLike(s.id)}
              onDelete={() => setSongs(prev => prev.filter(x => x.id !== s.id))}
            />
          ))}
        </>
      )}
    </div>
  );
};

// ─── EMPTY LIBRARY ─────────────────────────────────────────────────────────
const EmptyLibrary = () => (
  <div style={{ textAlign: "center", padding: "40px 20px" }}>
    <div style={{
      width: 80, height: 80, borderRadius: "50%",
      background: "rgba(var(--accent-rgb),0.1)", border: "1px solid rgba(var(--accent-rgb),0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px", color: "var(--accent)",
    }}>
      <IcMusic s={36} />
    </div>
    <div className="disp" style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No music yet</div>
    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
      Upload your music files using<br />the Upload tab below
    </div>
  </div>
);

// ─── UPLOAD SCREEN ─────────────────────────────────────────────────────────
const UploadScreen = ({ songs, setSongs }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const processFiles = (files) => {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith("audio/"));
    if (!audioFiles.length) return;
    setUploading(true);

    const readers = audioFiles.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target.result;
        const audio = new Audio(url);
        audio.addEventListener("loadedmetadata", () => {
          const rawName = file.name.replace(/\.[^/.]+$/, "");
          const parts   = rawName.split(" - ");
          resolve({
            id:       genId(),
            title:    parts[1]?.trim() || rawName,
            artist:   parts[0]?.trim() || "Unknown Artist",
            album:    "My Library",
            duration: audio.duration || 0,
            liked:    false,
            cover:    null,
            url,
          });
        });
        audio.addEventListener("error", () => {
          resolve({
            id:       genId(),
            title:    file.name.replace(/\.[^/.]+$/, ""),
            artist:   "Unknown Artist",
            album:    "My Library",
            duration: 0,
            liked:    false,
            cover:    null,
            url,
          });
        });
      };
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then(newSongs => {
      setSongs(prev => [...prev, ...newSongs]);
      setUploading(false);
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const toggleLike = (id) => setSongs(prev => prev.map(s => s.id === id ? { ...s, liked: !s.liked } : s));
  const deleteSong = (id) => setSongs(prev => prev.filter(s => s.id !== id));

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          borderRadius: 16,
          border: `2px dashed ${dragging ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
          background: dragging ? "rgba(var(--accent-rgb),0.08)" : "rgba(255,255,255,0.03)",
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          marginBottom: 20,
          transition: "all 0.15s",
        }}>
        <div style={{ color: dragging ? "var(--accent)" : "rgba(255,255,255,0.35)", marginBottom: 12 }}>
          <IcUpload s={36} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: dragging ? "var(--accent-soft)" : "#fff", marginBottom: 4 }}>
          {uploading ? "Processing..." : "Upload music"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
          Tap to browse or drag & drop audio files<br />
          <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 11 }}>MP3, WAV, AAC, FLAC, OGG supported</span>
        </div>
        <input ref={inputRef} type="file" accept="audio/*" multiple onChange={e => processFiles(e.target.files)} style={{ display: "none" }} />
      </div>

      {/* Tip: naming */}
      <div style={{ background: "rgba(var(--accent-rgb),0.08)", border: "1px solid rgba(var(--accent-rgb),0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-soft)", marginBottom: 3 }}>Tip: Auto-detect artist</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Name your files as <span style={{ color: "rgba(255,255,255,0.65)" }}>Artist - Song Title.mp3</span> and SICAC will auto-fill the artist name.
        </div>
      </div>

      {/* Song list */}
      {songs.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              Uploaded ({songs.length})
            </div>
            <button onClick={() => setSongs([])} style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#FFB4A8", cursor: "pointer",
            }}>Clear all</button>
          </div>
          {songs.map((s, i) => (
            <SongRow key={s.id} song={s} index={i + 1} isActive={false}
              onPlay={() => {}} onLike={() => toggleLike(s.id)} onDelete={() => deleteSong(s.id)} />
          ))}
        </>
      )}
    </div>
  );
};

// ─── HISTORY SCREEN ────────────────────────────────────────────────────────
const HistoryScreen = ({ history }) => {
  if (!history.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", paddingBottom: 110 }}>
      <div style={{ color: "rgba(255,255,255,0.2)", marginBottom: 12 }}><IcHistory s={40} /></div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>No history yet</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>Play some music to see it here</div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.055)", borderRadius: 12, padding: "11px 14px", marginBottom: 16 }}>
        <IcHistory s={15} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Listening History</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{history.length} tracks played</div>
        </div>
      </div>
      {history.map((h, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.055)" }}>
          <AlbumArt song={h} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>{h.artist}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{h.playedAt}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{fmt(h.duration)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── PROFILE SCREEN ────────────────────────────────────────────────────────
const ProfileScreen = ({ profile, setProfile, songs }) => {
  const fileRef = useRef();
  const levelInfo = getLevelInfo(profile.xp);
  const [editing, setEditing] = useState(false);
  const [tmpName, setTmpName] = useState(profile.name);
  const [tmpBio,  setTmpBio]  = useState(profile.bio);

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setProfile(p => ({ ...p, avatar: ev.target.result }));
    r.readAsDataURL(file);
  };

  const stats = [
    { label: "Songs", value: songs.length },
    { label: "Liked", value: songs.filter(s => s.liked).length },
    { label: "XP",    value: profile.xp.toLocaleString() },
    { label: "Level", value: `LVL ${levelInfo.idx}` },
  ];

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Hero card */}
      <div style={{ background: "linear-gradient(160deg,var(--hero1) 0%,var(--hero2) 60%,var(--panel) 100%)", borderRadius: 20, padding: "22px 18px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%", overflow: "hidden",
              border: "3px solid rgba(var(--accent-rgb),0.55)",
              background: profile.avatar ? "transparent" : "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : profile.name.slice(0, 2).toUpperCase()}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{
              position: "absolute", bottom: 0, right: 0, width: 24, height: 24,
              borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bg)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}><IcCamera s={11} /></button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <input value={tmpName} onChange={e => setTmpName(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 10px", fontSize: 15, fontWeight: 700, color: "#fff", outline: "none" }} />
                <input value={tmpBio} onChange={e => setTmpBio(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "rgba(255,255,255,0.6)", outline: "none" }} />
                <div style={{ display: "flex", gap: 7 }}>
                  <button onClick={() => { setProfile(p => ({ ...p, name: tmpName, bio: tmpBio })); setEditing(false); }}
                    style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditing(false)}
                    style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="disp" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{profile.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1.4 }}>{profile.bio}</div>
                <button onClick={() => setEditing(true)} style={{
                  marginTop: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}><IcEdit s={12} /> Edit</button>
              </>
            )}
          </div>
        </div>

        {/* Level */}
        <div style={{ marginTop: 18, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "11px 13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ background: levelInfo.color + "20", border: `1px solid ${levelInfo.color}40`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, color: levelInfo.color }}>LVL {levelInfo.idx}</div>
              <LevelRankIcon name={levelInfo.name} size={22} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{levelInfo.name}</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{levelInfo.xp.toLocaleString()} XP</span>
          </div>
          <XPBar pct={levelInfo.pct} color={levelInfo.color} height={7} />
          {levelInfo.next && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{levelInfo.name}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{levelInfo.next.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "13px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div style={{ background: "rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="disp" style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Level milestones</div>
        {LEVELS.map((l, i) => {
          const reached = profile.xp >= l.min;
          return (
            <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < LEVELS.length - 1 ? 12 : 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: reached ? l.color + "20" : "rgba(255,255,255,0.05)", border: `2px solid ${reached ? l.color : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: reached ? l.color : "rgba(255,255,255,0.28)", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: reached ? "#fff" : "rgba(255,255,255,0.38)" }}>{l.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{l.min.toLocaleString()} XP</div>
              </div>
              {reached && <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── SETTINGS SCREEN ───────────────────────────────────────────────────────
const SettingsScreen = ({ banner, setBanner, themeId, setThemeId }) => {
  const [notif, setNotif]   = useState(true);
  const [hq, setHq]         = useState(true);
  const [offline, setOffline] = useState(false);

  const Row = ({ icon: Icon, label, desc, right }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon s={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.33)", marginTop: 1 }}>{desc}</div>}
      </div>
      {right}
    </div>
  );

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ background: "rgba(255,255,255,0.055)", borderRadius: 14, padding: "0 14px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", padding: "14px 0 10px" }}>Tema</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setThemeId(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, cursor: "pointer",
              background: t.bg, color: "#fff", fontSize: 13, fontWeight: 600,
              border: `2px solid ${themeId === t.id ? t.accent : "rgba(255,255,255,0.1)"}`,
            }}>
              <span style={{ display: "flex" }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.hero2 }} />
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.accent, marginLeft: -5 }} />
              </span>
              {t.name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", padding: "18px 0 8px" }}>Teks banner</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={banner.title || ""} onChange={e => setBanner(b => ({ ...b, title: e.target.value }))} placeholder="Baris pertama, mis. Your Daily" maxLength={24}
            style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#fff", outline: "none" }} />
          <input value={banner.subtitle || ""} onChange={e => setBanner(b => ({ ...b, subtitle: e.target.value }))} placeholder="Baris kedua, mis. Mix" maxLength={24}
            style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#fff", outline: "none" }} />
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.055)", borderRadius: 14, padding: "0 14px", marginBottom: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", padding: "14px 0 6px" }}>Playback</div>
        <Row icon={IcVolume}   label="High quality audio"   desc="320kbps streaming"        right={<Toggle value={hq}      onChange={setHq} />} />
        <Row icon={IcDownload} label="Offline downloads"    desc="Save to device storage"   right={<Toggle value={offline} onChange={setOffline} />} />
      </div>
      <div style={{ background: "rgba(255,255,255,0.055)", borderRadius: 14, padding: "0 14px", marginBottom: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", padding: "14px 0 6px" }}>Notifications</div>
        <Row icon={IcBell} label="Push notifications" desc="New music & updates" right={<Toggle value={notif} onChange={setNotif} />} />
      </div>
      <div style={{ background: "rgba(255,255,255,0.055)", borderRadius: 14, padding: "0 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", padding: "14px 0 6px" }}>Account</div>
        <Row icon={IcLock} label="Privacy & security" desc="Manage your data" right={<span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)" }}>›</span>} />
        <Row icon={IcUser} label="Connected accounts" desc="Manage integrations" right={<span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)" }}>›</span>} />
      </div>
      <div style={{ marginTop: 24, background: "rgba(255,255,255,0.055)", borderRadius: 14, padding: "18px 16px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: -0.3 }}>SICAC</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Music Player v2.0.0</div>
        <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>Developed by</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>devnsepele</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>All rights reserved © 2025</div>
      </div>
    </div>
  );
};

// ─── MINI PLAYER ───────────────────────────────────────────────────────────
const MiniPlayer = ({ player, onExpand }) => {
  const { currentSong, isPlaying, progress, duration, togglePlay, playNext } = player;
  if (!currentSong) return null;
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div style={{ position: "fixed", bottom: 68, left: 0, right: 0, zIndex: 40, padding: "0 10px" }}>
      <div style={{ background: "var(--mini)", backdropFilter: "blur(20px)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", transition: "width 0.8s linear" }} />
        </div>
        <div onClick={onExpand} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", cursor: "pointer" }}>
          <AlbumArt song={currentSong} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentSong.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{currentSong.artist}</div>
          </div>
          <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
            <IconBtn icon={isPlaying ? IcPause : IcPlay} onClick={togglePlay} size={17} sx={{ padding: 7 }} />
            <IconBtn icon={IcNext} onClick={playNext} size={17} sx={{ padding: 7 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── FULL PLAYER ───────────────────────────────────────────────────────────
const FullPlayer = ({ player, songs, setSongs, onClose }) => {
  const { currentSong, isPlaying, progress, duration, volume, setVolume, shuffle, setShuffle, repeat, setRepeat, togglePlay, playNext, playPrev, seek } = player;
  if (!currentSong) return null;
  const song   = songs.find(s => s.id === currentSong.id) || currentSong;
  const pct    = duration ? (progress / duration) * 100 : 0;
  const toggleLike = () => setSongs(prev => prev.map(s => s.id === currentSong.id ? { ...s, liked: !s.liked } : s));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "radial-gradient(120% 60% at 50% 0%,var(--glow) 0%,var(--deep) 50%,var(--bg) 100%)", display: "flex", flexDirection: "column", padding: "0 22px 36px", overflowY: "auto" }}>
      {/* Top */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 20 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 0.3 }}>Now playing</div>
        <div style={{ width: 24 }} />
      </div>

      {/* Art: vinyl */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div className="vinyl" style={{
          width: 264, height: 264, borderRadius: "50%", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "repeating-radial-gradient(circle,#0c0a1a 0 2px,#1a1632 2px 4px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55), inset 0 0 0 3px rgba(255,255,255,0.05)",
          animation: "spin 9s linear infinite", animationPlayState: isPlaying ? "running" : "paused",
        }}>
          <AlbumArt song={currentSong} size={116} style={{ borderRadius: "50%" }} />
          <div style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "var(--bg)", border: "2px solid rgba(255,255,255,0.25)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 30deg,transparent 0 20%,rgba(255,255,255,0.07) 25%,transparent 30% 70%,rgba(255,255,255,0.07) 75%,transparent 80%)" }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{currentSong.title}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.48)" }}>{currentSong.artist}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{currentSong.album}</div>
        </div>
        <button onClick={toggleLike} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
          <IcHeart s={24} filled={song.liked} />
        </button>
      </div>

      {/* Seek */}
      <div style={{ marginBottom: 18 }}>
        <input type="range" min={0} max={duration || 1} step={0.1} value={progress}
          onChange={e => seek(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{fmt(progress)}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <IconBtn icon={IcShuffle} onClick={() => setShuffle(s => !s)} active={shuffle} size={20} />
        <IconBtn icon={IcPrev}    onClick={playPrev} size={24} />
        <button onClick={togglePlay} style={{ width: 68, height: 68, borderRadius: "50%", border: "none", cursor: "pointer", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 10px 28px rgba(var(--accent-rgb),0.4)" }}>
          {isPlaying ? <IcPause s={24} /> : <IcPlay s={24} />}
        </button>
        <IconBtn icon={IcNext}   onClick={playNext} size={24} />
        <IconBtn icon={IcRepeat} onClick={() => setRepeat(r => !r)} active={repeat} size={20} />
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IcVolume s={15} />
        <input type="range" min={0} max={100} value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--accent)", cursor: "pointer" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", minWidth: 28, textAlign: "right" }}>{volume}%</span>
      </div>
    </div>
  );
};

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",     label: "Home",     Icon: IcHome },
  { id: "upload",   label: "Upload",   Icon: IcUpload },
  { id: "online",   label: "Online",   Icon: IcUpload },
  { id: "history",  label: "History",  Icon: IcHistory },
  { id: "profile",  label: "Profile",  Icon: IcUser },
  { id: "settings", label: "Settings", Icon: IcSettings },
];
const BottomNav = ({ active, onChange }) => (
  <div style={{
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    background: "rgba(var(--bg-rgb),0.96)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "stretch",
    height: "calc(64px + env(safe-area-inset-bottom, 0px))",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    boxSizing: "border-box"
  }}>
    {TABS.map(({ id, label, Icon }) => {
      const on = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: "1 1 0",
            minWidth: 0,
            padding: "5px 0 4px",
            boxSizing: "border-box",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            color: on ? "var(--accent-soft)" : "rgba(255,255,255,0.45)",
            transition: "color 0.15s"
          }}
        >
          <div style={{
            padding: "4px 12px",
            borderRadius: 99,
            background: on ? "rgba(var(--accent-rgb),0.18)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Icon s={20} />
          </div>
          <span style={{
            fontSize: 10,
            lineHeight: "12px",
            whiteSpace: "nowrap",
            fontWeight: on ? 700 : 500
          }}>{label}</span>
        </button>
      );
    })}
  </div>
);

// ─── HEADER ────────────────────────────────────────────────────────────────
const Header = ({ tab }) => {
  const titles = { home: "SICAC", upload: "Upload", online: "YouTube Online", history: "History", profile: "Profile", settings: "Settings" };
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(var(--bg-rgb),0.9)", backdropFilter: "blur(16px)", borderBottom: "none", padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div className="disp" style={{ fontSize: tab === "home" ? 28 : 24, fontWeight: 800, color: "#fff" }}>
        {titles[tab]}
      </div>
      <button style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
        <IcBell s={15} />
      </button>
    </div>
  );
};

// ─── ROOT ──────────────────────────────────────────────────────────────────
export default function SicacApp() {
  const [tab, setTab]                   = useState("home");
  const [themeId, setThemeIdRaw]        = useState(() => { try { return localStorage.getItem("sicac-theme") || "midnight"; } catch { return "midnight"; } });
  const setThemeId = (id) => { setThemeIdRaw(id); try { localStorage.setItem("sicac-theme", id); } catch {} };
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const [showFullPlayer, setShowFull]   = useState(false);
  const [showBannerEdit, setShowBanner] = useState(false);
  const [songs, setSongs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sicac-songs") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sicac-songs", JSON.stringify(songs));
    } catch (error) {
      console.warn("SICAC: daftar lagu gagal disimpan", error);
    }
  }, [songs]);
  const [history, setHistory]           = useState([]);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("sicac-profile");
      return saved ? { name: "My Name", bio: "Music is life", avatar: null, xp: 3240, ...JSON.parse(saved) }
        : { name: "My Name", bio: "Music is life", avatar: null, xp: 3240 };
    } catch { return { name: "My Name", bio: "Music is life", avatar: null, xp: 3240 }; }
  });
  const [banner, setBanner] = useState(() => {
    const defaults = { type: "gradient", from: "#1a1a3e", mid: "#2d1b69", to: "#1e3a8a", accent: "var(--accent-soft)", title: "Your Daily", subtitle: "Mix", image: null };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem("sicac-banner") || "{}")} }
    catch { return defaults; }
  });

  // Persist user-customized appearance and profile between app launches.
  useEffect(() => {
    try { localStorage.setItem("sicac-profile", JSON.stringify(profile)); } catch (error) { console.warn("SICAC: profile could not be saved (storage quota?)", error); }
  }, [profile]);
  useEffect(() => {
    try { localStorage.setItem("sicac-banner", JSON.stringify(banner)); } catch (error) { console.warn("SICAC: banner could not be saved (storage quota?)", error); }
  }, [banner]);

  const player = usePlayer(songs);

  // Track history
  const prevSongId = useRef(null);
  useEffect(() => {
    const s = player.currentSong;
    if (!s || s.id === prevSongId.current) return;
    prevSongId.current = s.id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory(h => [{ ...s, playedAt: timeStr }, ...h].slice(0, 50));
  }, [player.currentSong]);

  return (
    <div style={{ ...themeVars(theme), background: "var(--bg)", minHeight: "100dvh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#fff", overflowX: "hidden" }}>
      <style>{GLOBAL_CSS}</style>
      <Header tab={tab} />

      <div style={{ padding: "14px 14px calc(110px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
        {tab === "home"     && <HomeScreen    player={player} songs={songs} setSongs={setSongs} profile={profile} banner={banner} onEditBanner={() => setShowBanner(true)} />}
        {tab === "upload"   && <UploadScreen  songs={songs} setSongs={setSongs} />}
        {tab === "online"   && <YouTubeOnline />}
        {tab === "history"  && <HistoryScreen history={history} />}
        {tab === "profile"  && <ProfileScreen profile={profile} setProfile={setProfile} songs={songs} />}
        {tab === "settings" && <SettingsScreen banner={banner} setBanner={setBanner} themeId={themeId} setThemeId={setThemeId} />}
      </div>

      {player.currentSong && <MiniPlayer player={player} onExpand={() => setShowFull(true)} />}
      <BottomNav active={tab} onChange={setTab} />

      {showFullPlayer  && <FullPlayer player={player} songs={songs} setSongs={setSongs} onClose={() => setShowFull(false)} />}
      {showBannerEdit  && <BannerEditor banner={banner} onSave={setBanner} onClose={() => setShowBanner(false)} />}
    </div>
  );
}
