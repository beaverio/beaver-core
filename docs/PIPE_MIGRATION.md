# Migration Guide: Pipe-Based Sanitization

## Overview

We've enhanced our sanitization system with a **global SanitizationPipe** that automatically sanitizes all string fields by default. This prevents XSS attacks even if developers forget to add sanitization decorators to new fields.

## How It Works

### 🔄 Before (Decorator-Only Approach)
```typescript
class CreatePostDto {
  @SanitizeText()  // ❌ Easy to forget
  @IsString()
  title: string;

  @SanitizeText()  // ❌ Easy to forget  
  @IsString()
  content: string;

  @IsStrongPassword()
  password: string; // ❌ Would be sanitized if we forgot @NoSanitize
}
```

### ✅ After (Pipe-Based Approach)
```typescript
class CreatePostDto {
  @IsString()
  title: string;        // ✅ Automatically sanitized

  @IsString() 
  content: string;      // ✅ Automatically sanitized

  @NoSanitize()         // ✅ Explicitly exclude sensitive fields
  @IsStrongPassword()
  password: string;
}
```

## Key Benefits

1. **Default Security**: All string fields are sanitized automatically
2. **Developer-Friendly**: No need to remember decorators for every field
3. **Flexible Overrides**: Fine-grained control when needed
4. **Zero Breaking Changes**: Existing decorators still work

## Usage Examples

### Basic Usage (Automatic)
```typescript
class UserDto {
  @IsEmail()
  email: string;        // Auto-sanitized ✅
  
  @IsString()
  name: string;         // Auto-sanitized ✅
  
  @IsString()
  bio: string;          // Auto-sanitized ✅
}
```

### Override Sanitization
```typescript
class ArticleDto {
  @IsString()
  title: string;                    // Auto-sanitized (default)
  
  @SanitizeRichText()              // Allow rich text formatting
  @IsString()
  content: string;
  
  @Sanitize({ allowedTags: ['code'] })  // Custom rules
  @IsString()
  codeSnippet: string;
  
  @NoSanitize()                    // Skip sanitization entirely
  @IsString()
  apiKey: string;
}
```

## Migration Steps

### 1. Existing Code (No Changes Required)
Your existing `@SanitizeText()` decorators will continue to work. The pipe and decorators work together.

### 2. New Fields (Simplified)
For new DTOs, you can omit sanitization decorators for most fields:

```typescript
// Old way
class NewFeatureDto {
  @SanitizeText()  // No longer required
  @IsString()
  field1: string;
  
  @SanitizeText()  // No longer required
  @IsString()  
  field2: string;
}

// New way  
class NewFeatureDto {
  @IsString()
  field1: string;  // Automatically sanitized
  
  @IsString()
  field2: string;  // Automatically sanitized
}
```

### 3. Sensitive Fields (Add @NoSanitize)
For fields that should never be sanitized (passwords, API keys, etc.):

```typescript
class AuthDto {
  @IsEmail()
  email: string;           // Auto-sanitized ✅

  @NoSanitize()           // ADD THIS for sensitive fields
  @IsStrongPassword()
  password: string;
}
```

## Testing

The pipe automatically runs before validation in the request pipeline. For unit tests, you can:

1. **Test DTOs with decorators** (existing approach continues to work)
2. **Test the pipe directly** for automatic sanitization scenarios

```typescript
// Testing the pipe
const pipe = new SanitizationPipe();
const result = pipe.transform(maliciousData, { 
  type: 'body', 
  metatype: YourDto 
});
expect(result.field).not.toContain('<script>');
```

## Security Guarantee

✅ **All string fields are now protected by default**  
✅ **Prevents XSS even on forgotten fields**  
✅ **Maintains flexibility for special cases**  
✅ **Zero performance impact on non-string data**

No more worrying about forgetting to sanitize a field that ends up in a frontend form!