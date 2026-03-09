"use client";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Crown } from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          升級至 Pro
        </DialogTitle>
        <DialogDescription>
          解鎖所有進階功能，讓健康管理更完整
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Crown className="h-10 w-10 text-amber-500/50" />
        <p className="text-base font-light text-neutral-400">敬請期待</p>
        <p className="text-sm text-neutral-400/70 text-center">
          付款功能正在開發中，完成後將開放訂閱
        </p>
      </div>
    </Dialog>
  );
}
