/** Mã loại hình khám từ xa */
export const CONSULTATION_TYPE_CODE = {
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
    CHAT: 'CHAT',
    HYBRID: 'HYBRID',
} as const;
export type ConsultationTypeCode = typeof CONSULTATION_TYPE_CODE[keyof typeof CONSULTATION_TYPE_CODE];

/** Platform hỗ trợ */
export const TELE_PLATFORM = {
    AGORA: 'AGORA',
    ZOOM: 'ZOOM',
    STRINGEE: 'STRINGEE',
    INTERNAL_CHAT: 'INTERNAL_CHAT',
} as const;
export type TelePlatform = typeof TELE_PLATFORM[keyof typeof TELE_PLATFORM];

/** Mã lỗi Module 8.1 */
export const REMOTE_CONSULTATION_ERRORS = {
    TYPE_NOT_FOUND: { code: 'RMC_001', message: 'Không tìm thấy loại hình khám từ xa.' },
    TYPE_CODE_EXISTS: { code: 'RMC_002', message: 'Mã loại hình đã tồn tại.' },
    TYPE_INACTIVE: { code: 'RMC_003', message: 'Loại hình khám từ xa đã bị vô hiệu hóa.' },
    CONFIG_NOT_FOUND: { code: 'RMC_004', message: 'Không tìm thấy cấu hình chuyên khoa.' },
    CONFIG_DUPLICATE: { code: 'RMC_005', message: 'Cấu hình đã tồn tại cho loại hình + chuyên khoa + cơ sở này.' },
    SPECIALTY_NOT_FOUND: { code: 'RMC_006', message: 'Không tìm thấy chuyên khoa.' },
    FACILITY_NOT_FOUND: { code: 'RMC_007', message: 'Không tìm thấy cơ sở y tế.' },
    FACILITY_SERVICE_NOT_FOUND: { code: 'RMC_008', message: 'Không tìm thấy dịch vụ cơ sở.' },
    INVALID_DURATION: { code: 'RMC_009', message: 'Thời lượng không hợp lệ: min <= default <= max.' },
    INVALID_PRICE: { code: 'RMC_010', message: 'Giá dịch vụ phải >= 0.' },
    TYPE_IN_USE: { code: 'RMC_011', message: 'Loại hình đang được sử dụng trong cấu hình, không thể xóa.' },
    NO_CONFIGS_PROVIDED: { code: 'RMC_012', message: 'Vui lòng cung cấp ít nhất 1 cấu hình.' },
} as const;

/** Thông báo thành công */
export const REMOTE_CONSULTATION_SUCCESS = {
    TYPE_CREATED: 'Tạo loại hình khám từ xa thành công.',
    TYPE_UPDATED: 'Cập nhật loại hình khám từ xa thành công.',
    TYPE_DELETED: 'Xóa loại hình khám từ xa thành công.',
    CONFIG_CREATED: 'Tạo cấu hình chuyên khoa thành công.',
    CONFIG_UPDATED: 'Cập nhật cấu hình chuyên khoa thành công.',
    CONFIG_DELETED: 'Xóa cấu hình chuyên khoa thành công.',
    BATCH_CREATED: 'Tạo hàng loạt cấu hình thành công.',
} as const;

/** Cấu hình phân trang */
export const REMOTE_CONSULTATION_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    /** Thời gian hết hạn chờ thanh toán (phút) */
    PAYMENT_EXPIRY_MINUTES: 30,
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.2: ĐẶT LỊCH TƯ VẤN & KHÁM TỪ XA
// ═══════════════════════════════════════════════════

/** Trạng thái phiên đặt lịch */
export const TELE_BOOKING_STATUS = {
    DRAFT: 'DRAFT',
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
} as const;
export type TeleBookingStatus = typeof TELE_BOOKING_STATUS[keyof typeof TELE_BOOKING_STATUS];

/** Trạng thái thanh toán */
export const TELE_PAYMENT_STATUS = {
    UNPAID: 'UNPAID',
    PAID: 'PAID',
    REFUNDED: 'REFUNDED',
} as const;
export type TelePaymentStatus = typeof TELE_PAYMENT_STATUS[keyof typeof TELE_PAYMENT_STATUS];

/** Loại giá */
export const TELE_PRICE_TYPE = {
    BASE: 'BASE',
    INSURANCE: 'INSURANCE',
    VIP: 'VIP',
} as const;

