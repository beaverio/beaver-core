/**
 * DTO Utility Examples and Patterns
 *
 * This file demonstrates how to implement the base DTO pattern for new entities.
 * Follow these patterns when creating DTOs for new resources.
 */

import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseDto, CreateUpdateDto } from './base.dto';

// Example: Base DTO for a hypothetical "Post" entity
export class BasePostDto extends BaseDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsUUID()
  authorId: string;
}

// Create DTO - only requires title, content, and authorId
export class CreatePostDto extends PickType(BasePostDto, [
  'title',
  'content',
  'authorId',
] as const) {}

// Update DTO - automatically excludes id, createdAt, updatedAt
// Only allows updating title and content (excludes authorId for security)
export class UpdatePostDto extends CreateUpdateDto(BasePostDto, ['authorId']) {}

// Query DTO - all fields optional for filtering
export class GetPostsQueryDto extends PartialType(
  PickType(BasePostDto, ['authorId', 'title'] as const),
) {}

// Response DTO - includes all fields except internal timestamps can be controlled
export class PostResponseDto extends OmitType(BasePostDto, [
  'updatedAt',
] as const) {
  // Add computed or transformed fields if needed
  @IsString()
  @IsOptional()
  authorEmail?: string;

  static fromEntity(post: PostEntity, authorEmail?: string): PostResponseDto {
    const dto = new PostResponseDto();
    dto.id = post.id;
    dto.title = post.title;
    dto.content = post.content;
    dto.authorId = post.authorId;
    dto.createdAt = post.createdAt.toISOString();
    if (authorEmail) {
      dto.authorEmail = authorEmail;
    }
    return dto;
  }

  static fromEntities(
    posts: PostEntity[],
    getAuthorEmail?: (authorId: string) => string,
  ): PostResponseDto[] {
    return posts.map((post) => {
      const authorEmail = getAuthorEmail
        ? getAuthorEmail(post.authorId)
        : undefined;
      return this.fromEntity(post, authorEmail);
    });
  }
}

// Example entity interface for type safety
interface PostEntity {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Key Patterns and Best Practices:
 *
 * 1. BASE DTO PATTERN:
 *    - Create a BaseEntityDto with ALL possible fields and their validations
 *    - Use appropriate validation decorators for each field type
 *    - Include fields that might be used across different DTOs
 *
 * 2. DERIVED DTO PATTERNS:
 *    - CreateDto: Use PickType to select only required fields for creation
 *    - UpdateDto: Use CreateUpdateDto utility to automatically exclude base fields
 *    - QueryDto: Use PartialType(PickType(...)) for optional filter fields
 *    - ResponseDto: Use PickType or OmitType to control exposed fields
 *
 * 3. AUTOMATIC FIELD EXCLUSION:
 *    - CreateUpdateDto automatically omits: id, createdAt, updatedAt
 *    - Pass additional fields to exclude as second parameter
 *    - Example: CreateUpdateDto(BaseUserDto, ['refreshToken'])
 *    - Ensures consistency across all update DTOs
 *
 * 4. STATIC METHODS:
 *    - Implement fromEntity() for single entity transformation
 *    - Implement fromEntities() for array transformation
 *    - Add business logic in transformation methods if needed
 *
 * 5. VALIDATION INHERITANCE:
 *    - All validation decorators are automatically inherited
 *    - No need to duplicate @IsEmail, @IsUUID, etc.
 *    - Mapped types preserve all metadata and decorators
 *
 * 6. TYPE SAFETY:
 *    - Use 'as const' with field arrays for better type inference
 *    - TypeScript will catch errors if referenced fields don't exist
 *    - IntelliSense works perfectly with this pattern
 */
