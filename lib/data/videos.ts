export type EventKey = string

export type Video = {
  id: string
  /** Display thumbnail. Prefer Supabase Storage when available. */
  thumbnailUrl?: string
  /** Canonical watch URL. YouTube Shorts can use a different path. */
  watchUrl?: string
  /** 원곡 아티스트 */
  artist?: string
  /** 곡명 (콤마 구분 메들리 가능) */
  song?: string
  /** 채널 원본 제목 (artist + song 으로 분리 안 되는 경우 fallback) */
  raw_title: string
  /** 팀명 (정기공연 팀곡인 경우) */
  team?: string
  event: EventKey
  eventLabel?: string
  eventOrder?: number
  duration: string
  views: number
  /** 채널 highlights / 메인 영상 (커버 아닌 종합 영상) */
  highlight?: boolean
}

export type Event = {
  key: EventKey
  title: string
  subtitle: string
  shortLabel: string
  year: string
  /** 표시 순서 (최신 우선) */
  order: number
}

export const events: Event[] = [
  {
    key: "2026-spring-welcome",
    title: "2026 신입생 환영공연",
    subtitle: "Spring Welcome Concert",
    shortLabel: "신환공",
    year: "2026",
    order: 1,
  },
  {
    key: "2025-fall-regular",
    title: "25-2 정기공연",
    subtitle: "2025 Fall Regular Concert",
    shortLabel: "정기공연",
    year: "2025",
    order: 2,
  },
  {
    key: "2025-stadium",
    title: "2025 STadium",
    subtitle: "Stadium Live",
    shortLabel: "STadium",
    year: "2025",
    order: 3,
  },
  {
    key: "2025-orientation",
    title: "2025 새내기새로배움터",
    subtitle: "Orientation Showcase",
    shortLabel: "새터",
    year: "2025",
    order: 4,
  },
]

