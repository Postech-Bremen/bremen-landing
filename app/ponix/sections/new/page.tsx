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
  sectionTypeFromSchemaKey,
} from "@/lib/cms/section-editor"
import {
  loadSectionCreationSchema,
  loadSectionCreationSchemas,
} from "@/lib/cms/section-editor.server"
import type { CmsSchemaDefinition } from "@/lib/cms/schema-registry"

export const metadata: Metadata = {
  title: "섹션 추가 | Bremen Admin",
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
    const schema = await loadSectionCreationSchema(schemaKey)

    if (schema) {
      return <CmsSectionCreatePage schema={schema} error={error} />
    }
  }

  const schemas = await loadSectionCreationSchemas()

  return (
    <SchemaPickerPage
      schemas={schemas}
      error={
        schemaKey
          ? `선택한 형식(${schemaKey})으로는 새 섹션을 만들 수 없습니다.`
          : error
      }
    />
  )
}

function SchemaPickerPage({
  schemas,
  error,
}: {
  schemas: CmsSchemaDefinition[]
  error?: string
}) {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-1 py-4 md:py-8">
        <div className="hero-score mb-6 flex flex-col gap-6 rounded-md p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-7">
          <div>
            <p className="caps mb-5">섹션 추가</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] italic leading-[0.9]">
              형식 선택
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              만들 섹션의 화면 형식을 먼저 고릅니다. 만든 뒤 페이지에 배치하고 필요한 콘텐츠를 연결합니다.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href="/ponix/sections">섹션 목록</Link>
          </Button>
        </div>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-md">
              <AlertTitle>선택할 수 없는 형식입니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schemas.map((schema) => (
              <Card
                key={schema.schemaKey}
                className="stage-card rounded-md bg-card/95 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <CardHeader className="border-b">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full font-mono">
                      {sectionTypeFromSchemaKey(schema.schemaKey)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {schema.fields.length}개 항목
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
                      선택
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
