import { Request, Response } from 'express';
import { MedInstructionService } from '../../services/Medication Management/med-instruction.service';
import { MED_INSTRUCTION_SUCCESS } from '../../constants/med-instruction.constant';

const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class MedInstructionController {

    /** GET /api/medication-instructions/templates */
    static async getTemplates(req: Request, res: Response) {
        try {
            const type = req.query.type as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await MedInstructionService.getTemplates(type, search);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATES_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.getTemplates] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** POST /api/medication-instructions/templates */
    static async createTemplate(req: Request, res: Response) {
        try {
            const result = await MedInstructionService.createTemplate(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATE_CREATED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.createTemplate] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/medication-instructions/templates/:id */
    static async updateTemplate(req: Request, res: Response) {
        try {
            const result = await MedInstructionService.updateTemplate(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATE_UPDATED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.updateTemplate] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** DELETE /api/medication-instructions/templates/:id */
    static async deleteTemplate(req: Request, res: Response) {
        try {
            await MedInstructionService.deleteTemplate(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.TEMPLATE_DELETED });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.deleteTemplate] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/medication-instructions/drugs — DS thuốc có HĐ mặc định */
    static async getAllDefaults(req: Request, res: Response) {
        try {
            const search = req.query.search as string | undefined;
            const result = await MedInstructionService.getAllDefaults(search);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULTS_LIST_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.getAllDefaults] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/medication-instructions/drugs/:drugId */
    static async getDrugDefault(req: Request, res: Response) {
        try {
            const result = await MedInstructionService.getDrugDefault(req.params.drugId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULT_FETCHED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.getDrugDefault] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PUT /api/medication-instructions/drugs/:drugId */
    static async upsertDrugDefault(req: Request, res: Response) {
        try {
            const result = await MedInstructionService.upsertDrugDefault(req.params.drugId as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULT_UPSERTED, data: result });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.upsertDrugDefault] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** DELETE /api/medication-instructions/drugs/:drugId */
    static async deleteDrugDefault(req: Request, res: Response) {
        try {
            await MedInstructionService.deleteDrugDefault(req.params.drugId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MED_INSTRUCTION_SUCCESS.DEFAULT_DELETED });
        } catch (error: any) {
            if (error.httpCode) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[MedInstructionController.deleteDrugDefault] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
