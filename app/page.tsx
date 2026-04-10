"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { HomeSection } from "@/components/home-section"
import { PerformancesSection } from "@/components/performances-section"

import { MembersSection } from "@/components/members-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pt-16">
        {activeTab === "home" && <HomeSection />}
        {activeTab === "performances" && <PerformancesSection />}

        {activeTab === "members" && <MembersSection />}
      </main>
      <Footer />
    </div>
  )
}