/** Mã lỗi Module 8.2 */
export const TELE_BOOKING_ERRORS = {
    SESSION_NOT_FOUND: { code: 'TBK_001', message: 'Không tìm thấy phiên đặt lịch.' },
    SESSION_EXPIRED: { code: 'TBK_002', message: 'Phiên đặt lịch đã hết hạn.' },
    SESSION_ALREADY_CONFIRMED: { code: 'TBK_003', message: 'Phiên đã được xác nhận.' },
    SESSION_ALREADY_CANCELLED: { code: 'TBK_004', message: 'Phiên đã bị hủy.' },
    SESSION_CANNOT_UPDATE: { code: 'TBK_005', message: 'Chỉ cập nhật phiên ở trạng thái DRAFT hoặc PENDING_PAYMENT.' },
    PATIENT_NOT_FOUND: { code: 'TBK_006', message: 'Không tìm thấy bệnh nhân.' },
    DOCTOR_NOT_FOUND: { code: 'TBK_007', message: 'Không tìm thấy bác sĩ.' },
    DOCTOR_NOT_AVAILABLE: { code: 'TBK_008', message: 'Bác sĩ không có lịch vào ngày/ca này.' },
    DOCTOR_ON_LEAVE: { code: 'TBK_009', message: 'Bác sĩ đang nghỉ phép vào ngày này.' },
    NO_CONFIG_AVAILABLE: { code: 'TBK_010', message: 'Không có cấu hình hình thức khám cho CK + cơ sở này.' },
    SLOT_NOT_FOUND: { code: 'TBK_011', message: 'Khung giờ không tồn tại hoặc đã bị khóa.' },
    SLOT_FULL: { code: 'TBK_012', message: 'Khung giờ đã đầy.' },
    PAYMENT_REQUIRED: { code: 'TBK_013', message: 'Phiên này yêu cầu thanh toán trước khi xác nhận.' },
    PAYMENT_ALREADY_DONE: { code: 'TBK_014', message: 'Thanh toán đã được xử lý.' },
    INVALID_BOOKING_DATE: { code: 'TBK_015', message: 'Ngày khám phải >= ngày hiện tại.' },
    BOOKING_DATE_TOO_FAR: { code: 'TBK_016', message: 'Ngày khám vượt quá giới hạn đặt trước.' },
    CANCEL_TIME_EXCEEDED: { code: 'TBK_017', message: 'Đã quá thời gian hủy lịch cho phép.' },
    MISSING_REQUIRED: { code: 'TBK_018', message: 'Thiếu thông tin bắt buộc.' },
    DOCTOR_CONFLICT: { code: 'TBK_019', message: 'Bác sĩ đã có lịch khám khác trong khung giờ này.' },
    PATIENT_CONFLICT: { code: 'TBK_020', message: 'Bệnh nhân đã có phiên đặt lịch khác trong khung giờ này.' },
} as const;

/** Thông báo thành công Module 8.2 */
export const TELE_BOOKING_SUCCESS = {
    SESSION_CREATED: 'Tạo phiên đặt lịch thành công.',
    SESSION_UPDATED: 'Cập nhật phiên đặt lịch thành công.',
    SESSION_CONFIRMED: 'Xác nhận phiên đặt lịch thành công. Đã tạo lịch khám & phiên tư vấn.',
    SESSION_CANCELLED: 'Hủy phiên đặt lịch thành công.',
    PAYMENT_INITIATED: 'Khởi tạo thanh toán thành công.',
    PAYMENT_CONFIRMED: 'Xác nhận thanh toán thành công.',
    DOCTORS_FETCHED: 'Lấy danh sách bác sĩ thành công.',
    SLOTS_FETCHED: 'Lấy danh sách khung giờ thành công.',
} as const;

/** Kênh đặt lịch teleconsultation — bổ sung vào BookingChannel */
export const TELE_BOOKING_CHANNEL = 'TELECONSULTATION' as const;

/** Prefix mã phiên đặt lịch */
export const TELE_BOOKING_CODE_PREFIX = 'TBS' as const;

// ═══════════════════════════════════════════════════
// MODULE 8.3: PHÒNG KHÁM TRỰC TUYẾN
// ═══════════════════════════════════════════════════

