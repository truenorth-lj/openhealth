"use client";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const { t } = useTranslation("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          {t("upgrade.title")}
        </DialogTitle>
        <DialogDescription>
          {t("upgrade.description")}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Crown className="h-10 w-10 text-amber-500/50" />
        <p className="text-base font-light text-neutral-400">{t("upgrade.comingSoon")}</p>
        <p className="text-sm text-neutral-400/70 text-center">
          {t("upgrade.paymentDeveloping")}
        </p>
      </div>
    </Dialog>
  );
}
