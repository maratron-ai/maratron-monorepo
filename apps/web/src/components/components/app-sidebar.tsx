"use client"

import * as React from "react"
import {
  Activity,
  BarChart3,
  Calendar,
  Footprints,
  HelpCircleIcon,
  Home,
  MessageSquare,
  SearchIcon,
  SettingsIcon,
  Target,
  Trophy,
  Users,
} from "lucide-react"
import { Icon } from "lucide-react"
import { sneaker } from "@lucide/lab"

import { NavDocuments } from "@components/components/nav-documents"
import { NavMain } from "@components/components/nav-main"
import { NavSecondary } from "@components/components/nav-secondary"
import { NavUser } from "@components/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/components/ui/sidebar"

const data = {
  user: {
    name: "Runner",
    email: "runner@maratron.com",
    avatar: "/default_profile.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Training Plans",
      url: "/plan-generator",
      icon: Calendar,
    },
    {
      title: "Run History",
      url: "/runs",
      icon: Activity,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Social Feed",
      url: "/social",
      icon: Users,
    },
  ],
  navClouds: [
    {
      title: "Gear",
      icon: () => <Icon iconNode={sneaker} size={16} className="h-4 w-4" />,
      isActive: false,
      url: "/shoes",
      items: [
        {
          title: "My Shoes",
          url: "/shoes",
        },
        {
          title: "Add New Shoes",
          url: "/shoes/new",
        },
      ],
    },
    {
      title: "Achievements",
      icon: Trophy,
      url: "/achievements",
      items: [
        {
          title: "All Achievements",
          url: "/achievements",
        },
        {
          title: "Goals",
          url: "/goals",
        },
      ],
    },
    {
      title: "AI Assistant",
      icon: MessageSquare,
      url: "/chat",
      items: [
        {
          title: "Chat",
          url: "/chat",
        },
        {
          title: "Training Tips",
          url: "/chat?topic=training",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Profile",
      url: "/profile",
      icon: Target,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: HelpCircleIcon,
    },
  ],
  documents: [
    {
      name: "Routes",
      url: "/routes",
      icon: Footprints,
    },
    {
      name: "Race Calendar",
      url: "/races",
      icon: Calendar,
    },
    {
      name: "Training Logs",
      url: "/logs",
      icon: Activity,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <Activity className="h-5 w-5" />
                <span className="text-base font-semibold">Maratron</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
