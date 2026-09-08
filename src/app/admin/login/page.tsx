"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("That email or password isn't right. Try again.");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-cream-base">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-display mb-1">Admin</h1>
        <p className="text-ink-soft text-sm mb-8">Private access only.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] text-ink-soft mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-taupe-line bg-white px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] text-ink-soft mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-taupe-line bg-white px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-wine-primary/20 focus:border-wine-primary"
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-wine-primary italic">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
