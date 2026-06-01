import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../common/dto/paginated-response.dto';
import { AuditLog } from './entities/audit-log.entity';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async findAll(query: FilterAuditLogDto): Promise<Paginated<AuditLog>> {
    const {
      page,
      limit,
      entityType,
      entityId,
      changedBy,
      action,
      field,
      dateFrom,
      dateTo,
    } = query;

    const qb = this.auditRepo.createQueryBuilder('log');

    if (entityType) qb.andWhere('log.entityType = :entityType', { entityType });
    if (entityId) qb.andWhere('log.entityId = :entityId', { entityId });
    if (changedBy) qb.andWhere('log.changedBy = :changedBy', { changedBy });
    if (action) qb.andWhere('log.action = :action', { action });
    if (field) qb.andWhere('log.field = :field', { field });
    if (dateFrom) qb.andWhere('log.changedAt >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('log.changedAt <= :dateTo', { dateTo });

    qb.orderBy('log.changedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
