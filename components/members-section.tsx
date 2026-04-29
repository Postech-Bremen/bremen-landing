import { Briefcase } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Reveal } from "@/components/reveal"
import {
  EditorialSectionHead,
  PageHero,
  PageSection,
} from "@/components/editorial"
import {
  groupMembersByYear,
  type MemberGroup,
  type MemberRecord,
} from "@/lib/data/members"
import { cn } from "@/lib/utils"

function memberStatusLabel(status: MemberRecord["status"]) {
  if (!status) return null
  if (status === "active") return "활동"
  if (status === "inactive") return "휴동"
  return "졸업"
}

function memberStatusBadgeVariant(status: MemberRecord["status"]) {
  if (status === "active") return "default" as const
  return "outline" as const
}

function formatGroupSummary(group: MemberGroup) {
  const parts = [`${group.total}명`]

  if (group.active.length > 0) parts.push(`활동 ${group.active.length}명`)
  if (group.inactive.length > 0) parts.push(`휴동 ${group.inactive.length}명`)
  if (group.alumni.length > 0) parts.push(`졸업 ${group.alumni.length}명`)

  return parts.join(" · ")
}

function MemberCard({
  member,
  index,
  canViewDetails,
}: {
  member: MemberRecord
  index: number
  canViewDetails: boolean
}) {
  const accent = member.status === "active" && Boolean(member.position)
  const isInactive = member.status === "inactive"
  const muted = member.status === "alumni"
  const statusLabel = memberStatusLabel(member.status)

  const card = (
    <article
      className={cn(
        "lift-card flex h-full flex-col rounded-md border p-5 shadow-sm hover:shadow-xl md:p-6",
        canViewDetails && "cursor-pointer",
        accent
          ? "border-transparent bg-accent text-accent-foreground shadow-md"
          : isInactive
            ? "border-dashed bg-muted/25 text-foreground"
          : muted
            ? "bg-muted/35 text-foreground"
            : "bg-card text-card-foreground",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "caps mb-2",
              accent ? "text-accent-foreground/75" : "text-muted-foreground",
            )}
          >
            {member.instrument ??
              (member.status === "active"
                ? "Member"
                : member.status === "inactive"
                  ? "Inactive"
                  : member.status === "alumni"
                    ? "Alumni"
                    : "Member")}
          </p>
          <h3 className="font-serif-kr text-2xl leading-tight">{member.name}</h3>
          {member.english_name && (
            <p
              className={cn(
                "mt-1 text-sm italic",
                accent ? "text-accent-foreground/80" : "text-muted-foreground",
              )}
            >
              {member.english_name}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {statusLabel && (
            <Badge
              variant={memberStatusBadgeVariant(member.status)}
              className={cn(
                "font-medium",
                accent && "border-transparent bg-background/90 text-foreground",
              )}
            >
              {statusLabel}
            </Badge>
          )}
          {member.position && (
            <Badge
              variant={accent ? "secondary" : "outline"}
              className="font-medium"
            >
              {member.position}
            </Badge>
          )}
        </div>
      </div>

      {member.bio && (
        <p
          className={cn(
            "mt-5 text-sm leading-relaxed",
            accent ? "text-accent-foreground/85" : "text-muted-foreground",
          )}
        >
          {member.bio}
        </p>
      )}

      {member.current_status && (
        <p
          className={cn(
            "mt-auto inline-flex items-center gap-1.5 pt-8 text-sm",
            accent ? "text-accent-foreground/85" : "text-muted-foreground",
          )}
        >
          <Briefcase weight="light" className="h-3.5 w-3.5 shrink-0" />
          {member.current_status}
        </p>
      )}
    </article>
  )

  return (
    <Reveal as="li" delay={index * 60} className="h-full">
      {canViewDetails ? (
        <Link
          href={`/members/${member.id}`}
          className="block h-full rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </Reveal>
  )
}

function CohortBody({
  group,
  canViewDetails,
}: {
  group: MemberGroup
  canViewDetails: boolean
}) {
  return (
    <div className="space-y-8">
      {group.active.length > 0 && (
        <div>
          <Reveal offset={18} blur={8}>
            <p className="caps mb-4">현재 활동</p>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.active.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                canViewDetails={canViewDetails}
              />
            ))}
          </ul>
        </div>
      )}

      {group.listed.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {group.listed.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              index={index}
              canViewDetails={canViewDetails}
            />
          ))}
        </ul>
      )}

      {group.inactive.length > 0 && (
        <div>
          <Reveal offset={18} blur={8}>
            <p className="caps mb-4">휴동</p>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.inactive.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                canViewDetails={canViewDetails}
              />
            ))}
          </ul>
        </div>
      )}

      {group.alumni.length > 0 && (
        <div>
          <Reveal offset={18} blur={8}>
            <p className="caps mb-4">졸업</p>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.alumni.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                index={index}
                canViewDetails={canViewDetails}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RecentCohortSection({
  group,
  canViewDetails,
}: {
  group: MemberGroup
  canViewDetails: boolean
}) {
  return (
    <section className="grid grid-cols-12 gap-6 md:gap-8">
      <div className="col-span-12 lg:col-span-3">
        <p className="caps mb-3">{`Class of ${group.year}`}</p>
        <h3 className="font-serif italic text-5xl leading-none tracking-tight md:text-6xl">
          {group.year}
        </h3>
        <p className="mt-4 font-serif-kr text-base text-muted-foreground">
          {formatGroupSummary(group)}
        </p>
      </div>
      <div className="col-span-12 lg:col-span-9">
        <CohortBody group={group} canViewDetails={canViewDetails} />
      </div>
    </section>
  )
}

export function MembersSection({
  members,
  canViewDetails = false,
}: {
  members: MemberRecord[]
  canViewDetails?: boolean
}) {
  const currentYear = new Date().getFullYear()
  const recentCutoff = currentYear - 3
  const groups = groupMembersByYear(members)
  const recentGroups = groups.filter((group) => group.year >= recentCutoff)
  const archivedGroups = groups.filter((group) => group.year < recentCutoff)

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <PageHero
        eyebrow="People in Bremen"
        titleEn="Members"
        titleKr="브레멘 사람들"
        description={
          <>
            지금 함께 연주하는 부원과, 무대를 지나 각자의 자리로 흩어진 졸업생까지.
            <br />
            브레멘을 지나간 사람들의 이름을 학번 따라 모아 둡니다.
          </>
        }
      />

      {recentGroups.length > 0 && (
        <PageSection>
          <div className="space-y-16 md:space-y-20">
            {recentGroups.map((group) => (
              <RecentCohortSection
                key={group.year}
                group={group}
                canViewDetails={canViewDetails}
              />
            ))}
          </div>
        </PageSection>
      )}

      {archivedGroups.length > 0 && (
        <PageSection className="mb-0">
          <Reveal offset={24} blur={10}>
            <EditorialSectionHead
              eyebrow="Earlier names"
              en="Earlier names"
              kr="이전 학번"
            />
          </Reveal>

          <Accordion type="single" collapsible className="border-t">
            {archivedGroups.map((group) => (
              <AccordionItem key={group.year} value={String(group.year)}>
                <AccordionTrigger className="py-6 hover:no-underline">
                  <div className="flex flex-col gap-3 text-left md:flex-row md:items-end md:gap-6">
                    <div>
                      <p className="caps mb-2">{`Class of ${group.year}`}</p>
                      <p className="font-serif italic text-4xl leading-none tracking-tight">
                        {group.year}
                      </p>
                    </div>
                    <p className="font-serif-kr text-base text-muted-foreground">
                      {formatGroupSummary(group)}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-8">
                  <CohortBody group={group} canViewDetails={canViewDetails} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PageSection>
      )}
    </div>
  )
}
