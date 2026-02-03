import type {
  AvailableProvider,
  EmailFilter,
  EmailListResponse,
  Integration,
} from "@/app/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
  } catch (error) {
    return res.statusText || "Request failed";
  }

  return res.statusText || "Request failed";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: init?.cache ?? "no-store",
  });

  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export async function getAvailableIntegrations(): Promise<AvailableProvider[]> {
  return requestJson<AvailableProvider[]>("/api/v1/integrations/available");
}

export async function getMyIntegrations(): Promise<Integration[]> {
  const data = await requestJson<Integration[] | { items?: Integration[] }>(
    "/api/v1/integrations/"
  );
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function connectGmail(
  redirectUri: string
): Promise<{ authorization_url: string }> {
  return requestJson<{ authorization_url: string }>(
    "/api/v1/integrations/gmail/connect",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ redirect_uri: redirectUri }),
    }
  );
}

export async function disconnectIntegration(integrationId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/integrations/${integrationId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new ApiError(message, res.status);
  }
}

export async function updateIntegration(
  integrationId: string,
  update: {
    status?: "active" | "disconnected";
    config?: {
      query?: string;
      label_ids?: string[];
      max_results?: number;
    };
  }
): Promise<Integration> {
  return requestJson<Integration>(`/api/v1/integrations/${integrationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(update),
  });
}

export async function getIntegrationEmails(
  integrationId: string,
  params: {
    query?: string;
    filter?: EmailFilter;
    label_ids?: string[];
    max_results?: number;
    page_token?: string;
    summarize?: boolean;
  } = {}
): Promise<EmailListResponse> {
  const search = new URLSearchParams();

  if (params.query) {
    search.set("query", params.query);
  }
  if (params.filter) {
    search.set("filter", params.filter);
  }
  if (params.label_ids?.length) {
    params.label_ids.forEach((label) => {
      search.append("label_ids", label);
    });
  }
  if (typeof params.max_results === "number") {
    search.set("max_results", String(params.max_results));
  }
  if (params.page_token) {
    search.set("page_token", params.page_token);
  }
  if (typeof params.summarize === "boolean") {
    search.set("summarize", String(params.summarize));
  }

  const queryString = search.toString();
  const path = `/api/v1/integrations/${integrationId}/emails${
    queryString ? `?${queryString}` : ""
  }`;

  return requestJson<EmailListResponse>(path);
}
