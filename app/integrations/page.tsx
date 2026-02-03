"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IntegrationConfigDialog } from "@/components/integrations/IntegrationConfigDialog";
import { cn } from "@/lib/utils";
import {
  ApiError,
  connectGmail,
  disconnectIntegration,
  getAvailableIntegrations,
  getMyIntegrations,
  updateIntegration,
} from "@/app/lib/integrations/api";
import { buildIntegrationCards } from "@/app/lib/integrations/merge";
import { primaryActionLabel, statusLabel } from "@/app/lib/integrations/status";
import type {
  Integration,
  IntegrationCardState,
  IntegrationCategory,
} from "@/app/lib/types";

const CATEGORY_FILTERS: Array<{ label: string; value: IntegrationCategory }> = [
  { label: "All Apps", value: "all" },
  { label: "Mail", value: "mail" },
  { label: "Productivity", value: "productivity" },
  { label: "Family", value: "family" },
  { label: "Calendar", value: "calendar" },
];

const STATUS_TONES: Record<
  string,
  { badge: string; dot: string; ring: string }
> = {
  active: {
    badge: "bg-teal-50 text-teal-600",
    dot: "bg-teal-500",
    ring: "ring-teal-200/70",
  },
  expired: {
    badge: "bg-amber-50 text-amber-600",
    dot: "bg-amber-500",
    ring: "ring-amber-200/70",
  },
  error: {
    badge: "bg-rose-50 text-rose-600",
    dot: "bg-rose-500",
    ring: "ring-rose-200/70",
  },
  disconnected: {
    badge: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
    ring: "ring-slate-200/70",
  },
  comingSoon: {
    badge: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
    ring: "ring-slate-200/70",
  },
};

function Toggle({
  on,
  disabled,
  onToggle,
}: {
  on: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        on ? "bg-teal-400" : "bg-slate-200",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
          on ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Your session has expired. Please refresh the page.";
    }
    if (error.status === 429) {
      return "You are making requests too quickly. Please try again shortly.";
    }
    return error.message || "Something went wrong.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to load integrations.";
}

