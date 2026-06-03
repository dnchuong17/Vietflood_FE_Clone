import {
  ClipboardDocumentListIcon as ClipboardList,
  Cog6ToothIcon as UserCog,
  LifebuoyIcon as LifeBuoy,
  ListBulletIcon as ListChecks,
  MapIcon as Map,
  PaperAirplaneIcon as Navigation,
  ShieldCheckIcon as ShieldCheck,
  UserGroupIcon as UsersRound,
  UserIcon as UserRound,
} from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUserRoleLabel } from "@/features/auth/lib/roles";
import { GUIDE_SECTIONS, ROLE_GUIDES } from "../lib/guide-content";

const SECTION_ICONS = [
  Map,
  ClipboardList,
  ListChecks,
  Navigation,
  UserCog,
  LifeBuoy,
] as const;

const ROLE_ICONS = {
  citizen: UserRound,
  relief: UsersRound,
  admin: ShieldCheck,
} as const;

export function UserGuide() {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge className="w-fit gap-1.5" variant="secondary">
              <LifeBuoy className="size-3.5" aria-hidden="true" />
              Hướng dẫn đồng bộ với ứng dụng di động
            </Badge>
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              Hướng dẫn sử dụng VietFlood
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Hướng dẫn web này phản ánh luồng trợ giúp trên ứng dụng di động và giữ mô hình
              vai trò trong phạm vi người dân, đội cứu trợ và quản trị viên.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <ListChecks className="size-4" aria-hidden="true" />
            {GUIDE_SECTIONS.length} khu vực hướng dẫn
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {ROLE_GUIDES.map((guide) => {
          const Icon = ROLE_ICONS[guide.role];

          return (
            <Card key={guide.role}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle>{guide.label}</CardTitle>
                    <CardDescription>{getUserRoleLabel(guide.role)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-slate-600">{guide.summary}</p>
                <ul className="flex flex-col gap-2 text-sm leading-6 text-slate-700">
                  {guide.responsibilities.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {GUIDE_SECTIONS.map((section, index) => {
          const Icon = SECTION_ICONS[index] ?? ListChecks;

          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="flex flex-col gap-2 text-sm leading-6 text-slate-700">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
