"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Download, LoaderCircle, Share2 } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ShareCardData = {
  eventTitle: string
  eventDate: string
  venueName: string
}

type PrivateTicketData = ShareCardData & {
  holderName: string
  serialCode: string
  ticketType: string
}

type TicketPassProps = PrivateTicketData & {
  ticketId: string
  qrValue: string
  walletBadgePath?: string | null
}

type PreparedImages = {
  share: Blob
  ticket: Blob
}

const COLORS = {
  ink: "#171512",
  paper: "#f4f0e8",
  warm: "#d6a14f",
  accent: "#9b352d",
  muted: "#746f66",
}

function fontFamily(variable: "--font-display" | "--font-serif-kr", fallback: string) {
  const configured = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return configured || fallback
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: "image/jpeg" | "image/png",
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("이미지를 만들지 못했습니다."))
      },
      type,
      quality,
    )
  })
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  let cursor = x
  for (const character of text) {
    context.fillText(character, cursor, y)
    cursor += context.measureText(character).width + tracking
  }
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const lines: string[] = []
  let line = ""

  for (const character of text.trim()) {
    const candidate = line + character
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line.trimEnd())
      line = character.trimStart()
      if (lines.length === maxLines - 1) break
    } else {
      line = candidate
    }
  }

  if (line && lines.length < maxLines) lines.push(line.trimEnd())

  lines.forEach((value, index) => {
    const isLastTruncatedLine =
      index === maxLines - 1 && lines.join("").length < text.replaceAll(" ", "").length
    context.fillText(
      isLastTruncatedLine ? `${value.replace(/\s*$/u, "")}…` : value,
      x,
      y + index * lineHeight,
    )
  })

  return y + lines.length * lineHeight
}

function paintPaperTexture(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save()
  context.globalAlpha = 0.055
  context.fillStyle = COLORS.ink
  for (let y = 24; y < height; y += 42) {
    for (let x = (y / 42) % 2 ? 18 : 38; x < width; x += 64) {
      context.fillRect(x, y, 2, 2)
    }
  }
  context.restore()
}

async function createShareCard(data: ShareCardData) {
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext("2d")
  if (!context) throw new Error("이미지 캔버스를 열지 못했습니다.")

  context.fillStyle = COLORS.paper
  context.fillRect(0, 0, canvas.width, canvas.height)
  paintPaperTexture(context, canvas.width, canvas.height)

  context.fillStyle = COLORS.ink
  context.fillRect(0, 0, canvas.width, 118)
  context.fillStyle = COLORS.warm
  context.fillRect(0, 118, canvas.width, 12)

  context.fillStyle = COLORS.paper
  context.font = '500 22px "Pretendard Variable", sans-serif'
  drawTrackedText(context, "BREMEN LIVE ADMISSION", 72, 73, 5)

  context.fillStyle = COLORS.accent
  context.font = `italic 400 84px ${fontFamily("--font-display", "serif")}`
  context.fillText("I’m going.", 72, 286)

  context.fillStyle = COLORS.ink
  context.font = `700 82px ${fontFamily("--font-serif-kr", "serif")}`
  const titleEnd = drawWrappedText(context, data.eventTitle, 72, 432, 910, 108, 3)

  const panelTop = Math.max(760, titleEnd + 76)
  context.fillStyle = COLORS.ink
  context.roundRect(72, panelTop, 936, 360, 28)
  context.fill()

  context.fillStyle = COLORS.warm
  context.font = '500 20px "Pretendard Variable", sans-serif'
  drawTrackedText(context, "DATE & VENUE", 122, panelTop + 72, 4)

  context.fillStyle = COLORS.paper
  context.font = '600 38px "Pretendard Variable", sans-serif'
  drawWrappedText(context, data.eventDate, 122, panelTop + 145, 820, 51, 2)

  context.fillStyle = "#d8d1c6"
  context.font = '500 32px "Pretendard Variable", sans-serif'
  drawWrappedText(context, data.venueName, 122, panelTop + 268, 820, 43, 2)

  context.fillStyle = COLORS.muted
  context.font = '500 21px "Pretendard Variable", sans-serif'
  context.fillText("QR과 예매자 정보가 포함되지 않은 공유용 이미지입니다.", 72, 1280)

  return canvasBlob(canvas, "image/jpeg", 0.94)
}