export default function ConnectionsPage() {
  const [cards, setCards] = React.useState<IntegrationCardState[]>(() =>
    buildIntegrationCards([], [])
  );
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<IntegrationCategory>("all");
  const [loading, setLoading] = React.useState(true);
  const [actionBusy, setActionBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [integrationsByProvider, setIntegrationsByProvider] = React.useState<
    Record<string, Integration>
  >({});
  const [configOpen, setConfigOpen] = React.useState(false);
  const [configProvider, setConfigProvider] = React.useState<string | null>(null);
  const showSkeleton = loading && cards.length === 0;

  const refreshIntegrations = React.useCallback(async () => {
    setLoading(true);
    try {
      const [availableResult, mineResult] = await Promise.allSettled([
        getAvailableIntegrations(),
        getMyIntegrations(),
      ]);

      const available =
        availableResult.status === "fulfilled" ? availableResult.value : [];
      const mine = mineResult.status === "fulfilled" ? mineResult.value : [];

      setCards(buildIntegrationCards(available, mine));
      setIntegrationsByProvider(
        mine.reduce<Record<string, Integration>>((acc, integration) => {
          acc[integration.provider_type] = integration;
          return acc;
        }, {})
      );

      if (
        availableResult.status === "rejected" ||
        mineResult.status === "rejected"
      ) {
        const availableError =
          availableResult.status === "rejected"
            ? getErrorMessage(availableResult.reason)
            : null;
        const mineError =
          mineResult.status === "rejected"
            ? getErrorMessage(mineResult.reason)
            : null;
        setError(availableError || mineError);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshIntegrations();
  }, [refreshIntegrations]);

  const filteredCards = React.useMemo(() => {
    const query = normalizeQuery(search);
    return cards.filter((card) => {
      if (category !== "all" && card.category !== category) return false;
      if (!query) return true;
      return (
        card.name.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query)
      );
    });
  }, [cards, search, category]);

  const handlePrimaryAction = async (card: IntegrationCardState) => {
    if (!card.enabled || card.comingSoon) return;
    if (card.provider_type !== "gmail") {
      setError("This integration is not yet supported.");
      return;
    }

    const label = primaryActionLabel(card.status);
    if (label === "Configure") {
      if (!card.integrationId) {
        setError("Connect Gmail before configuring it.");
        return;
      }
      setConfigProvider(card.provider_type);
      setConfigOpen(true);
      return;
    }

    setActionBusy(card.provider_type);
    setError(null);
    try {
      const redirectUri = window.location.href;
      const { authorization_url } = await connectGmail(redirectUri);
      window.location.href = authorization_url;
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  const handleDisconnect = async (card: IntegrationCardState) => {
    if (!card.integrationId) return;
    const ok = window.confirm("Disconnect this integration?");
    if (!ok) return;

    setActionBusy(card.provider_type);
    setError(null);
    try {
      await disconnectIntegration(card.integrationId);
      await refreshIntegrations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  const handleToggle = async (card: IntegrationCardState, nextOn: boolean) => {
    if (!card.integrationId) return;
    if (!card.enabled || card.comingSoon) return;

    setActionBusy(card.provider_type);
    setError(null);
    try {
      await updateIntegration(card.integrationId, {
        status: nextOn ? "active" : "disconnected",
      });
      await refreshIntegrations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  const requestNewIntegration = () => {
    window.open("https://your-form-url.example.com", "_blank");
  };

  const activeIntegration =
    configProvider ? integrationsByProvider[configProvider] ?? null : null;

  const handleSaveConfig = async (config: {
    query?: string;
    label_ids?: string[];
    max_results?: number;
  }) => {
    if (!activeIntegration) {
      setError("Connect Gmail before configuring it.");
      return;
    }

    setActionBusy(activeIntegration.provider_type);
    setError(null);
    try {
      await updateIntegration(activeIntegration.id, { config });
      await refreshIntegrations();
      setConfigOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="glass-panel soft-diffused rounded-soft border-none p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <h2 className="text-charcoal text-4xl font-extrabold tracking-tight">
              Integrations
            </h2>
            <p className="text-slate-500 text-sm font-semibold max-w-xl">
              Link your favorite tools so Assist Me can handle email, calendar,
              and productivity tasks for you.
            </p>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search integrations..."
              className="pl-9 bg-white/60 border-none shadow-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setCategory(filter.value)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                category === filter.value
                  ? "bg-salmon text-white shadow-sm"
                  : "bg-white/60 text-slate-500 hover:bg-white"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </Card>

      {error ?
        (
          <Card className="glass-panel soft-diffused rounded-inner border-none p-4">
            <p className="text-sm text-rose-600 font-semibold">{error}</p>
          </Card>
        ) : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[220px] w-full rounded-soft bg-white/60"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const displayStatus = card.comingSoon
              ? "Coming Soon"
              : statusLabel(card.status);
            const actionLabel = card.comingSoon
              ? "Coming Soon"
              : primaryActionLabel(card.status);
            const statusTone =
              STATUS_TONES[card.comingSoon ? "comingSoon" : card.status] ??
              STATUS_TONES.disconnected;
            const toggleOn =
              card.status === "active" ||
              card.status === "expired" ||
              card.status === "error";
            const actionDisabled =
              !card.enabled || card.comingSoon || actionBusy === card.provider_type;
            const toggleDisabled =
              actionDisabled || !card.integrationId || actionBusy === card.provider_type;

            return (
              <Card
                key={card.provider_type}
                className={cn(
                  "glass-panel soft-diffused rounded-soft border-none p-6 gap-4 h-full",
                  card.status === "expired" ? "ring-1" : "",
                  card.status === "expired" ? statusTone.ring : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-white/70 flex items-center justify-center text-slate-500 shadow-sm">
                    {card.icon}
                  </div>
                  <Toggle
                    on={toggleOn}
                    disabled={toggleDisabled}
                    onToggle={() => handleToggle(card, !toggleOn)}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-charcoal text-lg font-bold">
                    {card.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-2 border-none",
                      statusTone.badge
                    )}
                  >
                    <span
                      className={cn("h-2 w-2 rounded-full", statusTone.dot)}
                    />
                    {displayStatus}
                  </Badge>

                  <div className="flex items-center gap-2">
                    {card.integrationId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => handleDisconnect(card)}
                        disabled={actionBusy === card.provider_type}
                      >
                        Disconnect
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      size="sm"
                      className={cn(
                        "rounded-full text-xs",
                        actionDisabled
                          ? "bg-slate-200 text-slate-400"
                          : "bg-salmon text-white hover:bg-salmon/90"
                      )}
                      onClick={() => handlePrimaryAction(card)}
                      disabled={actionDisabled}
                    >
                      {actionLabel}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!showSkeleton && filteredCards.length === 0 ? (
        <Card className="glass-panel soft-diffused rounded-soft border-none p-8 text-center">
          <p className="text-charcoal text-lg font-bold">No integrations found</p>
          <p className="text-sm text-slate-500 mt-2">
            Try adjusting your search or filter to find integrations.
          </p>
        </Card>
      ) : null}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="rounded-full bg-white/70 border-none shadow-sm px-6"
          onClick={requestNewIntegration}
        >
          <Plus className="h-4 w-4" />
          Request New Integration
        </Button>
      </div>

      <IntegrationConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        integration={activeIntegration}
        loading={actionBusy === activeIntegration?.provider_type}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
