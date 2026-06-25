import {
  Clock,
  InstagramLogo,
  MapPin,
  YoutubeLogo,
  Link as LinkIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Separator } from "@/components/ui/separator"

export type FooterContactItem = {
  kind: "location" | "time" | "text"
  value: string
}

export type FooterSocialItem = {
  kind: "instagram" | "youtube" | "link"
  label: string
  href: string
}

export type FooterConfig = {
  titleKr: string
  titleEn: string
  eyebrow: string
  description: string
  contactTitle: string
  contacts: FooterContactItem[]
  socialTitle: string
  socials: FooterSocialItem[]
  copyrightName: string
  foundingYear: number
  sinceLabel: string
}

function ContactIcon({ kind }: { kind: FooterContactItem["kind"] }) {
  if (kind === "location") {
    return <MapPin weight="light" className="w-4 h-4 mt-0.5 shrink-0 text-primary-foreground/60" />
  }

  if (kind === "time") {
    return <Clock weight="light" className="w-4 h-4 mt-0.5 shrink-0 text-primary-foreground/60" />
  }

  return <LinkIcon weight="light" className="w-4 h-4 mt-0.5 shrink-0 text-primary-foreground/60" />
}

function SocialIcon({ kind }: { kind: FooterSocialItem["kind"] }) {
  if (kind === "instagram") {
    return <InstagramLogo weight="light" className="w-4 h-4" />
  }

  if (kind === "youtube") {
    return <YoutubeLogo weight="light" className="w-4 h-4" />
  }

  return <LinkIcon weight="light" className="w-4 h-4" />
}

export function Footer({ config }: { config: FooterConfig }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-32 border-t bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <h3 className="font-serif-kr text-4xl leading-tight">
              {config.titleKr}
              <span className="font-serif italic text-3xl ml-3 text-muted-foreground">
                {config.titleEn}
              </span>
            </h3>
            <p className="caps mt-3 text-primary-foreground/60">{config.eyebrow}</p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              {config.description}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="caps mb-4 text-primary-foreground/60">{config.contactTitle}</p>
            <ul className="space-y-3 text-sm">
              {config.contacts.map((contact) => (
                <li key={`${contact.kind}:${contact.value}`} className="flex items-start gap-2">
                  <ContactIcon kind={contact.kind} />
                  <span>{contact.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="caps mb-4 text-primary-foreground/60">{config.socialTitle}</p>
            <ul className="space-y-3 text-sm">
              {config.socials.map((social) => (
                <li key={`${social.kind}:${social.href}`}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-primary-foreground/80 transition-colors hover:text-accent"
                >
                  <SocialIcon kind={social.kind} />
                  <span>{social.label}</span>
                </a>
              </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-primary-foreground/60">
          <span className="tabular-nums">
            © {config.foundingYear} — {currentYear} {config.copyrightName}
          </span>
          <span className="caps text-primary-foreground/60">{config.sinceLabel}</span>
        </div>
      </div>
    </footer>
  )
}
