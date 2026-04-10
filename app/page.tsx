"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { HomeSection } from "@/components/home-section"
import { PerformancesSection } from "@/components/performances-section"
import { PhotosSection } from "@/components/photos-section"
import { AlumniSection } from "@/components/alumni-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pt-16">
        {activeTab === "home" && <HomeSection />}
        {activeTab === "performances" && <PerformancesSection />}
        {activeTab === "photos" && <PhotosSection />}
        {activeTab === "alumni" && <AlumniSection />}
      </main>
      <Footer />
    </div>
  )
}
