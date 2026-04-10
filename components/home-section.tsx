import { Calendar, MapPin, Users, Music, Clock } from "lucide-react"

const stats = [
  { label: "Active Members", value: "42" },
  { label: "Annual Performances", value: "12" },
  { label: "Years Active", value: "8" },
  { label: "Alumni Network", value: "180+" },
]

const areas = [
  { title: "Jazz Ensemble", description: "Weekly improvisation sessions and combo work", schedule: "Tues 7-9pm" },
  { title: "Concert Band", description: "Classical and contemporary repertoire", schedule: "Wed 6-8pm" },
  { title: "Chamber Groups", description: "Small ensemble coaching and performance", schedule: "Thu 5-7pm" },
  { title: "Music Tech Lab", description: "Recording, production, and sound design", schedule: "Fri 4-6pm" },
]

const events = [
  { date: "Apr 18", title: "Spring Concert", location: "Memorial Hall", time: "7:30 PM" },
  { date: "May 02", title: "Jazz Night", location: "Student Center", time: "8:00 PM" },
  { date: "May 15", title: "Chamber Recital", location: "Recital Hall", time: "4:00 PM" },
]

export function HomeSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <section className="mb-16">
        <div className="border border-border p-8 mb-8">
          <p className="font-mono text-xs text-muted-foreground mb-2">RESEARCH GROUP</p>
          <h1 className="text-3xl font-bold mb-4 text-balance">Soundwave Lab</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A collaborative research collective exploring the intersection of music, performance, and 
            community. We investigate sonic expression through weekly practice, public performance, 
            and peer mentorship.
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
          <h2 className="font-mono text-sm font-bold">PRACTICE AREAS</h2>
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
          <h2 className="font-mono text-sm font-bold">UPCOMING EVENTS</h2>
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
          <h2 className="font-mono text-sm font-bold">JOIN US</h2>
        </div>
        <div className="border border-border p-6">
          <div className="flex items-start gap-4">
            <Users className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <h3 className="font-bold mb-2">Open Auditions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We welcome musicians of all levels. Auditions are held at the beginning of each semester.
                No prior ensemble experience required.
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Next audition period: September 2026
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
