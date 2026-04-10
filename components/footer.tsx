import { Mail, MapPin, Clock } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-mono text-sm font-bold mb-4">연락처</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>bremen@postech.ac.kr</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>학생회관 동아리방</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-4">동아리방 운영시간</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>월-금: 오후 5시 - 밤 11시</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>토-일: 오후 1시 - 밤 10시</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-4">바로가기</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                포스텍 학생회
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                동아리연합회
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                포스텍 포탈
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex items-center justify-between">
          <div className="font-mono text-xs text-muted-foreground">
            <span className="font-bold">BREMEN</span>
            <span className="mx-2">|</span>
            <span>포항공과대학교 밴드 동아리</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            since 1994
          </p>
        </div>
      </div>
    </footer>
  )
}
