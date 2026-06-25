import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  CmsSaveNotice,
  CmsSubmitButton,
} from "@/app/ponix/_components/cms-save-controls"
import { updateCmsMemberAction } from "@/app/ponix/members/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsMemberDetail } from "@/lib/cms/members"

export const metadata: Metadata = {
  title: "멤버 수정 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixMemberEditPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixMemberEditPage({
  params,
  searchParams,
}: PonixMemberEditPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])

  await requireCmsAdmin(`/ponix/members/${id}/edit`)
  const member = await loadCmsMemberDetail(id)

  if (!member) {
    notFound()
  }

  const error = typeof search?.error === "string" ? search.error : undefined
  const saved = search?.saved === "member"

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="hero-score rounded-md p-5 shadow-sm md:p-6">
        <p className="caps mb-3 text-muted-foreground">멤버 관리</p>
        <h1 className="font-serif-kr text-[clamp(2.25rem,6vw,4.25rem)] leading-tight">
          {member.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          가입 승인, 관리자 권한, 멤버 페이지에 보이는 기본 정보를 수정합니다.
        </p>
      </div>

      <CmsSaveNotice
        saved={saved}
        error={error}
        savedDescription="멤버 권한과 프로필 정보가 저장되었습니다."
      />

      <form action={updateCmsMemberAction}>
        <input type="hidden" name="member_id" value={member.id} />
        <input
          type="hidden"
          name="redirect_to"
          value={`/ponix/members/${member.id}/edit`}
        />

        <Card className="stage-card overflow-hidden rounded-md bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="font-serif text-3xl italic">
              멤버 권한
            </CardTitle>
            <CardDescription>
              승인된 멤버만 로그인 후 자기 정보를 관리할 수 있습니다. 관리자 권한은
              PONIX 접근 권한입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-5 md:grid-cols-3 md:p-6">
            <SelectField
              name="approved"
              label="가입 승인"
              defaultValue={member.approved_at ? "yes" : "no"}
              options={[
                ["yes", "승인됨"],
                ["no", "미승인"],
              ]}
            />
            <SelectField
              name="role"
              label="권한"
              defaultValue={member.role}
              options={[
                ["member", "멤버"],
                ["admin", "관리자"],
              ]}
            />
            <SelectField
              name="status"
              label="활동 상태"
              defaultValue={member.status ?? "unset"}
              options={[
                ["unset", "미정"],
                ["active", "활동"],
                ["inactive", "휴동"],
                ["alumni", "졸업"],
              ]}
            />
          </CardContent>
        </Card>

        <Card className="stage-card mt-6 overflow-hidden rounded-md bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="font-serif text-3xl italic">
              공개 프로필
            </CardTitle>
            <CardDescription>
              멤버 페이지와 개인 정보 화면에 표시되는 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
            <TextField name="name" label="이름" defaultValue={member.name} required />
            <TextField
              name="english_name"
              label="영문 이름"
              defaultValue={member.english_name}
            />
            <TextField
              name="student_year"
              label="학번"
              defaultValue={member.student_year?.toString()}
              placeholder="예: 2021 또는 20210468"
            />
            <TextField
              name="instrument"
              label="세션"
              defaultValue={member.instrument}
              placeholder="보컬, 기타, 베이스, 키보드, 드럼"
            />
            <TextField
              name="position"
              label="표시 직책"
              defaultValue={member.position}
              placeholder="회장, 부회장, 총무 또는 직접 작성한 역할"
            />
            <TextField
              name="email"
              label="POSTECH 이메일"
              defaultValue={member.email}
              placeholder="name@postech.ac.kr"
            />
            <div className="md:col-span-2">
              <Label htmlFor="current_status">현재 하는 일</Label>
              <Textarea
                id="current_status"
                name="current_status"
                defaultValue={member.current_status ?? ""}
                className="mt-2 min-h-24"
                placeholder="예: 대학원, 회사, 프로젝트 등"
              />
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/ponix/members">취소</Link>
          </Button>
          <CmsSubmitButton className="rounded-full">저장</CmsSubmitButton>
        </div>
      </form>
    </section>
  )
}

function TextField({
  name,
  label,
  defaultValue,
  placeholder,
  required,
}: {
  name: string
  label: string
  defaultValue?: string | null
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className="mt-2"
      />
    </div>
  )
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string
  label: string
  defaultValue: string
  options: Array<[string, string]>
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="mt-2 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([value, optionLabel]) => (
            <SelectItem key={value} value={value}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
