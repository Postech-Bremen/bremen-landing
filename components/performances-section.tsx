import { MapPin, ExternalLink } from "lucide-react"

const performances = {
  "2026": [
    { date: "4월 20", title: "봄 정기공연", venue: "무은재기념관", type: "정기공연" },
    { date: "5월 10", title: "포스텍 축제", venue: "대운동장", type: "축제" },
    { date: "6월 15", title: "졸업생 송별회", venue: "학생회관", type: "송별" },
  ],
  "2025": [
    { date: "12월 20", title: "겨울 정기공연", venue: "무은재기념관", type: "정기공연" },
    { date: "11월 15", title: "가을 버스킹", venue: "포스텍 광장", type: "버스킹" },
    { date: "10월 8", title: "홈커밍데이 공연", venue: "학생회관", type: "특별" },
    { date: "9월 20", title: "신입생 환영 공연", venue: "학생회관", type: "특별" },
    { date: "5월 25", title: "봄 축제 공연", venue: "대운동장", type: "축제" },
    { date: "4월 18", title: "봄 정기공연", venue: "무은재기념관", type: "정기공연" },
    { date: "3월 15", title: "개강 버스킹", venue: "포스텍 광장", type: "버스킹" },
  ],
  "2024": [
    { date: "12월 18", title: "겨울 정기공연", venue: "무은재기념관", type: "정기공연" },
    { date: "11월 10", title: "교내 밴드 페스티벌", venue: "학생회관", type: "특별" },
    { date: "10월 25", title: "할로윈 파티 공연", venue: "동아리방", type: "특별" },
    { date: "9월 22", title: "신입생 환영회", venue: "학생회관", type: "특별" },
    { date: "5월 18", title: "졸업생 송별 공연", venue: "무은재기념관", type: "송별" },
    { date: "4월 20", title: "봄 정기공연", venue: "무은재기념관", type: "정기공연" },
  ],
}

const typeColors: Record<string, string> = {
  "정기공연": "bg-foreground text-background",
  "축제": "bg-muted text-foreground",
  "버스킹": "border border-foreground text-foreground",
  "특별": "bg-muted text-foreground",
  "송별": "border border-foreground text-foreground",
}

export function PerformancesSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">ARCHIVE</p>
        <h1 className="text-3xl font-bold mb-4">공연 기록</h1>
        <p className="text-muted-foreground max-w-2xl">
          브레멘의 공연 기록 아카이브입니다. 정기공연부터 축제, 버스킹까지 다양한 무대의 기록을 확인할 수 있습니다.
        </p>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {Object.entries(typeColors).map(([type, classes]) => (
          <span key={type} className={`px-2 py-1 text-xs font-mono ${classes}`}>
            {type}
          </span>
        ))}
      </div>

      {Object.entries(performances).map(([year, events]) => (
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
                className="border border-border p-4 flex items-center gap-6 hover:border-foreground transition-colors group"
              >
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
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
