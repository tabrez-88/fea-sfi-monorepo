import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { DealsService } from './deals.service';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    deal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a deal', async () => {
      const createDto = {
        name: 'Test Deal',
        effectiveDate: '2024-01-01T00:00:00.000Z',
      };

      const mockDeal = {
        id: 'uuid-123',
        name: 'Test Deal',
        description: null,
        status: 'DRAFT',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.deal.create.mockResolvedValue(mockDeal);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('uuid-123');
      expect(result.name).toBe('Test Deal');
    });
  });

  describe('findAll', () => {
    it('should return paginated deals', async () => {
      const mockDeals = [
        {
          id: 'uuid-1',
          name: 'Deal 1',
          description: null,
          status: 'DRAFT',
          effectiveDate: new Date(),
          terminationDate: null,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.deal.findMany.mockResolvedValue(mockDeals);
      mockPrismaService.deal.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a deal by id', async () => {
      const mockDeal = {
        id: 'uuid-123',
        name: 'Test Deal',
        description: null,
        status: 'DRAFT',
        effectiveDate: new Date(),
        terminationDate: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      };

      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);

      const result = await service.findOne('uuid-123');

      expect(result.id).toBe('uuid-123');
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
