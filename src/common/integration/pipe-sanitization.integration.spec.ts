import { SanitizationPipe } from '../pipes/sanitization.pipe';
import { ArgumentMetadata } from '@nestjs/common';
import { NoSanitize, Sanitize, SanitizeRichText } from '../decorators/sanitize.decorator';
import { IsString, IsEmail } from 'class-validator';

/**
 * Integration test to demonstrate the new pipe-based sanitization system
 * This shows how fields are automatically sanitized by default,
 * with options to override behavior per field.
 */

// Example DTO showing the new approach
class ExampleFormDto {
  @IsString()
  title: string; // Automatically sanitized by pipe (no decorator needed)

  @IsString() 
  description: string; // Automatically sanitized by pipe

  @SanitizeRichText() // Override: allow rich text formatting
  @IsString()
  content: string;

  @NoSanitize() // Override: exclude from sanitization  
  @IsString()
  apiKey: string;

  @IsEmail()
  email: string; // Automatically sanitized by pipe
}

describe('Pipe-Based Sanitization Integration', () => {
  let pipe: SanitizationPipe;

  beforeEach(() => {
    pipe = new SanitizationPipe();
  });

  describe('Automatic sanitization by default', () => {
    it('should sanitize all string fields automatically without decorators', () => {
      const maliciousData = {
        title: 'Blog Post <script>alert("xss")</script>',
        description: 'Description with <iframe>bad content</iframe>',
        content: 'Rich <b>bold</b> and <script>dangerous</script> content',
        apiKey: 'secret-key-<script>dont-sanitize-this</script>',
        email: 'user@example.com<script>alert("email-xss")</script>',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: ExampleFormDto,
        data: '',
      };

      const result = pipe.transform(maliciousData, metadata);

      // Default fields should be sanitized automatically
      expect(result.title).toBe('Blog Post &lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(result.description).toBe('Description with &lt;iframe&gt;bad content&lt;/iframe&gt;');
      expect(result.email).toBe('user@example.com&lt;script&gt;alert("email-xss")&lt;/script&gt;');

      // Rich text field should allow <b> but block <script>
      expect(result.content).toContain('<b>bold</b>');
      expect(result.content).not.toContain('<script>');

      // NoSanitize field should be unchanged
      expect(result.apiKey).toBe('secret-key-<script>dont-sanitize-this</script>');
    });

    it('should preserve legitimate content while blocking attacks', () => {
      const mixedData = {
        title: 'Hello 👋 World! Normal text with emojis',
        description: 'Unicode characters: αβγ 中文 العربية',
        content: 'Rich text with <strong>emphasis</strong> and <em>style</em>',
        apiKey: 'legitimate-api-key-123',
        email: 'user@example.com',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: ExampleFormDto,
        data: '',
      };

      const result = pipe.transform(mixedData, metadata);

      // Should preserve all legitimate content
      expect(result.title).toBe('Hello 👋 World! Normal text with emojis');
      expect(result.description).toBe('Unicode characters: αβγ 中文 العربية');
      expect(result.content).toBe('Rich text with <strong>emphasis</strong> and <em>style</em>');
      expect(result.apiKey).toBe('legitimate-api-key-123');
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('Benefits of the new approach', () => {
    it('prevents XSS on fields that developers might forget to sanitize', () => {
      // This simulates a scenario where a developer adds a new field
      // but forgets to add sanitization decorators
      class NewFormDto {
        @IsString()
        existingField: string; // Developer remembered this one
        
        @IsString()
        newFieldDeveloperForgot: string; // Developer forgot to add @SanitizeText()
      }

      const maliciousData = {
        existingField: 'Safe content',
        newFieldDeveloperForgot: 'Malicious <script>alert("forgot-to-sanitize")</script> content',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: NewFormDto,
        data: '',
      };

      const result = pipe.transform(maliciousData, metadata);

      // Both fields should be sanitized automatically!
      expect(result.existingField).toBe('Safe content');
      expect(result.newFieldDeveloperForgot).toBe(
        'Malicious &lt;script&gt;alert("forgot-to-sanitize")&lt;/script&gt; content'
      );
      expect(result.newFieldDeveloperForgot).not.toContain('<script>');
    });

    it('provides fine-grained control when needed', () => {
      class AdvancedDto {
        @IsString()
        autoSanitized: string; // Default behavior
        
        @Sanitize({ allowedTags: ['span'], allowedAttributes: { span: ['class'] } })
        @IsString()  
        customSanitized: string; // Custom rules
        
        @NoSanitize()
        @IsString()
        notSanitized: string; // Explicitly excluded
      }

      const testData = {
        autoSanitized: 'Text with <span class="highlight">content</span> and <script>bad</script>',
        customSanitized: 'Text with <span class="highlight">content</span> and <script>bad</script>',
        notSanitized: 'Raw content with <span class="highlight">content</span> and <script>preserved</script>',
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: AdvancedDto,
        data: '',
      };

      const result = pipe.transform(testData, metadata);

      // Auto-sanitized: removes all HTML
      expect(result.autoSanitized).toBe('Text with &lt;span&gt;content&lt;/span&gt; and &lt;script&gt;bad&lt;/script&gt;');
      
      // Custom-sanitized: allows span with class, blocks script  
      expect(result.customSanitized).toContain('<span class="highlight">content</span>');
      expect(result.customSanitized).not.toContain('<script>');
      
      // Not sanitized: everything preserved
      expect(result.notSanitized).toContain('<span class="highlight">content</span>');
      expect(result.notSanitized).toContain('<script>preserved</script>');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle complex nested forms safely', () => {
      const complexFormData = {
        personalInfo: {
          name: 'John <script>alert("name")</script> Doe',
          bio: 'Software developer with <i>experience</i> in <script>alert("bio")</script>',
        },
        contactInfo: {
          email: 'john@example.com<script>alert("email")</script>',
          phone: '555-1234<script>alert("phone")</script>',
        },
        preferences: [
          'Setting 1 <script>alert("pref1")</script>',
          'Setting 2 <script>alert("pref2")</script>',
        ],
      };

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: ExampleFormDto,
        data: '',
      };

      const result = pipe.transform(complexFormData, metadata);

      // All nested string content should be sanitized
      expect(result.personalInfo.name).not.toContain('<script>');
      expect(result.personalInfo.bio).not.toContain('<script>');
      expect(result.contactInfo.email).not.toContain('<script>');
      expect(result.contactInfo.phone).not.toContain('<script>');
      expect(result.preferences[0]).not.toContain('<script>');
      expect(result.preferences[1]).not.toContain('<script>');
      
      // But legitimate content should be preserved
      expect(result.personalInfo.name).toContain('John');
      expect(result.personalInfo.name).toContain('Doe');
    });
  });
});