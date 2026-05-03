import type { Metadata } from "next"
import Link from "next/link"

import { CmsSectionCreatePage } from "@/app/ponix/_components/cms-section-create-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  getSectionCreationSchema,
  getSectionCreationSchemas,
  sectionTypeFromSchemaKey,
} from "@/lib/cms/section-editor"

export const metadata: Metadata = {
  title: "New PONIX Section | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixNewSectionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PonixNewSectionPage({
  searchParams,
}: PonixNewSectionPageProps) {
  const query = (await searchParams) ?? {}
  const schemaKey = firstParam(query.schema)
  const error = firstParam(query.error)

  await requireCmsAdmin("/ponix/sections/new")

  if (schemaKey) {
    const schema = getSectionCreationSchema(schemaKey)

    if (schema) {
      return <CmsSectionCreatePage schema={schema} error={error} />
    }
  }

  return (
    <SchemaPickerPage
      error={
        schemaKey
          ? `Schema ${schemaKey} cannot be created from CMS.`
          : error
      }
    />
  )
}

function SchemaPickerPage({ error }: { error?: string }) {
  const schemas = getSectionCreationSchemas()

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / New section</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              Choose schema
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Start with a renderer-backed section schema. After creation, place
              the section into a page and connect entities as needed.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href="/ponix/sections">All sections</Link>
          </Button>
        </div>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Schema unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schemas.map((schema) => (
              <Card
                key={schema.schemaKey}
                className="rounded-md bg-card/95 shadow-xl transition-transform hover:-translate-y-1"
              >
                <CardHeader className="border-b">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full font-mono">
                      {sectionTypeFromSchemaKey(schema.schemaKey)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {schema.fields.length} fields
                    </Badge>
                  </div>
                  <CardTitle className="font-serif text-3xl italic">
                    {schema.label}
                  </CardTitle>
                  <CardDescription>{schema.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 px-6 py-5">
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {schema.schemaKey}
                  </p>
                  <Button asChild size="sm" className="shrink-0 rounded-full">
                    <Link
                      href={`/ponix/sections/new?schema=${encodeURIComponent(
                        schema.schemaKey,
                      )}`}
                    >
                      Select
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
