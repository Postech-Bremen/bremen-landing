import { MapPin, ExternalLink, Youtube } from "lucide-react"

const performances = [
  {
    year: "2026",
    events: [
      { date: "5월 10", title: "포스텍 축제", venue: "대운동장", type: "축제", youtubeId: null },
      { date: "4월 20", title: "1학기 정기공연", venue: "무은재기념관", type: "정기공연", youtubeId: null },
    ]
  },
  {
    year: "2025",
    events: [
      { date: "12월 20", title: "2학기 정기공연", venue: "무은재기념관", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
      { date: "9월 20", title: "신입생 환영 공연", venue: "학생회관", type: "특별", youtubeId: null },
      { date: "5월 25", title: "봄 축제 공연", venue: "대운동장", type: "축제", youtubeId: "dQw4w9WgXcQ" },
      { date: "4월 18", title: "1학기 정기공연", venue: "무은재기념관", type: "정기공연", youtubeId: null },
    ]
  },
  {
    year: "2024",
    events: [
      { date: "12월 18", title: "2학기 정기공연", venue: "무은재기념관", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
      { date: "11월 10", title: "교내 밴드 페스티벌", venue: "학생회관", type: "특별", youtubeId: null },
      { date: "10월 25", title: "할로윈 파티 공연", venue: "동아리방", type: "특별", youtubeId: null },
      { date: "9월 22", title: "신입생 환영회", venue: "학생회관", type: "특별", youtubeId: "dQw4w9WgXcQ" },
      { date: "4월 20", title: "1학기 정기공연", venue: "무은재기념관", type: "정기공연", youtubeId: null },
    ]
  },
]

const typeColors: Record<string, string> = {
  "정기공연": "bg-foreground text-background",
  "축제": "bg-muted text-foreground",
  "특별": "bg-muted text-foreground",
}

export function PerformancesSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">ARCHIVE</p>
        <h1 className="text-3xl font-bold mb-4">공연 기록</h1>
        <p className="text-muted-foreground max-w-2xl">
          브레멘의 공연 기록 아카이브입니다. 정기공연부터 축제까지 다양한 무대의 기록을 확인할 수 있습니다.
        </p>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {Object.entries(typeColors).map(([type, classes]) => (
          <span key={type} className={`px-2 py-1 text-xs font-mono ${classes}`}>
            {type}
          </span>
        ))}
      </div>

      {performances.map(({ year, events }) => (
        <section key={year} className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-mono text-lg font-bold">{year}</h2>
            <div className="flex-1 border-t border-border" />
            <span className="font-mono text-xs text-muted-foreground">{events.length}회 공연</span>
          </div>

          <div className="space-y-3">
            {events.map((event, idx) => (
              <div
                key={idx}
                className="border border-border p-4 flex items-center justify-between gap-6 hover:border-foreground transition-colors group"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-20">
                    <p className="font-mono text-sm">{event.date}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:underline">{event.title}</h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-mono ${typeColors[event.type]}`}>
                    {event.type}
                  </span>
                </div>
                {event.youtubeId ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${event.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 border border-border hover:bg-muted transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                    <span className="text-xs font-mono">영상</span>
                  </a>
                ) : (
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="border-t border-border pt-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          2024-2026년 공연 기록입니다. 이전 기록은 동아리 아카이브에서 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  )
}
