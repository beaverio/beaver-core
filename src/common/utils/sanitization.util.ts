import * as sanitizeHtml from 'sanitize-html';

/**
 * Additional text-based patterns to remove that might not be caught by sanitize-html
 */
const DANGEROUS_TEXT_PATTERNS = [
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /on\w+\s*=/gi, // onclick=, onload=, etc.
];

/**
 * Configuration options for HTML sanitization
 */
export interface SanitizationOptions {
  /**
   * Allow basic formatting tags (for rich text fields)
   * Default: false (strips all HTML)
   */
  allowBasicFormatting?: boolean;

  /**
   * Allow emojis and unicode characters
   * Default: true
   */
  allowEmojis?: boolean;

  /**
   * Custom allowed tags (advanced usage)
   */
  allowedTags?: string[];

  /**
   * Custom allowed attributes (advanced usage)
   */
  allowedAttributes?: { [key: string]: string[] };
}

/**
 * Default sanitization configuration for basic text input
 * Removes all HTML tags and malicious content while preserving emojis
 */
const DEFAULT_SANITIZATION_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No attributes allowed
  disallowedTagsMode: 'recursiveEscape', // Escape rather than remove for better UX
  allowedSchemes: [], // No links allowed
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: [],
  allowProtocolRelative: false,
  allowVulnerableTags: false,
};

/**
 * Configuration for basic formatting (future use for rich text fields)
 */
const BASIC_FORMATTING_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'u'],
  allowedAttributes: {},
  disallowedTagsMode: 'recursiveEscape',
  allowedSchemes: [],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: [],
  allowProtocolRelative: false,
  allowVulnerableTags: false,
};

/**
 * Sanitization utility class for cleaning user input
 * Prevents XSS attacks while preserving legitimate content
 */
export class SanitizationUtil {
  /**
   * Sanitize a string value to remove malicious content
   * @param value - The string to sanitize
   * @param options - Sanitization options
   * @returns Sanitized string
   */
  static sanitize(value: string, options: SanitizationOptions = {}): string {
    if (typeof value !== 'string') {
      return value;
    }

    // Handle empty or whitespace-only strings
    if (!value || value.trim().length === 0) {
      return value;
    }

    // Choose configuration based on options
    let config: sanitizeHtml.IOptions;
    if (options.allowBasicFormatting) {
      config = { ...BASIC_FORMATTING_CONFIG };
    } else {
      config = { ...DEFAULT_SANITIZATION_CONFIG };
    }

    // Apply custom overrides if provided
    if (options.allowedTags) {
      config.allowedTags = options.allowedTags;
    }
    if (options.allowedAttributes) {
      config.allowedAttributes = options.allowedAttributes;
    }

    // First, sanitize HTML content
    let sanitized = sanitizeHtml(value, config);

    // Then, remove additional dangerous text patterns
    DANGEROUS_TEXT_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Trim whitespace that might be left after tag removal
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Sanitize text with default settings (no HTML, emojis allowed)
   * This is the most common use case for user input fields
   * @param value - The string to sanitize
   * @returns Sanitized string
   */
  static sanitizeText(value: string): string {
    return this.sanitize(value, { allowEmojis: true });
  }

  /**
   * Sanitize with basic formatting allowed (for future rich text fields)
   * @param value - The string to sanitize
   * @returns Sanitized string with basic formatting preserved
   */
  static sanitizeRichText(value: string): string {
    return this.sanitize(value, {
      allowBasicFormatting: true,
      allowEmojis: true,
    });
  }

  /**
   * Check if a string contains potentially malicious content
   * Useful for logging/monitoring purposes
   * @param value - The string to check
   * @returns true if malicious content is detected
   */
  static containsMaliciousContent(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // Check for common malicious patterns
    const maliciousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>/gi,
      /javascript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
    ];

    return maliciousPatterns.some((pattern) => pattern.test(value));
  }
}