export const videos: Video[] = [
  // 2026 신환공 — 6
  { id: "sgDwk_UGHZE", artist: "Bon Jovi", song: "You Give Love a Bad Name", raw_title: "Bon Jovi - You Give Love a Bad Name", event: "2026-spring-welcome", duration: "4:01", views: 98 },
  { id: "TR3dgK5sqx8", artist: "SURL(설)", song: "Cilla", raw_title: "SURL(설) - Cilla", event: "2026-spring-welcome", duration: "5:25", views: 46 },
  { id: "hjXIfCHx0-I", artist: "한로로", song: "사랑하게 될 거야", raw_title: "한로로 - 사랑하게 될 거야", event: "2026-spring-welcome", duration: "2:38", views: 126 },
  { id: "0PZIb2ORP8U", artist: "쏜애플", song: "시퍼런 봄", raw_title: "쏜애플 - 시퍼런 봄", event: "2026-spring-welcome", duration: "5:40", views: 104 },
  { id: "OfzCQB3e644", artist: "브로큰 발렌타인", song: "Quasimodo", raw_title: "브로큰 발렌타인 - Quasimodo", event: "2026-spring-welcome", duration: "4:40", views: 47 },
  { id: "lPnkF2QurxE", artist: "한로로", song: "해초", raw_title: "한로로 - 해초", event: "2026-spring-welcome", duration: "3:38", views: 154 },

  // 25-2 정기공연 — 6 (팀별)
  { id: "kvIgeZFp0gQ", artist: "Dream Theater", song: "Octavarium", team: "Team Eternity", raw_title: "Dream Theater - Octavarium", event: "2025-fall-regular", duration: "22:56", views: 540 },
  { id: "kJVwTZeaFFI", artist: "한로로", song: "내일에서 온 티켓 / 0+0 / 용의자", team: "자살클럽", raw_title: "한로로 - 내일에서 온 티켓, 0+0, 용의자", event: "2025-fall-regular", duration: "10:01", views: 191 },
  { id: "rG2H8B360Bo", artist: "터치드", song: "여정 / Bad Sniper / Get Back", team: "돌아온 터치드", raw_title: "터치드 - 여정, Bad Sniper, Get Back", event: "2025-fall-regular", duration: "12:25", views: 85 },
  { id: "cC6ybD8EMOk", artist: "양문학", song: "OOPARTS / 1999", team: "음문학", raw_title: "양문학 - OOPARTS, 1999", event: "2025-fall-regular", duration: "11:30", views: 40 },
  { id: "QqUk16SxgyU", artist: "결속 밴드", song: "기타 / 고독 / 푸른 행성", team: "봇치", raw_title: "결속 밴드 - 기타, 고독, 푸른 행성", event: "2025-fall-regular", duration: "3:57", views: 77 },
  { id: "dOTgY7w1KsM", artist: "유다빈밴드", song: "안중", team: "일서연일서영", raw_title: "유다빈밴드 - 안중", event: "2025-fall-regular", duration: "4:19", views: 48 },

  // 2025 STadium — 4
  { id: "DpiI7mAcxjA", artist: "한로로", song: "해초", raw_title: "한로로 - 해초", event: "2025-stadium", duration: "3:42", views: 746 },
  { id: "5zhd0eCO0tQ", artist: "터치드", song: "Last Day", raw_title: "터치드 - Last Day", event: "2025-stadium", duration: "5:53", views: 93 },
  { id: "e4cjxqcQWgk", artist: "넬", song: "Star Shell", raw_title: "넬 - Star Shell", event: "2025-stadium", duration: "4:20", views: 127 },
  { id: "P4c5aS7p5lI", artist: "크라잉넛", song: "좋지 아니한가", raw_title: "크라잉넛 - 좋지 아니한가", event: "2025-stadium", duration: "4:40", views: 86 },

  // 2025 새터 — 1 highlight + 4 covers
  { id: "Lx4_I9V0yss", raw_title: "2025 POSTECH 새내기새로배움터 BREMEN", event: "2025-orientation", duration: "16:39", views: 399, highlight: true },
  { id: "83Ic_e-gW9I", artist: "이승윤", song: "비싼 숙취", raw_title: "이승윤 - 비싼 숙취", event: "2025-orientation", duration: "3:33", views: 7400 },
  { id: "tR8bSxa4igQ", artist: "쏜애플", song: "빨간 피터", raw_title: "쏜애플 - 빨간 피터", event: "2025-orientation", duration: "4:44", views: 983 },
  { id: "sf26ZMJzBk4", artist: "하현우", song: "Lazenca, Save Us", raw_title: "하현우 - Lazenca, Save Us", event: "2025-orientation", duration: "3:21", views: 584 },
  { id: "zj9I4hi6ths", artist: "버즈", song: "나에게로 떠나는 여행", raw_title: "버즈 - 나에게로 떠나는 여행", event: "2025-orientation", duration: "3:14", views: 519 },
]

type ThumbQuality = "max" | "hq" | "mq" | "sd"
const thumbName: Record<ThumbQuality, string> = {
  max: "maxresdefault", // 1280×720 16:9, only if uploader provided HD
  sd:  "sddefault",     // 640×480, 4:3 with letterbox bars
  hq:  "hqdefault",     // 480×360, 4:3 with letterbox bars
  mq:  "mqdefault",     // 320×180, true 16:9, no bars
}
export function thumbnailUrl(id: string, quality: ThumbQuality = "mq"): string {
  return `https://i.ytimg.com/vi/${id}/${thumbName[quality]}.jpg`
}

export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

export function eventByKey(key: EventKey): Event {
  const e = events.find((ev) => ev.key === key)
  if (e) return e

  return {
    key,
    title: key,
    subtitle: "",
    shortLabel: "기록",
    year: "",
    order: Number.MAX_SAFE_INTEGER,
  }
}

export function videosByEvent(): Map<EventKey, Video[]> {
  const m = new Map<EventKey, Video[]>()
  for (const e of events) m.set(e.key, [])
  for (const v of videos) m.get(v.event)?.push(v)
  return m
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
