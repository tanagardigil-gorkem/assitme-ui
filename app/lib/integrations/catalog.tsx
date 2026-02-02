import { Calendar, FileText, Mail, MessageSquare } from "lucide-react";
import type { IntegrationCatalogItem } from "@/app/lib/types";

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    provider_type: "gmail",
    name: "Gmail",
    description: "Read, draft, and manage emails.",
    category: "mail",
    icon: <Mail className="h-5 w-5" />,
    comingSoon: false,
  },
  {
    provider_type: "microsoft",
    name: "Microsoft Outlook",
    description: "Sync work emails and calendar.",
    category: "mail",
    icon: <Mail className="h-5 w-5" />,
    comingSoon: true,
  },
  {
    provider_type: "notion",
    name: "Notion",
    description: "Connect your workspace and notes.",
    category: "productivity",
    icon: <FileText className="h-5 w-5" />,
    comingSoon: true,
  },
  {
    provider_type: "slack",
    name: "Slack",
    description: "Get alerts and send messages.",
    category: "productivity",
    icon: <MessageSquare className="h-5 w-5" />,
    comingSoon: true,
  },
  {
    provider_type: "google_calendar",
    name: "Google Calendar",
    description: "Sync events and reminders.",
    category: "calendar",
    icon: <Calendar className="h-5 w-5" />,
    comingSoon: true,
  },
];
