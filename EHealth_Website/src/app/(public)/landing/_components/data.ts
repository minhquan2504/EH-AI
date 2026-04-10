/* ===================================================================
   Landing page — shared data constants
   Inspired by tamanhhospital.vn, ump.edu.vn
   =================================================================== */

export const IMG = {
    hero: "/img/general/hero-doctor.png",
    heroBg: "/img/general/hero-bg.png",
    heroSlides: ["/img/general/hero-slide-1.png", "/img/general/hero-slide-2.png", "/img/general/hero-slide-3.png"],
    about: "/img/general/about-hospital.png",
    ctaBg: "/img/general/cta-bg.png",
    equipment: "/img/general/equipment.png",
    labRoom: "/img/general/lab-room.png",
    surgeryRoom: "/img/general/surgery-room.png",
    lobby: "/img/general/lobby.png",
    videoThumb: "/img/general/video-thumb.png",
    appMockup: "/img/general/app-mockup.png",
    certIso: "/img/general/cert-iso.png",
    certJci: "/img/general/cert-jci.png",
    certByt: "/img/general/cert-byt.png",
    certHimss: "/img/general/cert-himss.png",
    certTop10: "/img/general/cert-top10.png",
    certWho: "/img/general/cert-who.png",
    doctors: ["/img/doctors/doctor-1.png", "/img/doctors/doctor-2.png", "/img/doctors/doctor-3.png", "/img/doctors/doctor-4.png", "/img/doctors/doctor-5.png", "/img/doctors/doctor-6.png", "/img/doctors/doctor-7.png", "/img/doctors/doctor-8.png"],
    services: ["/img/services/cardiology.png", "/img/services/neurology.png", "/img/services/dermatology.png", "/img/services/pediatrics.png", "/img/services/ophthalmology.png", "/img/services/dentistry.png", "/img/services/orthopedics.png", "/img/services/obstetrics.png"],
    testimonials: ["/img/testimonials/patient-1.png", "/img/testimonials/patient-2.png", "/img/testimonials/patient-3.png"],
    partners: ["/img/partners/bhxh.png", "/img/partners/baolong.png", "/img/partners/baoviet.png", "/img/partners/manulife.png", "/img/partners/prudential.png", "/img/partners/aia.png", "/img/partners/pvi.png", "/img/partners/liberty.png", "/img/partners/vbi.png", "/img/partners/sunlife.png", "/img/partners/fwd.png", "/img/partners/dai-ichi.png"],
    news: ["/img/news/news-1.png", "/img/news/news-2.png", "/img/news/news-3.png"],
};

export const SERVICES = [
    { icon: "cardiology", title: "Tim mạch", desc: "Khám, chẩn đoán và điều trị toàn diện bệnh lý tim mạch với trang thiết bị hiện đại nhất.", color: "from-red-500 to-rose-600", img: IMG.services[0], doctorCount: 18, features: ["Siêu âm tim", "Đặt stent", "Điện tâm đồ"] },
    { icon: "neurology", title: "Thần kinh", desc: "Điều trị đau đầu, đột quỵ, Parkinson, và các rối loạn thần kinh phức tạp.", color: "from-violet-500 to-purple-600", img: IMG.services[1], doctorCount: 12, features: ["Đo điện não", "MRI não", "Phẫu thuật TK"] },
    { icon: "dermatology", title: "Da liễu", desc: "Chăm sóc da, điều trị mụn, nám, và các bệnh lý da liễu bằng công nghệ laser.", color: "from-amber-500 to-orange-600", img: IMG.services[2], doctorCount: 8, features: ["Laser trị nám", "PRP trị rụng tóc", "Trị sẹo"] },
    { icon: "child_care", title: "Nhi khoa", desc: "Chăm sóc sức khoẻ toàn diện cho trẻ em từ sơ sinh đến 16 tuổi.", color: "from-cyan-500 to-teal-600", img: IMG.services[3], doctorCount: 15, features: ["Tiêm chủng", "Dinh dưỡng", "Hô hấp nhi"] },
    { icon: "visibility", title: "Nhãn khoa", desc: "Khám mắt, phẫu thuật laser LASIK, điều trị tật khúc xạ chuyên sâu.", color: "from-blue-500 to-indigo-600", img: IMG.services[4], doctorCount: 6, features: ["LASIK", "Phaco", "Glaucoma"] },
    { icon: "dentistry", title: "Răng hàm mặt", desc: "Nha khoa tổng hợp: nhổ răng, trồng Implant, niềng răng, thẩm mỹ cười.", color: "from-emerald-500 to-green-600", img: IMG.services[5], doctorCount: 10, features: ["Implant", "Niềng răng", "Tẩy trắng"] },
    { icon: "orthopedics", title: "Chấn thương chỉnh hình", desc: "Phẫu thuật và điều trị xương khớp, thay khớp nhân tạo, chấn thương thể thao.", color: "from-sky-500 to-blue-600", img: IMG.services[6], doctorCount: 9, features: ["Thay khớp gối", "Nội soi khớp", "Vật lý trị liệu"] },
    { icon: "pregnant_woman", title: "Sản phụ khoa", desc: "Theo dõi thai kỳ, sinh đẻ an toàn, khám phụ khoa, hỗ trợ sinh sản.", color: "from-pink-500 to-rose-600", img: IMG.services[7], doctorCount: 14, features: ["IVF", "Sinh thường", "Sinh mổ"] },
];

