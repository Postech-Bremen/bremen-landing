import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { Reveal } from "@/components/reveal"
import { EditorialSectionHead, PageHero, PageSection } from "@/components/editorial"
import type {
  ContentPageConfig,
  ContentSectionConfig,
  HistoryMilestoneItem,
} from "@/lib/data/content-graph"

type HistorySectionProps = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  milestones: HistoryMilestoneItem[]
}

export function HistorySection({
  page,
  sections,
  milestones,
}: HistorySectionProps) {
  const items = milestones
  const firstYear = items[0]?.year ?? ""
  const latestYear = items.at(-1)?.year ?? ""
  const timelineSection = sections.find((section) => section.key === "history-timeline")

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <PageHero
        eyebrow={`${firstYear} — ${latestYear}`}
        titleEn={page.subtitle ?? ""}
        titleKr={page.title}
        description={page.description}
        actions={
          <a
            href="https://www.instagram.com/postech.bremen"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-baseline gap-3 border-b pb-2 transition-colors hover:border-foreground"
          >
            <span className="font-serif italic text-xl">Follow current season</span>
            <ArrowUpRight weight="light" className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </a>
        }
      />

      <PageSection>
        <Reveal offset={24} blur={10}>
          <EditorialSectionHead
            eyebrow={timelineSection?.eyebrow ?? ""}
            en={timelineSection?.title ?? ""}
            kr={timelineSection?.subtitle ?? ""}
          />
        </Reveal>

        <ol className="border-t">
          {items.map((item, index) => (
            <Reveal
              key={item.id}
              as="li"
              delay={index * 55}
              className="grid grid-cols-12 gap-6 border-b py-8 md:gap-10 md:py-10"
            >
              <div className="col-span-12 md:col-span-3">
                <p className="caps">Year</p>
                <p className="mt-2 font-serif italic text-5xl leading-none tracking-tight tabular-nums md:text-6xl">
                  {item.year}
                </p>
              </div>
              <div className="col-span-12 md:col-span-8">
                <h3 className="font-serif-kr text-2xl leading-tight md:text-3xl">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {item.summary}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </ol>
      </PageSection>
    </div>
  )
}