async function createPrivateTicket(
  data: PrivateTicketData,
  qrCanvas: HTMLCanvasElement,
) {
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1600
  const context = canvas.getContext("2d")
  if (!context) throw new Error("이미지 캔버스를 열지 못했습니다.")

  context.fillStyle = COLORS.ink
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = COLORS.warm
  context.fillRect(0, 0, 18, canvas.height)

  context.fillStyle = COLORS.paper
  context.font = '500 22px "Pretendard Variable", sans-serif'
  drawTrackedText(context, "BREMEN · ADMISSION", 72, 82, 5)

  context.font = `700 76px ${fontFamily("--font-serif-kr", "serif")}`
  const titleEnd = drawWrappedText(context, data.eventTitle, 72, 200, 900, 98, 3)

  context.fillStyle = "#bdb5a8"
  context.font = '500 29px "Pretendard Variable", sans-serif'
  let detailY = Math.max(485, titleEnd + 50)
  detailY = drawWrappedText(context, data.eventDate, 72, detailY, 900, 44, 2) + 28
  drawWrappedText(context, data.venueName, 72, detailY, 900, 44, 2)

  context.fillStyle = COLORS.paper
  context.roundRect(72, 690, 936, 690, 32)
  context.fill()

  context.fillStyle = COLORS.muted
  context.font = '500 19px "Pretendard Variable", sans-serif'
  drawTrackedText(context, "TICKET HOLDER", 122, 770, 3)
  context.fillStyle = COLORS.ink
  context.font = '700 38px "Pretendard Variable", sans-serif'
  context.fillText(data.holderName, 122, 826)

  context.fillStyle = COLORS.muted
  context.font = '500 19px "Pretendard Variable", sans-serif'
  drawTrackedText(context, "TICKET TYPE", 122, 898, 3)
  context.fillStyle = COLORS.ink
  context.font = '600 31px "Pretendard Variable", sans-serif'
  context.fillText(data.ticketType, 122, 947)

  context.imageSmoothingEnabled = false
  context.drawImage(qrCanvas, 540, 755, 384, 384)
  context.imageSmoothingEnabled = true

  context.fillStyle = COLORS.muted
  context.font = '500 18px ui-monospace, monospace'
  drawTrackedText(context, data.serialCode, 122, 1258, 1.5)

  context.strokeStyle = "#c8c0b5"
  context.setLineDash([10, 12])
  context.beginPath()
  context.moveTo(72, 1452)
  context.lineTo(1008, 1452)
  context.stroke()

  context.setLineDash([])
  context.fillStyle = "#bdb5a8"
  context.font = '500 20px "Pretendard Variable", sans-serif'
  context.fillText("입장 시 QR을 제시하세요 · 공유하지 마세요", 72, 1520)

  return canvasBlob(canvas, "image/png")
}

