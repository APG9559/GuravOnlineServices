import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  UseGuards,
  Res,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FastifyReply, FastifyRequest } from "fastify";
import { SettingsService } from "./settings.service";
import { SyncService } from "./sync.service";
import { ALL_SYNC_TABLES, SyncPayloadV2 } from "./sync-types";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Role } from "../common/enums";
import { User } from "../users/user.entity";

// Both Admin and Operator can read and update pricing (no @Roles restriction)
@Controller("settings")
@UseGuards(AuthGuard("jwt"))
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly syncService: SyncService,
  ) {}

  // GET /api/settings/pricing  — full list with metadata
  @Get("pricing")
  getAll() {
    return this.service.getAll();
  }

  // GET /api/settings/pricing/map  — flat { key: value } used by frontend calculators
  @Get("pricing/map")
  getPricingMap() {
    return this.service.getPricingMap();
  }

  // PATCH /api/settings/pricing  — update one or many keys
  // Body: { "updates": { "magistrate_fee": 950, "notary_fee": 1200 } }
  @Patch("pricing")
  updateMany(
    @Body("updates") updates: Record<string, number>,
    @CurrentUser() user: User,
  ) {
    return this.service.updateMany(updates, user);
  }

  // POST /api/settings/pricing/reset  — restore all to original defaults
  @Post("pricing/reset")
  resetDefaults(@CurrentUser() user: User) {
    return this.service.resetDefaults(user);
  }

  // ── Database Management (Admin only) ────────────────────────────────────

  // GET /api/settings/database/export  — download a full pg_dump binary
  @Get("database/export")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  exportDatabase(@Res() res: FastifyReply) {
    return this.service.exportDatabase(res);
  }

  // POST /api/settings/database/import  — upload a .dump file and restore
  // Body (multipart): file + mode ('full' | 'insert')
  @Post("database/import")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async importDatabase(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException("No dump file uploaded.");
    }
    const modeField = (data.fields as any)?.mode;
    const mode = typeof modeField === "object" ? modeField.value : modeField;
    if (mode !== "full" && mode !== "insert") {
      throw new BadRequestException(
        'Invalid mode. Must be "full" or "insert".',
      );
    }
    const buffer = await data.toBuffer();
    return this.service.importDatabase(buffer, mode as "full" | "insert");
  }

  // POST /api/settings/database/clear  — clear all transactional records
  @Post("database/clear")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  clearDatabase() {
    return this.service.clearDatabase();
  }

  // ── Smart JSON Sync (Admin only) ─────────────────────────────────────────

  // GET /api/settings/sync/export?tables=affidavits,marriages&since=2026-07-01
  @Get("sync/export")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async exportSync(
    @Query("tables") tablesParam: string,
    @Query("since") sinceParam: string,
    @Res() res: FastifyReply,
  ) {
    const tables = tablesParam
      ? tablesParam.split(",").map((t) => t.trim())
      : [...ALL_SYNC_TABLES];
    const payload = await this.syncService.exportRecords(tables, sinceParam);
    const filename = `sync_${new Date().toISOString().slice(0, 10)}.json`;
    res.header("Content-Type", "application/json");
    res.header("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(payload, null, 2));
  }

  // POST /api/settings/sync/preview  — dry-run: validate and count what would be inserted
  // Body (multipart): file = .json sync file
  @Post("sync/preview")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async previewSync(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) throw new BadRequestException("No sync file uploaded.");
    const buffer = await data.toBuffer();
    let payload: any;
    try {
      payload = JSON.parse(buffer.toString("utf-8"));
    } catch {
      throw new BadRequestException("Invalid JSON file.");
    }
    return this.syncService.previewImport(this.upgradeV1Payload(payload));
  }

  // POST /api/settings/sync/import  — commit: actually insert the records
  // Body (multipart): file = .json sync file
  @Post("sync/import")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async importSync(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) throw new BadRequestException("No sync file uploaded.");
    const buffer = await data.toBuffer();
    let payload: any;
    try {
      payload = JSON.parse(buffer.toString("utf-8"));
    } catch {
      throw new BadRequestException("Invalid JSON file.");
    }
    return this.syncService.importRecords(this.upgradeV1Payload(payload));
  }

  /**
   * Convert v1 payload (3-table format) to v2 for backward compatibility.
   */
  private upgradeV1Payload(payload: any): SyncPayloadV2 {
    if (payload.version === "2") return payload;
    if (payload.version !== "1") {
      throw new BadRequestException("Unsupported sync version.");
    }
    return {
      version: "2",
      exportedAt: payload.exportedAt || new Date().toISOString(),
      tables: payload.tables || [],
      records: {
        customers: payload.records?.customers?.map((r: any) => ({
          id: undefined,
          name: r.name,
          phone: r.phone,
          address: r.address,
          email: r.email,
          createdAt: undefined,
          updatedAt: undefined,
          deletedAt: null,
          _meta: { businessKey: { phone: r.phone } },
        })),
        affidavits: payload.records?.affidavits?.map((r: any) => ({
          ...r,
          id: undefined,
          customerId: undefined,
          createdBy: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          deletedAt: null,
          _meta: {
            createdByEmail: r._meta?.createdByEmail,
            customerPhone: r._meta?.customerPhone,
            businessKey: {
              phone: r.phone,
              dateOfService: r.dateOfService,
              purpose: r.purpose,
            },
          },
        })),
        marriages: payload.records?.marriages?.map((r: any) => ({
          ...r,
          id: undefined,
          customerId: undefined,
          createdBy: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          deletedAt: null,
          affidavitIds: [],
          _meta: {
            createdByEmail: r._meta?.createdByEmail,
            customerPhone: r._meta?.customerPhone,
            businessKey: {
              spouse1Name: r.spouse1Name,
              spouse2Name: r.spouse2Name,
              dateOfService: r.dateOfService,
            },
          },
        })),
      },
    };
  }

  // POST /api/settings/database/backfill-customers  — backfill customer records (Admin only)
  @Post("database/backfill-customers")
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  backfillCustomers() {
    return this.service.backfillCustomers();
  }
}
