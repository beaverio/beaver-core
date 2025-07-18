import { Transform } from 'class-transformer';
import {
  SanitizationUtil,
  SanitizationOptions,
} from '../utils/sanitization.util';

/**
 * Decorator to automatically sanitize string values in DTOs
 * Uses class-transformer's @Transform decorator under the hood
 *
 * @param options - Sanitization options (optional)
 * @returns PropertyDecorator
 *
 * @example
 * class CreatePostDto {
 *   @Sanitize()
 *   @IsString()
 *   title: string;
 *
 *   @Sanitize({ allowBasicFormatting: true })
 *   @IsString()
 *   content: string;
 * }
 */
export function Sanitize(options: SanitizationOptions = {}): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle arrays of strings
    if (Array.isArray(value)) {
      return value.map((item: unknown) =>
        typeof item === 'string'
          ? SanitizationUtil.sanitize(item, options)
          : item,
      );
    }

    // Handle single string values
    if (typeof value === 'string') {
      return SanitizationUtil.sanitize(value, options);
    }

    // Return non-string values unchanged
    return value;
  });
}

/**
 * Decorator for basic text sanitization (most common use case)
 * Removes all HTML tags while preserving emojis
 *
 * @example
 * class UserDto {
 *   @SanitizeText()
 *   @IsString()
 *   name: string;
 * }
 */
export function SanitizeText(): PropertyDecorator {
  return Sanitize({ allowEmojis: true });
}

/**
 * Decorator for rich text sanitization (future use)
 * Allows basic formatting tags while removing dangerous content
 *
 * @example
 * class PostDto {
 *   @SanitizeRichText()
 *   @IsString()
 *   content: string;
 * }
 */
export function SanitizeRichText(): PropertyDecorator {
  return Sanitize({
    allowBasicFormatting: true,
    allowEmojis: true,
  });
}
