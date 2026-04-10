export class AppError extends Error {
    public readonly httpCode: number;
    public readonly code: string;

    constructor(httpCode: number, code: string, message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.httpCode = httpCode;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}
