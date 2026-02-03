"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ApiError,
  connectGmail,
  getIntegrationEmails,
  getMyIntegrations,
} from "@/app/lib/integrations/api";
import type {
  EmailFilter,
  EmailMessage,
  Integration,
} from "@/app/lib/types";

const FILTERS: Array<{ label: string; value: EmailFilter }> = [
  { label: "ALL", value: "all" },
  { label: "UNREAD", value: "unread" },
  { label: "TASKS", value: "tasks" },
];

const MAX_RESULTS = 20;
const MIN_RESULTS = 1;
const MAX_RESULTS_LIMIT = 100;

function normalizeQuery(value: string) {
  return value.trim();
}

function buildQuery(base?: string | null, extra?: string | null) {
  const parts = [base?.trim(), extra?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "";
}

function parseFrom(value?: string | null) {
  if (!value) {
    return { name: "Unknown Sender", email: "" };
  }
  const match = value.match(/^(.*?)(?:\s*<(.+?)>)?$/);
  const name = match?.[1]?.trim() || value;
  const email = match?.[2] ? `<${match[2]}>` : "";
  return { name, email };
}

function formatListDateTime(value?: string | null) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfDate = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();
  const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);

  if (dayDiff === 0) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatDetailDate(value?: string | null) {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getIntegrationLabel(
  integration: Integration,
  index: number
): string {
  const config = (integration.config ?? {}) as Record<string, unknown>;
  const email =
    (typeof config.email === "string" && config.email) ||
    (typeof config.account_email === "string" && config.account_email) ||
    (typeof config.user_email === "string" && config.user_email) ||
    null;
  const provider =
    integration.provider_type === "gmail"
      ? "Gmail"
      : integration.provider_type.replace(/_/g, " ");
  return email ? `${provider} • ${email}` : `${provider} Account ${index + 1}`;
}

function plainTextFromBody(value?: string | null) {
  if (!value) return "";
  if (value.includes("<")) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, "text/html");
      return doc.body.textContent?.trim() ?? "";
    } catch {
      return value;
    }
  }
  return value;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Your session has expired. Please sign in again.";
    }
    if (error.status === 404) {
      return "Email integration not found. Connect Gmail to continue.";
    }
    if (error.status === 429) {
      return "You're making requests too quickly. Please try again shortly.";
    }
    if (error.status === 502) {
      return "Gmail is temporarily unavailable. Please retry in a moment.";
    }
    return error.message || "Something went wrong.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to load emails.";
}