export const DOCTORS = [
    { name: "PGS.TS. Trần Văn Minh", title: "Trưởng khoa Tim mạch", dept: "Tim mạch", exp: "25 năm kinh nghiệm", specialties: ["Can thiệp mạch vành", "Suy tim", "Rối loạn nhịp"], img: IMG.doctors[0], rating: 4.9, reviews: 320, available: true, fee: "500.000đ" },
    { name: "TS.BS. Nguyễn Thị Hoa", title: "Chuyên gia Da liễu", dept: "Da liễu", exp: "18 năm kinh nghiệm", specialties: ["Laser trị nám", "Trị mụn", "Thẩm mỹ da"], img: IMG.doctors[1], rating: 4.8, reviews: 285, available: true, fee: "400.000đ" },
    { name: "BS.CK2. Phạm Đức Long", title: "Trưởng khoa Nhi", dept: "Nhi khoa", exp: "20 năm kinh nghiệm", specialties: ["Hô hấp nhi", "Tiêu hoá nhi", "Dinh dưỡng"], img: IMG.doctors[2], rating: 4.9, reviews: 410, available: false, fee: "450.000đ" },
    { name: "TS.BS. Lê Hoàng Anh", title: "Chuyên gia Thần kinh", dept: "Thần kinh", exp: "15 năm kinh nghiệm", specialties: ["Đột quỵ", "Parkinson", "Đau đầu mạn"], img: IMG.doctors[3], rating: 4.7, reviews: 198, available: true, fee: "500.000đ" },
    { name: "PGS.TS. Võ Thanh Tùng", title: "Trưởng khoa Chỉnh hình", dept: "Chấn thương chỉnh hình", exp: "22 năm kinh nghiệm", specialties: ["Thay khớp gối", "Nội soi khớp vai", "Chấn thương thể thao"], img: IMG.doctors[4], rating: 4.8, reviews: 256, available: true, fee: "450.000đ" },
    { name: "TS.BS. Đặng Minh Châu", title: "Trưởng khoa Sản phụ", dept: "Sản phụ khoa", exp: "20 năm kinh nghiệm", specialties: ["IVF", "Thai kỳ nguy cơ cao", "Sinh mổ"], img: IMG.doctors[5], rating: 4.9, reviews: 380, available: true, fee: "500.000đ" },
    { name: "BS.CK2. Lý Ngọc Hà", title: "Chuyên gia Nhãn khoa", dept: "Nhãn khoa", exp: "16 năm kinh nghiệm", specialties: ["LASIK", "Phẫu thuật Phaco", "Điều trị Glaucoma"], img: IMG.doctors[6], rating: 4.7, reviews: 175, available: true, fee: "400.000đ" },
    { name: "TS.BS. Huỳnh Bảo Quốc", title: "Trưởng khoa RHM", dept: "Răng hàm mặt", exp: "18 năm kinh nghiệm", specialties: ["Implant nha khoa", "Niềng răng", "Phẫu thuật hàm mặt"], img: IMG.doctors[7], rating: 4.8, reviews: 220, available: true, fee: "450.000đ" },
];

export const TESTIMONIALS = [
    { name: "Chị Nguyễn Thị Mai", age: 45, dept: "Tim mạch", text: "Tôi rất hài lòng với dịch vụ tại EHealth. Bác sĩ Minh đã giúp tôi phát hiện và điều trị kịp thời bệnh tim. Quy trình đặt lịch rất thuận tiện, không phải chờ đợi lâu.", rating: 5, img: IMG.testimonials[0], date: "15/02/2026" },
    { name: "Anh Trần Đức Hùng", age: 38, dept: "Nhi khoa", text: "Đưa con đi khám nhi ở đây rất yên tâm. BS. Long rất tận tình, giải thích cặn kẽ cho ba mẹ. Cơ sở vật chất sạch sẽ, hiện đại. Sẽ quay lại lần tới.", rating: 5, img: IMG.testimonials[1], date: "08/03/2026" },
    { name: "Chị Lê Phương Thảo", age: 32, dept: "Da liễu", text: "Điều trị da liễu tại đây hiệu quả ngoài mong đợi. Sau 3 tháng da đã cải thiện rõ rệt. Công nghệ laser hiện đại, bác sĩ tận tâm. Cảm ơn BS. Hoa rất nhiều!", rating: 5, img: IMG.testimonials[2], date: "20/03/2026" },
];

