"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TopNavProps {
  email?: string | null;
}

export function TopNav({ email }: TopNavProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />

      {/* Right side — avatar + logout */}
      <div className="flex items-center gap-3">
        {email && (
          <span className="text-sm text-gray-500 hidden sm:block">{email}</span>
        )}

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-white text-sm font-semibold select-none">
          {initials}
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
}
