import type { ReactNode } from "react";
import { ArrowUpRightIcon, MapPinIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
const styles = {
  "frame": "w-full max-w-5xl rounded-2xl border border-border bg-card text-card-foreground",
  "frameInner": "grid min-w-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]",
  "story": "order-2 flex min-w-0 flex-col gap-8 border-t border-border bg-muted p-6 lg:order-1 lg:border-r lg:border-t-0 lg:p-8",
  "storyTop": "flex flex-wrap items-center justify-between gap-3",
  "storyIndex": "text-xs font-semibold text-muted-foreground",
  "storyTag": "text-xs text-muted-foreground",
  "storyBody": "space-y-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_em]:not-italic [&_em]:text-primary [&_p]:text-sm [&_p]:leading-6 [&_p]:text-muted-foreground",
  "eyebrow": "text-xs font-semibold text-primary",
  "contour": "hidden",
  "contourCore": "hidden",
  "contourRingOne": "hidden",
  "contourRingTwo": "hidden",
  "contourRingThree": "hidden",
  "contourRingFour": "hidden",
  "contourRingFive": "hidden",
  "storyBottom": "mt-auto space-y-4 [&>p]:flex [&>p]:items-start [&>p]:gap-2 [&>p]:text-xs [&>p]:leading-5 [&>p]:text-muted-foreground [&>p>svg]:size-4 [&>p>svg]:shrink-0",
  "signalCard": "flex items-center gap-3 border-t border-border pt-4 [&_strong]:block [&_strong]:text-sm [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground",
  "signalIcon": "text-primary [&>svg]:size-5",
  "signalArrow": "ml-auto size-4 shrink-0 text-muted-foreground",
  "formCard": "order-1 min-w-0 gap-6 rounded-none border-0 bg-card p-6 shadow-none lg:order-2 lg:p-8",
  "formHeader": "workspace-header flex-col items-start space-y-2 p-0",
  "formEyebrow": "text-xs font-semibold text-primary",
  "formTitle": "workspace-title",
  "formDescription": "workspace-description",
  "formContent": "min-w-0 p-0",
  "note": "mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground"
};

type AuthFormCardProps = {
  title: string;
  description: string;
  mode: "login" | "register";
  note?: string;
  children: ReactNode;
};

export function AuthFormCard({ title, description, mode, note, children }: AuthFormCardProps) {
  const isRegister = mode === "register";

  return (
    <div className={styles.frame} data-auth-motion="frame">
      <div className={styles.frameInner}>
        <aside className={styles.story} aria-label="Giới thiệu VietFlood">
          <div className={styles.storyTop}>
            <span className={styles.storyIndex}>VIETFLOOD / {isRegister ? "02" : "01"}</span>
            <span className={styles.storyTag}><span aria-hidden="true" /> Nền tảng cộng đồng</span>
          </div>

          <div className={styles.storyBody} data-auth-motion="story">
            <span className={styles.eyebrow}>CHỦ ĐỘNG TRƯỚC MÙA NƯỚC</span>
            <h2>{isRegister ? <>Một tài khoản.<br /><em>Thêm sự an tâm.</em></> : <>Hiểu tình hình.<br /><em>Hành động kịp thời.</em></>}</h2>
            <p>{isRegister
              ? "Tham gia cộng đồng để gửi báo cáo, theo dõi diễn biến và chia sẻ vị trí khi cần hỗ trợ."
              : "Từ bản đồ ngập đến báo cáo của bạn, mọi thông tin cần thiết nằm trong một không gian rõ ràng."}</p>
          </div>

          <div className={styles.contour} aria-hidden="true">
            <span className={styles.contourCore} />
            <span className={styles.contourRingOne} />
            <span className={styles.contourRingTwo} />
            <span className={styles.contourRingThree} />
            <span className={styles.contourRingFour} />
            <span className={styles.contourRingFive} />
          </div>

          <div className={styles.storyBottom}>
            <div className={styles.signalCard}>
              <span className={styles.signalIcon}><MapPinIcon aria-hidden="true" /></span>
              <span><strong>Bản đồ & báo cáo</strong><small>Nắm bắt tình hình quanh bạn</small></span>
              <ArrowUpRightIcon className={styles.signalArrow} aria-hidden="true" />
            </div>
            <p><ShieldCheckIcon aria-hidden="true" /> Dữ liệu của bạn được dùng để hỗ trợ cộng đồng.</p>
          </div>
        </aside>

        <Card className={styles.formCard}>
          <CardHeader className={styles.formHeader}>
            <span className={styles.formEyebrow}>{isRegister ? "BẮT ĐẦU VỚI VIETFLOOD" : "CHÀO MỪNG TRỞ LẠI"}</span>
            <h1 className={styles.formTitle}>{title}</h1>
            <CardDescription className={styles.formDescription}>{description}</CardDescription>
          </CardHeader>
          <CardContent className={styles.formContent}>
            {children}
            {note ? <p className={styles.note}>{note}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
