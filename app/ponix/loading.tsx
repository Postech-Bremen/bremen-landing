import { Skeleton } from "@/components/ui/skeleton"

export default function PonixLoading() {
  return (
    <section className="mx-auto flex w-full max-w-[104rem] flex-col gap-5">
      <div className="rounded-xl border bg-card/90 p-5 shadow-sm md:p-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-5 h-16 w-72 max-w-full" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid min-h-[calc(100svh-13rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="overflow-hidden rounded-xl border bg-card/95 shadow-sm">
          <div className="border-b bg-muted/20 p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-10 w-64" />
            <div className="mt-5 flex gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-[calc(100svh-18rem)] min-h-[42rem] rounded-none" />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card/95 p-5 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-10 w-56" />
            <Skeleton className="mt-5 h-24 w-full" />
          </div>
          <div className="rounded-xl border bg-card/95 p-5 shadow-sm">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="mt-5 h-10 w-full" />
            <Skeleton className="mt-3 h-10 w-full" />
            <Skeleton className="mt-6 h-10 w-full rounded-full" />
          </div>
        </aside>
      </div>
    </section>
  )
}