function isIosDevice() {
  return /iPad|iPhone|iPod/u.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

function safeFilename(value: string) {
  return value.replace(/[^0-9A-Za-z가-힣_-]+/gu, "-").replace(/^-+|-+$/gu, "") || "bremen"
}

export function TicketPass({
  ticketId,
  qrValue,
  eventTitle,
  eventDate,
  venueName,
  holderName,
  serialCode,
  ticketType,
  walletBadgePath,
}: TicketPassProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const preparedRef = useRef<PreparedImages | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [preparing, setPreparing] = useState(true)
  const [busy, setBusy] = useState<"share" | "save" | "wallet" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null)

  useEffect(() => {
    let active = true

    async function prepare() {
      try {
        await document.fonts.ready
        if (!qrRef.current) throw new Error("QR을 준비하지 못했습니다.")

        const [share, ticket] = await Promise.all([
          createShareCard({ eventTitle, eventDate, venueName }),
          createPrivateTicket(
            { eventTitle, eventDate, venueName, holderName, serialCode, ticketType },
            qrRef.current,
          ),
        ])

        if (active) preparedRef.current = { share, ticket }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "이미지를 준비하지 못했습니다.")
        }
      } finally {
        if (active) setPreparing(false)
      }
    }

    void prepare()
    return () => {
      active = false
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [eventDate, eventTitle, holderName, serialCode, ticketType, venueName])

  function showPreview(blob: Blob, title: string) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(blob)
    previewUrlRef.current = url
    setPreview({ url, title })
  }

  function closePreview() {
    setPreview(null)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  async function shareTicket() {
    const blob = preparedRef.current?.share
    if (!blob) return
    setBusy("share")
    setError(null)

    try {
      const file = new File([blob], `${safeFilename(eventTitle)}-share.jpg`, {
        type: "image/jpeg",
      })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: eventTitle,
          text: `${eventTitle} 공연 보러 갑니다.`,
        })
      } else if (isIosDevice()) {
        showPreview(blob, "공유용 이미지")
      } else {
        downloadBlob(blob, file.name)
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      setError("공유 화면을 열지 못했습니다. 다시 시도해 주세요.")
    } finally {
      setBusy(null)
    }
  }

  function saveTicket() {
    const blob = preparedRef.current?.ticket
    if (!blob) return
    setBusy("save")
    setError(null)

    if (isIosDevice()) {
      showPreview(blob, "내 티켓 이미지")
    } else {
      downloadBlob(blob, `${safeFilename(eventTitle)}-${serialCode}.png`)
    }
    setBusy(null)
  }

  async function addToAppleWallet() {
    setBusy("wallet")
    setError(null)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const body = (await response.json()) as { download_url?: string; error?: string }
      if (!response.ok || !body.download_url) throw new Error(body.error ?? "wallet_unavailable")

      const downloadUrl = new URL(body.download_url, window.location.href)
      if (downloadUrl.origin !== window.location.origin) throw new Error("invalid_wallet_url")
      window.location.assign(downloadUrl.toString())
    } catch {
      setError("Apple Wallet 티켓을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      setBusy(null)
    }
  }

  return (
    <>
      <div className="grid place-items-center rounded-md bg-white p-4 text-black shadow-inner">
        <QRCodeCanvas
          ref={qrRef}
          value={qrValue}
          size={208}
          level="M"
          marginSize={4}
          title={`${serialCode} 입장 QR`}
          bgColor="#ffffff"
          fgColor="#111111"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          disabled={preparing || busy !== null}
          onClick={saveTicket}
        >
          {preparing || busy === "save" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          사진 저장
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
          disabled={preparing || busy !== null}
          onClick={shareTicket}
        >
          {preparing || busy === "share" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Share2 aria-hidden="true" />
          )}
          공유
        </Button>
      </div>

      {walletBadgePath ? (
        <button
          type="button"
          className="mt-3 flex w-full justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70 disabled:opacity-55"
          disabled={busy !== null}
          onClick={addToAppleWallet}
          aria-label="Apple Wallet에 추가"
        >
          {busy === "wallet" ? (
            <span className="flex h-[52px] items-center gap-2 text-sm">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Wallet 티켓 준비 중
            </span>
          ) : (
            <Image
              src={walletBadgePath}
              alt="Apple Wallet에 추가"
              width={168}
              height={52}
              unoptimized
            />
          )}
        </button>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-primary-foreground/55">
        공유 이미지는 QR·예매번호·예매자명을 제외합니다. 저장한 개인 티켓 이미지는 타인에게 보내지 마세요.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-xs leading-relaxed text-red-200">
          {error}
        </p>
      ) : null}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>
              iPhone에서는 아래 이미지를 길게 눌러 ‘사진에 저장’을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            // Blob URLs are generated locally from this ticket and cannot use next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={`${preview.title} 미리보기`}
              className="mx-auto h-auto max-h-[70dvh] w-auto rounded-md border"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
