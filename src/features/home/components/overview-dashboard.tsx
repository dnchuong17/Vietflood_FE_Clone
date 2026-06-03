"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { normalizeRole } from "@/features/auth/lib/roles";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { listReports, type FloodReport } from "@/features/reports/api/reports";
import { ReportsOverview } from "@/features/reports/components/reports-overview";
import { buildProfileHomeSummary } from "@/features/home/lib/profile-home-summary";
import { UsersOverview } from "./users-overview";

export function OverviewDashboard() {
  const identity = useAuthIdentity();
  const role = normalizeRole(identity?.role);
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSummaryReports() {
      if (!role) {
        setReports([]);
        return;
      }

      try {
        setIsLoadingSummary(true);
        const loadedReports = await listReports(role);
        if (isActive) {
          setReports(loadedReports);
        }
      } catch {
        if (isActive) {
          setReports([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadSummaryReports();

    return () => {
      isActive = false;
    };
  }, [role]);

  const summary = useMemo(
    () => buildProfileHomeSummary({ identity, reports }),
    [identity, reports],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <HomeIcon className="size-4 text-primary" aria-hidden="true" />
                <span>Trang chủ hồ sơ</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-card-foreground">
                {summary.greeting}
              </h2>
            </div>
            <Badge variant="secondary" className="w-fit">
              {isLoadingSummary ? "Đang đồng bộ báo cáo" : "Đã đồng bộ báo cáo"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ClipboardDocumentCheckIcon className="size-4 text-primary" aria-hidden="true" />
              <span>Công việc đang mở</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-card-foreground">
              {summary.openTasks}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Báo cáo đang chờ xử lý, đã xác minh hoặc đang thực hiện.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <BellAlertIcon className="size-4 text-primary" aria-hidden="true" />
              <span>Cảnh báo chưa đọc</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-card-foreground">
              {summary.unreadAlerts}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Báo cáo mới còn ở trạng thái chờ xử lý.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="gap-4">
        <TabsList aria-label="Tổng quan hệ thống">
          <TabsTrigger value="users">
            <UserGroupIcon data-icon="inline-start" aria-hidden="true" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="reports">
            <DocumentTextIcon data-icon="inline-start" aria-hidden="true" />
            Báo cáo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersOverview />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
