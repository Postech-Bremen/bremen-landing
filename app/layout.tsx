import type { Metadata } from 'next'
import { Instrument_Serif, Noto_Serif_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { loadSiteChrome } from '@/lib/data/content-graph'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const notoSerifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-serif-kr',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '브레멘 Bremen | 포스텍 밴드 동아리',
  description:
    '포항공과대학교 밴드 동아리 브레멘. 2001년 창립 이래 음악을 사랑하는 사람들이 모여 함께 연주하고 공연합니다.',
  generator: 'v0.app',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteChrome = await loadSiteChrome()

  if (!siteChrome) {
    throw new Error("Missing CMS site chrome configuration")
  }

  return (
    <html
      lang="ko"
      className={`${instrumentSerif.variable} ${notoSerifKr.variable}`}
    >
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background flex flex-col">
          <Navigation config={siteChrome.navigation} />
          <main className="pt-20 flex-1">{children}</main>
          <Footer config={siteChrome.footer} />
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
