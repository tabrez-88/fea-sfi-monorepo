import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { PaginationQueryDto } from '../../deals/dto';
import {
  UploadDocumentDto,
  ContextualUploadDocumentDto,
  DocumentResponseDto,
  DocumentListResponseDto,
  DocumentTypeEnum,
} from '../dto';
import { DocumentsService } from '../services/documents.service';

@ApiTags('documents')
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a document',
    description: `
Uploads a document to the system with optional associations to deals, revenue batches, or settlement runs.

**Purpose:**
Documents provide evidence and supporting materials for:
- Contracts and amendments
- Revenue reports from distribution sources
- Settlement reports and statements
- Audit reports
- Proof records for settlements

**File Handling:**
- Files are stored in secure object storage
- SHA-256 checksum is computed for integrity verification
- Original file name is preserved in metadata
- MIME type is detected and stored

**Associations:**
Documents can be associated with:
- A deal (general deal documents)
- A revenue batch (supporting documentation for revenue data)
- A settlement run (settlement reports, proofs)
- Multiple associations are allowed

**Storage:**
Documents are stored as-is without modification. The checksum allows
verification that the stored document matches the original upload.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'docType'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        docType: {
          type: 'string',
          enum: Object.values(DocumentTypeEnum),
          description: 'Type of document',
        },
        dealId: {
          type: 'string',
          format: 'uuid',
          description: 'Deal ID to associate with',
        },
        revenueBatchId: {
          type: 'string',
          format: 'uuid',
          description: 'Revenue batch ID to associate with',
        },
        settlementRunId: {
          type: 'string',
          format: 'uuid',
          description: 'Settlement run ID to associate with',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (JSON string)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or file missing',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large',
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(file, uploadDto);
  }

  @Post('deals/:dealId/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a document for a deal',
    description: `
Uploads a document and automatically associates it with the specified deal.

**Contextual Upload:**
The deal ID is taken from the URL path, so you don't need to specify it
in the body. You can optionally also associate with a revenue batch or
settlement run.

**Common Use Cases:**
- Uploading deal contracts
- Attaching amendments
- Adding supporting documentation
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to upload the document for',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'docType'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        docType: {
          type: 'string',
          enum: Object.values(DocumentTypeEnum),
          description: 'Type of document',
        },
        revenueBatchId: {
          type: 'string',
          format: 'uuid',
          description: 'Revenue batch ID to also associate with',
        },
        settlementRunId: {
          type: 'string',
          format: 'uuid',
          description: 'Settlement run ID to also associate with',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (JSON string)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async uploadDealDocument(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: ContextualUploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(file, {
      ...uploadDto,
      dealId,
    });
  }

  @Get('deals/:dealId/documents')
  @ApiOperation({
    summary: 'List documents for a deal',
    description: `
Returns all documents associated with a deal.

**Includes:**
- Direct deal documents
- Documents that have both a deal ID and other associations

**Filtering:**
- By document type
- Pagination support
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to list documents for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'docType',
    required: false,
    enum: DocumentTypeEnum,
    description: 'Filter by document type',
  })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
    type: DocumentListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async listDealDocuments(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<DocumentListResponseDto> {
    return this.documentsService.listDocuments({ dealId }, query);
  }

  @Get('revenue-batches/:revenueBatchId/documents')
  @ApiOperation({
    summary: 'List documents for a revenue batch',
    description: `
Returns all documents associated with a revenue batch.

**Common Document Types:**
- REVENUE_REPORT - Source revenue reports
- OTHER - Supporting documentation

**Use Cases:**
- View source documents for revenue data
- Audit trail for revenue figures
    `,
  })
  @ApiParam({
    name: 'revenueBatchId',
    type: 'string',
    format: 'uuid',
    description: 'The revenue batch to list documents for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
    type: DocumentListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue batch not found',
  })
  async listRevenueBatchDocuments(
    @Param('revenueBatchId', ParseUUIDPipe) revenueBatchId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<DocumentListResponseDto> {
    return this.documentsService.listDocuments({ revenueBatchId }, query);
  }

  @Get('settlement-runs/:settlementRunId/documents')
  @ApiOperation({
    summary: 'List documents for a settlement run',
    description: `
Returns all documents associated with a settlement run.

**Common Document Types:**
- SETTLEMENT_REPORT - Generated settlement statements
- PROOF_RECORD - Cryptographic proof exports
- AUDIT_REPORT - Audit documentation

**Use Cases:**
- Download settlement reports
- Access proof records for verification
- Audit trail for settlements
    `,
  })
  @ApiParam({
    name: 'settlementRunId',
    type: 'string',
    format: 'uuid',
    description: 'The settlement run to list documents for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
    type: DocumentListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Settlement run not found',
  })
  async listSettlementRunDocuments(
    @Param('settlementRunId', ParseUUIDPipe) settlementRunId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<DocumentListResponseDto> {
    return this.documentsService.listDocuments({ settlementRunId }, query);
  }

  @Get('documents/:id')
  @ApiOperation({
    summary: 'Get document details',
    description: `
Returns metadata for a specific document.

**Response includes:**
- Document metadata (type, associations, timestamps)
- Storage URL for downloading
- Checksum for integrity verification

**Note:**
This endpoint returns metadata. Use the storageUrl to download the actual file.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The document ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.getDocument(id);
  }

  @Delete('documents/:id')
  @ApiOperation({
    summary: 'Delete a document',
    description: `
Deletes a document from the system.

**Caution:**
- This permanently removes the document
- The file is deleted from storage
- This action cannot be undone

**Restrictions:**
- Documents associated with finalized settlements may be protected
- Audit requirements may prevent deletion in some cases
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The document ID to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Document cannot be deleted (protected)',
  })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.documentsService.deleteDocument(id);
  }
}
