import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { Role } from '../users/enums/role.enum';
import {
  PaginatedDto,
  PaginatedResponseDto,
} from '../common/dto/paginated-response.dto';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';
import { SkipThrottle } from '@nestjs/throttler';

// Admin backoffice — exempt from rate limiting
@SkipThrottle()
@ApiTags('Admin – Audit Log')
@ApiBearerAuth('access_token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@Controller('admin/audit-log')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'List audit log entries with filters' })
  @ApiOkResponse({ type: PaginatedDto(AuditLogResponseDto) })
  @Get()
  async findAll(
    @Query() query: FilterAuditLogDto,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    const result = await this.auditService.findAll(query);
    return {
      data: result.data.map((log) =>
        plainToInstance(AuditLogResponseDto, log, {
          excludeExtraneousValues: true,
        }),
      ),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }
}
