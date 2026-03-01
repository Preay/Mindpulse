import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPostgresPool } from '../db/connection';
import { CalendarIntegrationService } from '../services/CalendarIntegrationService';
import { TeamsService } from '../services/TeamsService';
import { authenticateToken } from '../middleware/auth';
import { CalendarConnectRequest, InviteTeamMemberRequest } from '@mindpulse/shared-types';

export async function integrationsAndTeamsRoutes(app: FastifyInstance): Promise<void> {
  const db = getPostgresPool();
  const calendarService = new CalendarIntegrationService(db);
  const teamsService = new TeamsService(db);

  // ============== Calendar Integration Routes ==============

  // Connect calendar
  app.post<{ Body: CalendarConnectRequest }>(
    '/api/v1/integrations/calendar/connect',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        const { provider, code } = request.body;

        if (!['google', 'outlook', 'apple'].includes(provider)) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid provider',
            statusCode: 400,
          });
        }

        const integration = await calendarService.connectCalendar(request.user.sub, {
          provider: provider as any,
          code,
        });

        return reply.status(201).send(integration);
      } catch (error: any) {
        console.error('Connect calendar error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to connect calendar',
          statusCode: 500,
        });
      }
    }
  );

  // Get calendar correlation
  app.get(
    '/api/v1/integrations/calendar/correlation',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        const correlation = await calendarService.getCalendarCorrelation(request.user.sub);

        if (!correlation) {
          return reply.status(400).send({
            error: 'NO_INTEGRATION',
            message: 'Calendar not connected',
            statusCode: 400,
          });
        }

        return reply.send(correlation);
      } catch (error: any) {
        console.error('Get calendar correlation error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get calendar correlation',
          statusCode: 500,
        });
      }
    }
  );

  // Disconnect calendar
  app.delete(
    '/api/v1/integrations/:provider',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        const { provider } = request.params as { provider: string };

        if (!['google', 'outlook', 'apple'].includes(provider)) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid provider',
            statusCode: 400,
          });
        }

        await calendarService.disconnectCalendar(request.user.sub, provider);

        return reply.send({ success: true, message: 'Integration disconnected' });
      } catch (error: any) {
        console.error('Disconnect integration error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to disconnect integration',
          statusCode: 500,
        });
      }
    }
  );

  // ============== Teams/Organization Routes ==============

  // Get team dashboard
  app.get(
    '/api/v1/teams/dashboard',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        if (!request.user.org_id) {
          return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'User is not part of an organization',
            statusCode: 403,
          });
        }

        const dashboard = await teamsService.getTeamDashboard(request.user.org_id);

        if (!dashboard) {
          return reply.status(400).send({
            error: 'INSUFFICIENT_DATA',
            message: 'Organization does not have enough active users to display dashboard',
            statusCode: 400,
          });
        }

        return reply.send(dashboard);
      } catch (error: any) {
        console.error('Get team dashboard error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get team dashboard',
          statusCode: 500,
        });
      }
    }
  );

  // Get team members
  app.get(
    '/api/v1/teams/members',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        if (!request.user.org_id) {
          return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'User is not part of an organization',
            statusCode: 403,
          });
        }

        const query = request.query as { limit?: string; offset?: string };
        const { members, total } = await teamsService.getTeamMembers(
          request.user.org_id,
          query.limit ? parseInt(query.limit) : 50,
          query.offset ? parseInt(query.offset) : 0
        );

        return reply.send({ data: members, total });
      } catch (error: any) {
        console.error('Get team members error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to get team members',
          statusCode: 500,
        });
      }
    }
  );

  // Invite team member
  app.post<{ Body: InviteTeamMemberRequest }>(
    '/api/v1/teams/invite',
    { onRequest: [authenticateToken] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!request.user) {
          return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            statusCode: 401,
          });
        }

        if (!request.user.org_id) {
          return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'User is not part of an organization',
            statusCode: 403,
          });
        }

        const { email } = request.body;

        if (!email) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Email is required',
            statusCode: 400,
          });
        }

        await teamsService.inviteTeamMember(request.user.org_id, email);

        return reply.status(201).send({ success: true, message: 'Invite sent successfully' });
      } catch (error: any) {
        if (error.message === 'USER_ALREADY_IN_ORG') {
          return reply.status(409).send({
            error: 'USER_EXISTS',
            message: 'User is already part of this organization',
            statusCode: 409,
          });
        }

        console.error('Invite team member error:', error);
        return reply.status(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to send invite',
          statusCode: 500,
        });
      }
    }
  );
}