export const COUNTER_STATS = [
    { label: "Bệnh nhân tin tưởng", value: 50000, suffix: "+", icon: "groups", detail: "mỗi năm" },
    { label: "PGS, TS, BS chuyên khoa", value: 120, suffix: "+", icon: "medical_services", detail: "8 chuyên khoa" },
    { label: "Năm hoạt động", value: 15, suffix: "+", icon: "calendar_month", detail: "từ năm 2011" },
    { label: "Tỷ lệ hài lòng", value: 98, suffix: "%", icon: "thumb_up", detail: "12,500+ đánh giá" },
];

export const PROCESS_STEPS = [
    { step: "01", title: "Đặt lịch online", desc: "Chọn bác sĩ, chuyên khoa và khung giờ phù hợp chỉ trong 2 phút", icon: "calendar_month" },
    { step: "02", title: "Xác nhận lịch hẹn", desc: "Nhận SMS/email xác nhận trong vòng 30 phút", icon: "verified" },
    { step: "03", title: "Khám bệnh", desc: "Đến bệnh viện đúng giờ, không cần chờ đợi lâu", icon: "stethoscope" },
    { step: "04", title: "Nhận kết quả", desc: "Xem kết quả xét nghiệm và đơn thuốc trực tuyến", icon: "assignment" },
];

