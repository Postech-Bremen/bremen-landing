import { Calendar, MapPin, ExternalLink } from "lucide-react"

const performances = {
  "2026": [
    { date: "05/10", title: "1학기 정기공연", venue: "학생회관 아틀라스홀", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
    { date: "04/13", title: "신입생 환영공연", venue: "학생회관 아틀라스홀", type: "특별", youtubeId: "dQw4w9WgXcQ" },
  ],
  "2025": [
    { date: "12/15", title: "2학기 정기공연", venue: "학생회관 아틀라스홀", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
    { date: "11/20", title: "포스텍-카이스트 학생대제전", venue: "학생회관", type: "축제", youtubeId: "dQw4w9WgXcQ" },
    { date: "10/08", title: "해맞이한마당", venue: "78계단 무대", type: "축제", youtubeId: "dQw4w9WgXcQ" },
    { date: "09/22", title: "새내기새로배움터", venue: "대강당", type: "특별", youtubeId: "dQw4w9WgXcQ" },
    { date: "05/25", title: "1학기 정기공연", venue: "학생회관 아틀라스홀", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
  ],
  "2024": [
    { date: "12/18", title: "2학기 정기공연", venue: "학생회관 아틀라스홀", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
    { date: "11/10", title: "포스텍-카이스트 학생대제전", venue: "학생회관", type: "축제", youtubeId: "dQw4w9WgXcQ" },
    { date: "10/08", title: "해맞이한마당", venue: "78계단 무대", type: "축제", youtubeId: "dQw4w9WgXcQ" },
    { date: "09/22", title: "새내기새로배움터", venue: "대강당", type: "특별", youtubeId: "dQw4w9WgXcQ" },
    { date: "05/18", title: "1학기 정기공연", venue: "학생회관 아틀라스홀", type: "정기공연", youtubeId: "dQw4w9WgXcQ" },
  ],
}

const typeColors: Record<string, string> = {
  "정기공연": "bg-foreground text-background",
  "축제": "bg-muted text-foreground",
  "특별": "border border-foreground text-foreground",
}

export function PerformancesSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">공연 기록</p>
        <h1 className="text-3xl font-bold mb-4">공연</h1>
        <p className="text-muted-foreground max-w-2xl">
          브레멘의 모든 공연과 활동 기록입니다.
        </p>
      </div>



      {Object.entries(performances).sort((a, b) => Number(b[0]) - Number(a[0])).map(([year, events]) => (
        <section key={year} className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-mono text-lg font-bold">{year}</h2>
            <div className="flex-1 border-t border-border" />
            <span className="font-mono text-xs text-muted-foreground">{events.length}개</span>
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
                <a
                  href={`https://www.youtube.com/watch?v=${event.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 border border-border hover:bg-muted transition-colors"
                >
                  <span className="text-xs font-mono">영상</span>
                </a>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="border-t border-border pt-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          2024-2026년 공연 기록입니다.
        </p>
      </div>
    </div>
  )
}
