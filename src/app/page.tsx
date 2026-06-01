import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  LocateFixed,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const roleCards = [
  {
    title: "Người dân",
    description:
      "Tạo báo cáo ngập lụt, theo dõi báo cáo của mình, xem bản đồ Windy và chia sẻ vị trí trực tiếp khi cần hỗ trợ.",
    icon: ClipboardList,
  },
  {
    title: "Đội ứng cứu",
    description:
      "Theo dõi toàn bộ báo cáo, cập nhật trạng thái xử lý, xem vị trí trực tiếp và quản lý hàng chờ điều phối.",
    icon: RadioTower,
  },
  {
    title: "Quản trị viên",
    description:
      "Có toàn quyền vận hành người dùng, báo cáo, thiết lập, quy trình cứu trợ và giám sát hệ thống.",
    icon: ShieldCheck,
  },
];

const featureCards = [
  {
    title: "Quy trình báo cáo",
    description:
      "Tạo và chỉnh sửa báo cáo nhiều phần với vị trí, mức độ nghiêm trọng, danh mục, độ khẩn cấp và tệp minh chứng.",
    metric: "/reports",
    icon: ClipboardList,
  },
  {
    title: "Điều phối cứu trợ",
    description:
      "Hàng chờ trực tiếp cho sự cố đang chờ xử lý, đã xác minh, cập nhật trạng thái và sẵn sàng phân công.",
    metric: "/reports/:id/status",
    icon: Siren,
  },
  {
    title: "Theo dõi trực tiếp",
    description:
      "Chia sẻ vị trí qua kết nối thời gian thực để quan sát hiện trường, theo dõi thiết bị đang hoạt động và chuyển nhanh sang bản đồ.",
    metric: "send-location",
    icon: LocateFixed,
  },
  {
    title: "Quản lý người dùng",
    description:
      "Danh sách và quản lý tài khoản theo vai trò, đồng bộ với hệ thống máy chủ: người dân, đội ứng cứu, quản trị viên.",
    metric: "/auth/all",
    icon: Users,
  },
];

const reportRows = [
  {
    id: "#214",
    title: "Khu chợ trung tâm",
    severity: "urgent",
    status: "verified",
    statusLabel: "đã xác minh",
  },
  {
    id: "#213",
    title: "Cầu bị chặn",
    severity: "high",
    status: "pending",
    statusLabel: "đang chờ",
  },
  {
    id: "#212",
    title: "Điểm trú ẩn trường học",
    severity: "medium",
    status: "resolved",
    statusLabel: "đã xử lý",
  },
];

