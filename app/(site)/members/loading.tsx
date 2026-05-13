import { Skeleton } from "@/components/ui/skeleton"

export default function MembersLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <section className="mb-20">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-6 h-24 w-80 max-w-full" />
        <Skeleton className="mt-7 h-16 w-full max-w-2xl" />
      </section>

      <div className="space-y-16 md:space-y-20">
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <section
            key={groupIndex}
            className="grid grid-cols-12 gap-6 md:gap-8"
          >
            <div className="col-span-12 lg:col-span-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-4 h-16 w-28" />
              <Skeleton className="mt-4 h-5 w-36" />
            </div>
            <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-9 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-md" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