/** Trạng thái phòng khám */
export const TELE_ROOM_STATUS = {
    SCHEDULED: 'SCHEDULED',
    WAITING: 'WAITING',
    ONGOING: 'ONGOING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    MISSED: 'MISSED',
} as const;
export type TeleRoomStatus = typeof TELE_ROOM_STATUS[keyof typeof TELE_ROOM_STATUS];

/** Vai trò người tham gia */
export const PARTICIPANT_ROLE = {
    HOST: 'HOST',
    GUEST: 'GUEST',
    OBSERVER: 'OBSERVER',
} as const;

/** Trạng thái participant */
export const PARTICIPANT_STATUS = {
    WAITING: 'WAITING',
    IN_ROOM: 'IN_ROOM',
    LEFT: 'LEFT',
    KICKED: 'KICKED',
} as const;

/** Loại sự kiện phòng */
export const ROOM_EVENT_TYPE = {
    JOIN: 'JOIN',
    LEAVE: 'LEAVE',
    VIDEO_ON: 'VIDEO_ON',
    VIDEO_OFF: 'VIDEO_OFF',
    AUDIO_ON: 'AUDIO_ON',
    AUDIO_OFF: 'AUDIO_OFF',
    SCREEN_SHARE_START: 'SCREEN_SHARE_START',
    SCREEN_SHARE_STOP: 'SCREEN_SHARE_STOP',
    FILE_SHARED: 'FILE_SHARED',
    ROOM_OPENED: 'ROOM_OPENED',
    ROOM_CLOSED: 'ROOM_CLOSED',
    NETWORK_ISSUE: 'NETWORK_ISSUE',
    RECONNECTED: 'RECONNECTED',
    KICKED: 'KICKED',
} as const;

/** Loại file chia sẻ */
export const SHARED_FILE_TYPE = {
    IMAGE: 'IMAGE',
    PDF: 'PDF',
    DOCUMENT: 'DOCUMENT',
    LAB_RESULT: 'LAB_RESULT',
    PRESCRIPTION: 'PRESCRIPTION',
} as const;

/** Chất lượng kết nối */
export const CONNECTION_QUALITY = {
    EXCELLENT: 'EXCELLENT',
    GOOD: 'GOOD',
    FAIR: 'FAIR',
    POOR: 'POOR',
} as const;

/** Lý do kết thúc phiên */
export const ENDED_REASON = {
    NORMAL: 'NORMAL',
    TIMEOUT: 'TIMEOUT',
    TECHNICAL_ERROR: 'TECHNICAL_ERROR',
    PATIENT_LEFT: 'PATIENT_LEFT',
    DOCTOR_LEFT: 'DOCTOR_LEFT',
} as const;

/** Thời hạn room token (giờ) */
export const ROOM_TOKEN_EXPIRY_HOURS = 4 as const;

/** Mã lỗi Module 8.3 */
export const TELE_ROOM_ERRORS = {
    CONSULTATION_NOT_FOUND: { code: 'TRM_001', message: 'Không tìm thấy phiên tư vấn.' },
    ROOM_ALREADY_OPEN: { code: 'TRM_002', message: 'Phòng đã được mở trước đó.' },
    ROOM_NOT_OPEN: { code: 'TRM_003', message: 'Phòng chưa được mở hoặc đã kết thúc.' },
    ROOM_COMPLETED: { code: 'TRM_004', message: 'Phiên đã kết thúc.' },
    NOT_PARTICIPANT: { code: 'TRM_005', message: 'Bạn không phải là người tham gia phiên này.' },
    ALREADY_IN_ROOM: { code: 'TRM_006', message: 'Bạn đã ở trong phòng.' },
    NOT_IN_ROOM: { code: 'TRM_007', message: 'Bạn không ở trong phòng.' },
    INVALID_TOKEN: { code: 'TRM_008', message: 'Room token không hợp lệ hoặc đã hết hạn.' },
    ONLY_HOST_CAN_OPEN: { code: 'TRM_009', message: 'Chỉ bác sĩ (HOST) mới được mở phòng.' },
    ONLY_HOST_CAN_CLOSE: { code: 'TRM_010', message: 'Chỉ bác sĩ (HOST) hoặc ADMIN mới được đóng phòng.' },
    ONLY_HOST_CAN_KICK: { code: 'TRM_011', message: 'Chỉ bác sĩ hoặc ADMIN mới được kick.' },
    CANNOT_KICK_HOST: { code: 'TRM_012', message: 'Không thể kick bác sĩ chủ phiên.' },
    ROOM_NOT_ONGOING: { code: 'TRM_013', message: 'Chat/file chỉ hoạt động khi phiên đang diễn ra.' },
    FILE_NOT_FOUND: { code: 'TRM_014', message: 'Không tìm thấy file.' },
    FILE_NOT_OWNER: { code: 'TRM_015', message: 'Chỉ người upload hoặc ADMIN mới được xóa file.' },
    TARGET_USER_NOT_FOUND: { code: 'TRM_016', message: 'Không tìm thấy người dùng cần kick.' },
} as const;

