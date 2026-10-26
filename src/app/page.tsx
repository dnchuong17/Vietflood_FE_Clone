import Link from "next/link";
import {
  ArrowRightIcon, BellAlertIcon, ClipboardDocumentListIcon,
  MapPinIcon, ShieldCheckIcon, SignalIcon, UsersIcon,
} from "@heroicons/react/24/solid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LandingAuthActions } from "@/features/auth/components/landing-auth-actions";
import {
  LandingHeroMotion, LandingMotionItem, LandingProgressBar,
  LandingPulseMarker, LandingReveal, LandingStagger,
} from "@/components/motion/landing-motion";

const roles = [
  { title: "Người dân", icon: UsersIcon, number: "01", description: "Ghi nhận ngập lụt, gửi vị trí và minh chứng. Theo dõi phản hồi cho báo cáo của bạn." },
  { title: "Đội ứng cứu", icon: SignalIcon, number: "02", description: "Xác minh sự cố, ưu tiên hàng chờ và theo dõi vị trí để phối hợp tại hiện trường." },
  { title: "Quản trị viên", icon: ShieldCheckIcon, number: "03", description: "Quản lý người dùng, phân quyền và giám sát quy trình báo cáo, cứu trợ." },
];
const features = [
  { title: "Bản đồ làm điểm xuất phát", icon: MapPinIcon, href: "/trang-chu", description: "Quan sát các lớp mưa, gió và thời tiết trên Windy trước khi di chuyển." },
  { title: "Báo cáo có ngữ cảnh", icon: ClipboardDocumentListIcon, href: "/bao-cao", description: "Gắn vị trí, danh mục và minh chứng để đội ứng cứu nắm rõ tình hình." },
  { title: "Điều phối có ưu tiên", icon: BellAlertIcon, href: "/cuu-tro", description: "Phân loại hàng chờ, xác minh thông tin và cập nhật trạng thái xử lý." },
  { title: "Kết nối vị trí trực tiếp", icon: SignalIcon, href: "/theo-doi", description: "Chủ động bật hoặc dừng chia sẻ vị trí với lực lượng đang hỗ trợ." },
];
const steps = [
  ["Ghi nhận", "Gửi vị trí, mô tả và minh chứng khi bạn ở nơi an toàn."],
  ["Xác minh", "Đội ứng cứu kiểm tra thông tin và ưu tiên ca cần hỗ trợ."],
  ["Phối hợp", "Theo dõi vị trí và điều phối lực lượng đến hiện trường."],
  ["Cập nhật", "Trạng thái xử lý được phản hồi trong từng báo cáo."],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 font-bold" aria-label="Trang chủ VietFlood">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheckIcon className="size-6" aria-hidden="true" /></span>
            <span className="text-lg">VietFlood<span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Cùng cộng đồng ứng phó</span></span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Điều hướng trang giới thiệu">
            <a href="#features" className="hover:text-primary">Năng lực</a><a href="#roles" className="hover:text-primary">Cộng đồng</a><a href="#workflow" className="hover:text-primary">Cách hoạt động</a>
          </nav>
          <div className="flex min-w-0 items-center gap-2"><ThemeToggle /><LandingAuthActions placement="header" /></div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="relative isolate overflow-hidden border-b border-border">
          <div className="absolute inset-y-0 right-0 -z-10 w-2/3 bg-linear-to-l from-primary/8 to-transparent" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <LandingHeroMotion className="min-w-0 max-w-xl">
              <Badge variant="outline" className="mb-5 gap-2 border-primary/20 bg-card px-3 py-1.5 text-primary"><span className="size-1.5 rounded-full bg-success" />Nền tảng phối hợp ứng phó ngập lụt</Badge>
              <h1 className="text-[2.35rem] leading-[1.2] font-extrabold tracking-tight sm:text-5xl">Nắm tình hình.<br />Kết nối hỗ trợ.<br /><span className="text-primary">Cùng nhau an toàn.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">Từ một báo cáo của người dân đến hành động của đội ứng cứu. VietFlood kết nối thông tin hiện trường, bản đồ và điều phối trong cùng một không gian.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/trang-chu"><MapPinIcon aria-hidden="true" />Mở bản đồ hiện trường<ArrowRightIcon aria-hidden="true" /></Link></Button><LandingAuthActions placement="hero" /></div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Đăng nhập để gửi báo cáo và sử dụng các công cụ theo vai trò.</p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheckIcon className="size-4 text-primary" aria-hidden="true" />Phân quyền rõ ràng</span><span className="flex items-center gap-1.5"><MapPinIcon className="size-4 text-primary" aria-hidden="true" />Thông tin gắn vị trí</span><span className="flex items-center gap-1.5"><UsersIcon className="size-4 text-primary" aria-hidden="true" />Lấy cộng đồng làm trung tâm</span></div>
            </LandingHeroMotion>
            <LandingHeroMotion className="min-w-0" direction="left" delay={0.12}>
              <div className="overflow-hidden rounded-2xl border border-[#24465b] bg-[var(--operations-navy)] text-white shadow-[0_24px_70px_#09243b25]" data-testid="landing-operations-preview">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--operations-teal)]">Góc nhìn điều phối</p><h2 className="mt-1 text-base font-bold sm:text-lg">Thông tin rõ. Hành động đúng.</h2></div><span className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white/80">GIAO DIỆN MINH HỌA</span></div>
                <div className="operations-grid relative h-72 overflow-hidden sm:h-88" aria-label="Sơ đồ minh họa vị trí báo cáo, không phải dữ liệu trực tiếp" role="img">
                  <svg viewBox="0 0 600 360" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <path d="M-30 230L110 160 240 185 330 50 630 90" fill="none" stroke="#173e53" strokeWidth="100" />
                    <path d="M-30 230L110 160 240 185 330 50 630 90" fill="none" stroke="#25647a" strokeWidth="2" />
                    <path d="M340 -30C270 100 390 130 320 240S340 340 300 400" fill="none" stroke="#12546a" strokeWidth="55" />
                    <g fill="none" stroke="#598496" strokeWidth="2" opacity=".45"><path d="M0 85L600 280M-40 320L630 150M160 0L40 360M470 0L400 360M0 40L600 100M30 220L550 360" /></g>
                    <g fill="none" stroke="#57e0cf" strokeWidth="2" strokeDasharray="6 6"><path d="M170 110L240 185 400 240" /></g>
                    <g fill="#b0ceda" fontSize="11" fontFamily="sans-serif"><text x="45" y="310">KHU DÂN CƯ</text><text x="420" y="65">ĐIỂM HỖ TRỢ</text><text x="350" y="180" transform="rotate(70 350 180)">SÔNG</text></g>
                  </svg>
                  <LandingPulseMarker className="left-[28%] top-[29%] bg-[#ff876f] shadow-[0_0_0_8px_#ff876f22]" />
                  <LandingPulseMarker className="left-[65%] top-[64%] bg-[#57e0cf] shadow-[0_0_0_8px_#57e0cf22]" />
                  <div className="absolute left-4 top-4 rounded-lg border border-white/15 bg-[#09243b]/90 p-3 text-xs shadow-lg"><span className="text-white/60">Lớp thông tin</span><p className="mt-1 font-bold">Hiện trường & hỗ trợ</p></div>
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4 rounded-lg border border-white/15 bg-[#09243b]/95 px-3 py-2.5 text-[11px]"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#ff876f]" />Cần xác minh</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#57e0cf]" />Điểm hỗ trợ</span></div>
                </div>
                <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-5"><div><p className="text-xs font-semibold text-white/60">Luồng phối hợp</p><p className="mt-2 text-sm font-bold">Ghi nhận → Xác minh → Hỗ trợ</p><div className="mt-3 h-1 rounded-full bg-white/10"><LandingProgressBar width="68%" /></div></div><p className="text-[11px] leading-5 text-white/65">Sơ đồ mô tả cách phối hợp. Không hiển thị số liệu sự cố hoặc vị trí thực tế.</p></div>
              </div>
            </LandingHeroMotion>
          </div>
        </section>
        <section id="features" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:py-20">
          <LandingReveal><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Một không gian · Bốn kết nối</p><h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Từ quan sát hiện trường<br className="hidden sm:block" /> đến phối hợp ứng cứu.</h2></LandingReveal>
          <LandingStagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ title, icon: Icon, href, description }, index) => <LandingMotionItem key={href} className="h-full"><Card className="h-full"><CardContent className="flex h-full flex-col p-5"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6" aria-hidden="true" /></span><span className="text-xs font-bold tabular-nums text-muted-foreground">0{index + 1}</span></div><h3 className="mt-5 text-base font-bold">{title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p><Link href={href} className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-primary">Khám phá<ArrowRightIcon className="size-4" aria-hidden="true" /><span className="sr-only">: {title}</span></Link></CardContent></Card></LandingMotionItem>)}</LandingStagger>
        </section>
        <section id="roles" className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:gap-16 lg:py-20">
            <LandingReveal><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cùng một mục tiêu</p><h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Mỗi vai trò.<br />Một phần của ứng cứu.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Công cụ phù hợp với nhiệm vụ, quyền truy cập phù hợp với trách nhiệm. Người dân, đội ứng cứu và quản trị viên cùng phối hợp trên VietFlood.</p></LandingReveal>
            <LandingStagger className="space-y-3">{roles.map(({ title, icon: Icon, number, description }) => <LandingMotionItem key={title}><div className="flex gap-4 rounded-xl border border-border bg-background/60 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-6" aria-hidden="true" /></span><div className="min-w-0"><h3 className="font-bold"><span className="mr-2 text-xs text-primary">{number}</span>{title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p></div></div></LandingMotionItem>)}</LandingStagger>
          </div>
        </section>
        <section id="workflow" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:py-20">
          <LandingReveal><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Quy trình ứng phó</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Thông tin đi cùng hành động.</h2></LandingReveal>
          <LandingStagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([title, description], index) => <LandingMotionItem key={title}><div className="border-t-2 border-primary/25 pt-5"><span className="text-xs font-bold text-primary">BƯỚC 0{index + 1}</span><h3 className="mt-3 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div></LandingMotionItem>)}</LandingStagger>
          <LandingReveal className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-[var(--operations-navy)] p-6 text-white sm:p-8"><div><h2 className="text-2xl font-bold">Sẵn sàng khi cộng đồng cần.</h2><p className="mt-2 text-sm leading-6 text-white/70">Bắt đầu bằng một thông tin chính xác, từ một vị trí an toàn.</p></div><div className="flex flex-wrap gap-3"><LandingAuthActions placement="workflow" /></div></LandingReveal>
        </section>
      </main>
      <footer className="border-t border-border bg-card"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-4 py-7 text-xs text-muted-foreground sm:px-6"><div><p className="text-sm font-bold text-foreground">VietFlood</p><p className="mt-1.5">Kết nối thông tin. Phối hợp ứng cứu. Vì cộng đồng.</p></div><nav className="flex flex-wrap gap-5" aria-label="Liên kết cuối trang"><Link href="/trang-chu" className="hover:text-primary">Bản đồ</Link><Link href="/bao-cao" className="hover:text-primary">Báo cáo</Link><Link href="/huong-dan" className="hover:text-primary">Hướng dẫn</Link></nav></div></footer>
    </div>
  );
}
