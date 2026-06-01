"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ReportsOverview } from "@/features/reports/components/reports-overview";
import { UsersOverview } from "./users-overview";

export function OverviewDashboard() {
  return (
    <Tabs defaultValue="users" className="gap-4">
      <TabsList aria-label="Tổng quan hệ thống">
        <TabsTrigger value="users">Người dùng</TabsTrigger>
        <TabsTrigger value="reports">Báo cáo</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <UsersOverview />
      </TabsContent>
      <TabsContent value="reports">
        <ReportsOverview />
      </TabsContent>
    </Tabs>
  );
}
