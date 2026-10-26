# Web → mobile feature parity and verification matrix

This inventory tracks user-visible behavior, not just screen names. Implementation status and test evidence are independent. A rendered screen does not prove a completed mutation or a working native integration.

## Evidence legend

- **Unit/contract**: automated code tests, with external systems mocked where applicable.
- **Browser fixture**: real browser and application code, explicit local test fixtures; not a live backend.
- **Live integration**: actual local services, database, queue, uploads, model/retrieval, or sockets.
- **Native runtime**: installed iOS/Android app on a simulator/device.
- **Pending/blocked**: not yet verified; never counted as a pass.

## Feature inventory

| Feature | Web consumer | Mobile consumer | Verification status |
|---|---|---|---|
| Registration and validation | `/dang-ky` | RegisterScreen | Pending |
| Sign-in and validation | `/dang-nhap` | LoginScreen | Pending |
| Role normalization and access restrictions | AppShell, roles, tabs | AuthContext, navigationGuard, AppNavigator | Pending |
| Session persistence and token refresh | auth-storage, api-client | AuthContext, services/api | Pending |
| Logout and refresh-race handling | header, auth storage | AuthContext | Pending |
| Map/weather view | `/trang-chu` | WindyScreen | Pending; external provider integration separate |
| Province/ward data and address search | location API/components | location/report services and report form | Pending |
| Location permission, GPS, reverse geocoding | report/chat/tracking workspaces | deviceLocation, reports/chat/tracking | Pending; native permission runtime separate |
| Overview summaries and metrics | `/tong-quan`, home summary | ProfileHomeScreen, relief summaries | Pending |
| Role-scoped report lists | `/bao-cao` | ReportsScreen, ReliefReportsScreen | Pending |
| Report search and filters | report-workspace | ReportsScreen, relief lists | Pending |
| Report creation and validation | report-workspace | ReportsScreen | Pending |
| Image upload and existing evidence | report form/detail | ReportsScreen, multipart service | Pending; live storage integration separate |
| Report detail and owner identity | `/bao-cao/[reportId]` | report detail screens | Pending |
| Report editing and permissions | report-workspace/detail | ReportsScreen, ReliefReportDetailScreen | Pending |
| Report deletion and confirmation | report workspaces, if supported | report services/screens | Pending; actual API support audited |
| Report lifecycle transitions | report detail/workspace | reports and relief screens | Pending |
| Relief priority queue | `/cuu-tro` | ReliefScreen | Pending |
| Assignment create/update/reassign/completion | `/phan-cong`, relief assignments | ReliefScreen and related assignment UI | Pending; persistence semantics audited |
| Live tracking sharing and monitoring | `/theo-doi` | LiveTrackingScreen, LiveTrackingContext | Pending; live sockets and native lifecycle separate |
| Tracking disconnect/reconnect/error states | tracking library/panel | trackingService, LiveTrackingContext | Pending |
| User lists/search and permissions | `/nguoi-dung` | UsersOverviewScreen | Pending |
| User edit/role management/admin delete | user-management | UsersOverviewScreen | Pending |
| Profile read/edit/validation | `/ho-so` | ProfileViewScreen, ProfileEditScreen | Pending |
| Password change capability and unavailable-state honesty | profile settings | ChangePasswordScreen | Pending; backend contract audited |
| Theme/settings and Vietnamese/English text | theme provider, profile settings | SettingsScreen, theme/i18n | Pending |
| User guide/help | `/huong-dan` | UserGuideScreen | Pending |
| Chat send and failed-draft recovery | `/chat` | ChatScreen | Pending |
| Chat session list/new/open/delete | chat workspace | ChatScreen, chatService | Pending |
| Chat history pagination and pending actions | chat workspace | ChatScreen, chatService | Pending |
| Chat location and evidence attachments | chat workspace | ChatScreen, multipart service | Pending |
| Chat action confirm/cancel safety | chat workspace | ChatScreen | Pending |
| Grounded response metadata and citations | EvidenceReply | EvidenceReply | Pending |
| Saved source versions and archive labels | `/tro-ly/nguon/[documentId]/[version]` | source snapshot UI | Pending |
| Loading/empty/error states and accessibility | shared feedback and all workspaces | shared controls and all screens | Pending |

## Scope boundaries

- Existing web functionality is the behavioral reference, including locally persisted state where that is the current web contract. Local-only data is not claimed to synchronize between devices.
- Native browser previews do not establish iOS/Android runtime, GPS permissions, camera/library integration, background behavior or live tracking correctness.
- Production data, active RAG collections, cloud uploads and deployed accounts are not modified during fixture-backed QA.
