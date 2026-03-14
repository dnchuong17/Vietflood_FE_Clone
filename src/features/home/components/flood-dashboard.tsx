import Link from "next/link";

const riskZones = [
    { province: "Quảng Bình", level: "Cao", rainfall: "245 mm/24h" },
    { province: "Quảng Trị", level: "Cao", rainfall: "232 mm/24h" },
    { province: "Thừa Thiên Huế", level: "Trung bình", rainfall: "178 mm/24h" },
    { province: "Đà Nẵng", level: "Trung bình", rainfall: "155 mm/24h" },
];

const responsePlans = [
    "Kích hoạt cảnh báo cấp xã theo ngưỡng mưa và mực nước thực đo.",
    "Ưu tiên sơ tán các điểm dân cư thấp trũng ven sông và vùng cửa biển.",
    "Bố trí vật tư cứu trợ theo cụm huyện có nguy cơ ngập sâu trên 0.8m.",
];

export function FloodDashboard() {
    return (
        <main className="mx-auto grid w-[min(1120px,92vw)] gap-5 py-9 pb-12">
            <section className="rounded-[1.3rem] border border-teal-100 bg-[radial-gradient(circle_at_90%_8%,rgba(3,105,161,0.18),transparent_44%),linear-gradient(150deg,#ffffff,#edf5ff_72%)] p-[clamp(1.2rem,2vw,2rem)]">
                <p className="m-0 text-sm font-bold uppercase tracking-[0.04em] text-sky-700">
                    Bảng điều hành tình hình lũ lụt
                </p>
                <h1 className="mb-2 mt-2 [font-family:var(--font-heading)] text-[clamp(1.5rem,2.9vw,2.35rem)] leading-[1.2]">
                    Phân tích nhanh nguy cơ lũ tại Việt Nam theo thời gian gần thực
                </h1>
                <p className="m-0 max-w-[72ch]">
                    Tổng hợp dữ liệu mưa, mực nước và cảnh báo tại các lưu vực trọng điểm để
                    hỗ trợ cơ quan vận hành quyết định kịp thời.
                </p>
                <div className="mt-4">
                    <Link
                        href="/dang-nhap"
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-4 py-2.5 font-bold text-white transition hover:-translate-y-px hover:brightness-105"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </section>

            <section className="grid grid-cols-3 gap-4 max-[880px]:grid-cols-1" aria-label="Chỉ số tổng quan">
                <article className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(4,20,47,0.08)]">
                    <h2 className="m-0 text-base">Điểm giám sát đang theo dõi</h2>
                    <strong className="text-[2rem] leading-none text-teal-700">126</strong>
                    <span className="text-[0.93rem] text-slate-600">Tăng 8 điểm so với tuần trước</span>
                </article>
                <article className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(4,20,47,0.08)]">
                    <h2 className="m-0 text-base">Tỉnh có cảnh báo cấp 2+</h2>
                    <strong className="text-[2rem] leading-none text-teal-700">11</strong>
                    <span className="text-[0.93rem] text-slate-600">Tập trung khu vực Bắc Trung Bộ</span>
                </article>
                <article className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(4,20,47,0.08)]">
                    <h2 className="m-0 text-base">Khuyến nghị hành động hôm nay</h2>
                    <strong className="text-[2rem] leading-none text-teal-700">03</strong>
                    <span className="text-[0.93rem] text-slate-600">Cập nhật lúc 08:30, ngày hiện tại</span>
                </article>
            </section>

            <section className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(4,20,47,0.08)]">
                    <h2 className="mb-3 [font-family:var(--font-heading)] text-2xl">Khu vực rủi ro cao</h2>
                    <ul className="m-0 grid list-none gap-3 p-0">
                        {riskZones.map((zone) => (
                            <li
                                key={zone.province}
                                className="flex items-center justify-between gap-3 rounded-xl bg-sky-50 p-3"
                            >
                                <div>
                                    <strong>{zone.province}</strong>
                                    <p className="mt-1 text-sm text-slate-600">Lượng mưa: {zone.rainfall}</p>
                                </div>
                                <span className="inline-flex min-w-[84px] items-center justify-center rounded-full bg-gradient-to-r from-sky-600 to-teal-600 px-2.5 py-1.5 text-xs font-bold text-white">
                                    {zone.level}
                                </span>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(4,20,47,0.08)]">
                    <h2 className="mb-3 [font-family:var(--font-heading)] text-2xl">Đề xuất vận hành</h2>
                    <ul className="m-0 grid list-none gap-3 p-0">
                        {responsePlans.map((plan) => (
                            <li key={plan} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-teal-600">
                                {plan}
                            </li>
                        ))}
                    </ul>
                </article>
            </section>
        </main>
    );
}
