import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import { LocalFileStorage } from '../../storage/local-file-storage';
import { FILE_STORAGE, IFileStorage } from '../../storage/storage.interface';
import {
  ArchiveDocumentDto,
  ContextualUploadDocumentDto,
  DocumentListQueryDto,
  DocumentListResponseDto,
  DocumentResponseDto,
  DocumentTypeEnum,
  UploadDocumentDto,
} from '../dto';
import { DocumentsService } from '../services/documents.service';

@ApiTags('documents')
@ApiBearerAuth('bearer')
@Controller()
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    // For the raw streaming endpoint we need to verify a preview token
    // that's specific to the local-storage adapter. Other adapters (GCS)
    // would use signed URLs directly and skip this endpoint entirely.
    @Inject(FILE_STORAGE) private readonly storage: IFileStorage,
    private readonly localStorage: LocalFileStorage,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // Raw streaming — for the FE Document Preview drawer
  //
  // Note: this is `@Public()` because authentication is provided by the
  // short-lived preview JWT in the query string (which embeds the
  // storage key). Without @Public the global JwtAuthGuard would block
  // the proxy URL.
  // ──────────────────────────────────────────────────────────────────

  @Get('documents/raw')
  @Public()
  @ApiOperation({
    summary: 'Stream a document file (token-gated proxy)',
    description:
      'Used by the FE Document Preview drawer. The token comes from ' +
      '`DocumentResponseDto.storageUrl` (a short-lived JWT). Token TTL ' +
      'is `STORAGE_PREVIEW_URL_TTL_SECONDS` (default 15 min).',
  })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'File missing from storage' })
  async streamRaw(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) throw new BadRequestException('Missing preview token');
    let storageKey: string;
    try {
      storageKey = await this.localStorage.verifyPreviewToken(token);
    } catch {
      throw new BadRequestException('Invalid or expired preview token');
    }
    const stream = await this.storage.getStream(storageKey);
    // Note: we don't know mimeType from the storage key alone (it lives
    // in the Document row). The FE typically already has it from the
    // list response; falling back to octet-stream is safe.
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=60');
    stream.pipe(res);
  }

  // ──────────────────────────────────────────────────────────────────
  // Upload
  // ──────────────────────────────────────────────────────────────────

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a document',
    description:
      'Streams the uploaded file to the configured storage backend ' +
      '(default: local FS — see StorageModule). Server-side SHA-256 ' +
      'checksum, MIME type detection, and `uploadedByUserId` auto-capture ' +
      'from the JWT. Optional `dealId` / `revenueBatchId` / `settlementRunId` ' +
      'links the document to an entity for context-scoped retrieval.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'docType'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'The file to upload' },
        docType: {
          type: 'string',
          enum: Object.values(DocumentTypeEnum),
          description: 'Type of document',
        },
        dealId: { type: 'string', format: 'uuid' },
        revenueBatchId: { type: 'string', format: 'uuid' },
        settlementRunId: { type: 'string', format: 'uuid' },
        metadata: { type: 'object', description: 'Additional metadata (JSON)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded', type: DocumentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or missing file' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(user.id, file, uploadDto);
  }

  @Post('deals/:dealId/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a document for a deal',
    description:
      'Contextual upload — dealId taken from the URL. Same upload semantics as `POST /documents`.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'docType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        docType: { type: 'string', enum: Object.values(DocumentTypeEnum) },
        revenueBatchId: { type: 'string', format: 'uuid' },
        settlementRunId: { type: 'string', format: 'uuid' },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async uploadDealDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: ContextualUploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(user.id, file, {
      ...uploadDto,
      dealId,
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // List endpoints — accept the new DocumentListQueryDto with archived
  // filter + uploadedByUserId filter
  // ──────────────────────────────────────────────────────────────────

  @Get('deals/:dealId/documents')
  @ApiOperation({
    summary: 'List documents for a deal',
    description:
      'Default filter hides archived rows (`archivedAt IS NULL`). ' +
      'Use `?archived=true` for archived only, `?archived=all` for both. ' +
      'Additional filters: `?docType=` and `?uploadedByUserId=`.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of documents', type: DocumentListResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async listDealDocuments(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: DocumentListQueryDto,
  ): Promise<DocumentListResponseDto> {
    return this.documentsService.listDocuments({ dealId }, query);
  }

  @Get('revenue-batches/:revenueBatchId/documents')
  @ApiOperation({ summary: 'List documents for a revenue batch' })
  @ApiParam({ name: 'revenueBatchId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of documents', type: DocumentListResponseDto })
  async listRevenueBatchDocuments(
    @Param('revenueBatchId', ParseUUIDPipe) revenueBatchId: string,
    @Query() query: DocumentListQueryDto,
  ): Promise<DocumentListResponseDto> {
    return this.documentsService.listDocuments({ revenueBatchId }, query);
  }

  @Get('settlement-runs/:settlementRunId/documents')
  @ApiOperation({ summary: 'List documents for a settlement run' })
  @ApiParam({ name: 'settlementRunId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of documents', type: DocumentListResponseDto })
  async listSettlementRunDocuments(
    @Param('settlementRunId', ParseUUIDPipe) settlementRunId: string,
    @Query() query: DocumentListQueryDto,
  ): Promise<DocumentListResponseDto> {
    return this.documentsService.listDocuments({ settlementRunId }, query);
  }

  // ──────────────────────────────────────────────────────────────────
  // Get one
  // ──────────────────────────────────────────────────────────────────

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document details (includes fresh preview URL)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document details', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.getDocument(id);
  }

  // ──────────────────────────────────────────────────────────────────
  // Archive / Restore — FB-003 Run 4 Comment 21
  // ──────────────────────────────────────────────────────────────────

  @Post('documents/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a document (soft-delete)',
    description:
      'Sets `archivedAt + archivedByUserId + archivedReason`. The row stays in the database — ' +
      'use `POST /documents/:id/restore` to undo. Default list view hides archived rows.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document archived', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 409, description: 'Document is already archived' })
  async archiveDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ArchiveDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.archiveDocument(user.id, id, body);
  }

  @Post('documents/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore an archived document',
    description: 'Clears `archivedAt + archivedByUserId + archivedReason`. Inverse of archive.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document restored', type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 409, description: 'Document is not archived' })
  async restoreDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.restoreDocument(user.id, id);
  }

  @Delete('documents/:id')
  @ApiOperation({
    summary: 'Soft-delete (= archive) a document',
    description:
      'Routes to archive for REST friendliness — no hard delete in v1 per Round 4 Comment 21. ' +
      'Prefer `POST /documents/:id/archive` for the explicit path (lets you supply a reason).',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document archived' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.documentsService.deleteDocument(user.id, id);
  }
}
