import { useState, useEffect, useCallback } from "react";

// ✅ 여기에 Railway 서버 주소 입력
const API_BASE = "https://live-scheduler-production.up.railway.app/api";

const PLATFORMS = {
  naver:    { name: "네이버",  color: "#03C75A", bg: "#03C75A15" },
  gmarket:  { name: "지마켓",  color: "#E31D1C", bg: "#E31D1C15" },
  elevenst: { name: "11번가", color: "#FF4500", bg: "#FF450015" },
  kakao:    { name: "카카오",  color: "#FEE500", bg: "#FEE50015" },
  coupang:  { name: "쿠팡",   color: "#1A6EFF", bg: "#1A6EFF15" },
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

// 카테고리별 이모지
const CATEGORY_EMOJI = {
  패션: "👗", 뷰티: "💄", 주방: "🍳", 식품: "🥩",
  가전: "📺", 건강: "💊", 반려동물: "🐶", 스포츠: "⛳",
};

function ViewerBadge({ count }) {
  if (!count || count === 0) return null;
  const formatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count;
  return (
    <span style={{
      background: "#ff4444", color: "#fff", fontSize: 10,
      padding: "1px 5px", borderRadius: 8, fontWeight: 700,
    }}>🔴 {formatted}</span>
  );
}

function LiveCard({ item }) {
  const platform = PLATFORMS[item.platform] || { name: item.platform, color: "#888", bg: "#88888815" };
  const statusStyle = {
    live:     { bg: "#ff444420", border: "#ff4444", label: "● LIVE", color: "#ff4444" },
    upcoming: { bg: "#ffffff08", border: "#ffffff20", label: "예정",   color: "#aaa"    },
    ended:    { bg: "#ffffff05", border: "#ffffff10", label: "종료",   color: "#555"    },
  }[item.status] || { bg: "#ffffff08", border: "#ffffff20", label: item.status, color: "#aaa" };

  const emoji = CATEGORY_EMOJI[item.category] || "📺";

  return (
    <div
      style={{
        background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
        transition: "all 0.2s", opacity: item.status === "ended" ? 0.5 : 1, cursor: "pointer",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "none"}
      onClick={() => item.url && window.open(item.url, "_blank")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{item.thumbnail || emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{
              background: platform.bg, color: platform.color,
              border: `1px solid ${platform.color}40`,
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
            }}>{platform.name}</span>
            <span style={{ color: statusStyle.color, fontSize: 10, fontWeight: 700 }}>{statusStyle.label}</span>
            {item.status === "live" && <ViewerBadge count={item.viewers} />}
          </div>
          <div style={{
            color: item.status === "ended" ? "#666" : "#eee",
            fontSize: 13, fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{item.title}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {(item.start_time || item.startTime) && (
              <span style={{ color: "#888", fontSize: 11 }}>
                🕐 {item.start_time || item.startTime}{(item.end_time || item.endTime) ? `~${item.end_time || item.endTime}` : ""}
              </span>
            )}
            {item.discount && (
              <span style={{ color: "#f90", fontSize: 11, fontWeight: 600 }}>🏷 {item.discount}</span>
            )}
            {item.host && (
              <span style={{ color: "#666", fontSize: 11 }}>👤 {item.host}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineView({ lives, selectedPlatforms }) {
  const filtered = lives.filter(l => selectedPlatforms.includes(l.platform));
  const platformList = [...new Set(filtered.map(l => l.platform))];

  const timeToX = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return ((h - 7) * 60 + m) / (16 * 60) * 100;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 700 }}>
        <div style={{ display: "flex", marginLeft: 80, marginBottom: 4 }}>
          {HOURS.map(h => (
            <div key={h} style={{ flex: 1, textAlign: "center", color: "#666", fontSize: 10 }}>{h}시</div>
          ))}
        </div>
        {platformList.map(pid => {
          const platform = PLATFORMS[pid] || { name: pid, color: "#888" };
          const items = filtered.filter(l => l.platform === pid);
          return (
            <div key={pid} style={{ display: "flex", alignItems: "center", marginBottom: 10, height: 40 }}>
              <div style={{
                width: 72, fontSize: 11, fontWeight: 700,
                color: platform.color, flexShrink: 0, textAlign: "right", paddingRight: 8,
              }}>{platform.name}</div>
              <div style={{ flex: 1, position: "relative", height: 32, background: "#ffffff05", borderRadius: 6 }}>
                {items.map((item, i) => {
                  const st = item.start_time || item.startTime;
                  const et = item.end_time || item.endTime;
                  const x = timeToX(st);
                  const w = Math.max(timeToX(et) - x, 2);
                  const statusColor = item.status === "live" ? "#ff4444" : item.status === "ended" ? "#444" : platform.color;
                  return (
                    <div key={i}
                      title={`${item.title}\n${st}~${et}`}
                      style={{
                        position: "absolute", left: `${x}%`, width: `${w}%`,
                        top: 4, height: 24,
                        background: statusColor + "33", border: `1px solid ${statusColor}88`,
                        borderRadius: 4, fontSize: 9, color: statusColor,
                        display: "flex", alignItems: "center", paddingLeft: 4,
                        overflow: "hidden", cursor: "pointer", whiteSpace: "nowrap",
                      }}>
                      {item.status === "live" && "● "}{item.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [crawling, setCrawling] = useState(false);

  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState(Object.keys(PLATFORMS));
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());

  // 서버에서 데이터 가져오기
  const fetchLives = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/lives`);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setLives(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 수동 크롤링 트리거
  const triggerCrawl = async () => {
    setCrawling(true);
    try {
      await fetch(`${API_BASE}/crawl`, { method: "POST" });
      setTimeout(fetchLives, 3000); // 3초 후 새로고침
    } catch (e) {
      setError("크롤링 실패: " + e.message);
    } finally {
      setCrawling(false);
    }
  };

  useEffect(() => {
    fetchLives();
    const t = setInterval(fetchLives, 5 * 60 * 1000); // 5분마다 자동 갱신
    return () => clearInterval(t);
  }, [fetchLives]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const togglePlatform = (pid) => {
    setSelectedPlatforms(prev =>
      prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
    );
  };

  const filtered = lives.filter(l => {
    if (!selectedPlatforms.includes(l.platform)) return false;
    if (filter !== "all" && l.status !== filter) return false;
    if (search && !l.title?.toLowerCase().includes(search.toLowerCase()) && !l.host?.includes(search)) return false;
    return true;
  });

  const liveCount = lives.filter(l => l.status === "live").length;
  const totalViewers = lives.reduce((s, l) => s + (l.viewers || 0), 0);

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0",
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    }}>
      {/* 헤더 */}
      <div style={{
        background: "linear-gradient(180deg, #13131f 0%, #0a0a0f 100%)",
        borderBottom: "1px solid #ffffff12",
        padding: "16px 20px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 900, margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📡</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>라이브 스케줄러</span>
              {liveCount > 0 && (
                <span style={{
                  background: "#ff4444", color: "#fff", fontSize: 10, fontWeight: 800,
                  padding: "2px 7px", borderRadius: 10, animation: "pulse 2s infinite",
                }}>LIVE {liveCount}</span>
              )}
            </div>
            <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
              {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
              {lastUpdated && ` · 업데이트 ${lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* 새로고침 버튼 */}
            <button onClick={triggerCrawl} disabled={crawling} style={{
              background: crawling ? "#ffffff08" : "#ffffff12",
              border: "1px solid #ffffff20", color: crawling ? "#555" : "#aaa",
              padding: "6px 12px", borderRadius: 8, cursor: crawling ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 600,
            }}>
              {crawling ? "수집 중..." : "🔄 새로고침"}
            </button>
            {["list", "timeline"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "#ffffff15" : "transparent",
                border: `1px solid ${view === v ? "#ffffff30" : "#ffffff10"}`,
                color: view === v ? "#fff" : "#666",
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontWeight: 600,
              }}>
                {v === "list" ? "목록" : "타임라인"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 16px" }}>
        {/* 에러 메시지 */}
        {error && (
          <div style={{
            background: "#ff444420", border: "1px solid #ff444440",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#ff8888", fontSize: 13,
          }}>
            ⚠️ {error} — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={fetchLives}>다시 시도</span>
          </div>
        )}

        {/* 플랫폼 필터 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {Object.entries(PLATFORMS).map(([pid, p]) => (
            <button key={pid} onClick={() => togglePlatform(pid)} style={{
              background: selectedPlatforms.includes(pid) ? p.bg : "transparent",
              border: `1px solid ${selectedPlatforms.includes(pid) ? p.color + "60" : "#ffffff15"}`,
              color: selectedPlatforms.includes(pid) ? p.color : "#555",
              padding: "5px 11px", borderRadius: 20, cursor: "pointer",
              fontSize: 12, fontWeight: 600, transition: "all 0.15s",
            }}>{p.name}</button>
          ))}
        </div>

        {/* 검색 + 상태 필터 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            placeholder="방송 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 160,
              background: "#ffffff08", border: "1px solid #ffffff15",
              color: "#eee", padding: "8px 14px", borderRadius: 10,
              fontSize: 13, outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "all", label: "전체" },
              { key: "live", label: "🔴 라이브" },
              { key: "upcoming", label: "⏰ 예정" },
              { key: "ended", label: "종료" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                background: filter === key ? "#ffffff15" : "transparent",
                border: `1px solid ${filter === key ? "#ffffff30" : "#ffffff10"}`,
                color: filter === key ? "#fff" : "#666",
                padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { label: "진행중", value: liveCount, color: "#ff4444" },
            { label: "예정",   value: lives.filter(l => l.status === "upcoming").length, color: "#4af" },
            { label: "총 시청자", value: totalViewers > 0 ? `${(totalViewers / 1000).toFixed(1)}k` : "-", color: "#f90" },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: "#ffffff06", border: "1px solid #ffffff10",
              borderRadius: 10, padding: "10px 14px", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 컨텐츠 */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            <div>서버에서 데이터 불러오는 중...</div>
          </div>
        ) : lives.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
            <div style={{ marginBottom: 8 }}>아직 수집된 방송이 없어요</div>
            <button onClick={triggerCrawl} disabled={crawling} style={{
              background: "#ffffff12", border: "1px solid #ffffff20",
              color: "#aaa", padding: "8px 16px", borderRadius: 8,
              cursor: "pointer", fontSize: 13,
            }}>
              {crawling ? "수집 중..." : "🔄 지금 바로 수집하기"}
            </button>
          </div>
        ) : view === "timeline" ? (
          <div style={{ background: "#ffffff06", border: "1px solid #ffffff10", borderRadius: 14, padding: 16 }}>
            <TimelineView lives={filtered} selectedPlatforms={selectedPlatforms} />
          </div>
        ) : (
          <div>
            {filtered.length === 0
              ? <div style={{ textAlign: "center", color: "#555", padding: "40px 0" }}>검색 결과가 없어요 😅</div>
              : filtered.map((item, i) => <LiveCard key={item.id || i} item={item} />)
            }
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #444; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}
