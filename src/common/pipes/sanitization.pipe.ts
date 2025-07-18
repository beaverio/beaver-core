import 'reflect-metadata';
import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { SanitizationUtil, SanitizationOptions } from '../utils/sanitization.util';
import { SANITIZE_METADATA_KEY, NO_SANITIZE_METADATA_KEY } from '../decorators/sanitize.decorator';

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
  transform(value: any, metadata: ArgumentMetadata): any {
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
  private sanitizeObject(obj: any, targetClass: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, targetClass));
    }

    const sanitizedObj = { ...obj };

    // Get all property names from the object
    for (const key in sanitizedObj) {
      if (sanitizedObj.hasOwnProperty(key)) {
        const value = sanitizedObj[key];

        // Skip null/undefined values
        if (value === null || value === undefined) {
          continue;
        }

        // Check if field should be excluded from sanitization
        const noSanitize = this.getMetadata(NO_SANITIZE_METADATA_KEY, targetClass, key);
        if (noSanitize) {
          continue; // Skip sanitization for this field
        }

        // Get custom sanitization options if defined
        const customOptions = this.getMetadata(SANITIZE_METADATA_KEY, targetClass, key);

        // Apply sanitization to string values
        if (typeof value === 'string') {
          const options = customOptions || { allowEmojis: true }; // Default options
          sanitizedObj[key] = SanitizationUtil.sanitize(value, options);
        }
        // Handle arrays of strings
        else if (Array.isArray(value)) {
          sanitizedObj[key] = value.map(item => {
            if (typeof item === 'string') {
              const options = customOptions || { allowEmojis: true };
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
  private getMetadata(metadataKey: string, target: any, propertyKey: string): any {
    return Reflect.getMetadata(metadataKey, target.prototype, propertyKey);
  }

  /**
   * Check if a type is a primitive type that should not be processed
   * @param type - Type to check
   * @returns true if primitive type
   */
  private isPrimitiveType(type: any): boolean {
    const primitiveTypes = [String, Boolean, Number, Array, Object];
    return primitiveTypes.includes(type);
  }
}