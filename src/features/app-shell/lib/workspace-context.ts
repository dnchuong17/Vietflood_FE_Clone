export type WorkspaceContext = { label: string; description: string };

const WORKSPACES: Record<string, WorkspaceContext> = {
  "/trang-chu": { label: "Quan sát hiện trường", description: "Xem thời tiết, ghi nhận sự cố và kết nối với đội ứng cứu." },
  "/bao-cao": { label: "Thông tin hiện trường", description: "Ghi nhận chính xác vị trí, theo dõi xác minh và trạng thái xử lý." },
  "/cuu-tro": { label: "Trung tâm điều phối", description: "Ưu tiên ca cần hỗ trợ, xác minh và phối hợp lực lượng tại hiện trường." },
  "/phan-cong": { label: "Điều phối lực lượng", description: "Theo dõi hàng chờ và các sự cố cần đội ứng cứu tiếp nhận." },
  "/theo-doi": { label: "Kết nối hiện trường", description: "Chia sẻ vị trí có kiểm soát để hỗ trợ phối hợp ứng cứu." },
  "/chat": { label: "Hỗ trợ ra quyết định", description: "Tra cứu hướng dẫn và kiểm tra nguồn thông tin trước khi hành động." },
  "/nguoi-dung": { label: "Quản lý truy cập", description: "Quản lý tài khoản và quyền hạn theo vai trò được cấp." },
  "/ho-so": { label: "Tài khoản của bạn", description: "Cập nhật thông tin, bảo mật và tùy chỉnh trải nghiệm VietFlood." },
  "/tong-quan": { label: "Tổng quan vận hành", description: "Theo dõi thông tin báo cáo và người dùng trong hệ thống." },
  "/huong-dan": { label: "Sẵn sàng ứng phó", description: "Tìm hướng dẫn phù hợp với vai trò và công việc của bạn." },
};

export function getWorkspaceContext(pathname: string): WorkspaceContext {
  const route = Object.keys(WORKSPACES).find((route) => pathname === route || pathname.startsWith(`${route}/`));
  return route ? WORKSPACES[route] : { label: "Không gian làm việc", description: "Báo cáo ngập lụt và phối hợp ứng cứu cùng VietFlood." };
}
