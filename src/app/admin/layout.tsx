import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-alt">
      <header className="border-b border-taupe-line bg-cream-base px-6 py-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="font-display text-[18px] text-ink">
          Tell Me Everything
        </Link>
        <LogoutButton />
      </header>
      <div>{children}</div>
    </div>
  );
}
