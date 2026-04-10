import { User, Briefcase, Mail } from "lucide-react"

const alumni = {
  "2025": [
    { name: "김민수", instrument: "기타", role: "밴드장", current: "삼성전자 반도체부문" },
    { name: "이서연", instrument: "보컬", role: "보컬 리더", current: "서울대 대학원 진학" },
    { name: "박준혁", instrument: "드럼", role: "드럼 파트장", current: "현대자동차 연구소" },
  ],
  "2024": [
    { name: "정하은", instrument: "베이스", role: "부밴드장", current: "카카오 개발자" },
    { name: "최영민", instrument: "키보드", role: "키보드 파트장", current: "KAIST 대학원 진학" },
    { name: "송지원", instrument: "기타", role: "기타 파트장", current: "네이버 기획자" },
    { name: "한승우", instrument: "보컬", role: "음향 담당", current: "음악 프로듀서 활동" },
  ],
  "2023": [
    { name: "윤태희", instrument: "드럼", role: "밴드장", current: "LG전자 AI연구소" },
    { name: "강민지", instrument: "보컬", role: "보컬 리더", current: "스탠포드 유학" },
    { name: "임재현", instrument: "베이스", role: "베이스 파트장", current: "토스 개발자" },
  ],
  "2022": [
    { name: "오서준", instrument: "기타", role: "밴드장", current: "구글 코리아" },
    { name: "신예린", instrument: "키보드", role: "부밴드장", current: "음악 치료사" },
    { name: "류지훈", instrument: "드럼", role: "드럼 파트장", current: "배달의민족 개발자" },
    { name: "황수민", instrument: "보컬", role: "홍보 담당", current: "싱어송라이터 활동" },
  ],
}

export function AlumniSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">NETWORK</p>
        <h1 className="text-3xl font-bold mb-4">졸업생</h1>
        <p className="text-muted-foreground max-w-2xl">
          브레멘 졸업생들은 다양한 분야에서 활약하고 있습니다. 
          30년 역사와 함께 500명 이상의 졸업생 네트워크가 형성되어 있습니다.
        </p>
      </div>

      <div className="border border-border p-6 mb-12">
        <div className="flex items-start gap-4">
          <Mail className="w-5 h-5 text-muted-foreground mt-1" />
          <div>
            <h3 className="font-bold mb-2">졸업생 연락망</h3>
            <p className="text-sm text-muted-foreground mb-3">
              재학생은 동아리 포털을 통해 졸업생 연락처와 디렉토리에 접근할 수 있습니다.
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              문의: bremen@postech.ac.kr
            </p>
          </div>
        </div>
      </div>

      {Object.entries(alumni).map(([year, members]) => (
        <section key={year} className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-mono text-lg font-bold">{year}학번</h2>
            <div className="flex-1 border-t border-border" />
            <span className="font-mono text-xs text-muted-foreground">{members.length}명</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member.name}
                className="border border-border p-4 hover:border-foreground transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-muted-foreground flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.instrument} | {member.role}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Briefcase className="w-3 h-3" />
                      <span>{member.current}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="border-t border-border pt-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          최근 졸업생(2022-2025학번) 정보입니다. 전체 명단은 동아리 회원 전용입니다.
        </p>
      </div>
    </div>
  )
}
