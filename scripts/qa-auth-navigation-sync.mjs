#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"

const files = {
  navigation: "components/navigation.tsx",
  authActions: "app/auth/actions.ts",
}

const sources = Object.fromEntries(
  Object.entries(files).map(([key, file]) => {
    if (!existsSync(file)) {
      throw new Error(`Missing required file: ${file}`)
    }

    return [key, readFileSync(file, "utf8")]
  }),
)

const checks = []

function addCheck(area, label, passed, detail) {
  checks.push({
    area,
    label,
    status: passed ? "ok" : "fail",
    detail,
  })
}

function includes(area, source, needle, label) {
  addCheck(area, label, source.includes(needle), `expected ${JSON.stringify(needle)}`)
}

function matches(area, source, pattern, label) {
  addCheck(area, label, pattern.test(source), `expected ${pattern}`)
}

function appearsBefore(area, source, first, second, label) {
  const firstIndex = source.indexOf(first)
  const secondIndex = source.indexOf(second)

  addCheck(
    area,
    label,
    firstIndex >= 0 && secondIndex >= 0 && firstIndex < secondIndex,
    `expected ${JSON.stringify(first)} before ${JSON.stringify(second)}`,
  )
}

function runSelfTest() {
  const sample = "useEffect(() => {}, [pathname]); revalidateAuthShell('/'); redirect('/')"
  const beforeChecks = checks.length

  includes("self-test", sample, "[pathname]", "include guard")
  matches("self-test", sample, /revalidateAuthShell\(['"]\/['"]\)/, "regex guard")
  appearsBefore("self-test", sample, "revalidateAuthShell('/')", "redirect('/')", "ordering guard")

  const selfTestChecks = checks.splice(beforeChecks)
  if (selfTestChecks.some((check) => check.status !== "ok")) {
    throw new Error("Self-test failed for auth navigation sync guard.")
  }
}

runSelfTest()

const { navigation, authActions } = sources

includes("navigation", navigation, "usePathname", "reads current route")
includes("navigation", navigation, "supabase.auth.getUser()", "rechecks browser session")
includes("navigation", navigation, "}, [pathname])", "rechecks session on route changes")
includes("navigation", navigation, "supabase.auth.onAuthStateChange", "keeps direct auth event listener")
includes("navigation", navigation, "subscription.unsubscribe()", "cleans auth listener")

includes("auth actions", authActions, "function revalidateAuthShell", "has shared auth shell revalidation")
includes("auth actions", authActions, 'revalidatePath("/", "layout")', "invalidates site layout shell")
includes("auth actions", authActions, 'revalidatePath("/login")', "invalidates login route")
includes("auth actions", authActions, 'revalidatePath("/mypage")', "invalidates account route")
appearsBefore("auth actions", authActions, "revalidateAuthShell(next)", "redirect(next)", "sign-in revalidates before redirect")
matches(
  "auth actions",
  authActions,
  /revalidateAuthShell\("\/mypage"\)\s+redirectWithParams\("\/mypage"/,
  "session sign-up revalidates before account redirect",
)
appearsBefore("auth actions", authActions, 'revalidateAuthShell("/")', 'redirect("/")', "sign-out revalidates before redirect")

console.log("Auth navigation sync guard")
console.table(
  checks.map((check) => ({
    area: check.area,
    check: check.label,
    status: check.status,
  })),
)

const failures = checks.filter((check) => check.status !== "ok")

if (failures.length) {
  console.error("\nAuth navigation sync regressions found:")
  for (const failure of failures) {
    console.error(`- ${failure.area}: ${failure.label} (${failure.detail})`)
  }
  process.exitCode = 1
}