/** Thông báo thành công Module 8.3 */
export const TELE_ROOM_SUCCESS = {
    ROOM_OPENED: 'Mở phòng khám trực tuyến thành công.',
    ROOM_JOINED: 'Tham gia phòng thành công.',
    ROOM_LEFT: 'Rời phòng thành công.',
    ROOM_CLOSED: 'Đóng phòng và kết thúc phiên thành công.',
    MESSAGE_SENT: 'Gửi tin nhắn thành công.',
    MESSAGES_READ: 'Đánh dấu đã đọc thành công.',
    FILE_UPLOADED: 'Upload file thành công.',
    FILE_DELETED: 'Xóa file thành công.',
    MEDIA_UPDATED: 'Cập nhật trạng thái media thành công.',
    PARTICIPANT_KICKED: 'Kick người dùng thành công.',
    NETWORK_REPORTED: 'Ghi nhận báo cáo mạng thành công.',
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.4: TRAO ĐỔI THÔNG TIN Y TẾ TRỰC TUYẾN
// ═══════════════════════════════════════════════════

/** Trạng thái cuộc hội thoại */
export const MED_CHAT_STATUS = {
    ACTIVE: 'ACTIVE',
    CLOSED: 'CLOSED',
    ARCHIVED: 'ARCHIVED',
} as const;

/** Độ ưu tiên */
export const MED_CHAT_PRIORITY = {
    NORMAL: 'NORMAL',
    URGENT: 'URGENT',
    FOLLOW_UP: 'FOLLOW_UP',
} as const;

/** Loại tin nhắn */
export const MED_CHAT_MSG_TYPE = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    FILE: 'FILE',
    LAB_RESULT: 'LAB_RESULT',
    PRESCRIPTION: 'PRESCRIPTION',
    SYSTEM_NOTE: 'SYSTEM_NOTE',
} as const;

/** Loại file đính kèm */
export const MED_CHAT_FILE_TYPE = {
    IMAGE: 'IMAGE',
    PDF: 'PDF',
    LAB_RESULT: 'LAB_RESULT',
    PRESCRIPTION: 'PRESCRIPTION',
    DOCUMENT: 'DOCUMENT',
} as const;

/** Mã lỗi Module 8.4 */
export const MED_CHAT_ERRORS = {
    CONVERSATION_NOT_FOUND: { code: 'MCH_001', message: 'Không tìm thấy cuộc hội thoại.' },
    CONVERSATION_CLOSED: { code: 'MCH_002', message: 'Cuộc hội thoại đã đóng, không thể gửi thêm tin nhắn.' },
    CONVERSATION_ALREADY_ACTIVE: { code: 'MCH_003', message: 'Cuộc hội thoại đang hoạt động.' },
    PATIENT_NOT_FOUND: { code: 'MCH_004', message: 'Không tìm thấy bệnh nhân.' },
    DOCTOR_NOT_FOUND: { code: 'MCH_005', message: 'Không tìm thấy bác sĩ.' },
    MESSAGE_NOT_FOUND: { code: 'MCH_006', message: 'Không tìm thấy tin nhắn.' },
    MESSAGE_ALREADY_DELETED: { code: 'MCH_007', message: 'Tin nhắn đã bị xóa.' },
    NOT_MESSAGE_OWNER: { code: 'MCH_008', message: 'Bạn không phải người gửi tin nhắn này.' },
    NO_ACCESS: { code: 'MCH_009', message: 'Bạn không có quyền truy cập cuộc hội thoại này.' },
    MISSING_CONTENT: { code: 'MCH_010', message: 'Nội dung tin nhắn hoặc file không được để trống.' },
    MISSING_REQUIRED: { code: 'MCH_011', message: 'Thiếu thông tin bắt buộc.' },
    DUPLICATE_CONVERSATION: { code: 'MCH_012', message: 'Đã tồn tại hội thoại ACTIVE giữa BN và BS này.' },
} as const;

