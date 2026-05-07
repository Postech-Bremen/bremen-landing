import type { ReactNode } from "react"

import { PonixShell } from "@/app/ponix/_components/ponix-shell"
import { requireCmsAdmin } from "@/lib/cms/auth"

export default async function PonixLayout({ children }: { children: ReactNode }) {
  const member = await requireCmsAdmin("/ponix")

  return <PonixShell memberName={member.name}>{children}</PonixShell>
}
