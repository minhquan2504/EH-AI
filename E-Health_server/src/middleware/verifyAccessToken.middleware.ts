import { Request, Response, NextFunction } from "express";
import { TokenUtil } from "../utils/token.util";
import { AUTH_ERRORS } from "../constants/auth-error.constant";

/**
 * Logic lõi dùng chung để xác thực token
 */
function _verifyToken(req: Request, res: Response, next: NextFunction, required: boolean) {
  try {
    const authHeader = req.headers.authorization;

    // Không có header Authorization hoặc không hợp lệ -> Xử lý theo required
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      if (required) {
        throw AUTH_ERRORS.UNAUTHORIZED;
      }
      return next(); // Guest mode
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      if (required) {
        throw AUTH_ERRORS.UNAUTHORIZED;
      }
      return next();
    }

    const payload: any = TokenUtil.verifyAccessToken(token);

    (req as any).auth = {
      user_id: payload.sub,
      roles: payload.roles,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "AUTH_401",
      message: "Unauthorized - Token is missing, invalid, or expired",
    });
  }
}

/**
 * Middleware bắt buộc hệ thống phải cung cấp Token hợp lệ
 */
export function verifyAccessToken(req: Request, res: Response, next: NextFunction) {
  _verifyToken(req, res, next, true);
}

export function optionalVerifyAccessToken(req: Request, res: Response, next: NextFunction) {
  _verifyToken(req, res, next, false);
}