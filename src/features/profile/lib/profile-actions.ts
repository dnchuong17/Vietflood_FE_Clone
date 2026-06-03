import type { UserRole } from "@/features/auth/lib/roles";

export type ProfileHomeAction = {
  href: string;
  label: string;
  description: string;
};

const CITIZEN_ACTIONS: ProfileHomeAction[] = [
  {
    href: "/bao-cao",
    label: "Mở báo cáo",
    description: "Tạo báo cáo mới hoặc kiểm tra báo cáo của bạn.",
  },
  {
    href: "/theo-doi",
    label: "Chia sẻ vị trí",
    description: "Bật theo dõi trực tiếp khi cần đội cứu trợ hỗ trợ.",
  },
];

const OPERATIONAL_ACTIONS: ProfileHomeAction[] = [
  {
    href: "/bao-cao",
    label: "Quản lý báo cáo",
    description: "Rà soát, cập nhật trạng thái và mở chi tiết báo cáo.",
  },
  {
    href: "/cuu-tro",
    label: "Điều phối cứu trợ",
    description: "Theo dõi hàng đợi phản hồi và phân công vận hành.",
  },
  {
    href: "/theo-doi",
    label: "Theo dõi trực tiếp",
    description: "Giám sát vị trí đang chia sẻ và mở dẫn đường khi cần.",
  },
  {
    href: "/nguoi-dung",
    label: "Người dùng",
    description: "Xem hồ sơ, lịch sử báo cáo và phân quyền khi được phép.",
  },
];

export function getProfileHomeActions(role: UserRole): ProfileHomeAction[] {
  return role === "citizen" ? CITIZEN_ACTIONS : OPERATIONAL_ACTIONS;
}
