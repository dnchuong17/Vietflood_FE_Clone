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
    title: "Citizen",
    description:
      "Create flood reports, track your own reports, view the Windy map, and share live location when requesting help.",
    icon: ClipboardList,
  },
  {
    title: "Relief",
    description:
      "Monitor all reports, update response status, review live tracking, and manage operational queues.",
    icon: RadioTower,
  },
  {
    title: "Admin",
    description:
      "Full operational access for users, reports, settings, relief workflows, and system oversight.",
    icon: ShieldCheck,
  },
];

const featureCards = [
  {
    title: "Report pipeline",
    description:
      "Multipart report creation and editing with location, severity, category, urgency, and evidence files.",
    metric: "/reports",
    icon: ClipboardList,
  },
  {
    title: "Relief operations",
    description:
      "A live queue for pending and verified incidents, status updates, and assignment-ready response work.",
    metric: "/reports/:id/status",
    icon: Siren,
  },
  {
    title: "Live tracking",
    description:
      "Socket-based location sharing for field visibility, active clients, and quick map handoff.",
    metric: "send-location",
    icon: LocateFixed,
  },
  {
    title: "User controls",
    description:
      "Role-aware user list and account management aligned to backend roles: citizen, relief, admin.",
    metric: "/auth/all",
    icon: Users,
  },
];

const reportRows = [
  ["#214", "Market district", "urgent", "verified"],
  ["#213", "Blocked bridge", "high", "pending"],
  ["#212", "School shelter", "medium", "resolved"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/" className="inline-flex items-center gap-2 font-bold">
            <span className="h-3 w-3 rounded-full bg-sky-600 shadow-[0_0_0_5px_rgba(2,132,199,0.12)]" />
            VietFlood Insight
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Landing navigation">
            <a href="#roles" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Roles
            </a>
            <a href="#features" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Features
            </a>
            <a href="#workflow" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Workflow
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/dang-nhap">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/dang-ky">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#0f172a_1px,transparent_1px),linear-gradient(90deg,#0f172a_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-18">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-5 bg-white">
              Flood response web platform
            </Badge>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Real-time flood reporting for communities and relief teams.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              VietFlood brings the mobile app workflows to web: citizens submit
              reports, relief teams triage incidents, admins manage users, and
              live tracking keeps field response visible.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dang-nhap">
                  Sign in
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/trang-chu">
                  Open Windy map
                  <MapPinned className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["3", "roles"],
                ["4", "report states"],
                ["24/7", "live socket"],
              ].map(([value, label]) => (
                <Card key={label} className="bg-slate-50/80">
                  <CardContent className="p-4">
                    <p className="text-2xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 shadow-2xl">
              <div className="rounded-md border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                      Live operations
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      Da Nang flood response
                    </h2>
                  </div>
                  <Badge variant="success">online</Badge>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="relative min-h-80 overflow-hidden rounded-md border border-slate-800 bg-slate-100">
                    <div className="absolute inset-0 [background-image:linear-gradient(120deg,rgba(14,165,233,0.22)_0_10%,transparent_10%_22%,rgba(20,184,166,0.18)_22%_30%,transparent_30%_100%),linear-gradient(35deg,transparent_0_35%,rgba(15,23,42,0.18)_35%_36%,transparent_36%_100%)] [background-size:180px_140px,220px_180px]" />
                    <div className="absolute left-[18%] top-[22%] h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_0_8px_rgba(244,63,94,0.18)]" />
                    <div className="absolute right-[28%] top-[38%] h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_0_8px_rgba(245,158,11,0.18)]" />
                    <div className="absolute bottom-[22%] left-[44%] h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_8px_rgba(16,185,129,0.18)]" />
                    <div className="absolute bottom-3 left-3 rounded-md border border-slate-200 bg-white/95 p-3 shadow-lg">
                      <p className="text-xs font-bold text-slate-500">Active clients</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">18</p>
                    </div>
                    <div className="absolute right-3 top-3 rounded-md border border-slate-200 bg-white/95 p-3 shadow-lg">
                      <p className="text-xs font-bold text-slate-500">Fresh reports</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">42</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reportRows.map(([id, title, severity, status]) => (
                      <div
                        key={id}
                        className="rounded-md border border-slate-800 bg-slate-950 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white">{id}</span>
                          <Badge
                            variant={status === "resolved" ? "success" : severity === "urgent" ? "warning" : "secondary"}
                          >
                            {status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{title}</p>
                        <div className="mt-3 h-1.5 rounded-full bg-slate-800">
                          <div
                            className="h-1.5 rounded-full bg-sky-400"
                            style={{
                              width:
                                status === "resolved"
                                  ? "100%"
                                  : status === "verified"
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
          <Badge variant="secondary">Three-role model</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950">
            Built around backend roles, not extra web-only roles.
          </h2>
          <p className="mt-3 text-slate-600">
            The landing page reflects the same access model used in the web app:
            citizen, relief, and admin.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {roleCards.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.title}>
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
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
            <Badge variant="outline">Mobile parity</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950">
              The web entry point tells the same product story as the mobile app.
            </h2>
            <p className="mt-3 text-slate-600">
              Reports, relief operations, tracking, users, and profile settings
              are presented as one coordinated flood-response workflow.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-800">
                        <Icon className="h-5 w-5" aria-hidden="true" />
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

      <section id="workflow" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Badge variant="secondary">Response workflow</Badge>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950">
                From citizen report to relief action.
              </h2>
              <p className="mt-3 text-slate-600">
                VietFlood turns individual flood observations into a structured
                operational feed: map context, report evidence, status updates,
                and live location support for active response.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dang-ky">Start as citizen</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dang-nhap">Open operations</Link>
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-5">
                {[
                  ["1", "Citizen submits report", "Location, severity, category, and evidence files."],
                  ["2", "Relief verifies incident", "Operational team filters, prioritizes, and updates status."],
                  ["3", "Live tracking supports response", "Field location sharing helps teams coordinate safely."],
                  ["4", "Admin manages access", "Users and permissions stay aligned with backend roles."],
                ].map(([step, title, description], index) => (
                  <div key={step}>
                    <div className="flex gap-4 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-600 text-sm font-black text-white">
                        {step}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-950">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {description}
                        </p>
                      </div>
                    </div>
                    {index < 3 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-white">VietFlood Insight</p>
            <p className="mt-1">Flood reporting, relief coordination, and live tracking.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/trang-chu" className="hover:text-white">
              Map
            </Link>
            <Link href="/bao-cao" className="hover:text-white">
              Reports
            </Link>
            <Link href="/theo-doi" className="hover:text-white">
              Tracking
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
