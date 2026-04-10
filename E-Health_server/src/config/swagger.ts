import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Health Server API',
      description: 'Hệ thống quản lý phòng khám',
      version: '1.0.0',
      contact: {
        name: 'PTH Group Inc',
        email: 'contact@pthgroup.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
      },
      schemas: {
        // Auth Models
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
            clientInfo: {
              type: 'object',
              description: 'Thông tin thiết bị - Tùy chọn. Nếu không gửi vẫn có thể login bình thường',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'ID thiết bị (UUID hoặc unique identifier)',
                  example: '550e8400-e29b-41d4-a716-446655440000',
                },
                deviceName: {
                  type: 'string',
                  description: 'Tên thiết bị (iPhone 13, Samsung Galaxy, etc)',
                  example: 'iPhone 13 Pro',
                },
                userAgent: {
                  type: 'string',
                  description: 'User agent từ browser',
                  example: 'Mozilla/5.0...',
                },
              },
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                },
                refreshToken: {
                  type: 'string',
                },
                expiresIn: {
                  type: 'number',
                },
                user: {
                  type: 'object',
                  properties: {
                    userId: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    avatar: {
                      type: 'string',
                      nullable: true,
                    },
                    email: {
                      type: 'string',
                      nullable: true,
                    },
                    phone: {
                      type: 'string',
                      nullable: true,
                    },
                    roles: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 8,
            },
            name: {
              type: 'string',
            },
          },
        },
        SessionInfo: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
            },
            device: {
              type: 'string',
            },
            ip: {
              type: 'string',
            },
            lastActiveAt: {
              type: 'string',
              format: 'date-time',
            },
            current: {
              type: 'boolean',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
            code: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      // ===== MODULE 1: HỆ THỐNG LÕI =====
      { name: '1.1.1 Quản lý User', description: 'Các chức năng CRUD cơ bản' },
      { name: '1.1.2 Khóa / mở khóa tài khoản', description: 'Action locking' },
      { name: '1.1.3 Quản lý trạng thái tài khoản', description: 'Vòng đời tài khoản' },
      { name: '1.1.4 Reset mật khẩu người dùng', description: 'Bảo mật mật khẩu' },
      { name: '1.1.5 Gán vai trò cho người dùng', description: 'Map N-N Role cho User' },
      { name: '1.1.6 Gán người dùng vào cơ sở y tế', description: 'Map N-N Facility cho User' },
      { name: '1.1.7 Import người dùng hàng loạt', description: 'Upload file Excel/CSV' },
      { name: '1.1.8 Export danh sách người dùng', description: 'Tải xuống xuất Excel' },
      { name: '1.1.9 API phục vụ filter / dropdown', description: 'List nhanh Facility/Roles' },
      { name: '1.2.1 Xác thực & Đăng nhập hệ thống', description: 'Login, Register, OTP' },
      { name: '1.2.2 Quản lý Phiên đăng nhập', description: 'Tracking thiết bị, Kick User' },
      { name: '1.3.1 Quản lý danh mục vai trò', description: 'Cấu hình System Roles' },
      { name: '1.3.2 Quản lý danh sách quyền', description: 'Cấu hình Core Permission Codes' },
      { name: '1.3.3 Gán quyền cho vai trò', description: 'Kế thừa Permission cho Role' },
      { name: '1.3.4 Phân quyền theo module', description: 'Tra cứu Modules' },
      { name: '1.3.5 Kiểm soát hiển thị menu theo vai trò', description: 'Định nghĩa UI Menus & Gán Role' },
      { name: '1.3.6 Kiểm soát API theo vai trò', description: 'Định nghĩa Endpoints & Gán Role' },
      { name: '1.3.7 Kiểm tra quyền của user', description: 'Lấy dữ liệu Context qua JWT cho Client' },
      { name: '1.4.1 Cấu hình thông tin cơ sở y tế', description: 'Xem và cập nhật thông tin cơ sở y tế, upload logo' },
      { name: '1.4.2 Cấu hình thời gian làm việc', description: 'Giờ mở/đóng cửa 7 ngày và cấu hình slot khám' },
      { name: '1.4.3 Cấu hình quy định nghiệp vụ', description: 'Tham số nghiệp vụ: hủy lịch, đặt lịch, bảo mật...' },
      { name: '1.4.4 Cấu hình bảo mật', description: 'Tham số bảo mật: password, token, session, 2FA' },
      { name: '1.4.5 Cấu hình đa ngôn ngữ', description: 'Ngôn ngữ mặc định, danh sách ngôn ngữ hỗ trợ' },
      { name: '1.4.6 Cấu hình giao diện', description: 'Theme, màu sắc, font, date/time format, timezone' },
      { name: '1.4.7 Quản lý tham số hệ thống', description: 'CRUD system_settings theo module, có protected key' },
      { name: '1.4.8 Phân quyền chỉnh sửa cấu hình', description: 'Kiểm soát vai trò nào được phép chỉnh sửa các module tham số hệ thống' },
      { name: '1.5.1 Quản lý danh mục chuyên khoa', description: 'CRUD chuyên khoa, hỗ trợ phân trang và tìm kiếm' },
      { name: '1.5.2 Quản lý danh mục', description: 'CRUD bệnh viện, hỗ trợ phân trang và tìm kiếm' },
      { name: '1.5.3 Quản lý danh mục thuốc', description: 'Quản lý Nhóm thuốc (Drug Categories) và Từ điển thuốc (Drugs)' },
      { name: '1.6 Quản lý hồ sơ người dùng (User Profile)', description: 'Xem và cập nhật thông tin cá nhân của người dùng đang đăng nhập' },
      { name: '1.7.1 Quản lý Loại Thông báo (Notification Categories)', description: 'Thiết lập các cấu hình nhóm thông báo cốt lõi của hệ thống' },
      { name: '1.7.2 Quản lý Mẫu Thông báo (Notification Templates)', description: 'Thiết lập và tùy chỉnh các mẫu thông báo đa kênh' },
      { name: '1.7.3 Cấu hình Thông báo theo Vai trò', description: 'Thiết lập cấu trúc Role nào nhận thông báo qua kênh nào' },
      { name: '1.7.4 Broadcast & Lõi Thông báo (Engine)', description: 'Trigger sự kiện và bắn thông báo thủ công hàng loạt' },
      { name: '1.7.5 Hộp thư Thông báo cá nhân (User Inbox)', description: 'Xem danh sách và đánh dấu đọc In-app Notifications' },
      { name: '1.8 Quản lý Nhật ký hệ thống (Audit Logs)', description: 'Tracking API Mọi thao tác POST/PUT/DELETE' },

      // ===== MODULE 2: QUẢN LÝ CƠ SỞ Y TẾ =====
      { name: '2.1 Quản lý Cơ sở Y tế', description: 'API Tạo và Cập nhật Cơ sở Y tế đa chi nhánh, upload logo' },
      { name: '2.2 Quản lý Chi nhánh', description: 'API Tạo và cấu hình Chi nhánh trực thuộc, phân tuyến cơ sở' },
      { name: '2.3 Quản lý Khoa/Phòng ban', description: 'API Quản lý chuyên khoa trực thuộc chi nhánh' },
      { name: '2.4 Quản lý Không gian/Phòng khám', description: 'API Quản lý không gian chức năng, buồng khám' },
      { name: '2.5 Quản lý Nhân sự y tế', description: 'API Quản lý Nhân sự y tế' },
      { name: '2.6.1 Quản lý Lịch làm việc & Ca trực', description: 'API Quản lý Ca làm việc' },
      { name: '2.6.2 Quản lý Lịch làm việc & Slot Khám', description: 'API Quản lý Slot Khám' },
      { name: '2.6.3 Quản lý Lịch Nhân viên', description: 'API Phân công xếp lịch khám bệnh' },
      { name: '2.6.4 Tạm ngưng lịch làm việc', description: 'API Tạm ngưng và mở lại lịch trực' },
      { name: '2.6.5 Quản lý Nghỉ phép', description: 'API Tạo, duyệt, từ chối đơn nghỉ phép' },
      { name: '2.6.6 Đổi ca làm việc', description: 'API Tạo yêu cầu đổi ca và duyệt/từ chối' },
      { name: '2.7 Giấy phép & Chứng chỉ', description: 'API Quản lý giấy phép, chứng chỉ hành nghề nhân viên y tế' },
      { name: '2.8 Giờ hoạt động cơ sở', description: 'API Quản lý giờ hoạt động cơ sở' },
      { name: '2.9.1 Gán dịch vụ - Chuyên khoa', description: 'Quản lý liên kết N-N giữa Dịch vụ y tế chuẩn và Chuyên khoa' },
      { name: '2.9.2 Gán dịch vụ - Bác sĩ', description: 'Quản lý liên kết N-N giữa Bác sĩ và Dịch vụ cơ sở' },
      { name: '2.9.3 Quản lý danh mục dịch vụ chuẩn', description: 'Các API liên quan đến quản lý danh mục gốc các dịch vụ y tế' },
      { name: '2.9.4 Quản lý dịch vụ cơ sở', description: 'Cấu hình giá và quy định đối với dịch vụ chuẩn áp dụng riêng tại từng cơ sở' },
      { name: '2.10 Quản lý Trang thiết bị Y tế', description: 'API Quản lý thiết bị y tế, gán phòng, bảo trì' },
      { name: '2.11 Quản lý Giường bệnh', description: 'API Quản lý giường bệnh, gán phòng, đổi trạng thái' },
      { name: '2.12 Cấu hình Quy tắc đặt khám', description: 'API Cấu hình quy tắc đặt lịch khám theo cơ sở/chi nhánh' },

      // ===== MODULE 3: QUẢN LÝ BỆNH NHÂN =====
      { name: '2.1 Quản lý Hồ sơ Bệnh nhân', description: 'API CRUD hồ sơ bệnh nhân, liên kết tài khoản App, đổi trạng thái' },
      { name: '2.2 Lịch sử Khám & Điều trị', description: 'API Xem danh sách lượt khám, chi tiết, dòng thời gian, tổng hợp (Read-Only)' },
      { name: '2.3.1 Quản lý Đơn vị Bảo hiểm', description: 'API CRUD đơn vị bảo hiểm (insurance_providers)' },
      { name: '2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân', description: 'API CRUD thẻ bảo hiểm bệnh nhân (patient_insurances)' },
      { name: '2.3.3 Hiệu lực Bảo hiểm', description: 'API Kiểm tra thẻ BH còn hiệu lực / đã hết hạn' },
      { name: '2.3.4 Tỷ lệ Chi trả Bảo hiểm', description: 'API CRUD cấu hình tỷ lệ chi trả bảo hiểm (insurance_coverages)' },
      { name: '2.3.5 Liên kết Bảo hiểm - Bệnh nhân', description: 'API Nested routes: xem & thêm thẻ BH cho bệnh nhân cụ thể' },
      { name: '2.3.6 Lịch sử thay đổi Bảo hiểm', description: 'API Tra cứu audit_logs thay đổi thẻ bảo hiểm' },
      { name: '2.3.7 Trạng thái Bảo hiểm Bệnh nhân', description: 'API Cập nhật cờ has_insurance, lọc BN có/không BH cho Billing' },
      { name: '2.4.1 Quản lý Người thân Bệnh nhân', description: 'API CRUD người thân/người giám hộ của bệnh nhân (patient_contacts)' },
      { name: '2.4.2 Quản lý Loại quan hệ', description: 'API CRUD danh mục loại quan hệ (relation_types): Cha, Mẹ, Vợ/Chồng, Con...' },
      { name: '2.4.3 Quản lý liên hệ khẩn cấp', description: 'API Đặt/hủy liên hệ khẩn cấp, danh sách liên hệ khẩn cấp của bệnh nhân' },
      { name: '2.4.4 Chỉ định người đại diện pháp lý', description: 'API Chỉ định/hủy người đại diện pháp lý (duy nhất), xem đại diện hiện tại' },
      { name: '2.4.5 Ghi chú quyền quyết định y tế', description: 'API Cập nhật và xem ghi chú quyền quyết định y tế của người thân' },
      { name: '2.4.6 Phân biệt người thân - liên hệ khẩn cấp', description: 'API Filter: tất cả liên hệ, người thân thông thường, người giám hộ' },
      { name: '2.5.1 Upload tài liệu bệnh nhân', description: 'API Upload, danh sách, chi tiết, cập nhật metadata và xóa tài liệu bệnh nhân (Cloudinary)' },
      { name: '2.5.2 Phân loại tài liệu', description: 'API CRUD danh mục loại tài liệu (document_types): CMND, BHYT, X-Quang...' },
      { name: '2.5.3 Gắn tài liệu vào hồ sơ bệnh nhân', description: 'API tường minh lồng trong /api/patients/:patientId/documents' },
      { name: '2.5.4 Phiên bản tài liệu', description: 'API quản lý lịch sử phiên bản file tài liệu y tế' },
      { name: '2.5.5 Xem & Tải tài liệu', description: 'API Proxy bảo mật để xem inline và ép tải file từ Cloudinary' },
      { name: '2.6.1 Danh mục thẻ bệnh nhân', description: 'API CRUD danh mục thẻ phân loại bệnh nhân (Tags): VIP, Mãn tính, Nguy cơ cao...' },
      { name: '2.6.2 Gắn thẻ bệnh nhân', description: 'API Gắn/Gỡ thẻ trên hồ sơ bệnh nhân (n-n mapping)' },
      { name: '2.6.4 Lọc bệnh nhân theo thẻ', description: 'API lọc danh sách bệnh nhân theo tag (AND/OR logic)' },
      { name: '2.6.5 Luật phân loại tự động', description: 'API CRUD cấu hình Rule gắn thẻ tự động (VD: khám > 10 lần → VIP)' },
      { name: '2.7 Tìm kiếm & Tra cứu', description: 'API Tìm kiếm nâng cao, autocomplete nhanh, tra cứu tóm tắt hồ sơ bệnh nhân' },
      { name: '2.9 Theo dõi & Audit Hồ sơ Bệnh nhân', description: 'API Tra cứu lịch sử thay đổi hồ sơ bệnh nhân (audit trail)' },

      // ===== MODULE 3: LỊCH KHÁM =====
      { name: '3.1 Quản lý Lịch khám', description: 'API Quản lý Lịch khám' },
      { name: '3.2 Quản lý khung giờ & ca khám', description: 'API Quản lý khung giờ & ca khám' },
      { name: '3.3 Quản lý lịch bác sĩ', description: 'API Quản lý Lịch bác sĩ' },
      { name: '3.4 Quản lý phòng khám & tài nguyên', description: 'API Quản lý Lịch khám' },
      { name: '3.6 Xác nhận & Nhắc lịch', description: 'API Xác nhận, nhắc lịch, check-in, hoàn tất lịch khám' },
      { name: '3.7 Check-in & Trạng thái', description: 'API Check-in, hoàn tất, hủy, đánh dấu no-show lịch khám' },
      { name: '3.8 Quản lý thay đổi & dời lịch', description: 'API Dời lịch, hủy lịch, lịch sử thay đổi, chính sách hủy' },
      { name: '3.9 Điều phối & tối ưu lịch khám', description: 'API Phân bổ tải, gợi ý slot, cân bằng, ưu tiên, reassign, auto-assign, AI dataset' },

      // ===== MODULE 4: KHÁM BỆNH & HỒ SƠ BỆNH ÁN (EMR) =====
      { name: '4.1 Encounter Management', description: 'API Tiếp nhận & Mở hồ sơ khám bệnh (Encounter), gán BS/phòng, chuyển trạng thái, walk-in/cấp cứu' },
      { name: '4.2 Clinical Examination', description: 'API Ghi nhận khám lâm sàng, sinh hiệu, tiền sử, chẩn đoán, kế hoạch điều trị' },
      { name: '4.3 Diagnosis Management', description: 'API Quản lý chẩn đoán, tìm kiếm mã ICD-10, lịch sử chẩn đoán theo bệnh nhân' },
      { name: '4.4 Medical Orders', description: 'API Quản lý chỉ định, tìm kiếm dịch vụ CLS, lịch sử chỉ định theo bệnh nhân, dashboard chỉ định chờ thực hiện, tóm tắt chỉ định + kết quả' },
      { name: '4.5 Prescription Management', description: 'API Kê đơn thuốc, quản lý dòng thuốc chi tiết, liên kết chẩn đoán, trạng thái đơn (DRAFT → PRESCRIBED), tìm kiếm thuốc, lịch sử đơn theo bệnh nhân' },
      { name: '4.6 Medical Records', description: 'API Hồ sơ bệnh án điện tử: tổng hợp encounter, completeness, finalize & khóa, ký số, snapshot, timeline, thống kê, xuất/in, tìm kiếm nâng cao' },
      { name: '4.7 Treatment Progress', description: 'API Quản lý tiến trình điều trị' },
      { name: '4.8 Medical Sign-off', description: 'API Ký số & xác nhận hồ sơ y khoa: xác nhận hoàn tất khám, ký nháp/chính thức, thu hồi, xác minh toàn vẹn, khóa chỉnh sửa, audit log' },

      // ===== MODULE 5: QUẢN LÝ THUỐC =====
      { name: '5.1 Quản lý danh mục thuốc', description: 'API Quản lý danh mục thuốc' },
      { name: '5.5 Dispensing Management', description: 'API Cấp phát thuốc & xuất kho: tạo phiếu, trừ kho, kiểm tra tồn kho, hủy + hoàn kho' },
      { name: '5.6 Drug Inventory Tracking', description: 'API Theo dõi tồn kho: danh sách, cảnh báo hết hạn, cảnh báo tồn kho thấp, nhập kho, cập nhật' },
      { name: '5.7 Warehouse Management', description: 'API Quản lý kho thuốc: CRUD kho theo chi nhánh' },
      { name: '5.8 Stock-In Management', description: 'API Nhập kho & NCC: CRUD NCC, phiếu nhập kho (DRAFT→CONFIRMED→RECEIVED→CANCELLED)' },
      { name: '5.9 Stock-Out Management', description: 'API Xuất kho & Hủy hàng: hủy thuốc, trả NCC, chuyển kho, hao hụt' },
      { name: '5.10 Medication Instructions', description: 'API Hướng dẫn sử dụng thuốc: mẫu chuẩn hóa (DOSAGE/FREQUENCY/ROUTE/INSTRUCTION) + hướng dẫn mặc định theo thuốc' },

      // ===== MODULE 6: HỒ SƠ SỨC KHỎE ĐIỆN TỬ (EHR) =====
      { name: '6.1 Patient Health Profile', description: 'API Hồ sơ sức khỏe tổng hợp: panorama sức khỏe, sinh hiệu, bệnh lý, dị ứng, thuốc đang dùng, lịch sử chẩn đoán, bảo hiểm, cảnh báo y tế (tự động + thủ công), ghi chú EHR' },
      { name: '6.2 Health Timeline', description: 'API Dòng thời gian sức khỏe: hợp nhất events từ 11 bảng EMR, thống kê, lọc theo encounter/ICD-10, sự kiện thủ công' },
      { name: '6.3 Medical History', description: 'API Tiền sử bệnh & yếu tố nguy cơ: CRUD tiền sử cá nhân/gia đình, dị ứng, yếu tố nguy cơ, tình trạng đặc biệt' },
      { name: '6.4 Clinical Results', description: 'API Kết quả xét nghiệm & cận lâm sàng: danh sách kết quả, chi tiết, xu hướng, thống kê, file đính kèm, bất thường' },
      { name: '6.5 Medication & Treatment', description: 'API Hồ sơ đơn thuốc & điều trị: lịch sử đơn thuốc, thuốc đang dùng, kế hoạch điều trị, tuân thủ, tương tác, timeline' },
      { name: '6.6 Vital Signs', description: 'API Chỉ số sức khỏe & sinh hiệu: lịch sử sinh hiệu, xu hướng, bất thường, tổng hợp BMI/BP, health metrics, timeline hợp nhất' },
      { name: '6.8 Data Integration', description: 'API Đồng bộ dữ liệu & tích hợp bên ngoài: nguồn dữ liệu, hồ sơ bên ngoài, HL7/FHIR, thiết bị, dashboard' },

      // ===== MODULE 8: KHÁM TỪ XA (REMOTE CONSULTATION) =====
      { name: '8.1.1 Quản lý loại hình khám từ xa', description: 'CRUD loại hình (VIDEO/AUDIO/CHAT/HYBRID), capabilities, thời lượng, platform mặc định' },
      { name: '8.1.2 Cấu hình chuyên khoa', description: 'Cấu hình hình thức theo CK × cơ sở, giá dịch vụ (base/insurance/VIP), thời lượng override, batch create, lookup 2 chiều' },
      { name: '8.1.3 Tra cứu & Thống kê', description: 'Availability check cho đặt lịch (CK + cơ sở), dashboard thống kê tổng quan loại hình & cấu hình' },
      { name: '8.2.1 Tìm BS & Slot', description: 'Tìm bác sĩ khả dụng, slot trống, kiểm tra availability BS cho đặt lịch từ xa' },
      { name: '8.2.2 Đặt lịch', description: 'Tạo/cập nhật/xác nhận/hủy phiên đặt lịch khám từ xa' },
      { name: '8.2.3 Thanh toán', description: 'Khởi tạo thanh toán, callback xác nhận thanh toán cho phiên khám từ xa' },
      { name: '8.2.4 Quản lý & Tra cứu', description: 'Danh sách phiên đặt lịch, chi tiết phiên, lịch sử đặt lịch BN' },
      { name: '8.3.1 Quản lý phòng', description: 'Mở/đóng phòng khám trực tuyến, tham gia/rời phòng, chi tiết phòng' },
      { name: '8.3.2 Chat', description: 'Gửi tin nhắn, lịch sử chat, đánh dấu đã đọc trong phiên khám' },
      { name: '8.3.3 File Sharing', description: 'Upload/xem/xóa file chia sẻ (ảnh, PDF, kết quả XN) trong phiên' },
      { name: '8.3.4 Media & Participants', description: 'Cập nhật cam/mic/screen, DS người tham gia, kick user' },
      { name: '8.3.5 Events & Thống kê', description: 'Activity log, báo cáo mạng, tổng kết phiên, DS phòng hoạt động' },
      { name: '8.4.1 Quản lý hội thoại', description: 'Tạo/xem/đóng/mở lại cuộc hội thoại y tế async BS↔BN' },
      { name: '8.4.2 Tin nhắn', description: 'Gửi text/ảnh/file/KQXN, lịch sử chat, đánh dấu đọc, ghim, xóa' },
      { name: '8.4.3 File y tế', description: 'DS file đính kèm, file y tế (is_medical_record) liên kết EMR' },
      { name: '8.4.4 Thống kê', description: 'Đếm tin chưa đọc, DS bệnh nhân đang chat' },
      { name: '8.5.1 Ghi nhận kết quả', description: 'Tạo/cập nhật/hoàn thiện/ký xác nhận kết quả khám từ xa' },
      { name: '8.5.2 Triệu chứng & Sinh hiệu', description: 'Cập nhật triệu chứng, BN tự báo sinh hiệu (JSONB)' },
      { name: '8.5.3 Chuyển tuyến & Tái khám', description: 'Ghi nhận chuyển tuyến, kế hoạch tái khám' },
      { name: '8.5.4 Tra cứu & Thống kê', description: 'DS kết quả, lịch sử BN, chờ ký, cần tái khám, summary' },
      { name: '8.6.1 Kê đơn từ xa', description: 'Tạo đơn DRAFT, thêm/xóa thuốc (kiểm tra restriction), kê đơn, chi tiết' },
      { name: '8.6.2 Gửi đơn & Kiểm soát', description: 'Gửi đơn BN (PICKUP/DELIVERY/DIGITAL), kiểm tra tồn kho, DS thuốc hạn chế' },
      { name: '8.6.3 Chỉ định XN & Tái khám', description: 'Chỉ định XN/CĐHA, DS XN, chỉ định tái khám trực tiếp' },
      { name: '8.6.4 Tra cứu đơn', description: 'DS đơn từ xa, lịch sử BN, tổng kết đơn' },
      { name: '8.7.1 Kế hoạch theo dõi', description: 'Tạo/cập nhật/hoàn thành/chuyển khám trực tiếp follow-up plan' },
      { name: '8.7.2 Diễn biến sức khỏe', description: 'BN/BS ghi diễn biến, BS phản hồi, DS cần xem xét (SEVERE/CRITICAL)' },
      { name: '8.7.3 Nhắc tái khám', description: 'Gửi nhắc lịch, DS sắp tái khám (3 ngày tới)' },
      { name: '8.7.4 Tra cứu & Báo cáo', description: 'DS plans, lịch sử BN, báo cáo điều trị, thống kê outcome' },
      { name: '8.8.1 Đánh giá chất lượng', description: 'Gửi đánh giá đa tiêu chí (BS/BN/kết nối), DS reviews, reviews theo BS' },
      { name: '8.8.2 Metrics & Phân tích', description: 'Metrics BS, tổng quan hệ thống (top/low performers), kết nối, xu hướng' },
      { name: '8.8.3 Cảnh báo chất lượng', description: 'DS/tạo/resolve alerts, auto-alert khi avg < 3.0' },
      { name: '8.8.4 Báo cáo', description: 'Báo cáo BS (metrics+reviews+alerts), báo cáo tổng hợp hệ thống' },
      { name: '8.9.1 Cấu hình hệ thống', description: 'DS/cập nhật/batch/reset configs (5 categories), audit log' },
      { name: '8.9.2 Chi phí dịch vụ', description: 'CRUD bảng giá, tra cứu giá hiện hành (final_price)' },
      { name: '8.9.3 SLA & Vận hành', description: 'Dashboard SLA 30 ngày, DS vi phạm SLA' },

      // ===== MODULE 9: THANH TOÁN (BILLING) =====
      { name: '9.1.1 Danh mục dịch vụ & bảng giá', description: 'Danh mục tổng hợp dịch vụ y tế (khám, cận lâm sàng) và bảng giá tại từng cơ sở' },
      { name: '9.1.2 Chính sách giá theo đối tượng', description: 'Quản lý chính sách giá linh hoạt theo đối tượng bệnh nhân (thường, BHYT, VIP, nhân viên, trẻ em, người cao tuổi), tạo hàng loạt, tra cứu giá cuối cùng' },
      { name: '9.1.3 Giá theo chuyên khoa', description: 'Override giá cho từng chuyên khoa cụ thể, cùng 1 dịch vụ chuyên khoa khác nhau có thể có giá khác nhau' },
      { name: '9.1.4 Lịch sử & thống kê bảng giá', description: 'Audit trail thay đổi giá, thống kê tổng hợp, so sánh giá liên cơ sở, cảnh báo chính sách sắp hết hạn' },

      // Module 9.2: Thu phí khám & dịch vụ y tế
      { name: '9.2.1 Quản lý Hóa đơn', description: 'Tạo HĐ thủ công / tự động từ encounter, gom phí khám + CLS + thuốc, cập nhật, hủy, tra cứu theo encounter/BN' },
      { name: '9.2.2 Chi tiết Hóa đơn', description: 'Thêm/sửa/xóa dòng chi tiết (CONSULTATION/LAB_ORDER/DRUG), tính lại tổng tiền tự động' },
      { name: '9.2.3 Thanh toán', description: 'Ghi nhận thanh toán (CASH/CARD/VNPAY/MOMO), thanh toán 1 phần, hoàn tiền, kiểm tra overpayment' },
      { name: '9.2.4 Ca thu ngân', description: 'Mở/đóng ca thu ngân, tính system balance tự động, phát hiện chênh lệch (DISCREPANCY)' },
      { name: '9.2.5 Thống kê doanh thu', description: 'Thống kê doanh thu theo cơ sở, claim BHYT, phân tích theo status' },

      // Module 9.3: Thanh toán trực tuyến (SePay)
      { name: '9.3 Payment Orders', description: 'Sinh QR Code VietQR qua SePay, quản lý lệnh thanh toán, kiểm tra trạng thái (polling)' },
      { name: '9.3 Webhook', description: 'Webhook nhận callback từ SePay khi phát hiện giao dịch, xác minh thủ công qua SePay API' },
      { name: '9.3 Gateway Config', description: 'Cấu hình cổng thanh toán SePay: API Key, tài khoản VA, bank, test kết nối' },
      { name: '9.3 Online Payment Stats', description: 'Lịch sử & thống kê thanh toán online: tổng orders, tỷ lệ thành công, doanh thu' },

      // Module 9.4: Thanh toán tại quầy (Offline Payment)
      { name: '9.4.1 Thanh toán tại quầy', description: 'Thanh toán tiền mặt/POS/chuyển khoản tại quầy, enforce ca mở, hủy giao dịch (VOID) trong 30 phút, danh sách giao dịch offline' },
      { name: '9.4.2 Quản lý POS', description: 'CRUD thiết bị POS/máy quẹt thẻ theo chi nhánh, bật/tắt trạng thái' },
      { name: '9.4.3 Biên lai thanh toán', description: 'Biên lai snapshot (lưu toàn bộ thông tin tại thời điểm in), in lại biên lai, đếm reprint' },
      { name: '9.4.4 Ca thu ngân mở rộng', description: 'Kê khai mệnh giá tiền VND khi đóng ca, giao dịch trong ca, tổng kết ca chi tiết' },
      { name: '9.4.5 Báo cáo', description: 'Báo cáo cuối ngày (tổng thu/hoàn/void phân theo phương thức & thu ngân), hiệu suất thu ngân (ca, chênh lệch, trung bình)' },

      // Module 9.5: Quản lý hóa đơn & chứng từ thanh toán
      { name: '9.5.1 Hóa đơn điện tử', description: 'Tạo HĐĐT (SALES/VAT), phát hành, ký số, gửi BN, hủy, thay thế, điều chỉnh — theo NĐ 123/2020 & TT 78/2021' },
      { name: '9.5.2 In hóa đơn', description: 'Chuẩn bị dữ liệu in HĐĐT (seller/buyer/items/totals), lịch sử in/xuất' },
      { name: '9.5.3 Tra cứu hóa đơn', description: 'Unified search (invoices + e_invoices + patients), dòng thời gian hóa đơn (timeline)' },
      { name: '9.5.4 Chứng từ thanh toán', description: 'Upload/quản lý chứng từ đính kèm (scan biên lai, HĐ giấy, ủy nhiệm chi), archive hàng loạt' },
      { name: '9.5.5 Cấu hình HĐĐT', description: 'Cấu hình phát hành HĐĐT theo cơ sở: thông tin bên bán, mẫu/ký hiệu, thuế suất mặc định' },

      // Module 9.6: Đối soát & quyết toán thanh toán
      { name: '9.6.1 Đối soát giao dịch', description: 'Đối soát online (SePay vs system), đối soát ca thu ngân (system vs actual vs denominations)' },
      { name: '9.6.2 Xử lý chênh lệch', description: 'Báo cáo chênh lệch (severity/type), xử lý items, review/approve/reject phiên đối soát' },
      { name: '9.6.3 Quyết toán', description: 'Tạo phiếu quyết toán (DAILY/WEEKLY/MONTHLY), workflow DRAFT→SUBMITTED→APPROVED' },
      { name: '9.6.4 Lịch sử & xuất báo cáo', description: 'Lịch sử đối soát, xuất data quyết toán (JSON cho Excel/PDF)' },

      // Module 9.7: Hoàn tiền & điều chỉnh giao dịch
      { name: '9.7.1 Yêu cầu hoàn tiền', description: 'Tạo yêu cầu hoàn tiền FULL/PARTIAL, auto-approve ≤ 50k VND, 7 danh mục lý do' },
      { name: '9.7.2 Phê duyệt hoàn tiền', description: 'Workflow PENDING→APPROVED→PROCESSING→COMPLETED, xử lý tạo GD REFUND' },
      { name: '9.7.3 Điều chỉnh giao dịch', description: 'OVERCHARGE/UNDERCHARGE/WRONG_METHOD/DUPLICATE, tạo GD bù/hoàn' },
      { name: '9.7.4 Dashboard & Tracking', description: 'Dashboard tổng quan hoàn tiền, timeline sự kiện, lịch sử hoàn/điều chỉnh GD' },

      // Module 9.8: Quản lý chính sách giá & ưu đãi
      { name: '9.8.1 Chính sách giảm giá', description: 'CRUD chính sách giảm giá PERCENTAGE/FIXED_AMOUNT, priority cascade, calculate' },
      { name: '9.8.2 Voucher / Coupon', description: 'CRUD voucher, validate 5-check, redeem + ghi usage, lịch sử sử dụng' },
      { name: '9.8.3 Gói dịch vụ', description: 'Combo nhiều DV, auto-calc giá lẻ vs giá gói, % tiết kiệm' },
      { name: '9.8.4 Tổng quan & Lịch sử', description: 'Active promotions, lịch sử thay đổi chính sách giá' },

      // Module 9.9: Quản lý phân quyền thu ngân
      { name: '9.9.1 Hồ sơ thu ngân', description: 'CRUD hồ sơ thu ngân, gán quyền thu/hoàn/VOID, branch, supervisor' },
      { name: '9.9.2 Giới hạn thao tác', description: 'Set/check giới hạn VND mỗi GD/ca/ngày, supervisor approval' },
      { name: '9.9.3 Khóa ca / Mở ca', description: 'Lock/unlock/force-close/handover ca thu ngân' },
      { name: '9.9.4 Nhật ký', description: 'Audit trail hoạt động thu ngân: SHIFT_OPEN, PAYMENT, VOID, LIMIT_EXCEEDED...' },
      { name: '9.9.5 Dashboard', description: 'Dashboard tổng quan, thống kê cá nhân, limit usage %' },

      // ===== MODULE 7: AI TƯ VẤN SỨC KHỎE =====
      { name: '7.1 AI Tư Vấn Sức Khỏe', description: 'Chatbot AI tư vấn sức khỏe ban đầu: tiếp nhận triệu chứng, hỏi chi tiết, gợi ý chuyên khoa + ưu tiên, hướng dẫn đặt lịch, SSE streaming' },
      { name: '7.2 AI Knowledge Base (RAG)', description: 'Quản lý tài liệu Knowledge Base của AI: upload PDF → cắt nhỏ (chunking) → nhúng vector (embedding) → tìm kiếm ngữ nghĩa (Cosine Similarity). Dùng để AI trả lời câu hỏi về bảng giá, bác sĩ, quy định phòng khám.' },

    ]
  },
  apis: [
    './src/routes/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
