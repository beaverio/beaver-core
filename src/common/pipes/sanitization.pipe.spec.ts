import { ArgumentMetadata } from '@nestjs/common';
import { SanitizationPipe } from './sanitization.pipe';
import { Sanitize, NoSanitize } from '../decorators/sanitize.decorator';
import { IsString, IsEmail } from 'class-validator';

// Test DTOs for the pipe
class TestDto {
  @IsString()
  name: string;

  @NoSanitize()
  @IsString()
  password: string;

  @Sanitize({ allowBasicFormatting: true })
  @IsString()
  richContent: string;

  @IsEmail()
  email: string;
}

class SimpleDto {
  @IsString()
  title: string;
}

describe('SanitizationPipe', () => {
  let pipe: SanitizationPipe;

  beforeEach(() => {
    pipe = new SanitizationPipe();
  });

  describe('transform', () => {
    it('should sanitize string fields by default', () => {
      const testData = {
        title: 'Hello <script>alert("xss")</script> world!',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SimpleDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      expect(result.title).toBe(
        'Hello &lt;script&gt;alert("xss")&lt;/script&gt; world!',
      );
    });

    it('should preserve emojis in default sanitization', () => {
      const testData = {
        title: 'Hello 👋 world! 🌍',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SimpleDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      expect(result.title).toBe('Hello 👋 world! 🌍');
    });

    it('should skip sanitization for @NoSanitize fields', () => {
      const testData = {
        name: 'John <script>alert("xss")</script>',
        password: 'MyP@ssw0rd<script>alert("xss")</script>',
        email: 'test@example.com<script>alert("xss")</script>',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      // name and email should be sanitized (default behavior)
      expect(result.name).toBe(
        'John &lt;script&gt;alert("xss")&lt;/script&gt;',
      );
      expect(result.email).toBe(
        'test@example.com&lt;script&gt;alert("xss")&lt;/script&gt;',
      );

      // password should NOT be sanitized due to @NoSanitize
      expect(result.password).toBe('MyP@ssw0rd<script>alert("xss")</script>');
    });

    it('should apply custom sanitization options', () => {
      const testData = {
        richContent: 'Hello <b>world</b> <script>alert("xss")</script>',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      // Should allow <b> tag but escape <script>
      expect(result.richContent).toBe(
        'Hello <b>world</b> &lt;script&gt;alert("xss")&lt;/script&gt;',
      );
    });

    it('should handle arrays of strings', () => {
      const testData = {
        name: [
          'John <script>alert("xss")</script>',
          'Jane <iframe>bad</iframe>',
        ],
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      expect(result.name).toEqual([
        'John &lt;script&gt;alert("xss")&lt;/script&gt;',
        'Jane &lt;iframe&gt;bad&lt;/iframe&gt;',
      ]);
    });

    it('should handle null and undefined values', () => {
      const testData = {
        name: null,
        password: undefined,
        email: 'test@example.com',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      expect(result.name).toBeNull();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should handle non-string values', () => {
      const testData = {
        name: 'John',
        age: 25,
        active: true,
        scores: [85, 90, 92],
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SimpleDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.scores).toEqual([85, 90, 92]);
    });

    it('should return primitive values unchanged', () => {
      const metadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: '',
      };

      expect(pipe.transform('test', metadata)).toBe('test');
      expect(pipe.transform(123, metadata)).toBe(123);
      expect(pipe.transform(true, metadata)).toBe(true);
    });

    it('should return null/undefined unchanged', () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SimpleDto,
        data: '',
      };

      expect(pipe.transform(null, metadata)).toBeNull();
      expect(pipe.transform(undefined, metadata)).toBeUndefined();
    });

    it('should handle missing metatype', () => {
      const testData = { name: 'test<script>alert("xss")</script>' };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: undefined,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      // Should return unchanged when no metatype
      expect(result).toBe(testData);
    });

    it('should handle nested objects', () => {
      const testData = {
        user: {
          name: 'John <script>alert("xss")</script>',
          email: 'test@example.com<script>bad</script>',
        },
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: SimpleDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      expect(result.user.name).toBe(
        'John &lt;script&gt;alert("xss")&lt;/script&gt;',
      );
      expect(result.user.email).toBe(
        'test@example.com&lt;script&gt;bad&lt;/script&gt;',
      );
    });
  });

  describe('XSS Prevention', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')"></svg>',
      '<div onclick="alert(\'XSS\')">Click me</div>',
    ];

    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: SimpleDto,
      data: '',
    };

    maliciousInputs.forEach((maliciousInput) => {
      it(`should sanitize: ${maliciousInput}`, () => {
        const testData = { title: maliciousInput };
        const result = pipe.transform(testData, metadata);

        // Should not contain any executable scripts
        expect(result.title).not.toContain('<script>');
        expect(result.title).not.toContain('<iframe>');
        expect(result.title).not.toContain('onerror=');
        expect(result.title).not.toContain('onclick=');
        expect(result.title).not.toContain('onload=');

        // For HTML context, javascript: should be removed
        if (maliciousInput.includes('javascript:')) {
          expect(result.title).not.toContain('javascript:');
        }
      });
    });

    it('should handle standalone javascript: URLs', () => {
      const testData = { title: 'javascript:alert("XSS")' };
      const result = pipe.transform(testData, metadata);

      // Standalone javascript: URLs should be removed/sanitized
      expect(result.title).not.toContain('javascript:');
      expect(result.title).toContain('alert("XSS")'); // Content preserved, just protocol removed
    });
  });
});
