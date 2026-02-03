"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "My Day", icon: "wb_sunny", color: "text-salmon", href: "/" },
  {
    title: "Integrations",
    icon: "hub",
    color: "text-indigo-400",
    href: "/integrations",
  },
  { title: "Projects", icon: "work", color: "text-indigo-400", href: "#" },
  { title: "Family", icon: "family_history", color: "text-teal-500", href: "#" },
  { title: "Email", icon: "mail", color: "text-pink-400", href: "/email" },
  { title: "Notes", icon: "sticky_note_2", color: "text-amber-400", href: "#" },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar
      collapsible="icon"
      className="w-20 lg:w-64 border-none bg-transparent"
    >
      <div className="h-full glass-panel soft-diffused rounded-soft flex flex-col justify-between p-5 transition-all duration-300">
        <div>
          <SidebarHeader className="p-0 mb-8">
            <div className="flex gap-3 items-center px-2">
              <div className="bg-gradient-to-tr from-salmon to-orange-300 rounded-2xl p-2.5 flex items-center justify-center shadow-lg shadow-salmon/20">
                <span className="material-symbols-outlined text-white text-xl">
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-col hidden lg:flex">
                <h1 className="text-charcoal text-base font-extrabold leading-none">
                  Assist Me
                </h1>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">
                  Personal Companion
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-0">
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href !== "#" &&
                  (pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href)));

                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`flex items-center gap-3 px-4 py-6 rounded-inner transition-all cursor-pointer group h-auto ${
                      isActive
                        ? "bg-white/60 shadow-sm text-charcoal font-bold"
                        : "hover:bg-white/30"
                    }`}
                  >
                    <Link href={item.href}>
                      <span
                        className={`material-symbols-outlined ${item.color} ${!isActive ? "group-hover:scale-110 transition-transform" : ""}`}
                      >
                        {item.icon}
                      </span>
                      <p className="text-xs font-medium hidden lg:block">
                        {item.title}
                      </p>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )})}
            </SidebarMenu>
          </SidebarContent>
        </div>

        <SidebarFooter className="p-0 flex flex-col gap-4">
          <SidebarMenu className="gap-4">
            <SidebarMenuItem>
              <SidebarMenuButton className="flex items-center gap-3 px-4 py-2.5 rounded-inner hover:bg-white/30 transition-all cursor-pointer h-auto">
                <span className="material-symbols-outlined text-slate-400">
                  settings
                </span>
                <p className="text-xs font-medium text-slate-500 hidden lg:block">
                  Settings
                </p>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <div className="flex items-center gap-3 p-2.5 bg-white/40 rounded-inner shadow-sm">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm flex-shrink-0">
                  <AvatarImage
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwHnkATN7__UFgp8g9-4LWFqrFP_lol5jJ9AZblovetDq-LtLBaOPx6k3GniM59TZeoUpb5pdglYVmo_-8wzdSwjHJd972zTWj1dzZZMi27q6WcEIszc5RfSQ6abBqkL_rKmQ5PkthgWHXY2illJlcDWXvyLuFKpL2OOkfBAnJtXVtfgbzV8GKp8M1udDfvEaQR64zToAMpyhW4ENR9Gls5k7vpRILKOS8-UWnVsRSi3F5i4D_LnCrym8ne-F3CMnIb5KhBBFzEr0"
                    alt="Alex Johnson"
                  />
                  <AvatarFallback className="bg-salmon text-white text-[10px] font-black">
                    AJ
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden hidden lg:flex">
                  <p className="text-xs font-bold text-charcoal truncate">
                    Alex Johnson
                  </p>
                  <p className="text-[9px] text-salmon font-bold uppercase">
                    Gold Member
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
