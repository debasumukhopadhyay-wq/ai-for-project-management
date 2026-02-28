import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current organization details' })
  getMyOrg(@CurrentUser('organizationId') orgId: string) {
    return this.orgService.findOne(orgId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get organization stats' })
  getStats(@CurrentUser('organizationId') orgId: string) {
    return this.orgService.getStats(orgId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update organization settings' })
  update(@CurrentUser('organizationId') orgId: string, @Body() body: any) {
    return this.orgService.update(orgId, body);
  }
}
