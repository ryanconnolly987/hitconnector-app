import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
        <p className="text-sm text-gray-500 leading-none">
          © {new Date().getFullYear()} HitConnector. All rights reserved.
        </p>
        <nav className="flex gap-6 text-sm leading-none">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </nav>
      </div>
    </footer>
  )
} 