"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth-client";
import posthog from "posthog-js";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LoginDialog({ open, onOpenChange, onSuccess }: LoginDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setReferralCode("");
    setError("");
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || "登入失敗");
          setLoading(false);
          return;
        }
        posthog.capture("user_logged_in", { method: "email" });
      } else {
        if (password.length < 8) {
          setError("密碼至少需要 8 個字元");
          setLoading(false);
          return;
        }
        const result = await signUp.email({ name, email, password });
        if (result.error) {
          setError(result.error.message || "註冊失敗");
          setLoading(false);
          return;
        }
        posthog.capture("user_signed_up", { method: "email" });

        // Apply referral code after successful registration
        if (referralCode.trim()) {
          try {
            const { applyReferralCode } = await import("@/server/actions/referral");
            const referralResult = await applyReferralCode({ code: referralCode.trim() });
            if (!referralResult.success) {
              // Registration succeeded but referral failed — show error and keep dialog open
              setError(`註冊成功，但推薦碼套用失敗：${referralResult.error}`);
              setLoading(false);
              setReferralCode("");
              return;
            }
          } catch {
            setError("註冊成功，但推薦碼套用失敗");
            setLoading(false);
            setReferralCode("");
            return;
          }
        }
      }

      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      setError(mode === "login" ? "登入失敗，請稍後再試" : "註冊失敗，請稍後再試");
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogHeader>
        <DialogTitle className="text-center text-primary">
          {mode === "login" ? "登入以繼續" : "建立帳號"}
        </DialogTitle>
        <DialogDescription className="text-center">
          {mode === "login"
            ? "登入後即可記錄食物和追蹤營養"
            : "註冊帳號開始追蹤你的營養"}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-3">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={googleLoading || appleLoading || loading}
          onClick={async () => {
            setGoogleLoading(true);
            setError("");
            try {
              await signIn.social({ provider: "google" });
              posthog.capture("user_logged_in", { method: "google" });
            } catch {
              setError("Google 登入失敗，請稍後再試");
              setGoogleLoading(false);
            }
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {googleLoading ? "登入中..." : "使用 Google 登入"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={googleLoading || appleLoading || loading}
          onClick={async () => {
            setAppleLoading(true);
            setError("");
            try {
              await signIn.social({ provider: "apple" });
              posthog.capture("user_logged_in", { method: "apple" });
            } catch {
              setError("Apple 登入失敗，請稍後再試");
              setAppleLoading(false);
            }
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          {appleLoading ? "登入中..." : "使用 Apple 登入"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">或</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {mode === "register" && (
          <Input
            placeholder="名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          type="email"
          placeholder="電子郵件"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder={mode === "register" ? "密碼 (至少 8 字元)" : "密碼"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "register" ? 8 : undefined}
        />

        {mode === "register" && (
          <Input
            placeholder="推薦碼（選填）"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            maxLength={12}
          />
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? (mode === "login" ? "登入中..." : "註冊中...")
            : (mode === "login" ? "登入" : "註冊")}
        </Button>
      </form>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        {mode === "login" ? "還沒有帳號？" : "已有帳號？"}{" "}
        <button
          type="button"
          onClick={switchMode}
          className="text-primary hover:underline"
        >
          {mode === "login" ? "註冊" : "登入"}
        </button>
      </p>
    </Dialog>
  );
}
