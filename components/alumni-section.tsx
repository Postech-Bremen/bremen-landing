import { User, Briefcase, Mail } from "lucide-react"

const alumni = {
  "2025": [
    { name: "Sarah Chen", instrument: "Violin", role: "Concertmaster", current: "Graduate Student, Juilliard" },
    { name: "Marcus Johnson", instrument: "Trumpet", role: "Jazz Ensemble Lead", current: "Music Teacher, Lincoln HS" },
    { name: "Emily Rodriguez", instrument: "Piano", role: "Accompanist", current: "Session Musician, LA" },
  ],
  "2024": [
    { name: "David Kim", instrument: "Percussion", role: "Section Leader", current: "Software Engineer, Spotify" },
    { name: "Aisha Patel", instrument: "Flute", role: "Principal", current: "Freelance Musician, NYC" },
    { name: "James Wilson", instrument: "Saxophone", role: "Jazz Combo", current: "Medical Student, Johns Hopkins" },
    { name: "Lisa Chang", instrument: "Cello", role: "Chamber Group", current: "Orchestra Fellow, Chicago Symphony" },
  ],
  "2023": [
    { name: "Michael Brown", instrument: "Clarinet", role: "Principal", current: "Music Director, Community Band" },
    { name: "Rachel Green", instrument: "Oboe", role: "Section Leader", current: "Arts Administrator, Kennedy Center" },
    { name: "Kevin Nguyen", instrument: "Bass", role: "Jazz Ensemble", current: "Sound Engineer, Blue Note Records" },
  ],
  "2022": [
    { name: "Amanda Foster", instrument: "French Horn", role: "Principal", current: "Orchestra Musician, Boston Pops" },
    { name: "Christopher Lee", instrument: "Trombone", role: "Section Leader", current: "Band Director, Midwest HS" },
    { name: "Jennifer Martinez", instrument: "Viola", role: "Chamber Group", current: "Music Therapist, Children&apos;s Hospital" },
    { name: "Andrew Taylor", instrument: "Guitar", role: "Jazz Combo", current: "Studio Musician, Nashville" },
  ],
}

export function AlumniSection() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">NETWORK</p>
        <h1 className="text-3xl font-bold mb-4">Alumni</h1>
        <p className="text-muted-foreground max-w-2xl">
          Our graduates continue to make music across diverse fields and geographies. 
          The Soundwave Lab alumni network spans over 180 musicians.
        </p>
      </div>

      <div className="border border-border p-6 mb-12">
        <div className="flex items-start gap-4">
          <Mail className="w-5 h-5 text-muted-foreground mt-1" />
          <div>
            <h3 className="font-bold mb-2">Alumni Directory</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Current members can access the full alumni directory and contact information 
              through the club portal.
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Contact: alumni@soundwavelab.edu
            </p>
          </div>
        </div>
      </div>

      {Object.entries(alumni).map(([year, members]) => (
        <section key={year} className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-mono text-lg font-bold">Class of {year}</h2>
            <div className="flex-1 border-t border-border" />
            <span className="font-mono text-xs text-muted-foreground">{members.length} members</span>
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
                      {member.instrument} • {member.role}
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
          Showing recent alumni (2022-2025). Full directory available to registered members.
        </p>
      </div>
    </div>
  )
}
