import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import { Buffer } from "node:buffer"
import { PKPass, type PassProps } from "passkit-generator"
import sharp from "sharp"

import type { AppleWalletEnvironment } from "@/lib/tickets/wallet-config"

export const WALLET_DOWNLOAD_TTL_SECONDS = 60

export type WalletTicketSnapshot = {
  id: string
  qrToken: string
  serialCode: string
  holderName: string
  ticketType: string
  eventTitle: string
  startsAt: string
  endsAt: string | null
  venueName: string
  venueAddress: string | null
  ticketStatus: "issued"
  orderStatus: "confirmed"
}

type WalletTokenPayload = {
  version: 1
  expiresAt: number
  ticket: WalletTicketSnapshot
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

function encryptionKey(secret: string) {
  if (secret.length < 32) throw new Error("Wallet download secret is too short")
  return createHash("sha256").update(secret, "utf8").digest()
}

function isBoundedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength
}

function validIsoDate(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

export function isValidTicketId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value)
}

function isEligibleSnapshot(value: unknown): value is WalletTicketSnapshot {
  if (!value || typeof value !== "object") return false
  const ticket = value as Partial<WalletTicketSnapshot>

  return Boolean(
    isValidTicketId(ticket.id) &&
      ticket.ticketStatus === "issued" &&
      ticket.orderStatus === "confirmed" &&
      isBoundedString(ticket.qrToken, 512) &&
      isBoundedString(ticket.serialCode, 80) &&
      isBoundedString(ticket.holderName, 80) &&
      isBoundedString(ticket.ticketType, 80) &&
      isBoundedString(ticket.eventTitle, 160) &&
      validIsoDate(ticket.startsAt) &&
      (ticket.endsAt === null || validIsoDate(ticket.endsAt)) &&
      isBoundedString(ticket.venueName, 160) &&
      (ticket.venueAddress === null || isBoundedString(ticket.venueAddress, 300)),
  )
}

export function createWalletTicketSnapshot(value: WalletTicketSnapshot) {
  const snapshot: WalletTicketSnapshot = {
    id: value.id,
    qrToken: value.qrToken.slice(0, 512),
    serialCode: value.serialCode.slice(0, 80),
    holderName: value.holderName.slice(0, 80),
    ticketType: value.ticketType.slice(0, 80),
    eventTitle: value.eventTitle.slice(0, 160),
    startsAt: new Date(value.startsAt).toISOString(),
    endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null,
    venueName: value.venueName.slice(0, 160),
    venueAddress: value.venueAddress?.slice(0, 300) ?? null,
    ticketStatus: value.ticketStatus,
    orderStatus: value.orderStatus,
  }

  if (!isEligibleSnapshot(snapshot)) throw new Error("Ticket is not eligible for Wallet")
  return snapshot
}

export function createWalletDownloadToken(
  ticket: WalletTicketSnapshot,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
) {
  if (!isEligibleSnapshot(ticket)) throw new Error("Ticket is not eligible for Wallet")

  const initializationVector = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), initializationVector)
  const payload: WalletTokenPayload = {
    version: 1,
    expiresAt: nowSeconds + WALLET_DOWNLOAD_TTL_SECONDS,
    ticket,
  }
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])

  return [initializationVector, encrypted, cipher.getAuthTag()]
    .map((part) => part.toString("base64url"))
    .join(".")
}

export function readWalletDownloadToken(
  token: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
) {
  const parts = token?.split(".") ?? []
  if (parts.length !== 3) return null

  try {
    const [initializationVector, encrypted, authenticationTag] = parts.map((part) =>
      Buffer.from(part, "base64url"),
    )
    if (initializationVector.length !== 12 || authenticationTag.length !== 16) return null

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(secret),
      initializationVector,
    )
    decipher.setAuthTag(authenticationTag)
    const decoded = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8",
    )
    const payload = JSON.parse(decoded) as Partial<WalletTokenPayload>

    if (
      payload.version !== 1 ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= nowSeconds ||
      !isEligibleSnapshot(payload.ticket)
    ) {
      return null
    }
    return payload.ticket
  } catch {
    return null
  }
}

function iconSvg(size: number) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="22" fill="#171512"/>
      <path d="M27 18h26c18 0 29 8 29 22 0 9-5 15-13 18 10 3 16 10 16 21 0 16-12 24-33 24H27V18Zm20 33c9 0 14-3 14-10 0-6-5-9-14-9h-2v19h2Zm2 38c10 0 16-4 16-12s-6-12-16-12h-4v24h4Z" fill="#f4f0e8"/>
      <rect x="18" y="10" width="7" height="80" fill="#d6a14f"/>
    </svg>
  `)
}

function stripSvg(width: number, height: number) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1125 294">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stop-color="#171512"/>
          <stop offset="0.68" stop-color="#2a211c"/>
          <stop offset="1" stop-color="#71302a"/>
        </linearGradient>
      </defs>
      <rect width="1125" height="294" fill="url(#g)"/>
      <path d="M0 238C180 150 305 316 505 204S825 119 1125 211V294H0Z" fill="#d6a14f" opacity=".22"/>
      <path d="M0 269C199 186 360 328 554 225S871 161 1125 240" fill="none" stroke="#f4f0e8" stroke-width="5" opacity=".22"/>
    </svg>
  `)
}

