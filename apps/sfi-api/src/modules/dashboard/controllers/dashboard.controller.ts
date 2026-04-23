import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import {
  DashboardPendingReviewsResponseDto,
  DashboardSummaryResponseDto,
} from '../dto';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get the dashboard summary stat cards',
    description:
      'Returns Total Deals, Active Deals, Pending Review, and Total Settled — scoped to the authenticated user\'s deals.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary',
    type: DashboardSummaryResponseDto,
  })
  async getSummary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(user.id);
  }

  @Get('pending-reviews')
  @ApiOperation({
    summary: 'Get items needing review for the dashboard Pending Reviews section',
    description:
      'Returns revenue batches (PENDING) and settlement runs (PREVIEWED) for the authenticated user\'s deals. Returns empty arrays when nothing is pending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending review items',
    type: DashboardPendingReviewsResponseDto,
  })
  async getPendingReviews(@CurrentUser() user: AuthenticatedUser): Promise<DashboardPendingReviewsResponseDto> {
    return this.dashboardService.getPendingReviews(user.id);
  }
}
