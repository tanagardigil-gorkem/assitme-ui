import type {
  AvailableProvider,
  Integration,
  IntegrationCardState,
  IntegrationStatus,
} from "@/app/lib/types";
import { INTEGRATION_CATALOG } from "@/app/lib/integrations/catalog";

const availableSetFor = (available: AvailableProvider[]) =>
  new Set(available.map((provider) => provider.provider_type));

export function buildIntegrationCards(
  available: AvailableProvider[],
  mine: Integration[]
): IntegrationCardState[] {
  const availableSet = availableSetFor(available);
  const byProvider = new Map(mine.map((integration) => [integration.provider_type, integration]));

  return INTEGRATION_CATALOG.map((item) => {
    const integration = byProvider.get(item.provider_type) ?? null;
    const status: IntegrationStatus | "disconnected" = integration
      ? integration.status
      : "disconnected";

    const enabled = availableSet.has(item.provider_type) && !item.comingSoon;

    return {
      provider_type: item.provider_type,
      name: item.name,
      description: item.description,
      category: item.category,
      icon: item.icon,
      comingSoon: item.comingSoon,
      integrationId: integration ? integration.id : null,
      status,
      enabled,
    };
  });
}
