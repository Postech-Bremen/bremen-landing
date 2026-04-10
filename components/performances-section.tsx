import { Calendar, MapPin, ExternalLink } from "lucide-react"

const performances = {
  "2026": [
    { date: "Apr 18", title: "Spring Concert", venue: "Memorial Hall", type: "Concert" },
    { date: "May 02", title: "Jazz Night", venue: "Student Center", type: "Jazz" },
    { date: "May 15", title: "Chamber Recital", venue: "Recital Hall", type: "Chamber" },
  ],
  "2025": [
    { date: "Dec 12", title: "Winter Showcase", venue: "Memorial Hall", type: "Concert" },
    { date: "Nov 08", title: "Fall Jazz Festival", venue: "Downtown Arts Center", type: "Jazz" },
    { date: "Oct 20", title: "Homecoming Performance", venue: "Alumni Stadium", type: "Pep Band" },
    { date: "Sep 15", title: "Welcome Week Concert", venue: "Student Center", type: "Concert" },
    { date: "May 10", title: "Spring Gala", venue: "Memorial Hall", type: "Concert" },
    { date: "Apr 05", title: "Jazz Cabaret", venue: "Black Box Theater", type: "Jazz" },
    { date: "Mar 22", title: "Chamber Music Evening", venue: "Recital Hall", type: "Chamber" },
  ],
  "2024": [
    { date: "Dec 14", title: "Holiday Concert", venue: "Memorial Hall", type: "Concert" },
    { date: "Nov 15", title: "Big Band Bash", venue: "Student Center", type: "Jazz" },
    { date: "Oct 25", title: "Halloween Spooktacular", venue: "Outdoor Amphitheater", type: "Concert" },
    { date: "Sep 20", title: "New Member Showcase", venue: "Recital Hall", type: "Chamber" },
    { date: "May 18", title: "Senior Sendoff", venue: "Memorial Hall", type: "Concert" },
    { date: "Apr 12", title: "Spring Jazz Night", venue: "Downtown Jazz Club", type: "Jazz" },
  ],
}

const typeColors: Record<string, string> = {
  "Concert": "bg-foreground text-background",
  "Jazz": "bg-muted text-foreground",
  "Chamber": "border border-foreground text-foreground",
  "Pep Band": "bg-muted text-foreground",
}

export function PerformancesSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">ARCHIVE</p>
        <h1 className="text-3xl font-bold mb-4">Performances</h1>
        <p className="text-muted-foreground max-w-2xl">
          A chronological record of our public performances and collaborative events.
        </p>
      </div>

      <div className="flex gap-2 mb-8">
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
            <span className="font-mono text-xs text-muted-foreground">{events.length} events</span>
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
          Showing performances from 2024-2026. For earlier records, contact the club archivist.
        </p>
      </div>
    </div>
  )
}
