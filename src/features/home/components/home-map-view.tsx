"use client";

import Link from "next/link";
import { MapPinIcon, ArrowTopRightOnSquareIcon, DocumentPlusIcon, RadioIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { useAuthIdentity } from "@/features/auth/lib/use-auth-identity";
import { normalizeRole } from "@/features/auth/lib/roles";
import { WindyMap } from "../../map/components/windy-map";
import { HomeDisplayProvider, useHomeDisplayState } from "../state/home-display-state";
import { Tools } from "./tools";

function HomeMapContent() {
  const { state } = useHomeDisplayState();
  const identity = useAuthIdentity();
  const isCitizen = normalizeRole(identity?.role) === "citizen";

  return (
    <div className="map-workspace" data-testid="map-workspace">
      <aside className="flex flex-col gap-5 border-b border-border p-4 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-5" aria-label="Điều khiển bản đồ">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Bản đồ hiện trường</p>
          <h2 className="mt-2 text-xl font-bold">Nắm tình hình.<br className="hidden lg:block" /> Chủ động ứng phó.</h2>
          <p className="mt-2 hidden text-sm leading-6 text-muted-foreground lg:block">Chọn lớp thời tiết để quan sát khu vực trước khi di chuyển hoặc báo cáo sự cố.</p>
        </div>
        <Tools />
        <div className="hidden rounded-xl border bg-background p-3 lg:block">
          <p className="flex items-center gap-2 text-xs font-bold"><MapPinIcon className="size-4 text-primary" aria-hidden="true" /> Góc nhìn ban đầu: Đà Nẵng</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Dữ liệu thời tiết do Windy cung cấp, không phải bản đồ xác nhận vùng ngập. Kiểm tra thông báo chính thức và điều kiện thực tế.</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:mt-auto lg:flex-col">
          <Button asChild className="lg:w-full"><Link href={isCitizen ? "/bao-cao" : "/cuu-tro"}><DocumentPlusIcon aria-hidden="true" />{isCitizen ? "Báo cáo sự cố" : "Mở hàng chờ cứu trợ"}</Link></Button>
          <Button asChild variant="outline" className="lg:w-full"><Link href="/theo-doi"><RadioIcon aria-hidden="true" />Chia sẻ vị trí</Link></Button>
          <a href="https://www.windy.com/?16.047,108.206,6" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 text-xs font-semibold text-primary">Mở Windy trong tab mới<ArrowTopRightOnSquareIcon className="size-3.5" aria-hidden="true" /></a>
        </div>
      </aside>
      <div className="relative min-h-96 min-w-0 bg-[#071726]">
        <WindyMap mapOnlyMode={!state.isWeatherStatsVisible} overlay={state.overlay} />
      </div>
    </div>
  );
}

export function HomeMapView() {
  return <HomeDisplayProvider><HomeMapContent /></HomeDisplayProvider>;
}
