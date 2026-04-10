import { Calendar, MapPin, Users, Music, Clock } from "lucide-react"

const stats = [
  { label: "현재 부원", value: "45" },
  { label: "연간 공연", value: "6+" },
  { label: "활동 연수", value: "30+" },
  { label: "졸업생 네트워크", value: "500+" },
]

const areas = [
  { title: "밴드 합주", description: "팀별 자율적 합주 및 공연 준비", schedule: "팀별 자율 일정" },
  { title: "악기별 멘토링", description: "악기별 경험자 멘토링 및 기초 레슨", schedule: "주 1-2회" },
  { title: "작곡/편곡", description: "오리지널 곡 작업 및 편곡 스터디", schedule: "매주 금 17:00" },
  { title: "녹음 스튜디오", description: "레코딩 및 믹싱 작업", schedule: "예약제 운영" },
]

const events = [
  { date: "4월 20", title: "봄 정기공연", location: "무은재기념관", time: "오후 7:00" },
  { date: "5월 10", title: "포스텍 축제 공연", location: "대운동장 무대", time: "오후 8:00" },
]

export function HomeSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <section className="mb-16">
        <div className="border border-border p-8 mb-8">
          <p className="font-mono text-xs text-muted-foreground mb-2">POSTECH BAND CLUB</p>
          <h1 className="text-3xl font-bold mb-4 text-balance">브레멘 Bremen</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            포항공과대학교 밴드 동아리 브레멘입니다. 음악을 사랑하는 사람들이 모여 
            함께 연주하고, 공연하며, 음악적 성장을 도모하는 공동체입니다. 
            1994년 창립 이래 꾸준히 포스텍의 음악 문화를 이끌어왔습니다.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-border p-4 text-center">
              <p className="font-mono text-2xl font-bold">{stat.value}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <span className="font-mono text-xs text-muted-foreground">01</span>
          <h2 className="font-mono text-sm font-bold">활동 영역</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {areas.map((area) => (
            <div key={area.title} className="border border-border p-6 hover:border-foreground transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold">{area.title}</h3>
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{area.description}</p>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{area.schedule}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <span className="font-mono text-xs text-muted-foreground">02</span>
          <h2 className="font-mono text-sm font-bold">다가오는 공연</h2>
        </div>
        <div className="border border-border divide-y divide-border">
          {events.map((event) => (
            <div key={event.title} className="p-4 flex items-center gap-6 hover:bg-muted/50 transition-colors">
              <div className="w-16 text-center">
                <p className="font-mono text-xs text-muted-foreground">{event.date.split(" ")[0]}</p>
                <p className="font-mono text-lg font-bold">{event.date.split(" ")[1]}</p>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{event.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </span>
                </div>
              </div>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <span className="font-mono text-xs text-muted-foreground">03</span>
          <h2 className="font-mono text-sm font-bold">가입 안내</h2>
        </div>
        <div className="border border-border p-6">
          <div className="flex items-start gap-4">
            <Users className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <h3 className="font-bold mb-2">신입 부원 모집</h3>
              <p className="text-sm text-muted-foreground">
                매년 1학기 초에 신입(1학년)을 대상으로 부원을 모집합니다. 
                악기 경험이 없어도 괜찮습니다. 음악을 사랑하고 함께 연주하고 싶은 마음만 있다면 환영합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
