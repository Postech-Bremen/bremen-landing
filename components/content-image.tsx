import Image, { type ImageProps } from "next/image"

type ContentImageProps = Omit<ImageProps, "src"> & {
  src: string
}

const configuredSupabaseHost = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) return null

  try {
    return new URL(supabaseUrl).hostname
  } catch {
    return null
  }
})()

export function shouldBypassImageOptimization(src: string) {
  try {
    const url = new URL(src)
    const isConfiguredSupabaseHost =
      configuredSupabaseHost !== null && url.hostname === configuredSupabaseHost
    const isSupabaseHost = url.hostname.endsWith(".supabase.co")

    return (
      (isConfiguredSupabaseHost || isSupabaseHost) &&
      url.pathname.startsWith("/storage/v1/object/")
    )
  } catch {
    return false
  }
}

export function ContentImage({
  src,
  alt,
  unoptimized,
  ...props
}: ContentImageProps) {
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? shouldBypassImageOptimization(src)}
    />
  )
}
