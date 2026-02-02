export type IntegrationStatus = "active" | "expired" | "error" | "disconnected";

export interface Integration {
  id: string;
  provider_type: string;
  status: IntegrationStatus;
  config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableProvider {
  provider_type: string;
  name: string;
  description: string;
}

export type IntegrationCategory =
  | "all"
  | "mail"
  | "productivity"
  | "family"
  | "calendar";

export interface IntegrationCatalogItem {
  provider_type: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: React.ReactNode;
  comingSoon: boolean;
}

export interface IntegrationCardState {
  provider_type: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  icon: React.ReactNode;
  comingSoon: boolean;
  integrationId: string | null;
  status: IntegrationStatus | "disconnected";
  enabled: boolean;
}
