import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '../repository/Core/audit-log.repository';
import { AuditActionType } from '../models/Core/audit-log.model';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return next();
    }

    if (req.originalUrl.includes('/refresh-token')) {
        return next();
    }

    const originalSend = res.send;

    res.send = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {

            let actionType = AuditActionType.OTHER;
            if (req.method === 'POST') actionType = AuditActionType.CREATE;
            if (req.method === 'PUT' || req.method === 'PATCH') actionType = AuditActionType.UPDATE;
            if (req.method === 'DELETE') actionType = AuditActionType.DELETE;

            if (req.originalUrl.includes('/login')) actionType = AuditActionType.LOGIN;


            const parts = req.originalUrl.split('?')[0].split('/');

            const entityId = req.params.id ? String(req.params.id) : (parts[parts.length - 1] ? String(parts[parts.length - 1]) : undefined);
            const moduleName = parts[2] ? parts[2].toUpperCase() : 'SYSTEM_UNKNOWN';

            const userId = (req as any).auth?.user_id || (req as any).user?.user_id || undefined;
            let safeBody = { ...req.body };
            if (safeBody.password) safeBody.password = '***';
            if (safeBody.refreshToken) safeBody.refreshToken = '***';

            /**
             * Lấy old_value từ Controller nếu có gắn trước đó.
             */
            const oldValue = (req as any).auditOldValue || null;

            AuditLogRepository.createLog({
                user_id: userId,
                action_type: actionType,
                module_name: moduleName,
                target_id: entityId !== moduleName ? entityId : undefined,
                old_value: oldValue,
                new_value: safeBody,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            }).catch((e: any) => console.error('[AUDIT_GUARD_ERROR]', e));
        }

        return originalSend.call(this, body);
    };

    next();
};
