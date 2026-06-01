import type { UserRole } from "@/features/auth/lib/roles";

export type GuideSection = {
  title: string;
  description: string;
  points: string[];
};

export type RoleGuide = {
  role: UserRole;
  label: string;
  summary: string;
  responsibilities: string[];
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: "Bản đồ thời tiết và ngập lụt",
    description:
      "Dùng bản đồ Windy để theo dõi các lớp thời tiết trực tiếp và bối cảnh ngập lụt địa phương trước khi tạo hoặc xử lý báo cáo.",
    points: [
      "Chuyển giữa các lớp mưa, gió, nhiệt độ, độ ẩm, mây và áp suất.",
      "Dùng bảng chỉ số thời tiết để xem điều kiện hiện tại mà không rời khỏi bản đồ.",
      "Kiểm tra bản đồ trước khi báo cáo sự kiện ngập để ngữ cảnh vị trí rõ ràng hơn.",
      "Đội cứu trợ và quản trị viên có thể dùng cùng màn hình thời tiết trước khi điều phối hỗ trợ.",
    ],
  },
  {
    title: "Quản lý báo cáo",
    description:
      "Báo cáo là hồ sơ vận hành chính cho sự cố ngập lụt, nhu cầu của người dân và quá trình theo dõi cứu trợ.",
    points: [
      "Người dân tạo báo cáo với mô tả, loại báo cáo, vị trí và hình ảnh tuỳ chọn.",
      "Người dân có thể xem lại và cập nhật các báo cáo mình đã gửi.",
      "Đội cứu trợ có thể rà soát toàn bộ báo cáo và phân loại các trường hợp khẩn cấp.",
      "Quản trị viên có thể quản lý báo cáo toàn hệ thống và kiểm tra tiến độ vận hành.",
    ],
  },
  {
    title: "Chi tiết báo cáo",
    description:
      "Màn hình chi tiết báo cáo kết hợp dữ liệu sự cố, thông tin liên hệ, toạ độ, minh chứng và trạng thái hiện tại.",
    points: [
      "Kiểm tra thông tin người báo trước khi liên hệ hoặc điều phối cứu trợ.",
      "Dùng toạ độ và địa chỉ để xác minh vị trí sự cố.",
      "Rà soát hình ảnh hoặc thông tin bổ sung khi có.",
      "Theo dõi trạng thái từ chờ xử lý sang đã xác minh, đã xử lý hoặc từ chối.",
    ],
  },
  {
    title: "Điều hướng",
    description:
      "Ứng dụng web dùng điều hướng theo vai trò để mỗi người dùng chỉ thấy các khu vực vận hành mình có thể sử dụng.",
    points: [
      "Người dân bắt đầu từ bản đồ Windy và có thể chuyển sang báo cáo, theo dõi và hồ sơ.",
      "Đội cứu trợ bắt đầu từ dashboard cứu trợ để phân loại vận hành.",
      "Quản trị viên dùng cùng điều hướng cứu trợ và có thêm quản lý người dùng cùng quyền phân quyền.",
      "Dùng cài đặt hồ sơ để cập nhật tài khoản, mật khẩu và mở hướng dẫn này.",
    ],
  },
  {
    title: "Hồ sơ và cài đặt",
    description:
      "Hồ sơ giúp thông tin liên hệ luôn chính xác để báo cáo và phối hợp cứu trợ hoạt động ổn định.",
    points: [
      "Kiểm tra vai trò tài khoản và thông tin hồ sơ hiện tại.",
      "Cập nhật tên, số điện thoại, tỉnh/thành phố, phường/xã và địa chỉ khi thay đổi.",
      "Đổi mật khẩu khi máy chủ đã hỗ trợ chức năng này.",
      "Đăng xuất khi rời khỏi máy tính dùng chung hoặc máy công cộng.",
    ],
  },
  {
    title: "Khuyến nghị phản hồi",
    description:
      "Dùng dữ liệu chung một cách nhất quán để báo cáo, theo dõi và phân công cứu trợ luôn khớp nhau.",
    points: [
      "Tạo báo cáo càng sớm càng tốt với mô tả và dữ liệu vị trí chính xác.",
      "Chỉ chia sẻ vị trí trực tiếp khi bạn cần hỗ trợ hoặc phối hợp đang diễn ra.",
      "Đội cứu trợ nên cập nhật trạng thái báo cáo ngay khi có thay đổi về xác minh hoặc xử lý.",
      "Dùng dẫn đường từ theo dõi trực tiếp để di chuyển tới vị trí người dùng đang chia sẻ.",
    ],
  },
];

export const ROLE_GUIDES: RoleGuide[] = [
  {
    role: "citizen",
    label: "Người dân",
    summary: "Báo cáo tình trạng ngập lụt, xem báo cáo của mình và chia sẻ vị trí trực tiếp khi cần hỗ trợ.",
    responsibilities: [
      "Tạo và chỉnh sửa báo cáo ngập lụt cá nhân.",
      "Dùng các lớp thời tiết Windy để nắm điều kiện tại địa phương.",
      "Chia sẻ vị trí trực tiếp trong một yêu cầu hỗ trợ đang diễn ra.",
    ],
  },
  {
    role: "relief",
    label: "Đội cứu trợ",
    summary: "Điều phối phản hồi báo cáo, theo dõi vị trí chia sẻ và cập nhật trạng thái vận hành.",
    responsibilities: [
      "Rà soát toàn bộ báo cáo và cập nhật trạng thái báo cáo.",
      "Theo dõi vị trí trực tiếp và mở chỉ đường tới người dùng đang chia sẻ.",
      "Dùng màn hình người dùng và phân công để phối hợp phản hồi.",
    ],
  },
  {
    role: "admin",
    label: "Quản trị viên",
    summary: "Quản lý toàn bộ bề mặt vận hành web, bao gồm báo cáo, người dùng và phân quyền.",
    responsibilities: [
      "Sử dụng tất cả chức năng vận hành của đội cứu trợ.",
      "Chỉnh sửa hoặc xoá người dùng theo quyền từ máy chủ.",
      "Gán một trong các vai trò được hỗ trợ: người dân, đội cứu trợ hoặc quản trị viên.",
    ],
  },
];

export function getGuideSectionTitles(): string[] {
  return GUIDE_SECTIONS.map((section) => section.title);
}
