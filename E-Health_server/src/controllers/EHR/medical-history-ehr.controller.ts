import { Request, Response } from 'express';
import { MedicalHistoryEhrService } from '../../services/EHR/medical-history-ehr.service';
import { MH_EHR_SUCCESS } from '../../constants/medical-history-ehr.constant';


export class MedicalHistoryEhrController {

    //  NHÓM A: TIỀN SỬ BỆNH 

    static async getHistories(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                history_type: req.query.history_type as string | undefined,
                status: req.query.status as string | undefined,
                keyword: req.query.keyword as string | undefined,
            };
            const data = await MedicalHistoryEhrService.getHistories(patientId, filters);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORIES_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async getHistoryById(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            const data = await MedicalHistoryEhrService.getHistoryById(patientId, historyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createHistory(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createHistory(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') || error.message?.includes('không hợp lệ') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateHistory(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            const data = await MedicalHistoryEhrService.updateHistory(patientId, historyId, req.body);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_UPDATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403
                    : error.message?.includes('không hợp lệ') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateHistoryStatus(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            const { status } = req.body;
            const data = await MedicalHistoryEhrService.updateHistoryStatus(patientId, historyId, status);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_STATUS_UPDATED, data });
        } catch (error: any) {
            const st = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403
                    : error.message?.includes('không hợp lệ') ? 400 : 500;
            res.status(st).json({ success: false, message: error.message });
        }
    }

    static async deleteHistory(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const historyId = req.params.historyId as string;
            await MedicalHistoryEhrService.deleteHistory(patientId, historyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.HISTORY_DELETED });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    //  NHÓM B: DỊ ỨNG 

    static async getAllergies(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                allergen_type: req.query.allergen_type as string | undefined,
                severity: req.query.severity as string | undefined,
            };
            const data = await MedicalHistoryEhrService.getAllergies(patientId, filters);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGIES_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async getAllergyById(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const allergyId = req.params.allergyId as string;
            const data = await MedicalHistoryEhrService.getAllergyById(patientId, allergyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createAllergy(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createAllergy(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') || error.message?.includes('không hợp lệ') || error.message?.includes('đã được') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateAllergy(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const allergyId = req.params.allergyId as string;
            const data = await MedicalHistoryEhrService.updateAllergy(patientId, allergyId, req.body);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_UPDATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async deleteAllergy(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const allergyId = req.params.allergyId as string;
            await MedicalHistoryEhrService.deleteAllergy(patientId, allergyId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.ALLERGY_DELETED });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    //  NHÓM C: YẾU TỐ NGUY CƠ 

    static async getRiskFactors(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await MedicalHistoryEhrService.getRiskFactors(patientId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.RISKS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createRiskFactor(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createRiskFactor(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.RISK_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') || error.message?.includes('không hợp lệ') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async updateRiskFactor(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const factorId = req.params.factorId as string;
            const data = await MedicalHistoryEhrService.updateRiskFactor(patientId, factorId, req.body);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.RISK_UPDATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async deleteRiskFactor(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const factorId = req.params.factorId as string;
            await MedicalHistoryEhrService.deleteRiskFactor(patientId, factorId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.RISK_DELETED });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    //  NHÓM D: TÌNH TRẠNG ĐẶC BIỆT 

    static async getSpecialConditions(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await MedicalHistoryEhrService.getSpecialConditions(patientId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.SPECIALS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createSpecialCondition(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalHistoryEhrService.createSpecialCondition(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MH_EHR_SUCCESS.SPECIAL_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') || error.message?.includes('không hợp lệ') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async deleteSpecialCondition(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const conditionId = req.params.conditionId as string;
            await MedicalHistoryEhrService.deleteSpecialCondition(patientId, conditionId);
            res.status(200).json({ success: true, message: MH_EHR_SUCCESS.SPECIAL_DELETED });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
