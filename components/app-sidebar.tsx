"use client"

import * as React from "react"
import { Sun, Calendar, Star, Inbox, Search, Settings, HelpCircle, User } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarTrigger,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const items = [
    {
        title: "My Day",
        url: "#",
        icon: Sun,
    },
    {
        title: "Important",
        url: "#",
        icon: Star,
    },
    {
        title: "Planned",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Tasks",
        url: "#",
        icon: Inbox,
    },
]

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" className="border-r">
            <SidebarHeader className="p-4">
                <div className="flex items-center justify-between gap-2 px-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                            <span className="font-semibold text-sidebar-foreground">Assist Me</span>
                            <span className="text-xs text-sidebar-foreground/60">Personal Assistant</span>
                        </div>
                    </div>
                    <SidebarTrigger className="-mr-2 h-8 w-8" />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarSeparator />
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <Settings className="h-4 w-4" />
                                    <span>Settings</span>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Preferences</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <HelpCircle className="h-4 w-4" />
                            <span>Help & Support</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