let passAssetsPromise: Promise<Record<string, Buffer>> | null = null

async function passAssets() {
  if (!passAssetsPromise) {
    passAssetsPromise = (async () => {
      const iconSizes = [29, 58, 87]
      const stripSizes = [
        [375, 98],
        [750, 196],
        [1125, 294],
      ] as const
      const icons = await Promise.all(
        iconSizes.map((size) => sharp(iconSvg(size)).png().toBuffer()),
      )
      const strips = await Promise.all(
        stripSizes.map(([width, height]) => sharp(stripSvg(width, height)).png().toBuffer()),
      )

      return {
        "icon.png": icons[0],
        "icon@2x.png": icons[1],
        "icon@3x.png": icons[2],
        "strip.png": strips[0],
        "strip@2x.png": strips[1],
        "strip@3x.png": strips[2],
      }
    })()
  }
  return passAssetsPromise
}

const walletDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
})

export async function buildAppleWalletPass(
  ticket: WalletTicketSnapshot,
  environment: AppleWalletEnvironment,
  appOrigin: string,
) {
  if (!isEligibleSnapshot(ticket)) throw new Error("Ticket is not eligible for Wallet")

  const startsAt = new Date(ticket.startsAt)
  const expirationDate = ticket.endsAt
    ? new Date(ticket.endsAt)
    : new Date(startsAt.getTime() + 24 * 60 * 60 * 1_000)
  const passPageUrl = new URL("/tickets", appOrigin).toString()

  const passJson: PassProps = {
    formatVersion: 1,
    passTypeIdentifier: environment.passTypeId,
    teamIdentifier: environment.teamId,
    serialNumber: ticket.id,
    organizationName: "브레멘 Bremen",
    description: `${ticket.eventTitle} 공연 입장 티켓`,
    logoText: "BREMEN",
    backgroundColor: "rgb(23, 21, 18)",
    foregroundColor: "rgb(244, 240, 232)",
    labelColor: "rgb(214, 161, 79)",
    sharingProhibited: true,
    appLaunchURL: passPageUrl,
    relevantDate: startsAt.toISOString(),
    expirationDate: expirationDate.toISOString(),
    semantics: {
      eventType: "PKEventTypeLivePerformance",
      eventName: ticket.eventTitle,
      eventStartDate: startsAt.toISOString(),
      ...(ticket.endsAt ? { eventEndDate: new Date(ticket.endsAt).toISOString() } : {}),
      venueName: ticket.venueName,
      attendeeName: ticket.holderName,
      admissionLevel: ticket.ticketType,
    },
    eventTicket: {
      headerFields: [{ key: "type", label: "TICKET", value: ticket.ticketType }],
      primaryFields: [{ key: "event", label: "공연", value: ticket.eventTitle }],
      secondaryFields: [
        {
          key: "date",
          label: "일시",
          value: startsAt,
          dateStyle: "PKDateStyleMedium",
          timeStyle: "PKDateStyleShort",
        },
        { key: "venue", label: "장소", value: ticket.venueName },
      ],
      auxiliaryFields: [
        { key: "holder", label: "예매자", value: ticket.holderName },
        { key: "serial", label: "티켓 번호", value: ticket.serialCode },
      ],
      backFields: [
        ...(ticket.venueAddress
          ? [{ key: "address", label: "주소", value: ticket.venueAddress }]
          : []),
        {
          key: "admission",
          label: "입장 안내",
          value: "입장 시 이 패스의 QR을 스태프에게 보여주세요. QR과 티켓 이미지는 타인에게 공유하지 마세요.",
        },
        {
          key: "performance_date",
          label: "공연 일시",
          value: walletDateFormatter.format(startsAt),
        },
        {
          key: "website",
          label: "내 티켓",
          value: passPageUrl,
          dataDetectorTypes: ["PKDataDetectorTypeLink"],
        },
      ],
    },
  }

  const decodeCertificate = (value: string) => Buffer.from(value, "base64")
  const pass = new PKPass(
    {
      ...(await passAssets()),
      "pass.json": Buffer.from(JSON.stringify(passJson), "utf8"),
    },
    {
      wwdr: decodeCertificate(environment.wwdrCert),
      signerCert: decodeCertificate(environment.signerCert),
      signerKey: decodeCertificate(environment.signerKey),
      signerKeyPassphrase: environment.signerKeyPassphrase,
    },
  )
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: ticket.qrToken,
    messageEncoding: "utf-8",
    altText: ticket.serialCode,
  })

  return pass.getAsBuffer()
}
