"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

const photos = [
  { id: 1, title: "1학기 정기공연 2025", category: "공연", aspect: "landscape" },
  { id: 2, title: "악기별 멘토링", category: "연습", aspect: "portrait" },
  { id: 3, title: "녹음 세션", category: "스튜디오", aspect: "landscape" },
  { id: 4, title: "해맞이한마당", category: "축제", aspect: "landscape" },
  { id: 5, title: "신입생 환영공연", category: "행사", aspect: "portrait" },
  { id: 6, title: "동아리 워크숍", category: "단체", aspect: "landscape" },
  { id: 7, title: "2학기 정기공연 준비", category: "무대", aspect: "portrait" },
  { id: 8, title: "밴드 합주", category: "공연", aspect: "landscape" },
  { id: 9, title: "치어로 밴드 연주", category: "스튜디오", aspect: "landscape" },
  { id: 10, title: "선후배 모임", category: "단체", aspect: "portrait" },
  { id: 11, title: "야외 공연", category: "공연", aspect: "landscape" },
  { id: 12, title: "연습실 활동", category: "연습", aspect: "portrait" },
]

const categories = ["전체", "공연", "연습", "스튜디오", "행사", "단체", "무대"]

export function PhotosSection() {
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredPhotos = selectedCategory === "전체" 
    ? photos 
    : photos.filter(p => p.category === selectedCategory)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const nextPhoto = () => setLightboxIndex((prev) => prev !== null ? (prev + 1) % filteredPhotos.length : null)
  const prevPhoto = () => setLightboxIndex((prev) => prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : null)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="font-mono text-xs text-muted-foreground mb-2">갤러리</p>
        <h1 className="text-3xl font-bold mb-4">사진</h1>
        <p className="text-muted-foreground max-w-2xl">
          브레멘의 공연, 연습, 그리고 단체 활동을 기록한 사진들입니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-xs font-mono border transition-colors ${
              selectedCategory === category
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className={`border border-border hover:border-foreground transition-colors overflow-hidden group ${
              photo.aspect === "portrait" ? "row-span-2" : ""
            }`}
          >
            <div className={`bg-muted flex items-center justify-center ${
              photo.aspect === "portrait" ? "h-full min-h-64" : "aspect-video"
            }`}>
              <div className="text-center p-4">
                <div className="w-12 h-12 border border-muted-foreground mx-auto mb-3 flex items-center justify-center">
                  <span className="font-mono text-xs text-muted-foreground">{photo.id}</span>
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  {photo.title}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          {filteredPhotos.length}개 사진 • 클릭하면 확대됩니다
        </p>
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 hover:bg-muted transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={prevPhoto}
            className="absolute left-6 p-2 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-6 p-2 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="max-w-3xl mx-auto p-8">
            <div className="bg-muted border border-border aspect-video flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-24 h-24 border border-muted-foreground mx-auto mb-4 flex items-center justify-center">
                  <span className="font-mono text-2xl text-muted-foreground">
                    {filteredPhotos[lightboxIndex].id}
                  </span>
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  {filteredPhotos[lightboxIndex].title}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold">{filteredPhotos[lightboxIndex].title}</p>
              <span className="font-mono text-xs text-muted-foreground">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              분류: {filteredPhotos[lightboxIndex].category}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
