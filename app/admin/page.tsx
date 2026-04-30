import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Restricted | 브레멘 Bremen",
  description: "This route is not available.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminDecoyPage() {
  return (
    <main className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#120f0b] text-[#fff8ec]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(180,24,15,0.35),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(255,248,236,0.12),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[#fff8ec]/30" />
      </div>

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center px-6 py-24 md:px-8">
        <p className="caps mb-8 text-[#d6c7b3]">Restricted Route</p>
        <h1 className="max-w-4xl font-serif text-[clamp(4.5rem,15vw,12rem)] italic leading-[0.78] tracking-tight text-[#fff8ec]">
          HACK IS ILLIGAL
        </h1>
        <div className="mt-10 max-w-2xl border-l border-[#b21f13] pl-6">
          <p className="text-xl leading-relaxed text-[#d6c7b3] md:text-2xl">
            This route is not the Bremen CMS. Unauthorized access attempts are
            not welcome here.
          </p>
          <div className="mt-8">
            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