export const NAV_ITEMS = [
    { id: "services", label: "Chuyên khoa" },
    { id: "medical-services", label: "Dịch vụ", href: "/services" },
    { id: "about", label: "Giới thiệu" },
    { id: "doctors", label: "Đội ngũ bác sĩ" },
    { id: "equipment", label: "Trang thiết bị" },
    { id: "testimonials", label: "Đánh giá" },
    { id: "news", label: "Tin tức" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Liên hệ" },
];

export const FAQ_DATA = [
    { q: "Làm thế nào để đặt lịch khám?", a: "Bạn có thể đặt lịch khám trực tiếp trên website bằng cách điền form \"Đặt lịch khám\" hoặc gọi hotline (028) 1234 5678. Chúng tôi sẽ xác nhận lịch hẹn qua SMS trong vòng 30 phút." },
    { q: "Bệnh viện có nhận BHYT không?", a: "Có. EHealth Hospital là cơ sở khám chữa bệnh được BHXH công nhận. Chúng tôi nhận tất cả các loại thẻ BHYT theo quy định hiện hành. Vui lòng mang theo thẻ BHYT và CMND/CCCD khi đến khám." },
    { q: "Chi phí khám bệnh khoảng bao nhiêu?", a: "Chi phí khám chuyên khoa từ 200.000 — 500.000đ tuỳ loại dịch vụ. Khám tổng quát từ 1.500.000đ. Chi phí xét nghiệm và cận lâm sàng sẽ được tư vấn cụ thể sau khi khám." },
    { q: "Bệnh viện làm việc vào Chủ nhật không?", a: "Bệnh viện làm việc từ Thứ 2 — Thứ 7 (7:00 — 20:00). Chủ nhật chỉ tiếp nhận cấp cứu 24/7. Các dịch vụ đặc biệt có thể hẹn riêng ngoài giờ hành chính." },
    { q: "Tôi có thể xem kết quả xét nghiệm online không?", a: "Có. Sau khi đăng ký tài khoản trên hệ thống EHealth, bạn có thể xem kết quả xét nghiệm, lịch sử khám bệnh, đơn thuốc trực tuyến bất cứ lúc nào." },
    { q: "Bệnh viện có dịch vụ tư vấn từ xa không?", a: "Có. Chúng tôi cung cấp dịch vụ Telemedicine — tư vấn sức khoẻ trực tuyến qua video call với bác sĩ chuyên khoa. Đặt lịch tư vấn từ xa tại mục \"Đặt lịch khám\" và chọn hình thức \"Tư vấn online\"." },
];

export const PARTNERS = [
    { name: "Bảo hiểm Xã hội Việt Nam", img: IMG.partners[0] },
    { name: "Bảo Long", img: IMG.partners[1] },
    { name: "Bảo Việt", img: IMG.partners[2] },
    { name: "Manulife", img: IMG.partners[3] },
    { name: "Prudential", img: IMG.partners[4] },
    { name: "AIA", img: IMG.partners[5] },
    { name: "PVI", img: IMG.partners[6] },
    { name: "Liberty", img: IMG.partners[7] },
    { name: "VBI", img: IMG.partners[8] },
    { name: "Sun Life", img: IMG.partners[9] },
    { name: "FWD", img: IMG.partners[10] },
    { name: "Dai-ichi Life", img: IMG.partners[11] },
];

export const HERO_SLIDES = [
    { img: IMG.heroSlides[0], title: "Hệ thống Y tế", highlight: "Thông minh", subtitle: "hàng đầu Việt Nam", desc: "Đội ngũ 120+ bác sĩ chuyên khoa, trang thiết bị nhập khẩu từ Đức, Nhật, Mỹ." },
    { img: IMG.heroSlides[1], title: "Ứng dụng", highlight: "AI tiên phong", subtitle: "trong chẩn đoán", desc: "Hệ thống AI hỗ trợ chẩn đoán với độ chính xác 97%, rút ngắn thời gian điều trị." },
    { img: IMG.heroSlides[2], title: "Đội ngũ", highlight: "Chuyên gia", subtitle: "tận tâm", desc: "24 PGS.TS, 120+ bác sĩ CK2, kinh nghiệm trung bình 18 năm trong nghề." },
];

export const CERTIFICATIONS = [
    { name: "ISO 9001:2015", desc: "Chứng nhận quản lý chất lượng", img: IMG.certIso, icon: "verified", color: "text-blue-600 bg-blue-50", year: "2015" },
    { name: "JCI Accreditation", desc: "Chuẩn quốc tế bệnh viện", img: IMG.certJci, icon: "workspace_premium", color: "text-amber-600 bg-amber-50", year: "2019" },
    { name: "Bộ Y Tế", desc: "Giấy phép hoạt động", img: IMG.certByt, icon: "shield_with_house", color: "text-red-600 bg-red-50", year: "2011" },
    { name: "HIMSS", desc: "Chứng nhận Y tế số", img: IMG.certHimss, icon: "computer", color: "text-indigo-600 bg-indigo-50", year: "2023" },
    { name: "Top 10 Bệnh viện", desc: "Bệnh viện xuất sắc Việt Nam", img: IMG.certTop10, icon: "emoji_events", color: "text-emerald-600 bg-emerald-50", year: "2024" },
    { name: "WHO Partnership", desc: "Đối tác Y tế Quốc tế", img: IMG.certWho, icon: "public", color: "text-cyan-600 bg-cyan-50", year: "2020" },
];

export const EQUIPMENT_LIST = [
    { name: "Máy MRI 3.0 Tesla", desc: "Chụp cộng hưởng từ độ phân giải cao, nhập khẩu từ Siemens (Đức)", icon: "mri", img: IMG.equipment },
    { name: "Phòng mổ Hybrid", desc: "Tích hợp hệ thống DSA, cho phép can thiệp tim mạch & phẫu thuật đồng thời", icon: "surgical", img: IMG.surgeryRoom },
    { name: "Phòng xét nghiệm tự động", desc: "Hệ thống xét nghiệm Roche cobas 8000, trả kết quả trong 2 giờ", icon: "biotech", img: IMG.labRoom },
];

export const NEWS_DATA = [
    { title: "EHealth ứng dụng AI trong chẩn đoán ung thư sớm", excerpt: "Hệ thống AI mới giúp phát hiện tế bào ung thư với độ chính xác 97%, rút ngắn thời gian chẩn đoán từ 2 tuần xuống còn 2 ngày.", date: "20/03/2026", category: "Công nghệ", img: IMG.news[0] },
    { title: "Mổ thay khớp gối bằng Robot thành công ca thứ 500", excerpt: "Robot phẫu thuật MAKO giúp thay khớp gối chính xác tuyệt đối, bệnh nhân phục hồi nhanh hơn 40% so với phương pháp truyền thống.", date: "15/03/2026", category: "Thành tựu", img: IMG.news[1] },
    { title: "5 dấu hiệu cảnh báo bệnh tim mạch cần khám ngay", excerpt: "PGS.TS. Trần Văn Minh chia sẻ những dấu hiệu quan trọng mà nhiều người thường bỏ qua, có thể dẫn đến đột quỵ hoặc nhồi máu cơ tim.", date: "10/03/2026", category: "Sức khoẻ", img: IMG.news[2] },
];

export const MILESTONES = [
    { year: "2011", title: "Thành lập", desc: "Khởi đầu với 50 giường bệnh và 20 bác sĩ" },
    { year: "2015", title: "ISO 9001:2015", desc: "Đạt chứng nhận quản lý chất lượng quốc tế" },
    { year: "2019", title: "JCI Accreditation", desc: "Chứng nhận chất lượng bệnh viện quốc tế" },
    { year: "2022", title: "Smart Hospital", desc: "Triển khai hệ thống bệnh viện thông minh toàn diện" },
    { year: "2025", title: "50.000+ bệnh nhân", desc: "Cột mốc phục vụ 50.000 bệnh nhân/năm" },
];