import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assist Me",
  description: "Your Personal Companion",
};

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden p-6 gap-6">
            <AppSidebar />
            <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar gap-6">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
