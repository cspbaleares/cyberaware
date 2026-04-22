import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantSummary(currentUser: any) {
    const tenantId = currentUser.tenantId;
    const actorUserId = currentUser.sub ?? currentUser.id;
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      usersTotal,
      usersActive,
      usersInactive,

      campaignsTotal,
      campaignsDraft,
      campaignsScheduled,
      campaignsActive,
      campaignsCompleted,
      campaignsArchived,

      campaignAssignmentsTotal,
      campaignAssignmentsAssigned,
      campaignAssignmentsInProgress,
      campaignAssignmentsCompleted,

      trainingCoursesTotal,
      trainingCoursesDraft,
      trainingCoursesPublished,
      trainingCoursesArchived,

      trainingEnrollmentsTotal,
      trainingEnrollmentsAssigned,
      trainingEnrollmentsInProgress,
      trainingEnrollmentsCompleted,

      campaignsYearTotal,
      campaignsYearCompleted,
      campaignAssignmentsYearTotal,
      trainingCoursesYearTotal,
      trainingEnrollmentsYearTotal,
      suppressionsYearTotal,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { tenantId, deletedAt: null, isActive: true },
      }),
      this.prisma.user.count({
        where: { tenantId, deletedAt: null, isActive: false },
      }),

      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, status: 'draft' },
      }),
      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, status: 'scheduled' },
      }),
      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, status: 'active' },
      }),
      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, status: 'completed' },
      }),
      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, status: 'archived' },
      }),

      this.prisma.campaignAssignment.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, deletedAt: null, status: 'assigned' },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, deletedAt: null, status: 'in_progress' },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, deletedAt: null, status: 'completed' },
      }),

      this.prisma.trainingCourse.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.trainingCourse.count({
        where: { tenantId, deletedAt: null, status: 'draft' },
      }),
      this.prisma.trainingCourse.count({
        where: { tenantId, deletedAt: null, status: 'published' },
      }),
      this.prisma.trainingCourse.count({
        where: { tenantId, deletedAt: null, status: 'archived' },
      }),

      this.prisma.trainingEnrollment.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, deletedAt: null, status: 'assigned' },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, deletedAt: null, status: 'in_progress' },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, deletedAt: null, status: 'completed' },
      }),

      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: yearStart } },
      }),
      this.prisma.campaign.count({
        where: { tenantId, deletedAt: null, status: 'completed', createdAt: { gte: yearStart } },
      }),
      this.prisma.campaignAssignment.count({
        where: { tenantId, deletedAt: null, assignedAt: { gte: yearStart } },
      }),
      this.prisma.trainingCourse.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: yearStart } },
      }),
      this.prisma.trainingEnrollment.count({
        where: { tenantId, deletedAt: null, assignedAt: { gte: yearStart } },
      }),
      this.prisma.mailSuppression.count({
        where: { tenantId, createdAt: { gte: yearStart } },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        action: 'dashboard.tenant_summary',
        entityType: 'dashboard',
        entityId: tenantId,
        metadata: {
          scope: 'tenant',
        },
      },
    });

    return {
      users: {
        total: usersTotal,
        active: usersActive,
        inactive: usersInactive,
      },
      campaigns: {
        total: campaignsTotal,
        draft: campaignsDraft,
        scheduled: campaignsScheduled,
        active: campaignsActive,
        completed: campaignsCompleted,
        archived: campaignsArchived,
      },
      campaignAssignments: {
        total: campaignAssignmentsTotal,
        assigned: campaignAssignmentsAssigned,
        inProgress: campaignAssignmentsInProgress,
        completed: campaignAssignmentsCompleted,
      },
      trainingCourses: {
        total: trainingCoursesTotal,
        draft: trainingCoursesDraft,
        published: trainingCoursesPublished,
        archived: trainingCoursesArchived,
      },
      trainingEnrollments: {
        total: trainingEnrollmentsTotal,
        assigned: trainingEnrollmentsAssigned,
        inProgress: trainingEnrollmentsInProgress,
        completed: trainingEnrollmentsCompleted,
      },
      yearToDate: {
        year: now.getFullYear(),
        campaigns: campaignsYearTotal,
        campaignsCompleted: campaignsYearCompleted,
        campaignAssignments: campaignAssignmentsYearTotal,
        trainingCourses: trainingCoursesYearTotal,
        trainingEnrollments: trainingEnrollmentsYearTotal,
        suppressions: suppressionsYearTotal,
      },
    };
  }
}
