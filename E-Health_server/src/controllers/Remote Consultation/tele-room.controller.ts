import { Request, Response } from 'express';
import { TeleRoomService } from '../../services/Remote Consultation/tele-room.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_ROOM_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.3 — Phòng khám trực tuyến
 * 18 handler chia 5 nhóm: Room, Chat, Files, Media, Events
 */
export class TeleRoomController {

    // ═══ NHÓM 1: Room ═══

    /** POST /room/:consultationId/open */
    static async openRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.openRoom(String(req.params.consultationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_OPENED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /room/:consultationId/join */
    static async joinRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.joinRoom(String(req.params.consultationId), userId, req.body.device_info);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_JOINED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /room/:consultationId/leave */
    static async leaveRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.leaveRoom(String(req.params.consultationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_LEFT, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /room/:consultationId/close */
    static async closeRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.closeRoom(String(req.params.consultationId), userId, req.body.ended_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.ROOM_CLOSED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /room/:consultationId */
    static async getRoomDetail(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleRoomService.getRoomDetail(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 2: Chat ═══

    /** POST /room/:consultationId/messages */
    static async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const userRoles = (req as any).user?.roles || [];
            const result = await TeleRoomService.sendMessage(String(req.params.consultationId), userId, req.body, userRoles);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_ROOM_SUCCESS.MESSAGE_SENT, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /room/:consultationId/messages */
    static async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleRoomService.getMessages(String(req.params.consultationId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /room/:consultationId/messages/read */
    static async markRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const count = await TeleRoomService.markRead(String(req.params.consultationId), userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.MESSAGES_READ, data: { marked_count: count } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 3: Files ═══

    /** POST /room/:consultationId/files */
    static async uploadFile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.uploadFile(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_ROOM_SUCCESS.FILE_UPLOADED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /room/:consultationId/files */
    static async getFiles(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleRoomService.getFiles(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** DELETE /room/:consultationId/files/:fileId */
    static async deleteFile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const isAdmin = ((req as any).user?.roles || []).includes('ADMIN');
            await TeleRoomService.deleteFile(String(req.params.consultationId), String(req.params.fileId), userId, isAdmin);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.FILE_DELETED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 4: Media ═══

    /** PUT /room/:consultationId/media */
    static async updateMedia(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleRoomService.updateMedia(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.MEDIA_UPDATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /room/:consultationId/participants */
    static async getParticipants(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleRoomService.getParticipants(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /room/:consultationId/kick/:userId */
    static async kickUser(req: Request, res: Response): Promise<void> {
        try {
            const kickedBy = (req as any).user?.userId;
            await TeleRoomService.kickUser(String(req.params.consultationId), String(req.params.userId), kickedBy);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.PARTICIPANT_KICKED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 5: Events & Stats ═══

    /** GET /room/:consultationId/events */
    static async getEvents(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 100, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleRoomService.getEvents(String(req.params.consultationId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /room/:consultationId/network-report */
    static async networkReport(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            await TeleRoomService.reportNetwork(String(req.params.consultationId), userId, req.body.quality, req.body.details);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_ROOM_SUCCESS.NETWORK_REPORTED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /room/:consultationId/summary */
    static async getRoomSummary(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleRoomService.getRoomSummary(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /room/active */
    static async getActiveRooms(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleRoomService.getActiveRooms();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }
}
