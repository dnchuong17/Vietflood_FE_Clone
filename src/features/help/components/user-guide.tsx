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
import { MotionReveal } from "@/components/motion/gsap-motion";
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
    <div className="workspace-stack">
      <MotionReveal><section className="workspace-section">
        <div className="workspace-header flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge className="w-fit gap-1.5" variant="secondary">
              <LifeBuoy className="size-3.5" aria-hidden="true" />
              Hướng dẫn đồng bộ với ứng dụng di động
            </Badge>
            <h2 className="workspace-title">
              Hướng dẫn sử dụng VietFlood
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Hướng dẫn web này phản ánh luồng trợ giúp trên ứng dụng di động và giữ mô hình
              vai trò trong phạm vi người dân, đội cứu trợ và quản trị viên.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground">
            <ListChecks className="size-4" aria-hidden="true" />
            {GUIDE_SECTIONS.length} khu vực hướng dẫn
          </div>
        </div>
      </section></MotionReveal>

      <MotionReveal><section className="grid gap-4 xl:grid-cols-3">
        {ROLE_GUIDES.map((guide) => {
          const Icon = ROLE_ICONS[guide.role];

          return (
            <Card key={guide.role}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle>{guide.label}</CardTitle>
                    <CardDescription>{getUserRoleLabel(guide.role)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-muted-foreground">{guide.summary}</p>
                <ul className="flex flex-col gap-3 text-sm leading-6 text-foreground">
                  {guide.responsibilities.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section></MotionReveal>

      <MotionReveal><section className="grid gap-4 xl:grid-cols-2">
        {GUIDE_SECTIONS.map((section, index) => {
          const Icon = SECTION_ICONS[index] ?? ListChecks;

          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
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
                <ul className="flex flex-col gap-3 text-sm leading-6 text-foreground">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section></MotionReveal>
    </div>
  );
}
