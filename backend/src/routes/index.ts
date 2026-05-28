import type { FastifyInstance } from 'fastify';
import healthRoutes from './health.js';
import authPlugin from './auth.js';
import complianceRunsPlugin from './complianceRuns.js';
import partnersPlugin from './partners.js';
import findingsPlugin from './findings.js';
import documentsPlugin from './documents.js';
import scheduledReportsPlugin from './scheduledReports.js';
import crmLogsPlugin from './crmLogs.js';
import dashboardPlugin from './dashboard.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authPlugin, { prefix: '/api' });
  await app.register(dashboardPlugin, { prefix: '/api' });
  await app.register(complianceRunsPlugin, { prefix: '/api' });
  await app.register(partnersPlugin, { prefix: '/api' });
  await app.register(findingsPlugin, { prefix: '/api' });
  await app.register(documentsPlugin, { prefix: '/api' });
  await app.register(scheduledReportsPlugin, { prefix: '/api' });
  await app.register(crmLogsPlugin, { prefix: '/api' });
}