"use client"

import { useEffect, useRef, useState } from "react"
import type { Html5Qrcode } from "html5-qrcode"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Keyboard,
  Loader2,
  RotateCcw,
  ScanLine,
} from "lucide-react"

import {
  checkInTicketAction,
  type TicketCheckInActionResult,
} from "@/app/staff/events/[id]/check-in/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ScannerState = "idle" | "starting" | "scanning" | "processing" | "stopping"

const resultMeta = {
  checked_in: {
    title: "입장 완료",
    description: "티켓을 사용 처리했습니다.",
    className: "border-emerald-400/40 bg-emerald-400/10",
    icon: CheckCircle2,
  },
  already_used: {
    title: "이미 사용한 티켓",
    description: "중복 입장 여부를 확인해 주세요.",
    className: "border-amber-400/40 bg-amber-400/10",
    icon: AlertTriangle,
  },
  invalid: {
    title: "이 공연의 티켓이 아닙니다",
    description: "QR 또는 공연을 다시 확인해 주세요.",
    className: "border-destructive/40 bg-destructive/10",
    icon: AlertTriangle,
  },
  error: {
    title: "티켓을 확인하지 못했습니다",
    description: "네트워크 연결을 확인하고 다시 시도해 주세요.",
    className: "border-destructive/40 bg-destructive/10",
    icon: AlertTriangle,
  },
} as const

export function TicketCheckInScanner({ eventId }: { eventId: string }) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)
  const [scannerState, setScannerState] = useState<ScannerState>("idle")
  const [manualToken, setManualToken] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<TicketCheckInActionResult | null>(null)
  const containerId = `ticket-reader-${eventId.replaceAll("-", "").slice(0, 12)}`

  async function stopScanner() {
    const scanner = scannerRef.current
    if (!scanner) return

    try {
      setScannerState("stopping")
      if (scanner.getState() === 2 || scanner.getState() === 3) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      // The camera may already have stopped after a browser permission change.
    } finally {
      scannerRef.current = null
      setScannerState("idle")
    }
  }

  async function processToken(rawToken: string) {
    if (processingRef.current) return

    processingRef.current = true
    setScannerState("processing")
    setResult(null)

    const scanner = scannerRef.current
    if (scanner) {
      try {
        if (scanner.getState() === 2 || scanner.getState() === 3) {
          await scanner.stop()
        }
        scanner.clear()
      } catch {
        // Continue with the decoded token even if camera cleanup raced.
      }
      scannerRef.current = null
    }

    try {
      const nextResult = await checkInTicketAction(eventId, rawToken)
      setResult(nextResult)
    } catch {
      setResult({
        result: "error",
        ticketId: null,
        serialCode: null,
        holderName: null,
        orderNumber: null,
        checkedInAt: null,
        message: "서버에 연결하지 못했습니다.",
      })
    } finally {
      processingRef.current = false
      setScannerState("idle")
    }
  }

  async function startScanner() {
    if (scannerRef.current || scannerState !== "idle") return

    setCameraError(null)
    setResult(null)
    setScannerState("starting")

    try {
      const { Html5Qrcode: Scanner } = await import("html5-qrcode")
      const scanner = new Scanner(containerId, false)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const edge = Math.floor(Math.min(width, height) * 0.72)
            return { width: edge, height: edge }
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          void processToken(decodedText)
        },
        undefined,
      )
      setScannerState("scanning")
    } catch {
      scannerRef.current = null
      setScannerState("idle")
      setCameraError(
        "카메라를 열지 못했습니다. 브라우저의 카메라 권한을 확인하거나 티켓 코드를 직접 입력해 주세요.",
      )
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (!scanner) return
      scannerRef.current = null
      void scanner.stop().catch(() => undefined)
    }
  }, [])

  const meta = result ? resultMeta[result.result] : null
  const ResultIcon = meta?.icon

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-md border bg-black shadow-2xl">
        <div id={containerId} className="aspect-square w-full [&_video]:object-cover" />
        {scannerState !== "scanning" ? (
          <div className="absolute inset-0 grid place-items-center bg-primary p-7 text-center text-primary-foreground">
            <div>
              {scannerState === "starting" || scannerState === "processing" || scannerState === "stopping" ? (
                <Loader2 className="mx-auto size-10 animate-spin text-primary-foreground/70" aria-hidden="true" />
              ) : (
                <ScanLine className="mx-auto size-12 text-primary-foreground/70" aria-hidden="true" />
              )}
              <p className="mt-4 font-serif-kr text-2xl">
                {scannerState === "processing" ? "티켓 확인 중" : "입장 QR 스캔"}
              </p>
              <p className="mt-2 text-sm text-primary-foreground/60">
                카메라는 시작 버튼을 누른 뒤에만 사용합니다.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {scannerState === "scanning" ? (
        <Button variant="outline" size="lg" className="w-full rounded-full" onClick={() => void stopScanner()}>
          카메라 닫기
        </Button>
      ) : (
        <Button
          size="lg"
          className="w-full rounded-full"
          onClick={() => void startScanner()}
          disabled={scannerState !== "idle"}
        >
          <Camera className="size-5" aria-hidden="true" />
          카메라로 스캔 시작
        </Button>
      )}

      {cameraError ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>카메라를 열 수 없습니다</AlertTitle>
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      ) : null}

      {result && meta && ResultIcon ? (
        <Alert className={meta.className} aria-live="assertive">
          <ResultIcon className="size-4" aria-hidden="true" />
          <AlertTitle>{meta.title}</AlertTitle>
          <AlertDescription>
            <p>{result.message ?? meta.description}</p>
            {result.serialCode ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{result.serialCode}</Badge>
                {result.holderName ? <strong>{result.holderName}</strong> : null}
                {result.orderNumber ? <span>{result.orderNumber}</span> : null}
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-md border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Keyboard className="size-4 text-accent" aria-hidden="true" />
          <p className="font-medium">티켓 코드 직접 입력</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (manualToken.trim()) void processToken(manualToken)
          }}
          className="flex gap-2"
        >
          <Input
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            placeholder="QR 아래 UUID 코드"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={scannerState !== "idle"}
          />
          <Button type="submit" variant="outline" disabled={scannerState !== "idle" || !manualToken.trim()}>
            확인
          </Button>
        </form>
      </div>

      {result ? (
        <Button
          variant="ghost"
          className="w-full rounded-full"
          onClick={() => {
            setResult(null)
            setManualToken("")
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          다음 티켓 준비
        </Button>
      ) : null}
    </div>
  )
}
