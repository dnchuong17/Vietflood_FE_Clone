import type { ReactNode } from "react";
import { ArrowUpRightIcon, MapPinIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./auth-experience.module.css";

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
            <CardTitle className={styles.formTitle}>{title}</CardTitle>
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
