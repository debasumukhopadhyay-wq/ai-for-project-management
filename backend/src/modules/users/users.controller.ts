import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in organization' })
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.usersService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.usersService.findOne(id, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('organizationId') orgId: string) {
    return this.usersService.update(id, orgId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user' })
  remove(@Param('id') id: string, @CurrentUser('organizationId') orgId: string) {
    return this.usersService.remove(id, orgId);
  }
}
