type LegalSection = {
  title: string
  paragraphs?: string[]
  items?: string[]
}

type LegalDocumentProps = {
  eyebrow: string
  title: string
  description: string
  effectiveDate: string
  sections: LegalSection[]
}

export function LegalDocument({
  eyebrow,
  title,
  description,
  effectiveDate,
  sections,
}: LegalDocumentProps) {
  return (
    <article className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <header className="grid gap-8 border-b pb-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="caps mb-5">{eyebrow}</p>
          <h1 className="font-serif-kr text-5xl leading-tight md:text-7xl">{title}</h1>
        </div>
        <div className="md:col-span-4">
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
          <p className="mt-4 text-xs tabular-nums text-muted-foreground">
            시행일 {effectiveDate}
          </p>
        </div>
      </header>

      <div className="divide-y">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="grid gap-5 py-10 md:grid-cols-12 md:gap-8 md:py-12"
          >
            <div className="md:col-span-4">
              <p className="mb-2 text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="font-serif-kr text-2xl leading-snug">{section.title}</h2>
            </div>
            <div className="max-w-2xl space-y-5 text-sm leading-7 text-muted-foreground md:col-span-7 md:col-start-6 md:text-base">
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.items?.length ? (
                <ul className="list-disc space-y-2 pl-5 marker:text-accent">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
