import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { loadSiteChrome } from "@/lib/data/content-graph"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteChrome = await loadSiteChrome()

  if (!siteChrome) {
    throw new Error("Missing CMS site chrome configuration")
  }

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <Navigation config={siteChrome.navigation} />
      <main className="flex-1 pt-20">{children}</main>
      <Footer config={siteChrome.footer} />
    </div>
  )
}
