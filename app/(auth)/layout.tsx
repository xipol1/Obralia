import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10">
      <Link
        href="/"
        className="mb-10 text-4xl font-black tracking-tight text-[--color-primary]"
      >
        Obral<span className="text-[--color-accent]">i</span>a
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
