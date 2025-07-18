import 'reflect-metadata';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import {
  NO_SANITIZE_METADATA_KEY,
  SANITIZE_METADATA_KEY,
} from '../decorators/sanitize.decorator';
import {
  SanitizationUtil,
  SanitizationOptions,
} from '../utils/sanitization.util';

// Type for constructor functions
type Constructor = new (...args: any[]) => any;

// Type for objects that can be sanitized
type SanitizableObject = Record<string, unknown>;

// Type guard to check if value is a sanitizable object
function isSanitizableObject(value: unknown): value is SanitizableObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Global sanitization pipe that automatically sanitizes all string fields
 * in DTOs to prevent XSS attacks and malicious content injection
 *
 * This pipe runs before validation and sanitizes data by default,
 * unless explicitly overridden with decorators:
 * - @NoSanitize() - Skip sanitization entirely
 * - @Sanitize(options) - Custom sanitization options
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  /**
   * Transform incoming data by applying sanitization to all string fields
   * @param value - The incoming data (DTO)
   * @param metadata - Pipe metadata including target class
   * @returns Sanitized data
   */
  transform(value: unknown, metadata: ArgumentMetadata): any {
    // Only process body/query parameters with a defined DTO class
    if (!value || !metadata.metatype || typeof value !== 'object') {
      return value;
    }

    // Skip primitive types and built-in classes
    if (this.isPrimitiveType(metadata.metatype)) {
      return value;
    }

    return this.sanitizeObject(value, metadata.metatype);
  }

  /**
   * Recursively sanitize an object based on its class metadata
   * @param obj - Object to sanitize
   * @param targetClass - Target DTO class with metadata
   * @returns Sanitized object
   */
  private sanitizeObject(obj: unknown, targetClass: Constructor): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      const sanitizedArray = obj.map((item) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        this.sanitizeObject(item, targetClass),
      );
      // Type assertion is safe here since we're returning the same shape

      return sanitizedArray as any;
    }

    // Ensure we have a sanitizable object
    if (!isSanitizableObject(obj)) {
      return obj;
    }

    const sanitizedObj: SanitizableObject = { ...obj };

    // Get all property names from the object
    for (const key in sanitizedObj) {
      if (Object.prototype.hasOwnProperty.call(sanitizedObj, key)) {
        const value = sanitizedObj[key];

        // Skip null/undefined values
        if (value === null || value === undefined) {
          continue;
        }

        // Check if field should be excluded from sanitization
        const noSanitize = this.getMetadata(
          NO_SANITIZE_METADATA_KEY,
          targetClass,
          key,
        );
        if (noSanitize) {
          continue; // Skip sanitization for this field
        }

        // Get custom sanitization options if defined
        const customOptions = this.getMetadata(
          SANITIZE_METADATA_KEY,
          targetClass,
          key,
        );

        // Apply sanitization to string values
        if (typeof value === 'string') {
          const options: SanitizationOptions = (typeof customOptions ===
          'object'
            ? customOptions
            : null) || {
            allowEmojis: true,
          }; // Default options
          sanitizedObj[key] = SanitizationUtil.sanitize(value, options);
        }
        // Handle arrays of strings
        else if (Array.isArray(value)) {
          sanitizedObj[key] = value.map((item: unknown) => {
            if (typeof item === 'string') {
              const options: SanitizationOptions = (typeof customOptions ===
              'object'
                ? customOptions
                : null) || {
                allowEmojis: true,
              };
              return SanitizationUtil.sanitize(item, options);
            }
            return item;
          });
        }
        // Recursively handle nested objects
        else if (typeof value === 'object') {
          sanitizedObj[key] = this.sanitizeObject(value, targetClass);
        }
      }
    }

    return sanitizedObj;
  }

  /**
   * Get metadata for a specific property
   * @param metadataKey - Metadata key to retrieve
   * @param target - Target class
   * @param propertyKey - Property name
   * @returns Metadata value or undefined
   */
  private getMetadata(
    metadataKey: string,
    target: Constructor,
    propertyKey: string,
  ): SanitizationOptions | boolean | undefined {
    if (!target || typeof target !== 'function' || !target.prototype) {
      return undefined;
    }
    const targetPrototype = target.prototype as object;
    const metadata: unknown = Reflect.getMetadata(
      metadataKey,
      targetPrototype,
      propertyKey,
    );
    // Type assertion is safe here as we control what we store in metadata
    return metadata as SanitizationOptions | boolean | undefined;
  }

  /**
   * Check if a type is a primitive type that should not be processed
   * @param type - Type to check
   * @returns true if primitive type
   */
  private isPrimitiveType(type: Constructor): boolean {
    return (
      type === String ||
      type === Boolean ||
      type === Number ||
      type === Array ||
      type === Object
    );
  }
}
