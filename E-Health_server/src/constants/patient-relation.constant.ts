/** Tiền tố sinh ID cho bảng relation_types */
export const RELATION_TYPE_ID_PREFIX = 'REL';

/** Tiền tố sinh ID cho bảng patient_contacts */
export const PATIENT_CONTACT_ID_PREFIX = 'PTC';

/** Mã lỗi cho Loại quan hệ */
export const RELATION_TYPE_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'REL_001',
        message: 'Không tìm thấy loại quan hệ.',
    },
    CODE_ALREADY_EXISTS: {
        success: false,
        code: 'REL_002',
        message: 'Mã loại quan hệ (code) đã tồn tại trong hệ thống.',
    },
    IN_USE: {
        success: false,
        code: 'REL_003',
        message: 'Loại quan hệ đang được sử dụng bởi hồ sơ người thân, không thể xóa.',
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'REL_004',
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: code, name.',
    },
};

/** Mã lỗi cho Người thân bệnh nhân */
export const PATIENT_CONTACT_ERRORS = {
    NOT_FOUND: {
        success: false,
        code: 'PTC_001',
        message: 'Không tìm thấy thông tin người thân.',
    },
    MISSING_REQUIRED_FIELDS: {
        success: false,
        code: 'PTC_002',
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: patient_id, relation_type_id, contact_name, phone_number.',
    },
    PATIENT_NOT_FOUND: {
        success: false,
        code: 'PTC_003',
        message: 'Không tìm thấy hồ sơ bệnh nhân được chỉ định.',
    },
    RELATION_TYPE_INVALID: {
        success: false,
        code: 'PTC_004',
        message: 'Loại quan hệ không tồn tại hoặc đã bị vô hiệu hóa.',
    },
    MISSING_EMERGENCY_FLAG: {
        success: false,
        code: 'PTC_005',
        message: 'Vui lòng cung cấp giá trị is_emergency_contact (true/false).',
    },
    MISSING_LEGAL_REP_FLAG: {
        success: false,
        code: 'PTC_006',
        message: 'Vui lòng cung cấp giá trị is_legal_representative (true/false).',
    },
    MISSING_MEDICAL_NOTE: {
        success: false,
        code: 'PTC_007',
        message: 'Vui lòng cung cấp nội dung ghi chú quyền quyết định y tế (medical_decision_note).',
    },
    NO_LEGAL_REPRESENTATIVE: {
        success: false,
        code: 'PTC_008',
        message: 'Bệnh nhân chưa được chỉ định người đại diện pháp lý.',
    },
};

/** Thông báo thành công cho Module 2.4 */
export const PATIENT_CONTACT_MESSAGES = {
    SET_EMERGENCY_SUCCESS: 'Cập nhật trạng thái liên hệ khẩn cấp thành công.',
    SET_LEGAL_REP_SUCCESS: 'Chỉ định người đại diện pháp lý thành công.',
    UNSET_LEGAL_REP_SUCCESS: 'Đã hủy chỉ định người đại diện pháp lý.',
    UPDATE_MEDICAL_NOTE_SUCCESS: 'Cập nhật ghi chú quyền quyết định y tế thành công.',
};

/** Cấu hình phân trang */
export const PATIENT_CONTACT_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
