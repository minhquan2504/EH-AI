import { Express } from 'express'
import productRouter from './Core/testProduct.route';
import authRoutes from './Core/auth.routes';
import userRoutes from './Core/user.routes';
import roleRoutes from './Core/role.routes';
import facilityRoutes from './Facility Management/facility.routes';
import branchRoutes from './Facility Management/branch.routes';
import departmentRoutes from './Facility Management/department.routes';
import medicalRoomRoutes from './Facility Management/medical-room.routes';
import permissionRoutes from './Core/permission.routes';
import moduleRoutes from './Core/module.routes';
import menuRoutes from './Core/menu.routes';
import apiPermissionRoutes from './Core/api-permission.routes';
import systemRoutes from './Core/system.routes';
import specialtyRouter from './Facility Management/specialty.route';
import masterDataRoutes from './Core/master-data.routes';
import { drugCategoryRoutes } from './Medication Management/drug-category.routes';
import { drugRoutes } from './Medication Management/drug.routes';
import medicalServiceRoutes from './Facility Management/medical-service.routes';
import specialtyServiceRoutes from './Facility Management/specialty-service.routes';
import doctorServiceRoutes from './Facility Management/doctor-service.routes';
import medicalEquipmentRoutes from './Facility Management/medical-equipment.routes';
import { bedRoutes } from './Facility Management/bed.routes';
import bookingConfigRoutes from './Facility Management/booking-config.routes';
import profileRoutes from './Core/profile.routes';
import notificationCategoryRoutes from './Core/notification-category.routes';
import notificationTemplateRoutes from './Core/notification-template.routes';
import notificationRoleConfigRoutes from './Core/notification-role-config.routes';
import userNotificationRoutes from './Core/user-notification.routes';
import staffRoutes from './Facility Management/staff.routes';
import shiftRoutes from './Facility Management/shift.routes';
import { slotRoutes } from './Facility Management/appointment-slot.routes';
import { staffScheduleRoutes } from './Facility Management/staff-schedule.routes';
import { leaveRoutes } from './Facility Management/leave.routes';
import { shiftSwapRoutes } from './Facility Management/shift-swap.routes';
import { licenseRoutes } from './Facility Management/license.routes';
import { operatingHourRoutes } from './Facility Management/operating-hour.routes';
import { closedDayRoutes } from './Facility Management/closed-day.routes';
import { holidayRoutes } from './Facility Management/holiday.routes';
import { facilityStatusRoutes } from './Facility Management/facility-status.routes';
import { patientRoutes } from './Patient Management/patient.routes';
import { medicalHistoryRoutes } from './Patient Management/medical-history.routes';
import insuranceProviderRoutes from './Patient Management/insurance-provider.routes';
import patientInsuranceRoutes from './Patient Management/patient-insurance.routes';
import insuranceCoverageRoutes from './Patient Management/insurance-coverage.routes';
import { relationTypeRoutes } from './Patient Management/relation-type.routes';
import { patientContactRoutes } from './Patient Management/patient-contact.routes';
import { documentTypeRoutes } from './Patient Management/document-type.routes';
import { patientDocumentRoutes } from './Patient Management/patient-document.routes';
import { patientTagRoutes } from './Patient Management/patient-tag.routes';
import { classificationRuleRoutes } from './Patient Management/classification-rule.routes';
import { appointmentRoutes } from './Appointment Management/appointment.routes';
import { consultationDurationRoutes } from './Appointment Management/consultation-duration.routes';
import { lockedSlotRoutes } from './Appointment Management/locked-slot.routes';
import { shiftServiceRoutes } from './Appointment Management/shift-service.routes';
import { doctorAvailabilityRoutes } from './Appointment Management/doctor-availability.routes';
import { doctorAbsenceRoutes } from './Appointment Management/doctor-absence.routes';
import { appointmentConfirmationRoutes } from './Appointment Management/appointment-confirmation.routes';
import { appointmentStatusRoutes } from './Appointment Management/appointment-status.routes';
import appointmentChangeRoutes from './Appointment Management/appointment-change.routes';
import appointmentCoordinationRoutes from './Appointment Management/appointment-coordination.routes';
import { roomMaintenanceRoutes } from './Facility Management/room-maintenance.routes';
import { encounterRoutes } from './EMR/encounter.routes';
import { clinicalExamRoutes } from './EMR/clinical-exam.routes';
import { diagnosisRoutes } from './EMR/diagnosis.routes';
import medicalOrderRoutes from './EMR/medical-order.routes';
import { prescriptionRoutes } from './EMR/prescription.routes';
import { medicalRecordRoutes } from './EMR/medical-record.routes';
import { treatmentProgressRoutes } from './EMR/treatment-progress.routes';
import { signOffRoutes } from './EMR/medical-signoff.routes';
import { dispensingRoutes } from './Medication Management/dispensing.routes';
import { inventoryRoutes } from './Medication Management/inventory.routes';
import { warehouseRoutes } from './Medication Management/warehouse.routes';
import { supplierRoutes } from './Medication Management/supplier.routes';
import { stockInRoutes } from './Medication Management/stock-in.routes';
import { stockOutRoutes } from './Medication Management/stock-out.routes';
import { medInstructionRoutes } from './Medication Management/med-instruction.routes';
import { healthProfileRoutes } from './EHR/health-profile.routes';
import { healthTimelineRoutes } from './EHR/health-timeline.routes';
import { medicalHistoryEhrRoutes } from './EHR/medical-history-ehr.routes';
import { clinicalResultsRoutes } from './EHR/clinical-results.routes';
import { medicationTreatmentRoutes } from './EHR/medication-treatment.routes';
import { vitalSignsRoutes } from './EHR/vital-signs.routes';
import { dataIntegrationRoutes } from './EHR/data-integration.routes';
import billingPricingRoutes from './Billing/billing-pricing.routes';
import billingInvoiceRoutes from './Billing/billing-invoices.routes';
import billingPaymentGatewayRoutes from './Billing/billing-payment-gateway.routes';
import billingOfflinePaymentRoutes from './Billing/billing-offline-payment.routes';
import billingDocumentRoutes from './Billing/billing-document.routes';
import billingReconciliationRoutes from './Billing/billing-reconciliation.routes';
import billingRefundRoutes from './Billing/billing-refund.routes';
import billingPricingPolicyRoutes from './Billing/billing-pricing-policy.routes';
import billingCashierAuthRoutes from './Billing/billing-cashier-auth.routes';
import { teleConsultationTypeRoutes } from './Remote Consultation/tele-consultation-type.routes';
import { teleBookingRoutes } from './Remote Consultation/tele-booking.routes';
import { teleRoomRoutes } from './Remote Consultation/tele-room.routes';
import { medicalChatRoutes } from './Remote Consultation/tele-medical-chat.routes';
import { teleResultRoutes } from './Remote Consultation/tele-result.routes';
import { telePrescriptionRoutes } from './Remote Consultation/tele-prescription.routes';
import { teleFollowUpRoutes } from './Remote Consultation/tele-followup.routes';
import { teleQualityRoutes } from './Remote Consultation/tele-quality.routes';
import { teleConfigRoutes } from './Remote Consultation/tele-config.routes';
import { aiHealthChatRoutes } from './AI/ai-health-chat.routes';
import aiRagRoutes from './AI/ai-rag.routes';
import { verifySepayWebhook } from '../middleware/verifyWebhook.middleware';
import { sepayWebhook } from '../controllers/Billing/billing-payment-gateway.controller';
import { auditMiddleware } from '../middleware/audit.middleware';

