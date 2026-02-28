"use client";

import { useSession } from "@/lib/auth-client";
import { User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoginDialog } from "@/components/auth/login-dialog";

export function Header() {
  const { data: session } = useSession();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/diary" className="text-lg font-bold text-primary">
            Open Health
          </Link>

          {session?.user ? (
            <Link
              href="/settings/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              登入
            </button>
          )}
        </div>
      </header>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </>
  );
}
