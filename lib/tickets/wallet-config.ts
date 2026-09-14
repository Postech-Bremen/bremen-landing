import "server-only"

import { access } from "node:fs/promises"
import path from "node:path"

export type AppleWalletEnvironment = {
  passTypeId: string
  teamId: string
  signerCert: string
  signerKey: string
  signerKeyPassphrase?: string
  wwdrCert: string
  downloadSecret: string
}

function optionalEnvironment(name: string) {
  return process.env[name]?.trim() || null
}

export function getAppleWalletEnvironment(): AppleWalletEnvironment | null {
  if (optionalEnvironment("APPLE_WALLET_ENABLED") !== "true") return null

  const passTypeId = optionalEnvironment("APPLE_PASS_TYPE_ID")
  const teamId = optionalEnvironment("APPLE_TEAM_ID")
  const signerCert = optionalEnvironment("APPLE_SIGNER_CERT_BASE64")
  const signerKey = optionalEnvironment("APPLE_SIGNER_KEY_BASE64")
  const wwdrCert = optionalEnvironment("APPLE_WWDR_CERT_BASE64")
  const downloadSecret = optionalEnvironment("WALLET_DOWNLOAD_SECRET")

  if (
    !passTypeId ||
    !teamId ||
    !signerCert ||
    !signerKey ||
    !wwdrCert ||
    !downloadSecret ||
    downloadSecret.length < 32
  ) {
    return null
  }

  return {
    passTypeId,
    teamId,
    signerCert,
    signerKey,
    signerKeyPassphrase: optionalEnvironment("APPLE_SIGNER_KEY_PASSPHRASE") ?? undefined,
    wwdrCert,
    downloadSecret,
  }
}

export async function getAppleWalletBadgePath() {
  if (!getAppleWalletEnvironment()) return null

  const badgePath = optionalEnvironment("APPLE_WALLET_BADGE_PATH")
  if (!badgePath?.startsWith("/") || !badgePath.toLowerCase().endsWith(".svg")) {
    return null
  }

  const publicRoot = path.resolve(process.cwd(), "public")
  const absoluteBadgePath = path.resolve(publicRoot, `.${badgePath}`)
  if (!absoluteBadgePath.startsWith(`${publicRoot}${path.sep}`)) return null

  try {
    await access(absoluteBadgePath)
    return badgePath
  } catch {
    return null
  }
}
