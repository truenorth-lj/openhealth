"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation("common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>{t("error.title", { defaultValue: "Something went wrong" })}</h2>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>{t("error.description", { defaultValue: "Sorry, an error occurred in the application" })}</p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.5rem", fontSize: "0.875rem", cursor: "pointer" }}
          >
            {t("buttons.retry", { defaultValue: "Retry" })}
          </button>
        </div>
      </body>
    </html>
  );
}
