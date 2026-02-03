"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Integration } from "@/app/lib/types";

type GmailConfig = {
  query?: string;
  label_ids?: string[];
  max_results?: number;
};

type IntegrationConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
  loading?: boolean;
  onSave: (config: GmailConfig) => Promise<void>;
};

function parseLabelIds(value: string) {
  return value
    .split(",")
    .map((labelId) => labelId.trim())
    .filter(Boolean);
}

export function IntegrationConfigDialog({
  open,
  onOpenChange,
  integration,
  loading,
  onSave,
}: IntegrationConfigDialogProps) {
  const config = (integration?.config ?? {}) as Partial<GmailConfig>;
  const [query, setQuery] = React.useState("");
  const [labelIds, setLabelIds] = React.useState("INBOX");
  const [maxResults, setMaxResults] = React.useState("20");

  React.useEffect(() => {
    if (!open) return;
    setQuery(config.query ?? "");
    setLabelIds(config.label_ids?.join(", ") ?? "INBOX");
    setMaxResults(
      typeof config.max_results === "number"
        ? String(config.max_results)
        : "20"
    );
  }, [open, config.query, config.label_ids, config.max_results]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const labels = parseLabelIds(labelIds);
    const maxResultsValue = Number.parseInt(maxResults, 10);

    await onSave({
      query: query.trim() || undefined,
      label_ids: labels.length ? labels : undefined,
      max_results: Number.isFinite(maxResultsValue)
        ? maxResultsValue
        : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel soft-diffused">
        <DialogHeader>
          <DialogTitle>Configure Gmail</DialogTitle>
          <DialogDescription>
            Tune how Assist Me reads and filters your Gmail messages.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">
              Search Query
            </label>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="from:inbox@example.com"
              className="bg-white/70 border-none"
            />
            <p className="text-[11px] text-slate-400">
              Use Gmail search syntax to filter which emails are included.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">
              Label IDs
            </label>
            <Input
              value={labelIds}
              onChange={(event) => setLabelIds(event.target.value)}
              placeholder="INBOX, IMPORTANT"
              className="bg-white/70 border-none"
            />
            <p className="text-[11px] text-slate-400">
              Comma-separated Gmail label IDs to include.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">
              Max Results
            </label>
            <Input
              type="number"
              min={1}
              max={200}
              value={maxResults}
              onChange={(event) => setMaxResults(event.target.value)}
              className="bg-white/70 border-none"
            />
            <p className="text-[11px] text-slate-400">
              Limit how many emails to fetch per sync.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="bg-white/70 border-none"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-salmon text-white hover:bg-salmon/90"
              disabled={loading || !integration}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
