"use client"

import { User, Briefcase, Guitar, Mic, Drum, Music, Volume2 } from "lucide-react"

const instrumentIcons: Record<string, React.ElementType> = {
  "기타": Guitar,
  "보컬": Mic,
  "드럼": Drum,
  "키보드": Music,
  "베이스": Volume2,
}

const activeMembers = [
  {
    year: "2025",
    members: [
      { name: "김도윤", instrument: "기타", role: "밴드장" },
      { name: "이하늘", instrument: "보컬" },
      { name: "박서준", instrument: "드럼", role: "부밴드장" },
      { name: "최유진", instrument: "키보드" },
      { name: "정민호", instrument: "베이스" },
    ]
  },
  {
    year: "2024",
    members: [
      { name: "김태현", instrument: "기타" },
      { name: "이수빈", instrument: "보컬" },
      { name: "박지우", instrument: "드럼" },
      { name: "송민아", instrument: "키보드" },
    ]
  },
  {
    year: "2023",
    members: [
      { name: "한준서", instrument: "기타" },
      { name: "오예린", instrument: "보컬" },
      { name: "신동훈", instrument: "베이스" },
    ]
  },
]

const alumni = [
  {
    year: "2025",
    members: [
      { name: "김민수", instrument: "기타", role: "밴드장", current: "삼성전자 반도체부문" },
      { name: "이서연", instrument: "보컬", current: "서울대 대학원 진학" },
      { name: "박준혁", instrument: "드럼", current: "현대자동차 연구소" },
    ]
  },
  {
    year: "2024",
    members: [
      { name: "정하은", instrument: "베이스", role: "부밴드장", current: "카카오 개발자" },
      { name: "최영민", instrument: "키보드", current: "KAIST 대학원 진학" },
      { name: "송지원", instrument: "기타", current: "네이버 기획자" },
      { name: "한승우", instrument: "보컬", current: "음악 프로듀서 활동" },
    ]
  },
  {
    year: "2023",
    members: [
      { name: "윤태희", instrument: "드럼", role: "밴드장", current: "LG전자 AI연구소" },
      { name: "강민지", instrument: "보컬", current: "스탠포드 유학" },
      { name: "임재현", instrument: "베이스", current: "토스 개발자" },
    ]
  },
  {
    year: "2022",
    members: [
      { name: "오서준", instrument: "기타", role: "밴드장", current: "구글 코리아" },
      { name: "신예린", instrument: "키보드", current: "음악 치료사" },
      { name: "류지훈", instrument: "드럼", current: "배달의민족 개발자" },
      { name: "황수민", instrument: "보컬", current: "싱어송라이터 활동" },
    ]
  },
]

interface MemberCardProps {
  member: {
    name: string
    instrument: string
    role?: string
    current?: string
  }
  isAlumni?: boolean
}

function MemberCard({ member, isAlumni = false }: MemberCardProps) {
  const InstrumentIcon = instrumentIcons[member.instrument] || User
  
  return (
    <div
      className={`p-4 transition-colors ${
        isAlumni 
          ? "border border-dashed border-muted-foreground/50 hover:border-muted-foreground" 
          : "border-2 border-foreground hover:bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 flex items-center justify-center flex-shrink-0 ${
          isAlumni 
            ? "border border-dashed border-muted-foreground/50" 
            : "border-2 border-foreground"
        }`}>
          <User className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold">{member.name}</h3>
            {member.role && (
              <span className={`text-xs font-mono font-bold ${
                member.role.includes("밴드장") ? "text-foreground bg-muted px-2 py-1" : "text-muted-foreground"
              }`}>{member.role}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <InstrumentIcon className="w-3.5 h-3.5" />
            <span>{member.instrument}</span>
          </div>
          {isAlumni && member.current && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3" />
              <span>{member.current}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function MembersSection() {
  // 학번별로 활동부원과 졸업생을 합쳐서 정렬
  const allYears = ["2025", "2024", "2023", "2022"]
  
  const getMembersForYear = (year: string) => {
    const active = activeMembers.find(y => y.year === year)?.members || []
    const grad = alumni.find(y => y.year === year)?.members || []
    return { active, grad }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">MEMBERS</p>
        <h1 className="text-3xl font-bold mb-4">멤버</h1>
        <p className="text-muted-foreground max-w-2xl">
          브레멘의 현재 활동 부원과 졸업생 네트워크입니다.
        </p>
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-foreground" />
            <span className="text-sm text-muted-foreground">활동 부원</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border border-dashed border-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">졸업생</span>
          </div>
        </div>
      </div>

      <section>
        {allYears.map((year) => {
          const { active, grad } = getMembersForYear(year)
          const totalCount = active.length + grad.length
          
          if (totalCount === 0) return null
          
          return (
            <div key={year} className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-mono text-sm font-bold">{year}학번</h3>
                <div className="flex-1 border-t border-border" />
                <span className="font-mono text-xs text-muted-foreground">{totalCount}명</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((member) => (
                  <MemberCard key={`active-${member.name}`} member={member} isAlumni={false} />
                ))}
                {grad.map((member) => (
                  <MemberCard key={`alumni-${member.name}`} member={member} isAlumni={true} />
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