export default function EmailPage() {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [activeIntegrationId, setActiveIntegrationId] = React.useState<
    string | null
  >(null);
  const [loadingIntegration, setLoadingIntegration] = React.useState(true);
  const [emails, setEmails] = React.useState<EmailMessage[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<EmailFilter>("all");
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [pageTokens, setPageTokens] = React.useState<Array<string | null>>([
    null,
  ]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null);
  const [loadingEmails, setLoadingEmails] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reauthBusy, setReauthBusy] = React.useState(false);
  const reauthAttemptedRef = React.useRef(false);

  const integration = React.useMemo(() => {
    if (!integrations.length) return null;
    return (
      integrations.find((item) => item.id === activeIntegrationId) ??
      integrations[0] ??
      null
    );
  }, [integrations, activeIntegrationId]);

  const config = React.useMemo(() => {
    return (integration?.config ?? {}) as {
      query?: string;
      label_ids?: string[];
      max_results?: number;
    };
  }, [integration?.config]);

  const configQuery = React.useMemo(() => {
    return typeof config.query === "string" ? config.query.trim() : "";
  }, [config.query]);

  const configLabelIds = React.useMemo(() => {
    if (!Array.isArray(config.label_ids)) return undefined;
    const labels = config.label_ids.map((label) => label.trim()).filter(Boolean);
    return labels.length ? labels : undefined;
  }, [config.label_ids]);

  const resolvedMaxResults = React.useMemo(() => {
    const configured =
      typeof config.max_results === "number" ? config.max_results : NaN;
    if (!Number.isFinite(configured)) return MAX_RESULTS;
    return Math.min(
      MAX_RESULTS_LIMIT,
      Math.max(MIN_RESULTS, Math.floor(configured))
    );
  }, [config.max_results]);

  React.useEffect(() => {
    reauthAttemptedRef.current = false;
  }, [integration?.id]);

  const startReauth = React.useCallback(async () => {
    if (reauthBusy) return;
    setReauthBusy(true);
    setError(null);
    try {
      const redirectUri = window.location.href;
      const { authorization_url } = await connectGmail(redirectUri);
      window.location.href = authorization_url;
    } catch (err) {
      setError(getErrorMessage(err));
      setReauthBusy(false);
    }
  }, [reauthBusy]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(normalizeQuery(query));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    let alive = true;
    setLoadingIntegration(true);
    setError(null);

    getMyIntegrations()
      .then((items) => {
        if (!alive) return;
        const emailIntegrations = items.filter(
          (item) => item.provider_type === "gmail"
        );
        setIntegrations(emailIntegrations);
        setActiveIntegrationId((prev) => prev ?? emailIntegrations[0]?.id ?? null);
      })
      .catch((err) => {
        if (!alive) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!alive) return;
        setLoadingIntegration(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!integrations.length) {
      if (activeIntegrationId) setActiveIntegrationId(null);
      return;
    }
    if (!activeIntegrationId) {
      setActiveIntegrationId(integrations[0]?.id ?? null);
      return;
    }
    if (!integrations.some((item) => item.id === activeIntegrationId)) {
      setActiveIntegrationId(integrations[0]?.id ?? null);
    }
  }, [integrations, activeIntegrationId]);

  React.useEffect(() => {
    setPageIndex((prev) => (prev === 0 ? prev : 0));
    setPageTokens((prev) => {
      if (prev.length === 1 && prev[0] === null) return prev;
      return [null];
    });
  }, [filter, debouncedQuery, configQuery, integration?.id]);

  React.useEffect(() => {
    if (!integration || integration.status === "disconnected") {
      setEmails([]);
      setNextPageToken(null);
      setLoadingEmails(false);
      return;
    }

    let alive = true;
    setLoadingEmails(true);
    setError(null);

    const currentToken = pageTokens[pageIndex] ?? null;

    const effectiveQuery = buildQuery(configQuery, debouncedQuery);

    getIntegrationEmails(integration.id, {
      filter,
      query: effectiveQuery || undefined,
      label_ids: configLabelIds,
      max_results: resolvedMaxResults,
      page_token: currentToken || undefined,
      summarize: true,
    })
      .then((data) => {
        if (!alive) return;
        const items = data.items ?? [];
        setEmails(items);
        setNextPageToken(data.next_page_token ?? null);
        setSelectedId((prev) => {
          if (prev && items.some((item) => item.id === prev)) return prev;
          return items[0]?.id ?? null;
        });
      })
      .catch((err) => {
        if (!alive) return;
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403) &&
          integration &&
          !reauthAttemptedRef.current
        ) {
          reauthAttemptedRef.current = true;
          void startReauth();
          return;
        }
        setError(getErrorMessage(err));
        setEmails([]);
        setNextPageToken(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoadingEmails(false);
      });

    return () => {
      alive = false;
    };
  }, [
    integration,
    filter,
    debouncedQuery,
    configQuery,
    configLabelIds,
    resolvedMaxResults,
    pageIndex,
    pageTokens,
    startReauth,
  ]);

  const selectedEmail = React.useMemo(() => {
    if (!selectedId) return emails[0] ?? null;
    return emails.find((item) => item.id === selectedId) ?? emails[0] ?? null;
  }, [emails, selectedId]);

  const integrationUnavailable =
    !loadingIntegration && (!integration || integration.status === "disconnected");
  const showNotice =
    integration?.status === "expired" || integration?.status === "error";
  const noticeMessage =
    integration?.status === "expired"
      ? "Gmail access has expired. Reconnect to resume syncing."
      : integration?.status === "error"
        ? "Gmail reported an error. Check connection settings."
        : null;

  const handleNextPage = () => {
    if (!nextPageToken) return;
    setPageTokens((prev) => {
      const updated = [...prev];
      updated[pageIndex + 1] = nextPageToken;
      return updated;
    });
    setPageIndex((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (pageIndex === 0) return;
    setPageIndex((prev) => Math.max(0, prev - 1));
  };

  const bodyText = plainTextFromBody(selectedEmail?.body);
  const bodyParagraphs = bodyText
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const { name: senderName, email: senderEmail } = parseFrom(
    selectedEmail?.from
  );
  const senderInitial = (senderName || senderEmail || "A").charAt(0).toUpperCase();
  const summaryText = selectedEmail?.summary?.trim() ?? "";

  return (
    <div className="flex flex-1 gap-6 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full lg:w-1/3 flex flex-col gap-4 min-h-0">
        {integrations.length > 0 ? (
          <Card className="glass-panel soft-diffused rounded-soft border-none p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Email Account
                </p>
                <p className="text-sm font-semibold text-charcoal">
                  {integration
                    ? getIntegrationLabel(
                        integration,
                        integrations.findIndex((item) => item.id === integration.id)
                      )
                    : "Select an account"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white/70 text-slate-600 hover:bg-white"
                    disabled={loadingIntegration || integrations.length === 0}
                  >
                    Switch
                    <span className="material-symbols-outlined text-sm">
                      expand_more
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Select account</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={activeIntegrationId ?? ""}
                    onValueChange={(value) => setActiveIntegrationId(value)}
                  >
                    {integrations.map((item, index) => (
                      <DropdownMenuRadioItem
                        key={item.id}
                        value={item.id}
                        className="text-sm"
                      >
                        {getIntegrationLabel(item, index)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ) : null}

        {integrationUnavailable ? (
          <Card className="glass-panel soft-diffused rounded-soft border-none p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-salmon text-lg">
                  mail
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-charcoal text-sm font-bold">
                  Connect Gmail to view your inbox
                </p>
                <p className="text-[11px] text-slate-500">
                  Head to Integrations to connect or enable your Gmail account.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-salmon text-white hover:bg-salmon/90"
                >
                  <Link href="/integrations">Go to Integrations</Link>
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {showNotice && noticeMessage ? (
          <Card className="glass-panel soft-diffused rounded-inner border-none p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-amber-600">
                {noticeMessage}
              </p>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-salmon text-white hover:bg-salmon/90"
                onClick={() => void startReauth()}
                disabled={reauthBusy}
              >
                {reauthBusy ? "Reconnecting..." : "Reconnect Gmail"}
              </Button>
            </div>
          </Card>
        ) : null}

        {error ? (
          <Card className="glass-panel soft-diffused rounded-inner border-none p-4">
            <p className="text-xs font-semibold text-rose-600">{error}</p>
          </Card>
        ) : null}

        <Card className="glass-panel soft-diffused p-4 rounded-soft flex flex-col gap-4 border-none">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search emails..."
              className="w-full bg-white/40 border-none rounded-inner pl-10 pr-4 py-2 text-xs focus-visible:ring-salmon/20"
              disabled={integrationUnavailable || loadingIntegration}
            />
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                disabled={integrationUnavailable || loadingIntegration}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all",
                  filter === option.value
                    ? "bg-white shadow-sm text-charcoal"
                    : "hover:bg-white/40 text-slate-500",
                  integrationUnavailable || loadingIntegration
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
          {loadingIntegration || loadingEmails ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[140px] w-full rounded-soft bg-white/60"
              />
            ))
          ) : integrationUnavailable ? (
            <Card className="glass-panel soft-diffused rounded-soft border-none p-6 text-center">
              <p className="text-charcoal text-sm font-bold">
                Gmail is not connected
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Connect your account to load emails here.
              </p>
            </Card>
          ) : emails.length === 0 ? (
            <Card className="glass-panel soft-diffused rounded-soft border-none p-6 text-center">
              <p className="text-charcoal text-sm font-bold">No emails found</p>
              <p className="text-[11px] text-slate-500 mt-2">
                Try changing the filters or search query.
              </p>
            </Card>
          ) : (
            emails.map((email) => {
              const isUnread = email.labels?.includes("UNREAD");
              const isSelected = email.id === selectedEmail?.id;
              const { name } = parseFrom(email.from);
              const summaryLine = email.summary?.trim() || "No summary available.";

              return (
                <Card
                  key={email.id}
                  className={cn(
                    "glass-panel soft-diffused p-6 min-h-[170px] rounded-soft cursor-pointer transition-all border-none",
                    isSelected
                      ? "bg-white/80 ring-2 ring-salmon/10 shadow-lg"
                      : "bg-white/40 hover:bg-white/60",
                    isUnread
                      ? "border-l-4 border-salmon"
                      : "border-l-4 border-transparent"
                  )}
                  onClick={() => setSelectedId(email.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isUnread ? (
                      <span className="w-2 h-2 rounded-full bg-salmon shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full opacity-0" />
                    )}
                    <p className="text-sm font-semibold text-charcoal">
                      {name}
                    </p>
                    <span className="text-xs text-slate-400">-</span>
                    <p className="text-xs font-medium text-slate-400">
                      {formatListDateTime(email.date)}
                    </p>
                  </div>
                  <p className="text-[15px] font-bold text-slate-700 truncate mb-2">
                    {email.subject || "(No subject)"}
                  </p>
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed line-clamp-3",
                      email.summary ? "text-slate-600" : "text-slate-400"
                    )}
                  >
                    {summaryLine}
                  </p>
                </Card>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-2 py-3 bg-white/20 rounded-inner mt-auto">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="bg-white/60 hover:bg-white"
            onClick={handlePrevPage}
            disabled={
              pageIndex === 0 || loadingEmails || loadingIntegration || integrationUnavailable
            }
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </Button>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Page {pageIndex + 1}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="bg-white/60 hover:bg-white"
            onClick={handleNextPage}
            disabled={
              !nextPageToken ||
              loadingEmails ||
              loadingIntegration ||
              integrationUnavailable
            }
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <Card className="glass-panel soft-diffused rounded-soft border-none flex-1 flex flex-col overflow-hidden">
          {loadingIntegration || loadingEmails ? (
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl bg-white/60" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-56 bg-white/60" />
                    <Skeleton className="h-3 w-40 bg-white/60" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg bg-white/60" />
                  <Skeleton className="h-9 w-9 rounded-lg bg-white/60" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-inner bg-white/60" />
              <Skeleton className="h-60 w-full rounded-soft bg-white/60" />
            </div>
          ) : integrationUnavailable ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-semibold">
              Connect Gmail to view email details.
            </div>
          ) : !selectedEmail ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-semibold">
              Select an email to view details.
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-white/20">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shadow-sm">
                      <span className="text-indigo-600 font-extrabold text-xl">
                        {senderInitial}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-charcoal font-friendly text-xl font-bold">
                        {selectedEmail.subject || "(No subject)"}
                      </h2>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-600">
                            From
                          </span>
                          <span>{senderName}</span>
                          {senderEmail ? <span>{senderEmail}</span> : null}
                        </div>
                        {selectedEmail.to ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-600">
                              To
                            </span>
                            <span>{selectedEmail.to}</span>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-600">
                            Date
                          </span>
                          <span>{formatDetailDate(selectedEmail.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="bg-white/60 hover:bg-white"
                    >
                      <span className="material-symbols-outlined text-slate-500 text-lg">
                        star
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="bg-white/60 hover:bg-white"
                    >
                      <span className="material-symbols-outlined text-slate-500 text-lg">
                        print
                      </span>
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-inner border",
                    summaryText
                      ? "bg-indigo-50/70 border-indigo-200/60 shadow-sm"
                      : "bg-slate-50/60 border-slate-200/50"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-lg",
                      summaryText ? "text-indigo-400" : "text-slate-400"
                    )}
                  >
                    auto_awesome
                  </span>
                  <p
                    className={cn(
                      "text-[11px] font-medium",
                      summaryText ? "text-slate-600" : "text-slate-500"
                    )}
                  >
                    <span
                      className={cn(
                        "font-bold uppercase text-[9px] mr-1",
                        summaryText ? "text-indigo-600" : "text-slate-500"
                      )}
                    >
                      AI Briefing:
                    </span>
                    {summaryText || "Summaries are unavailable for this message."}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="material-symbols-outlined text-sm">
                      mail
                    </span>
                    Message
                  </div>
                  <Separator className="my-3 bg-white/50" />
                  {bodyParagraphs.length ? (
                    bodyParagraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-sm text-slate-700 leading-relaxed font-medium"
                      >
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No email body content available.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white/30 border-t border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    className="px-6 py-2.5 bg-salmon text-white text-[11px] font-black rounded-inner shadow-lg shadow-salmon/20 hover:scale-[1.02] transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">
                      auto_fix
                    </span>
                    REPLY WITH AI
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="px-6 py-2.5 bg-white/80 text-charcoal text-[11px] font-black rounded-inner shadow-sm hover:bg-white"
                  >
                    <span className="material-symbols-outlined text-sm">
                      calendar_add_on
                    </span>
                    ADD TO SCHEDULE
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-2.5 bg-slate-100/60 text-slate-500 text-[11px] font-black rounded-inner hover:bg-white"
                >
                  ARCHIVE
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