export const initRoutes = (app: Express) => {
    // Audit Middleware
    app.use(auditMiddleware);

    //test product routes
    app.use('/api/test', productRouter)

    //auth routes
    app.use('/api/auth', authRoutes);

    //user management routes
    app.use('/api/users', userRoutes);

    //medical staff management routes
    app.use('/api/staff', staffRoutes);

    //shift management routes
    app.use('/api/shifts', shiftRoutes);

    //appointment slot routes
    app.use('/api/slots', slotRoutes);

    //staff schedule routes
    app.use('/api/staff-schedules', staffScheduleRoutes);

    //leave management routes
    app.use('/api/leaves', leaveRoutes);

    //shift swap routes
    app.use('/api/shift-swaps', shiftSwapRoutes);

    //license management routes
    app.use('/api/licenses', licenseRoutes);

    //operating hours management routes
    app.use('/api/operating-hours', operatingHourRoutes);

    //closed days management routes
    app.use('/api/closed-days', closedDayRoutes);

    //holidays management routes
    app.use('/api/holidays', holidayRoutes);

    //facility status & calendar routes
    app.use('/api/facility-status', facilityStatusRoutes);

    //role dropdowns routes
    app.use('/api/roles', roleRoutes);

    //facility dropdown routes
    app.use('/api/facilities', facilityRoutes);

    //branch management routes
    app.use('/api/branches', branchRoutes);

    //department management routes
    app.use('/api/departments', departmentRoutes);

    //medical rooms management routes
    app.use('/api/medical-rooms', medicalRoomRoutes);

    //permissions routes
    app.use('/api/permissions', permissionRoutes);

    // feature modules routes
    app.use('/api/modules', moduleRoutes);

    // system menus routes
    app.use('/api/menus', menuRoutes);

    // api permission settings
    app.use('/api/api-permissions', apiPermissionRoutes);

    // system settings routes
    app.use('/api/system', systemRoutes);

    // specialty routes
    app.use('/api/specialties', specialtyRouter);

    // master data routes
    app.use('/api/master-data', masterDataRoutes);

    // Module 5.1 – Medication Management (Danh mục thuốc & Dữ liệu chuẩn)
    app.use('/api/pharmacy/categories', drugCategoryRoutes);
    app.use('/api/pharmacy/drugs', drugRoutes);

    // Module 5.5 – Dispensing Management (Cấp phát thuốc & xuất kho)
    app.use('/api/dispensing', dispensingRoutes);

    // Module 5.6 – Drug Inventory Tracking (Theo dõi tồn kho)
    app.use('/api/inventory', inventoryRoutes);

    // Warehouse Management (Quản lý kho thuốc)
    app.use('/api/warehouses', warehouseRoutes);

    // Module 5.7/5.8 – Stock-In Management (Nhập kho & NCC)
    app.use('/api/suppliers', supplierRoutes);
    app.use('/api/stock-in', stockInRoutes);

    // Module 5.9 – Stock-Out Management (Xuất kho & Hủy hàng)
    app.use('/api/stock-out', stockOutRoutes);

    // Module 5.10 – Medication Instructions (Hướng dẫn sử dụng thuốc)
    app.use('/api/medication-instructions', medInstructionRoutes);

    // medical services
    app.use('/api/medical-services', medicalServiceRoutes);

    // specialty-service mapping (2.9.1)
    app.use('/api/specialty-services', specialtyServiceRoutes);

    // doctor-service mapping (2.9.2)
    app.use('/api/doctor-services', doctorServiceRoutes);

    // medical equipment management (2.10)
    app.use('/api/equipments', medicalEquipmentRoutes);

    // bed management (2.11)
    app.use('/api/beds', bedRoutes);

    // booking configurations (2.12)
    app.use('/api/booking-configs', bookingConfigRoutes);

    // profile routes
    app.use('/api/profile', profileRoutes);

    // Notification Core Module Routes
    app.use('/api/notifications/categories', notificationCategoryRoutes);
    app.use('/api/notifications/templates', notificationTemplateRoutes);
    app.use('/api/notifications/role-configs', notificationRoleConfigRoutes);
    app.use('/api/notifications/inbox', userNotificationRoutes);

    // Patient Management (2.1)
    app.use('/api/patients', patientRoutes);

    // Medical History (2.2 )
    app.use('/api/medical-history', medicalHistoryRoutes);

    // Insurance Providers & Patient Insurances (2.3)
    app.use('/api/insurance-providers', insuranceProviderRoutes);
    app.use('/api/patient-insurances', patientInsuranceRoutes);
    app.use('/api/insurance-coverage', insuranceCoverageRoutes);

    // Patient Relations & Relation Types (2.4)
    app.use('/api/relation-types', relationTypeRoutes);
    app.use('/api/patient-relations', patientContactRoutes);

    // Document Types & Patient Documents (2.5)
    app.use('/api/document-types', documentTypeRoutes);
    app.use('/api/patient-documents', patientDocumentRoutes);

    // Patient Tags (2.6)
    app.use('/api/patient-tags', patientTagRoutes);

    // Classification Rules (2.6.5)
    app.use('/api/patient-classification-rules', classificationRuleRoutes);

    // Appointment Management (3.1)
    app.use('/api/appointments', appointmentRoutes);

    // Module 3.2 – Quản lý khung giờ & ca khám
    app.use('/api/facilities', consultationDurationRoutes);
    app.use('/api/locked-slots', lockedSlotRoutes);
    app.use('/api/shift-services', shiftServiceRoutes);

    // Module 3.3 – Quản lý lịch bác sĩ
    app.use('/api/doctor-availability', doctorAvailabilityRoutes);
    app.use('/api/doctor-absences', doctorAbsenceRoutes);

    // Module 3.4 – Quản lý phòng khám & tài nguyên
    app.use('/api/room-maintenance', roomMaintenanceRoutes);

    // Module 3.6 – Xác nhận & Nhắc lịch khám
    app.use('/api/appointment-confirmations', appointmentConfirmationRoutes);

    // Module 3.7 – Check-in & Trạng thái lịch khám
    app.use('/api/appointment-status', appointmentStatusRoutes);

    // Module 3.8 – Quản lý thay đổi & dời lịch
    app.use('/api/appointment-changes', appointmentChangeRoutes);

    // Module 3.9 – Điều phối & tối ưu lịch khám
    app.use('/api/appointment-coordination', appointmentCoordinationRoutes);

    // MODULE 4: KHÁM BỆNH & HỒ SƠ BỆNH ÁN (EMR)
    // Module 4.1 – Encounter Management
    app.use('/api/encounters', encounterRoutes);

    // Module 4.2 – Clinical Examination
    app.use('/api/clinical-examinations', clinicalExamRoutes);

    // Module 4.3 – Diagnosis Management
    app.use('/api/diagnoses', diagnosisRoutes);

    // Module 4.4 – Medical Orders (Chỉ định dịch vụ y tế)
    app.use('/api/medical-orders', medicalOrderRoutes);

    // Module 4.5 – Prescription Management (Kê đơn thuốc)
    app.use('/api/prescriptions', prescriptionRoutes);

    // Module 4.6 – Medical Records (Hồ sơ Bệnh án Điện tử)
    app.use('/api/medical-records', medicalRecordRoutes);

    // Module 4.7 – Treatment Progress (Theo dõi Tiến trình Điều trị)
    app.use('/api/treatment-plans', treatmentProgressRoutes);

    // Module 4.8 – Medical Sign-off (Ký số & Xác nhận Hồ sơ Y khoa)
    app.use('/api/sign-off', signOffRoutes);

    // ═══ MODULE 6: HỒ SƠ SỨC KHỎE ĐIỆN TỬ (EHR) ═══
    // Module 6.1 – Patient Health Profile (Hồ sơ sức khỏe tổng hợp)
    app.use('/api/ehr', healthProfileRoutes);

    // Module 6.2 – Health Timeline (Dòng thời gian sức khỏe)
    app.use('/api/ehr', healthTimelineRoutes);

    // Module 6.3 – Medical History & Risk Factors (Tiền sử bệnh & yếu tố nguy cơ)
    app.use('/api/ehr', medicalHistoryEhrRoutes);

    // Module 6.4 – Clinical Results (Kết quả xét nghiệm & cận lâm sàng)
    app.use('/api/ehr', clinicalResultsRoutes);

    // Module 6.5 – Medication & Treatment Records (Hồ sơ đơn thuốc & điều trị)
    app.use('/api/ehr', medicationTreatmentRoutes);

    // Module 6.6 – Vital Signs & Health Metrics (Chỉ số sức khỏe & sinh hiệu)
    app.use('/api/ehr', vitalSignsRoutes);

    // Module 6.8 – Data Integration (Đồng bộ dữ liệu & tích hợp bên ngoài)
    app.use('/api/ehr', dataIntegrationRoutes);

    // ═══ MODULE 9: THANH TOÁN (BILLING) ═══
    // Module 9.1 – Quản lý danh mục dịch vụ & bảng giá
    app.use('/api/billing/pricing', billingPricingRoutes);

    // Module 9.2 – Thu phí khám & dịch vụ y tế
    app.use('/api/billing', billingInvoiceRoutes);

    // Module 9.3 – Thanh toán trực tuyến (SePay)
    app.use('/api/billing/payments', billingPaymentGatewayRoutes);

    // Module 9.4 – Thanh toán tại quầy (Offline Payment)
    app.use('/api/billing', billingOfflinePaymentRoutes);

    // Module 9.5 – Quản lý hóa đơn & chứng từ thanh toán
    app.use('/api/billing', billingDocumentRoutes);

    // Module 9.6 – Đối soát & quyết toán thanh toán
    app.use('/api/billing', billingReconciliationRoutes);

    // Module 9.7 – Hoàn tiền & điều chỉnh giao dịch
    app.use('/api/billing', billingRefundRoutes);

    // Module 9.8 – Quản lý chính sách giá & ưu đãi
    app.use('/api/billing', billingPricingPolicyRoutes);

    // Module 9.9 – Quản lý phân quyền thu ngân
    app.use('/api/billing', billingCashierAuthRoutes);

    // ═══ MODULE 8: KHÁM TỪ XA (REMOTE CONSULTATION) ═══
    // Module 8.1 – Quản lý hình thức khám từ xa
    app.use('/api/teleconsultation', teleConsultationTypeRoutes);
    // Module 8.2 – Đặt lịch tư vấn & khám từ xa
    app.use('/api/teleconsultation', teleBookingRoutes);
    // Module 8.3 – Phòng khám trực tuyến
    app.use('/api/teleconsultation', teleRoomRoutes);
    // Module 8.4 – Trao đổi thông tin y tế trực tuyến
    app.use('/api/teleconsultation', medicalChatRoutes);
    // Module 8.5 – Ghi nhận kết quả khám từ xa
    app.use('/api/teleconsultation', teleResultRoutes);
    // Module 8.6 – Kê đơn & chỉ định từ xa
    app.use('/api/teleconsultation', telePrescriptionRoutes);
    // Module 8.7 – Theo dõi sau tư vấn & tái khám
    app.use('/api/teleconsultation', teleFollowUpRoutes);
    // Module 8.8 – Quản lý chất lượng & đánh giá
    app.use('/api/teleconsultation', teleQualityRoutes);
    // Module 8.9 – Cấu hình & quản trị hệ thống
    app.use('/api/teleconsultation', teleConfigRoutes);

    // ═══ MODULE 7: AI TƯ VẤN SỨC KHỎE ═══
    // Module 7.1 – AI Tư vấn sức khỏe ban đầu
    app.use('/api/ai/health-chat', aiHealthChatRoutes);

    // Module 7.2 – AI Đọc Hiểu Tài Liệu (Knowledge Base & RAG)
    app.use('/api/ai/rag', aiRagRoutes);

    // Webhook alias — Nginx strip /api/ nên SePay gọi /api/hooks/sepay-payment → Express nhận /hooks/sepay-payment
    app.post('/hooks/sepay-payment', verifySepayWebhook, sepayWebhook);
}

