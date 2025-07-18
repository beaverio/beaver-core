# Data Sanitization Strategy

This document outlines the data sanitization implementation in the Beaver Core application to prevent XSS and injection attacks.

## Overview

The application implements a comprehensive data sanitization mechanism that:
- Removes malicious HTML tags and scripts
- Preserves legitimate content and formatting
- Maintains emojis and unicode characters
- Provides different sanitization levels for different use cases

## Core Components

### SanitizationUtil (`src/common/utils/sanitization.util.ts`)

The main utility class that provides sanitization functionality:

```typescript
// Basic text sanitization (most common)
SanitizationUtil.sanitizeText(userInput);

// Rich text with basic formatting (future use)
SanitizationUtil.sanitizeRichText(userInput);

// Custom sanitization options
SanitizationUtil.sanitize(userInput, { allowedTags: ['b'] });

// Malicious content detection
SanitizationUtil.containsMaliciousContent(userInput);
```

### Decorators (`src/common/decorators/sanitize.decorator.ts`)

Convenient decorators for automatic sanitization in DTOs:

```typescript
class UserDto {
  @SanitizeText()
  @IsString()
  name: string;

  @SanitizeRichText()  // For future rich text fields
  @IsString()
  description: string;

  @Sanitize({ allowedTags: ['b', 'i'] })  // Custom configuration
  @IsString()
  customField: string;
}
```

## Usage Guidelines

### 1. Text Input Fields

For basic text input (names, descriptions):

```typescript
@SanitizeText()
@IsString()
@MaxLength(500)
name: string;
```

**What it does:**
- Removes all HTML tags: `<script>`, `<iframe>`, `<img>`, etc.
- Escapes remaining content: `<script>` becomes `&lt;script&gt;`
- Preserves emojis: `👋 🌍 🎉`
- Preserves unicode: `αβγ 中文 العربية`

### 2. Email Fields

For email addresses (additional layer of security):

```typescript
@SanitizeText()
@IsEmail()
email: string;
```

**Note:** While email validation provides primary protection, sanitization adds an extra security layer.

### 3. Rich Text Fields (Future)

For fields that need basic formatting:

```typescript
@SanitizeRichText()
@IsString()
content: string;
```

**Allows:** `<b>`, `<i>`, `<em>`, `<strong>`, `<u>`
**Removes:** `<script>`, `<iframe>`, `<img>`, etc.

### 4. Custom Sanitization

For special cases requiring specific HTML tags:

```typescript
@Sanitize({ 
  allowedTags: ['span', 'div'],
  allowedAttributes: { span: ['class'] }
})
@IsString()
specialField: string;
```

## Security Features

### XSS Prevention

The sanitization automatically prevents common XSS attacks:

```javascript
// Input
"Hello <script>alert('xss')</script> world!"

// Output  
"Hello &lt;script&gt;alert('xss')&lt;/script&gt; world!"
```

### Malicious Pattern Detection

The system detects and logs suspicious input:

```typescript
const isMalicious = SanitizationUtil.containsMaliciousContent(input);
// Detects: <script>, <iframe>, javascript:, onload=, onerror=, etc.
```

### Safe HTML Handling

Uses `sanitize-html` library with strict configuration:
- No HTML tags allowed by default
- No attributes allowed
- Recursive escaping instead of removal
- No protocol-relative URLs
- No vulnerable tags

## Implementation Examples

### Basic User Bio

```typescript
// DTO
class UpdateUserDto {
  @SanitizeText()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;
}

// Usage
const userInput = {
  name: "Hello 👋 I'm a developer! <script>alert('xss')</script>"
};

const dto = plainToClass(UpdateUserDto, userInput);
// Result: "Hello 👋 I'm a developer! &lt;script&gt;alert('xss')&lt;/script&gt;"
```

### Email with Malicious Content

```typescript
// DTO
class CreateUserDto {
  @SanitizeText()
  @IsEmail()
  email: string;
}

// Usage
const userInput = {
  email: "test<script>alert(1)</script>@example.com"
};

const dto = plainToClass(CreateUserDto, userInput);
// Result: "test&lt;script&gt;alert(1)&lt;/script&gt;@example.com"
// Note: This would fail email validation, providing double protection
```

## Testing

Comprehensive tests cover:

- ✅ XSS payload removal (`<script>`, `<iframe>`, etc.)
- ✅ Emoji preservation (`👋`, `🌍`, `🎉`)
- ✅ Unicode character preservation (`αβγ`, `中文`, `العربية`)
- ✅ Edge cases (empty strings, null, undefined)
- ✅ Integration with class-validator
- ✅ Array sanitization
- ✅ Custom configuration options

## Configuration

### Default Settings

```typescript
// Removes ALL HTML tags
allowedTags: []
allowedAttributes: {}
disallowedTagsMode: 'recursiveEscape'  // Escape instead of remove
allowVulnerableTags: false
```

### Rich Text Settings

```typescript
// Allows basic formatting only
allowedTags: ['b', 'i', 'em', 'strong', 'u']
allowedAttributes: {}
// Still removes dangerous tags
```

## Future Enhancements

1. **File Upload Sanitization**
   - Sanitize file names and metadata
   - Content-type validation
   - File content scanning

2. **Rich Text Editor Support**
   - Whitelist approach for rich content
   - Custom tag validation
   - Attribute sanitization

3. **Performance Optimization**
   - Caching of sanitized content
   - Batch processing for large datasets
   - Async sanitization for heavy workloads

4. **Advanced Detection**
   - Machine learning-based malicious content detection
   - Pattern learning and adaptation
   - Real-time threat intelligence integration

## Migration Notes

### Existing Data

When implementing sanitization on existing data:

1. Existing data in the database is NOT automatically sanitized
2. Sanitization only applies to new input through DTOs
3. Consider running a migration script for existing data if needed
4. Response DTOs will sanitize data when transformed from entities

### Password Fields

**Important:** Password fields should NOT be sanitized as they are:
- Hashed before storage
- Never displayed in responses
- Handled separately by authentication logic

```typescript
// Correct - No sanitization on password
@IsStrongPassword()
password: string;

// Incorrect - Don't sanitize passwords
@SanitizeText()  // ❌ Remove this
@IsStrongPassword()
password: string;
```

## Monitoring and Logging

Consider implementing logging for security monitoring:

```typescript
// Example implementation
if (SanitizationUtil.containsMaliciousContent(input)) {
  logger.warn('Malicious content detected', {
    input: input.substring(0, 100), // Log partial content
    userId: currentUser.id,
    endpoint: req.url,
    timestamp: new Date()
  });
}
```

## Dependencies

- `sanitize-html`: ^2.x - Core sanitization library
- `@types/sanitize-html`: Type definitions
- `class-transformer`: Integration with DTO transformation
- `class-validator`: Compatible with validation decorators