const workflowSteps = [
  [
    "1",
    "Người dân gửi báo cáo",
    "Vị trí, mức độ nghiêm trọng, danh mục và tệp minh chứng.",
  ],
  [
    "2",
    "Đội ứng cứu xác minh sự cố",
    "Đội vận hành lọc, ưu tiên và cập nhật trạng thái xử lý.",
  ],
  [
    "3",
    "Theo dõi trực tiếp hỗ trợ phản ứng",
    "Chia sẻ vị trí hiện trường giúp các đội phối hợp an toàn.",
  ],
  [
    "4",
    "Quản trị viên quản lý truy cập",
    "Người dùng và quyền hạn luôn đồng bộ với vai trò từ máy chủ.",
  ],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/" className="inline-flex items-center gap-2 font-bold">
            <span className="size-3 rounded-full bg-primary shadow-[0_0_0_5px_color-mix(in_oklch,var(--primary)_18%,transparent)]" />
            VietFlood
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng trang giới thiệu">
            <a href="#roles" className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
              Vai trò
            </a>
            <a href="#features" className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
              Tính năng
            </a>
            <a href="#workflow" className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
              Quy trình
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/dang-nhap">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/dang-ky">Tạo tài khoản</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-18">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-5 bg-background">
              Nền tảng web ứng phó ngập lụt
            </Badge>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Báo cáo ngập lụt theo thời gian thực cho cộng đồng và đội ứng cứu.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              VietFlood đưa các quy trình trên ứng dụng di động lên web: người
              dân gửi báo cáo, đội ứng cứu phân loại sự cố, quản trị viên quản
              lý người dùng và theo dõi trực tiếp giúp hiện trường luôn rõ ràng.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dang-nhap">
                  Đăng nhập
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/trang-chu">
                  Mở bản đồ Windy
                  <MapPinned data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["3", "vai trò"],
                ["4", "trạng thái báo cáo"],
                ["24/7", "kết nối trực tiếp"],
              ].map(([value, label]) => (
                <Card key={label} className="bg-card/80">
                  <CardContent className="p-4">
                    <p className="text-2xl font-black text-foreground">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-border bg-foreground p-3 text-background shadow-2xl">
              <div className="rounded-md border border-background/10 bg-foreground p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Điều phối trực tiếp
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-background">
                      Ứng phó ngập lụt Đà Nẵng
                    </h2>
                  </div>
                  <Badge variant="success">đang trực tuyến</Badge>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="relative min-h-80 overflow-hidden rounded-md border border-background/10 bg-muted">
                    <div className="absolute inset-0 [background-image:linear-gradient(120deg,rgba(14,165,233,0.22)_0_10%,transparent_10%_22%,rgba(20,184,166,0.18)_22%_30%,transparent_30%_100%),linear-gradient(35deg,transparent_0_35%,rgba(15,23,42,0.18)_35%_36%,transparent_36%_100%)] [background-size:180px_140px,220px_180px]" />
                    <div className="absolute left-[18%] top-[22%] size-3 rounded-full bg-critical shadow-[0_0_0_8px_color-mix(in_oklch,var(--critical)_20%,transparent)]" />
                    <div className="absolute right-[28%] top-[38%] size-3 rounded-full bg-warning shadow-[0_0_0_8px_color-mix(in_oklch,var(--warning)_22%,transparent)]" />
                    <div className="absolute bottom-[22%] left-[44%] size-3 rounded-full bg-success shadow-[0_0_0_8px_color-mix(in_oklch,var(--success)_22%,transparent)]" />
                    <div className="absolute bottom-3 left-3 rounded-md border border-border bg-card/95 p-3 text-card-foreground shadow-lg">
                      <p className="text-xs font-bold text-muted-foreground">Thiết bị hoạt động</p>
                      <p className="mt-1 text-2xl font-black text-foreground">18</p>
                    </div>
                    <div className="absolute right-3 top-3 rounded-md border border-border bg-card/95 p-3 text-card-foreground shadow-lg">
                      <p className="text-xs font-bold text-muted-foreground">Báo cáo mới</p>
                      <p className="mt-1 text-2xl font-black text-foreground">42</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {reportRows.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-md border border-background/10 bg-background/5 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-background">{report.id}</span>
                          <Badge
                            variant={
                              report.status === "resolved"
                                ? "success"
                                : report.severity === "urgent"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {report.statusLabel}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-background/70">{report.title}</p>
                        <div className="mt-3 h-1.5 rounded-full bg-background/10">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{
                              width:
                                report.status === "resolved"
                                  ? "100%"
                                  : report.status === "verified"
                                    ? "68%"
                                    : "34%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl px-4 py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary">Mô hình ba vai trò</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-foreground">
            Xây dựng theo vai trò từ máy chủ, không tạo thêm vai trò riêng cho giao diện trình duyệt.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Trang giới thiệu phản ánh đúng mô hình phân quyền đang dùng trong
            web app: người dân, đội ứng cứu và quản trị viên.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {roleCards.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.title}>
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon aria-hidden="true" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator />

      <section id="features" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr] lg:items-start">
          <div>
            <Badge variant="outline">Đồng bộ với ứng dụng di động</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-normal text-foreground">
              Điểm vào trên web truyền tải cùng một trải nghiệm sản phẩm như ứng dụng di động.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Báo cáo, điều phối cứu trợ, theo dõi, người dùng và thiết lập hồ
              sơ được trình bày như một quy trình ứng phó ngập lụt thống nhất.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon aria-hidden="true" />
                      </div>
                      <Badge variant="outline">{feature.metric}</Badge>
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-muted/35 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Badge variant="secondary">Quy trình ứng phó</Badge>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-foreground">
                Từ báo cáo của người dân đến hành động cứu trợ.
              </h2>
              <p className="mt-3 text-muted-foreground">
                VietFlood chuyển từng ghi nhận ngập lụt thành luồng vận hành có
                cấu trúc: ngữ cảnh bản đồ, minh chứng báo cáo, cập nhật trạng
                thái và hỗ trợ vị trí trực tiếp cho lực lượng đang phản ứng.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dang-ky">Bắt đầu với vai trò người dân</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dang-nhap">Mở bảng điều phối</Link>
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-5">
                {workflowSteps.map(([step, title, description], index) => (
                  <div key={step}>
                    <div className="flex gap-4 py-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                        {step}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>
                    {index < workflowSteps.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-card-foreground">VietFlood</p>
            <p className="mt-1">Báo cáo ngập lụt, điều phối cứu trợ và theo dõi trực tiếp.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/trang-chu" className="transition hover:text-foreground">
              Bản đồ
            </Link>
            <Link href="/bao-cao" className="transition hover:text-foreground">
              Báo cáo
            </Link>
            <Link href="/theo-doi" className="transition hover:text-foreground">
              Theo dõi
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
