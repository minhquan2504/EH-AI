import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { initRoutes } from './routes/index.route'
import { SessionCleanup } from './jobs/SessionCleanup.jobs'
import { AppointmentReminderJob } from './jobs/AppointmentReminder.jobs'
import { startPaymentOrderExpiryJob } from './jobs/PaymentOrderExpiry.jobs'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #4a90e2; }',
  customSiteTitle: 'E-Health API Documentation',
}))

initRoutes(app);

SessionCleanup.startSessionCleanupJob();
AppointmentReminderJob.startReminderJob();
startPaymentOrderExpiryJob();

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Endpoint API không tồn tại trên hệ thống.'
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
});

export default app