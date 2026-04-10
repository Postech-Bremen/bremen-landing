import { Mail, MapPin, Clock } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-mono text-sm font-bold mb-4">CONTACT</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@soundwavelab.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Music Building, Room 204</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-4">PRACTICE HOURS</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Mon-Thu: 4pm - 10pm</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Fri: 4pm - 8pm</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Sat-Sun: 12pm - 6pm</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm font-bold mb-4">LINKS</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                University Music Department
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Student Activities Office
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">
                Performance Calendar
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex items-center justify-between">
          <div className="font-mono text-xs text-muted-foreground">
            <span className="font-bold">SOUNDWAVE LAB</span>
            <span className="mx-2">•</span>
            <span>University Band Club</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            est. 2018
          </p>
        </div>
      </div>
    </footer>
  )
}
