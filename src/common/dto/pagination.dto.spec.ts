import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto, PaginatedResponseDto } from './pagination.dto';

describe('PaginationQueryDto', () => {
  const createDto = (data: any) => {
    return plainToInstance(PaginationQueryDto, data);
  };

  describe('validation', () => {
    it('should validate with default values', async () => {
      const dto = createDto({});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.sortOrder).toBe('ASC');
    });

    it('should validate with valid values', async () => {
      const dto = createDto({
        page: '2',
        limit: '20',
        sortBy: 'email',
        sortOrder: 'DESC',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(20);
      expect(dto.sortBy).toBe('email');
      expect(dto.sortOrder).toBe('DESC');
    });

    it('should fail validation for invalid page', async () => {
      const dto = createDto({ page: '0' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation for invalid limit', async () => {
      const dto = createDto({ limit: '0' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should fail validation for limit over maximum', async () => {
      const dto = createDto({ limit: '101' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
    });

    it('should fail validation for invalid sortOrder', async () => {
      const dto = createDto({ sortOrder: 'INVALID' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sortOrder');
    });
  });
});

describe('PaginatedResponseDto', () => {
  const mockData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];

  describe('constructor', () => {
    it('should create paginated response with correct metadata', () => {
      const dto = new PaginatedResponseDto(mockData, 25, 2, 5);

      expect(dto.data).toBe(mockData);
      expect(dto.total).toBe(25);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(5);
      expect(dto.totalPages).toBe(5); // Math.ceil(25/5)
      expect(dto.hasNext).toBe(true); // page 2 < 5 total pages
      expect(dto.hasPrevious).toBe(true); // page 2 > 1
    });

    it('should handle first page correctly', () => {
      const dto = new PaginatedResponseDto(mockData, 25, 1, 10);

      expect(dto.hasNext).toBe(true); // page 1 < 3 total pages
      expect(dto.hasPrevious).toBe(false); // page 1 = 1
    });

    it('should handle last page correctly', () => {
      const dto = new PaginatedResponseDto(mockData, 25, 3, 10);

      expect(dto.hasNext).toBe(false); // page 3 = 3 total pages
      expect(dto.hasPrevious).toBe(true); // page 3 > 1
    });

    it('should handle single page correctly', () => {
      const dto = new PaginatedResponseDto(mockData, 2, 1, 10);

      expect(dto.totalPages).toBe(1);
      expect(dto.hasNext).toBe(false);
      expect(dto.hasPrevious).toBe(false);
    });
  });

  describe('fromPaginatedResult', () => {
    it('should create dto from paginated result', () => {
      const result = {
        data: mockData,
        total: 25,
        page: 2,
        limit: 5,
        totalPages: 5,
        hasNext: true,
        hasPrevious: true,
      };

      const dto = PaginatedResponseDto.fromPaginatedResult(result);

      expect(dto.data).toBe(mockData);
      expect(dto.total).toBe(25);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(5);
      expect(dto.totalPages).toBe(5);
      expect(dto.hasNext).toBe(true);
      expect(dto.hasPrevious).toBe(true);
    });
  });
});
