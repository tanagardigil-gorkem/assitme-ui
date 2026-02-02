export function statusLabel(status: string): string {
  if (status === "active") return "In Sync";
  if (status === "expired") return "Action Required";
  if (status === "error") return "Error";
  if (status === "disconnected") return "Disconnected";
  return "Unknown";
}

export function primaryActionLabel(
  status: string
): "Connect" | "Reconnect" | "Configure" {
  if (status === "active") return "Configure";
  if (status === "expired" || status === "error") return "Reconnect";
  return "Connect";
}
