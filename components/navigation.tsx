"use client"

import Image from "next/image"

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  { id: "home", label: "홈" },
  { id: "performances", label: "공연" },
  { id: "members", label: "멤버" },
]

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Image
              src="/bremen-logo.jpg"
              alt="Bremen logo"
              width={40}
              height={40}
              className="rounded"
            />
            <div>
              <span className="font-mono text-sm font-bold tracking-tight">BREMEN</span>
              <span className="font-mono text-xs text-muted-foreground ml-2">POSTECH</span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-mono transition-colors ${
                  activeTab === tab.id
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
