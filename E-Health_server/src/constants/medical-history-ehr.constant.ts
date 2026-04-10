
/** Loại tiền sử bệnh */
export const HISTORY_TYPE = {
    PERSONAL: 'PERSONAL',
    FAMILY: 'FAMILY',
} as const;

/** Trạng thái tiền sử */
export const HISTORY_STATUS = {
    ACTIVE: 'ACTIVE',
    RESOLVED: 'RESOLVED',
} as const;

/** Mối quan hệ gia đình (dùng khi history_type=FAMILY) */
export const FAMILY_RELATIONSHIP = {
    FATHER: 'FATHER',
    MOTHER: 'MOTHER',
    SIBLING: 'SIBLING',
    GRANDPARENT: 'GRANDPARENT',
    UNCLE_AUNT: 'UNCLE_AUNT',
    CHILD: 'CHILD',
    SPOUSE: 'SPOUSE',
    OTHER: 'OTHER',
} as const;

/** Loại dị ứng */
export const ALLERGEN_TYPE = {
    DRUG: 'DRUG',
    FOOD: 'FOOD',
    ENVIRONMENT: 'ENVIRONMENT',
    OTHER: 'OTHER',
} as const;

/** Mức độ dị ứng */
export const ALLERGY_SEVERITY = {
    MILD: 'MILD',
    MODERATE: 'MODERATE',
    SEVERE: 'SEVERE',
} as const;

/** Loại yếu tố nguy cơ */
export const RISK_FACTOR_TYPE = {
    SMOKING: 'SMOKING',
    ALCOHOL: 'ALCOHOL',
    OCCUPATION: 'OCCUPATION',
    LIFESTYLE: 'LIFESTYLE',
    GENETIC: 'GENETIC',
    OTHER: 'OTHER',
} as const;

/** Mức độ yếu tố nguy cơ */
export const RISK_SEVERITY = {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
} as const;

/** Loại tình trạng đặc biệt */
export const SPECIAL_CONDITION_TYPE = {
    PREGNANCY: 'PREGNANCY',
    DISABILITY: 'DISABILITY',
    IMPLANT: 'IMPLANT',
    TRANSPLANT: 'TRANSPLANT',
    INFECTIOUS: 'INFECTIOUS',
    MENTAL_HEALTH: 'MENTAL_HEALTH',
    OTHER: 'OTHER',
} as const;

/** Cấu hình chung */
export const MH_EHR_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/** Thông báo lỗi */
export const MH_EHR_ERRORS = {
    PATIENT_NOT_FOUND: 'Bệnh nhân không tồn tại hoặc đã bị xóa',
    HISTORY_NOT_FOUND: 'Bản ghi tiền sử không tồn tại hoặc đã bị xóa',
    HISTORY_NOT_BELONG: 'Bản ghi tiền sử không thuộc bệnh nhân này',
    ALLERGY_NOT_FOUND: 'Bản ghi dị ứng không tồn tại hoặc đã bị xóa',
    ALLERGY_NOT_BELONG: 'Bản ghi dị ứng không thuộc bệnh nhân này',
    ALLERGY_DUPLICATE: 'Dị ứng với chất này đã được ghi nhận',
    RISK_NOT_FOUND: 'Yếu tố nguy cơ không tồn tại hoặc đã bị xóa',
    RISK_NOT_BELONG: 'Yếu tố nguy cơ không thuộc bệnh nhân này',
    SPECIAL_NOT_FOUND: 'Tình trạng đặc biệt không tồn tại hoặc đã bị xóa',
    SPECIAL_NOT_BELONG: 'Tình trạng đặc biệt không thuộc bệnh nhân này',
    CONDITION_NAME_REQUIRED: 'Tên tình trạng/bệnh lý là bắt buộc',
    ALLERGEN_NAME_REQUIRED: 'Tên dị nguyên là bắt buộc',
    DETAILS_REQUIRED: 'Chi tiết yếu tố nguy cơ là bắt buộc',
    DESCRIPTION_REQUIRED: 'Mô tả tình trạng đặc biệt là bắt buộc',
    INVALID_HISTORY_TYPE: 'Loại tiền sử không hợp lệ (PERSONAL hoặc FAMILY)',
    INVALID_STATUS: 'Trạng thái không hợp lệ (ACTIVE hoặc RESOLVED)',
    INVALID_ALLERGEN_TYPE: 'Loại dị ứng không hợp lệ',
    INVALID_RISK_TYPE: 'Loại yếu tố nguy cơ không hợp lệ',
    INVALID_SPECIAL_TYPE: 'Loại tình trạng đặc biệt không hợp lệ',
    FAMILY_RELATIONSHIP_REQUIRED: 'Mối quan hệ gia đình là bắt buộc khi history_type=FAMILY',
} as const;

/** Thông báo thành công */
export const MH_EHR_SUCCESS = {
    HISTORIES_FETCHED: 'Lấy danh sách tiền sử thành công',
    HISTORY_FETCHED: 'Lấy chi tiết tiền sử thành công',
    HISTORY_CREATED: 'Thêm tiền sử thành công',
    HISTORY_UPDATED: 'Cập nhật tiền sử thành công',
    HISTORY_STATUS_UPDATED: 'Cập nhật trạng thái tiền sử thành công',
    HISTORY_DELETED: 'Xóa tiền sử thành công',
    ALLERGIES_FETCHED: 'Lấy danh sách dị ứng thành công',
    ALLERGY_FETCHED: 'Lấy chi tiết dị ứng thành công',
    ALLERGY_CREATED: 'Thêm dị ứng thành công',
    ALLERGY_UPDATED: 'Cập nhật dị ứng thành công',
    ALLERGY_DELETED: 'Xóa dị ứng thành công',
    RISKS_FETCHED: 'Lấy danh sách yếu tố nguy cơ thành công',
    RISK_CREATED: 'Thêm yếu tố nguy cơ thành công',
    RISK_UPDATED: 'Cập nhật yếu tố nguy cơ thành công',
    RISK_DELETED: 'Xóa yếu tố nguy cơ thành công',
    SPECIALS_FETCHED: 'Lấy danh sách tình trạng đặc biệt thành công',
    SPECIAL_CREATED: 'Thêm tình trạng đặc biệt thành công',
    SPECIAL_DELETED: 'Xóa tình trạng đặc biệt thành công',
} as const;
