import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';

const EXCLUDED_FIELDS = new Set([
  'password',
  'tokenVersion',
  'googleLinked',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'version',
]);

const EXCLUDED_ENTITIES = new Set(['AuditLog', 'RefreshToken']);

function serializeValue(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val !== 'object') return String(val);
  return JSON.stringify(val);
}

function flattenForDiff(
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entity)) {
    if (
      v !== null &&
      typeof v === 'object' &&
      !(v instanceof Date) &&
      !Array.isArray(v)
    ) {
      for (const [ek, ev] of Object.entries(v as Record<string, unknown>)) {
        flat[`${k}.${ek}`] = ev;
      }
    } else {
      flat[k] = v;
    }
  }
  return flat;
}

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cls: ClsService,
  ) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(
    event: InsertEvent<Record<string, unknown>>,
  ): Promise<void> {
    const entityName = event.metadata?.targetName;
    if (!entityName || EXCLUDED_ENTITIES.has(entityName)) return;

    const entityId = event.entity?.id as string | undefined;
    if (!entityId) return;

    const changedBy = this.cls.get<string | null>('userId') ?? null;
    const manager = event.queryRunner?.manager ?? this.dataSource.manager;

    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        entityType: entityName,
        entityId,
        action: AuditAction.CREATE,
        field: null,
        fromValue: null,
        toValue: null,
        changedBy,
      }),
    );
  }

  async beforeUpdate(
    event: UpdateEvent<Record<string, unknown>>,
  ): Promise<void> {
    const entityName = event.metadata?.targetName;
    if (!entityName || EXCLUDED_ENTITIES.has(entityName)) return;
    if (!event.entity || !event.databaseEntity) return;

    const entity = event.entity as Record<string, unknown>;
    const dbEntity = event.databaseEntity;
    const entityId = (entity.id ?? dbEntity.id) as string | undefined;
    if (!entityId) return;

    const changedBy = this.cls.get<string | null>('userId') ?? null;
    const manager = event.queryRunner?.manager ?? this.dataSource.manager;

    // Soft-delete detection
    const isDelete =
      'deletedAt' in entity &&
      entity.deletedAt !== null &&
      entity.deletedAt !== undefined &&
      dbEntity.deletedAt === null;

    if (isDelete) {
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          entityType: entityName,
          entityId,
          action: AuditAction.DELETE,
          field: null,
          fromValue: null,
          toValue: null,
          changedBy,
        }),
      );
      return;
    }

    const flatEntity = flattenForDiff(entity);
    const flatDb = flattenForDiff(dbEntity);

    const entries: Partial<AuditLog>[] = [];

    for (const key of Object.keys(flatEntity)) {
      if (EXCLUDED_FIELDS.has(key)) continue;

      const newVal = serializeValue(flatEntity[key]);
      const oldVal = serializeValue(flatDb[key]);

      if (newVal === oldVal) continue;

      entries.push({
        entityType: entityName,
        entityId,
        action: AuditAction.UPDATE,
        field: key,
        fromValue: oldVal,
        toValue: newVal,
        changedBy,
      });
    }

    if (entries.length > 0) {
      await manager.save(
        AuditLog,
        entries.map((e) => manager.create(AuditLog, e)),
      );
    }
  }
}
