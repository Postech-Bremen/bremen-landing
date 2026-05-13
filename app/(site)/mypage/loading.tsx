import { Skeleton } from "@/components/ui/skeleton"

export default function MyPageLoading() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-12rem] top-16 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-10rem] top-1/2 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-6 h-24 w-80 max-w-full" />
            <Skeleton className="mt-6 h-20 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md lg:col-span-4 lg:justify-self-end" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-md border bg-card/95 p-6 shadow-xl lg:col-span-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="mt-3 h-4 w-32" />
            <div className="mt-8 flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-8 h-px w-full" />
            <Skeleton className="mt-6 h-16 w-full" />
          </div>

          <div className="rounded-md border bg-card/95 shadow-xl lg:col-span-8">
            <div className="border-b p-6 md:p-8">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="mt-3 h-4 w-72 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 md:p-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
              <Skeleton className="h-11 w-full md:col-span-2" />
              <Skeleton className="h-32 w-full md:col-span-2" />
              <Skeleton className="h-10 w-full md:col-span-2" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
