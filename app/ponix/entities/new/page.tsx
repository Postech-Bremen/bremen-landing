import type { Metadata } from "next"
import Link from "next/link"

import { CmsEntityCreatePage } from "@/app/ponix/_components/cms-entity-create-form"
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
import { semanticKindForSchema } from "@/lib/cms/entity-editor"
import {
  loadEntityCreationSchema,
  loadEntityCreationSchemas,
} from "@/lib/cms/entity-editor.server"
import type { CmsSchemaDefinition } from "@/lib/cms/schema-registry"

export const metadata: Metadata = {
  title: "콘텐츠 추가 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixNewEntityPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PonixNewEntityPage({
  searchParams,
}: PonixNewEntityPageProps) {
  const query = (await searchParams) ?? {}
  const schemaKey = firstParam(query.schema)
  const error = firstParam(query.error)

  await requireCmsAdmin("/ponix/entities/new")

  if (schemaKey) {
    const schema = await loadEntityCreationSchema(schemaKey)

    if (schema) {
      return <CmsEntityCreatePage schema={schema} error={error} />
    }
  }

  const schemas = await loadEntityCreationSchemas()

  return (
    <SchemaPickerPage
      schemas={schemas}
      error={
        schemaKey
          ? `선택한 형식(${schemaKey})으로는 새 콘텐츠를 만들 수 없습니다.`
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
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-1 py-4 md:py-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">콘텐츠 추가</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] italic leading-[0.9] tracking-tight">
              형식 선택
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              만들 콘텐츠의 종류를 먼저 고릅니다. 형식에 따라 입력 항목과 검증 방식이 달라집니다.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href="/ponix/entities">콘텐츠 목록</Link>
          </Button>
        </div>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>선택할 수 없는 형식입니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schemas.map((schema) => (
              <Card
                key={schema.schemaKey}
                className="rounded-[1.5rem] bg-card/95 shadow-sm transition-transform hover:-translate-y-1"
              >
                <CardHeader className="border-b">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full font-mono">
                      {semanticKindForSchema(schema)}
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
                      href={`/ponix/entities/new?schema=${encodeURIComponent(
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
