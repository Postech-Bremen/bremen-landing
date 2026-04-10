import { Mail, MapPin, Clock, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-mono text-sm font-bold mb-4">연락처</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                <span>DM @postech.bremen</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>학생회관 401호</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-4">정기모임</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>수요일 밤 9:30</span>
              </div>
              <p className="text-xs mt-3">
                필요시 정기모임을 개최합니다.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-4">SNS</h3>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/postech.bremen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@postech_bremen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
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
            since 2001
          </p>
        </div>
      </div>
    </footer>
  )
}
