"use client";

import { useSession } from "@/lib/auth-client";
import { User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useTranslation } from "react-i18next";

export function Header() {
  const { data: session } = useSession();
  const [showLogin, setShowLogin] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/[0.06] dark:border-white/[0.06] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/hub" className="text-base font-light tracking-[0.3em] text-foreground transition-all duration-300 hover:opacity-60">
            OH
          </Link>

          {session?.user ? (
            <Link
              href="/settings/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06] text-neutral-500 transition-all duration-300 hover:text-foreground"
            >
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-light text-neutral-500 transition-all duration-300 hover:text-foreground"
            >
              {t("auth.login")}
            </button>
          )}
        </div>
      </header>

      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </>
  );
}