/** Thông báo thành công Module 8.4 */
export const MED_CHAT_SUCCESS = {
    CONVERSATION_CREATED: 'Tạo cuộc hội thoại thành công.',
    CONVERSATION_CLOSED: 'Đóng cuộc hội thoại thành công.',
    CONVERSATION_REOPENED: 'Mở lại cuộc hội thoại thành công.',
    MESSAGE_SENT: 'Gửi tin nhắn thành công.',
    MESSAGES_READ: 'Đánh dấu đã đọc thành công.',
    MESSAGE_PINNED: 'Ghim tin nhắn thành công.',
    MESSAGE_UNPINNED: 'Bỏ ghim tin nhắn thành công.',
    MESSAGE_DELETED: 'Xóa tin nhắn thành công.',
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.5: GHI NHẬN KẾT QUẢ KHÁM TỪ XA
// ═══════════════════════════════════════════════════

/** Trạng thái kết quả */
export const TELE_RESULT_STATUS = {
    DRAFT: 'DRAFT',
    COMPLETED: 'COMPLETED',
    SIGNED: 'SIGNED',
} as const;

/** Mức độ triệu chứng */
export const SYMPTOM_SEVERITY = {
    MILD: 'MILD',
    MODERATE: 'MODERATE',
    SEVERE: 'SEVERE',
} as const;

/** Loại kết luận */
export const CONCLUSION_TYPE = {
    PRELIMINARY: 'PRELIMINARY',
    FINAL: 'FINAL',
} as const;

/** Loại tái khám */
export const FOLLOW_UP_TYPE = {
    TELECONSULTATION: 'TELECONSULTATION',
    IN_PERSON: 'IN_PERSON',
} as const;

/** Mã lỗi Module 8.5 */
export const TELE_RESULT_ERRORS = {
    CONSULTATION_NOT_FOUND: { code: 'TRS_001', message: 'Không tìm thấy phiên tư vấn.' },
    RESULT_NOT_FOUND: { code: 'TRS_002', message: 'Không tìm thấy kết quả khám.' },
    RESULT_ALREADY_EXISTS: { code: 'TRS_003', message: 'Phiên này đã có kết quả.' },
    RESULT_SIGNED: { code: 'TRS_004', message: 'Kết quả đã ký, không thể sửa.' },
    RESULT_NOT_COMPLETED: { code: 'TRS_005', message: 'Kết quả chưa hoàn thiện (COMPLETED) để ký.' },
    RESULT_ALREADY_COMPLETED: { code: 'TRS_006', message: 'Kết quả đã ở trạng thái COMPLETED.' },
    RESULT_ALREADY_SIGNED: { code: 'TRS_007', message: 'Kết quả đã được ký xác nhận.' },
    MISSING_CONCLUSION: { code: 'TRS_008', message: 'Vui lòng nhập kết luận y khoa trước khi hoàn thiện.' },
    MISSING_EXAMINATION_LIMITS: { code: 'TRS_009', message: 'Vui lòng ghi nhận hạn chế khám từ xa.' },
    PATIENT_NOT_FOUND: { code: 'TRS_010', message: 'Không tìm thấy bệnh nhân.' },
    NO_ACCESS: { code: 'TRS_011', message: 'Bạn không có quyền truy cập kết quả này.' },
    INVALID_FOLLOW_UP_DATE: { code: 'TRS_012', message: 'Ngày tái khám phải >= ngày hiện tại.' },
    MISSING_REQUIRED: { code: 'TRS_013', message: 'Thiếu thông tin bắt buộc.' },
} as const;

/** Thông báo thành công Module 8.5 */
export const TELE_RESULT_SUCCESS = {
    RESULT_CREATED: 'Tạo kết quả khám từ xa thành công.',
    RESULT_UPDATED: 'Cập nhật kết quả thành công.',
    RESULT_COMPLETED: 'Hoàn thiện kết quả thành công.',
    RESULT_SIGNED: 'Ký xác nhận kết quả thành công.',
    SYMPTOMS_UPDATED: 'Cập nhật triệu chứng thành công.',
    VITALS_UPDATED: 'Cập nhật sinh hiệu thành công.',
    REFERRAL_UPDATED: 'Cập nhật chuyển tuyến thành công.',
    FOLLOW_UP_UPDATED: 'Cập nhật kế hoạch tái khám thành công.',
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.6: KÊ ĐƠN & CHỈ ĐỊNH TỪ XA
// ═══════════════════════════════════════════════════

/** Phương thức gửi đơn */
export const DELIVERY_METHOD = {
    PICKUP: 'PICKUP',
    DELIVERY: 'DELIVERY',
    DIGITAL: 'DIGITAL',
} as const;

/** Loại hạn chế thuốc */
export const DRUG_RESTRICTION_TYPE = {
    BANNED: 'BANNED',
    REQUIRES_IN_PERSON: 'REQUIRES_IN_PERSON',
    QUANTITY_LIMITED: 'QUANTITY_LIMITED',
} as const;

/** Mã lỗi Module 8.6 */
export const TELE_RX_ERRORS = {
    CONSULTATION_NOT_FOUND: { code: 'TRX_001', message: 'Không tìm thấy phiên tư vấn.' },
    PRESCRIPTION_NOT_FOUND: { code: 'TRX_002', message: 'Không tìm thấy đơn thuốc từ xa.' },
    PRESCRIPTION_EXISTS: { code: 'TRX_003', message: 'Phiên này đã có đơn thuốc.' },
    PRESCRIPTION_NOT_DRAFT: { code: 'TRX_004', message: 'Đơn thuốc đã được kê, không thể sửa.' },
    DRUG_NOT_FOUND: { code: 'TRX_005', message: 'Không tìm thấy thuốc.' },
    DRUG_RESTRICTED: { code: 'TRX_006', message: 'Thuốc bị hạn chế kê từ xa.' },
    DRUG_QUANTITY_LIMITED: { code: 'TRX_007', message: 'Số lượng thuốc vượt giới hạn cho phép kê từ xa.' },
    DETAIL_NOT_FOUND: { code: 'TRX_008', message: 'Không tìm thấy chi tiết thuốc.' },
    STOCK_INSUFFICIENT: { code: 'TRX_009', message: 'Tồn kho không đủ.' },
    IDENTITY_NOT_CONFIRMED: { code: 'TRX_010', message: 'BS chưa xác nhận danh tính bệnh nhân.' },
    RESTRICTIONS_NOT_CHECKED: { code: 'TRX_011', message: 'BS chưa xác nhận kiểm tra danh mục thuốc hạn chế.' },
    MISSING_REQUIRED: { code: 'TRX_012', message: 'Thiếu thông tin bắt buộc.' },
} as const;

/** Thông báo thành công Module 8.6 */
export const TELE_RX_SUCCESS = {
    PRESCRIPTION_CREATED: 'Tạo đơn thuốc từ xa thành công.',
    ITEM_ADDED: 'Thêm thuốc vào đơn thành công.',
    ITEM_REMOVED: 'Xóa thuốc khỏi đơn thành công.',
    PRESCRIBED: 'Kê đơn thành công.',
    SENT_TO_PATIENT: 'Gửi đơn cho bệnh nhân thành công.',
    LAB_ORDER_CREATED: 'Tạo chỉ định xét nghiệm thành công.',
    REFERRAL_UPDATED: 'Cập nhật chỉ định tái khám thành công.',
    STOCK_CHECKED: 'Kiểm tra tồn kho thành công.',
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.7: THEO DÕI SAU TƯ VẤN & TÁI KHÁM TỪ XA
// ═══════════════════════════════════════════════════

/** Loại kế hoạch */
export const FOLLOW_UP_PLAN_TYPE = {
    MEDICATION_MONITOR: 'MEDICATION_MONITOR',
    SYMPTOM_TRACK: 'SYMPTOM_TRACK',
    POST_PROCEDURE: 'POST_PROCEDURE',
    CHRONIC_CARE: 'CHRONIC_CARE',
} as const;

/** Tần suất theo dõi */
export const FOLLOW_UP_FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    BI_WEEKLY: 'BI_WEEKLY',
    MONTHLY: 'MONTHLY',
} as const;

/** Trạng thái kế hoạch */
export const FOLLOW_UP_PLAN_STATUS = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CONVERTED_IN_PERSON: 'CONVERTED_IN_PERSON',
    CANCELLED: 'CANCELLED',
} as const;

/** Đánh giá outcome */
export const OUTCOME_RATING = {
    IMPROVED: 'IMPROVED',
    STABLE: 'STABLE',
    WORSENED: 'WORSENED',
    RESOLVED: 'RESOLVED',
} as const;

/** Loại cập nhật sức khỏe */
export const HEALTH_UPDATE_TYPE = {
    SYMPTOM_UPDATE: 'SYMPTOM_UPDATE',
    VITAL_SIGNS: 'VITAL_SIGNS',
    MEDICATION_RESPONSE: 'MEDICATION_RESPONSE',
    SIDE_EFFECT: 'SIDE_EFFECT',
    GENERAL_NOTE: 'GENERAL_NOTE',
} as const;

/** Mức độ severity */
export const SEVERITY_LEVEL = {
    NORMAL: 'NORMAL',
    MILD: 'MILD',
    MODERATE: 'MODERATE',
    SEVERE: 'SEVERE',
    CRITICAL: 'CRITICAL',
} as const;

/** Mã lỗi Module 8.7 */
export const TELE_FU_ERRORS = {
    CONSULTATION_NOT_FOUND: { code: 'TFU_001', message: 'Không tìm thấy phiên tư vấn.' },
    PLAN_NOT_FOUND: { code: 'TFU_002', message: 'Không tìm thấy kế hoạch theo dõi.' },
    PLAN_NOT_ACTIVE: { code: 'TFU_003', message: 'Kế hoạch không ở trạng thái ACTIVE.' },
    PLAN_ALREADY_COMPLETED: { code: 'TFU_004', message: 'Kế hoạch đã hoàn thành.' },
    UPDATE_NOT_FOUND: { code: 'TFU_005', message: 'Không tìm thấy bản cập nhật.' },
    UPDATE_ALREADY_RESPONDED: { code: 'TFU_006', message: 'Đã phản hồi bản cập nhật này.' },
    PATIENT_NOT_FOUND: { code: 'TFU_007', message: 'Không tìm thấy bệnh nhân.' },
    MISSING_REQUIRED: { code: 'TFU_008', message: 'Thiếu thông tin bắt buộc.' },
    INVALID_DATE: { code: 'TFU_009', message: 'Ngày không hợp lệ.' },
    REMINDER_ALREADY_SENT: { code: 'TFU_010', message: 'Đã gửi nhắc lịch rồi.' },
    MISSING_OUTCOME: { code: 'TFU_011', message: 'Vui lòng ghi nhận kết quả trước khi hoàn thành.' },
} as const;

/** Thông báo thành công Module 8.7 */
export const TELE_FU_SUCCESS = {
    PLAN_CREATED: 'Tạo kế hoạch theo dõi thành công.',
    PLAN_UPDATED: 'Cập nhật kế hoạch thành công.',
    PLAN_COMPLETED: 'Hoàn thành kế hoạch thành công.',
    PLAN_CONVERTED: 'Chuyển sang khám trực tiếp thành công.',
    UPDATE_ADDED: 'Ghi nhận diễn biến sức khỏe thành công.',
    UPDATE_RESPONDED: 'Phản hồi diễn biến thành công.',
    REMINDER_SENT: 'Gửi nhắc lịch tái khám thành công.',
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.8: QUẢN LÝ CHẤT LƯỢNG & ĐÁNH GIÁ
// ═══════════════════════════════════════════════════

/** Loại cảnh báo */
export const QUALITY_ALERT_TYPE = {
    LOW_RATING: 'LOW_RATING',
    TECH_ISSUE: 'TECH_ISSUE',
    HIGH_CANCEL_RATE: 'HIGH_CANCEL_RATE',
    PATIENT_COMPLAINT: 'PATIENT_COMPLAINT',
} as const;

/** Mức độ cảnh báo */
export const QUALITY_ALERT_SEVERITY = {
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL',
} as const;

/** Đối tượng cảnh báo */
export const QUALITY_TARGET_TYPE = {
    DOCTOR: 'DOCTOR',
    SYSTEM: 'SYSTEM',
    PLATFORM: 'PLATFORM',
} as const;

/** Trạng thái cảnh báo */
export const QUALITY_ALERT_STATUS = {
    OPEN: 'OPEN',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    RESOLVED: 'RESOLVED',
    DISMISSED: 'DISMISSED',
} as const;

/** Vấn đề kỹ thuật phổ biến */
export const TECH_ISSUE_TAGS = {
    AUDIO_LAG: 'AUDIO_LAG',
    VIDEO_FREEZE: 'VIDEO_FREEZE',
    DISCONNECTED: 'DISCONNECTED',
    LOW_RESOLUTION: 'LOW_RESOLUTION',
    ECHO: 'ECHO',
    NO_AUDIO: 'NO_AUDIO',
    NO_VIDEO: 'NO_VIDEO',
} as const;

/** Ngưỡng cảnh báo */
export const QUALITY_THRESHOLDS = {
    LOW_RATING_WARNING: 3.0,
    LOW_RATING_CRITICAL: 2.0,
    MIN_REVIEWS_FOR_ALERT: 5,
} as const;

/** Mã lỗi Module 8.8 */
export const TELE_QA_ERRORS = {
    CONSULTATION_NOT_FOUND: { code: 'TQA_001', message: 'Không tìm thấy phiên tư vấn.' },
    REVIEW_NOT_FOUND: { code: 'TQA_002', message: 'Không tìm thấy đánh giá.' },
    REVIEW_EXISTS: { code: 'TQA_003', message: 'Phiên này đã được đánh giá.' },
    ALERT_NOT_FOUND: { code: 'TQA_004', message: 'Không tìm thấy cảnh báo.' },
    ALERT_ALREADY_RESOLVED: { code: 'TQA_005', message: 'Cảnh báo đã được xử lý.' },
    INVALID_RATING: { code: 'TQA_006', message: 'Điểm đánh giá phải từ 1 đến 5.' },
    DOCTOR_NOT_FOUND: { code: 'TQA_007', message: 'Không tìm thấy bác sĩ.' },
    MISSING_REQUIRED: { code: 'TQA_008', message: 'Thiếu thông tin bắt buộc.' },
} as const;

/** Thông báo thành công Module 8.8 */
export const TELE_QA_SUCCESS = {
    REVIEW_CREATED: 'Gửi đánh giá thành công.',
    ALERT_CREATED: 'Tạo cảnh báo thành công.',
    ALERT_RESOLVED: 'Xử lý cảnh báo thành công.',
} as const;

// ═══════════════════════════════════════════════════
// MODULE 8.9: CẤU HÌNH & QUẢN TRỊ HỆ THỐNG
// ═══════════════════════════════════════════════════

/** Phân loại config */
export const CONFIG_CATEGORY = {
    PLATFORM: 'PLATFORM',
    SECURITY: 'SECURITY',
    USAGE_LIMIT: 'USAGE_LIMIT',
    OPERATION: 'OPERATION',
    SLA: 'SLA',
} as const;

/** Kiểu dữ liệu config */
export const CONFIG_TYPE = {
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
    JSON: 'JSON',
} as const;

/** Mã lỗi Module 8.9 */
export const TELE_CFG_ERRORS = {
    CONFIG_NOT_FOUND: { code: 'TCFG_001', message: 'Không tìm thấy cấu hình.' },
    CONFIG_NOT_EDITABLE: { code: 'TCFG_002', message: 'Cấu hình này không cho phép sửa.' },
    PRICING_NOT_FOUND: { code: 'TCFG_003', message: 'Không tìm thấy bảng giá.' },
    PRICING_DUPLICATE: { code: 'TCFG_004', message: 'Bảng giá đã tồn tại cho bộ (loại + chuyên khoa + cơ sở + ngày hiệu lực).' },
    INVALID_VALUE: { code: 'TCFG_005', message: 'Giá trị không hợp lệ cho kiểu dữ liệu.' },
    MISSING_REQUIRED: { code: 'TCFG_006', message: 'Thiếu thông tin bắt buộc.' },
    INVALID_DATE_RANGE: { code: 'TCFG_007', message: 'Khoảng ngày không hợp lệ.' },
} as const;

/** Thông báo thành công Module 8.9 */
export const TELE_CFG_SUCCESS = {
    CONFIG_UPDATED: 'Cập nhật cấu hình thành công.',
    CONFIG_BATCH_UPDATED: 'Cập nhật hàng loạt thành công.',
    CONFIG_RESET: 'Đã reset cấu hình về mặc định.',
    PRICING_CREATED: 'Tạo bảng giá thành công.',
    PRICING_UPDATED: 'Cập nhật bảng giá thành công.',
    PRICING_DELETED: 'Xóa bảng giá thành công.',
} as const;
