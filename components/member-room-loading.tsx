import { Skeleton } from "@/components/ui/skeleton"

export function MemberRoomLoading({
  titleWidth = "w-72",
}: {
  titleWidth?: string
}) {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-8rem] h-72 w-72 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <Skeleton className="h-3 w-32" />
          <Skeleton className={`mt-6 h-28 ${titleWidth} max-w-full`} />
          <Skeleton className="mt-7 h-20 w-full max-w-xl" />
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="overflow-hidden rounded-md border bg-card/95 shadow-xl">
            <div className="border-b p-6 md:p-8">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="mt-3 h-4 w-64 max-w-full" />
            </div>
            <div className="p-6 md:p-8">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="mt-5 h-11 w-full" />
              <Skeleton className="mt-7 h-10 w-full" />
              <Skeleton className="mt-6 h-16 w-full" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
