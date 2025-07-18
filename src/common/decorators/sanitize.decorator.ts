import 'reflect-metadata';
import { Transform } from 'class-transformer';
import {
  SanitizationUtil,
  SanitizationOptions,
} from '../utils/sanitization.util';

// Metadata keys for sanitization control
export const SANITIZE_METADATA_KEY = 'sanitize:options';
export const NO_SANITIZE_METADATA_KEY = 'sanitize:skip';

/**
 * Decorator to automatically sanitize string values in DTOs
 * Uses class-transformer's @Transform decorator under the hood
 * Also sets metadata for the SanitizationPipe to use
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
  return function (target: any, propertyKey: string | symbol) {
    // Set metadata for the SanitizationPipe
    Reflect.defineMetadata(SANITIZE_METADATA_KEY, options, target, propertyKey);

    // Apply the transform decorator for backward compatibility
    const transformDecorator = Transform(({ value }: { value: unknown }) => {
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

    transformDecorator(target, propertyKey);
  };
}

/**
 * Decorator for basic text sanitization (most common use case)
 * Removes all HTML tags while preserving emojis
 * Also sets metadata for the SanitizationPipe to use
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
 * Also sets metadata for the SanitizationPipe to use
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

/**
 * Decorator to exclude a field from automatic sanitization
 * Use this for fields that should never be sanitized (e.g., passwords, tokens)
 *
 * @example
 * class LoginDto {
 *   @IsEmail()
 *   email: string; // Will be sanitized automatically
 *
 *   @NoSanitize()
 *   @IsStrongPassword()
 *   password: string; // Will NOT be sanitized
 * }
 */
export function NoSanitize(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    Reflect.defineMetadata(NO_SANITIZE_METADATA_KEY, true, target, propertyKey);
  };
}
