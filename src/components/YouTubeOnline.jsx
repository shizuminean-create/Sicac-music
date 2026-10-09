
import { useState } from "react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export default function YouTubeOnline() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchVideos(event) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (!API_KEY) {
      setError("API key belum diatur di .env.local.");
      return;
    }

    setLoading(true);
    setError("");
    setVideos([]);
    setSelected(null);

    try {
      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        q,
        maxResults: "10",
        videoEmbeddable: "true",
        key: API_KEY,
      });

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?${params}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || "Pencarian YouTube gagal."
        );
      }

      setVideos(
        (data.items || [])
          .filter((item) => item.id?.videoId)
          .map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url,
          }))
      );

      if (!data.items?.length) {
        setError("Tidak ada video yang ditemukan.");
      }
    } catch (err) {
      setError(err.message || "Periksa koneksi internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, color: "white" }}>
      <h2 style={{ marginTop: 0 }}>YouTube Online</h2>
      <p style={{ color: "#aaa", fontSize: 13 }}>
        Cari musik dan putar melalui pemutar YouTube resmi.
      </p>

      <form
        onSubmit={searchVideos}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Judul lagu atau nama artis..."
          aria-label="Cari lagu YouTube"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #444",
            background: "#191923",
            color: "white",
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Mencari..." : "Cari"}
        </button>
      </form>

      {error && (
        <p role="status" style={{ color: "#ffb4b4", fontSize: 13 }}>
          {error}
        </p>
      )}

      {selected && (
        <section style={{ marginBottom: 20 }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <iframe
              key={selected.id}
              title={`Pemutar YouTube: ${selected.title}`}
              src={`https://www.youtube.com/embed/${encodeURIComponent(
                selected.id
              )}?playsinline=1`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </div>
          <h3 style={{ fontSize: 15 }}>{selected.title}</h3>
          <p style={{ color: "#aaa", fontSize: 12 }}>
            {selected.channel}
          </p>
        </section>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setSelected(video)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 10,
              textAlign: "left",
              border: "1px solid #30303b",
              borderRadius: 12,
              background:
                selected?.id === video.id ? "#292943" : "#191923",
              color: "white",
            }}
          >
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt=""
                loading="lazy"
                style={{
                  width: 112,
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            )}
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13 }}>
                {video.title}
              </span>
              <span
                style={{
                  display: "block",
                  color: "#aaa",
                  fontSize: 11,
                  marginTop: 5,
                }}
              >
                {video.channel}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

