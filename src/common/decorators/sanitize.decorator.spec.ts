import { plainToClass } from 'class-transformer';
import { IsString } from 'class-validator';
import { Sanitize, SanitizeText, SanitizeRichText } from './sanitize.decorator';

// Test DTOs
class TestDto {
  @Sanitize()
  @IsString()
  basicField: string;

  @SanitizeText()
  @IsString()
  textField: string;

  @SanitizeRichText()
  @IsString()
  richTextField: string;

  @Sanitize({ allowedTags: ['b'] })
  @IsString()
  customField: string;

  // Non-sanitized field for comparison
  @IsString()
  normalField: string;
}

class ArrayTestDto {
  @Sanitize()
  tags: string[];
}

describe('Sanitize Decorators', () => {
  describe('@Sanitize decorator', () => {
    it('should sanitize malicious content in basic field', () => {
      const input = {
        basicField: "Hello <script>alert('xss')</script> world!",
        normalField: "Hello <script>alert('xss')</script> world!",
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.basicField).toBe(
        "Hello &lt;script&gt;alert('xss')&lt;/script&gt; world!",
      );
      expect(dto.basicField).not.toContain('<script>');
      expect(dto.normalField).toContain('<script>'); // Not sanitized
    });

    it('should preserve clean content', () => {
      const input = {
        basicField: 'Clean text with emojis 👋 and unicode αβγ',
        normalField: 'Clean text with emojis 👋 and unicode αβγ',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.basicField).toBe(input.basicField);
      expect(dto.basicField).toContain('👋');
      expect(dto.basicField).toContain('αβγ');
    });

    it('should handle null and undefined values', () => {
      const input = {
        basicField: null,
        normalField: undefined,
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.basicField).toBe(null);
      expect(dto.normalField).toBe(undefined);
    });

    it('should handle empty strings', () => {
      const input = {
        basicField: '',
        normalField: '   ',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.basicField).toBe('');
      expect(dto.normalField).toBe('   ');
    });

    it('should work with custom sanitization options', () => {
      const input = {
        customField: 'Text with <b>bold</b> and <script>alert(1)</script>',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.customField).toContain('<b>bold</b>');
      expect(dto.customField).not.toContain('<script>');
    });
  });

  describe('@SanitizeText decorator', () => {
    it('should remove all HTML tags', () => {
      const input = {
        textField: 'Text with <b>bold</b> and <i>italic</i> formatting',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.textField).not.toContain('<b>');
      expect(dto.textField).not.toContain('<i>');
      expect(dto.textField).toContain('bold');
      expect(dto.textField).toContain('italic');
    });

    it('should preserve emojis', () => {
      const input = {
        textField: 'Hello 👋 World 🌍',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.textField).toBe(input.textField);
      expect(dto.textField).toContain('👋');
      expect(dto.textField).toContain('🌍');
    });
  });

  describe('@SanitizeRichText decorator', () => {
    it('should allow basic formatting tags', () => {
      const input = {
        richTextField:
          'Text with <b>bold</b>, <i>italic</i>, and <strong>strong</strong>',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.richTextField).toContain('<b>bold</b>');
      expect(dto.richTextField).toContain('<i>italic</i>');
      expect(dto.richTextField).toContain('<strong>strong</strong>');
    });

    it('should still remove dangerous tags', () => {
      const input = {
        richTextField:
          'Safe <b>bold</b> but dangerous <script>alert(1)</script>',
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.richTextField).toContain('<b>bold</b>');
      expect(dto.richTextField).not.toContain('<script>');
      expect(dto.richTextField).toContain('alert(1)'); // Content preserved, tags removed
    });
  });

  describe('Array handling', () => {
    it('should sanitize arrays of strings', () => {
      const input = {
        tags: [
          'Clean tag',
          "Malicious <script>alert('xss')</script> tag",
          'Another clean tag',
        ],
      };

      const dto = plainToClass(ArrayTestDto, input);

      expect(dto.tags).toHaveLength(3);
      expect(dto.tags[0]).toBe('Clean tag');
      expect(dto.tags[1]).not.toContain('<script>');
      expect(dto.tags[1]).toContain('Malicious');
      expect(dto.tags[1]).toContain('tag');
      expect(dto.tags[2]).toBe('Another clean tag');
    });

    it('should handle arrays with mixed types', () => {
      const input = {
        tags: [
          'String tag',
          null,
          undefined,
          123,
          'Another <script>alert(1)</script> string',
        ],
      };

      const dto = plainToClass(ArrayTestDto, input);

      expect(dto.tags).toHaveLength(5);
      expect(dto.tags[0]).toBe('String tag');
      expect(dto.tags[1]).toBe(null);
      expect(dto.tags[2]).toBe(undefined);
      expect(dto.tags[3]).toBe(123);
      expect(dto.tags[4]).not.toContain('<script>');
    });

    it('should handle empty arrays', () => {
      const input = {
        tags: [],
      };

      const dto = plainToClass(ArrayTestDto, input);

      expect(dto.tags).toEqual([]);
    });
  });

  describe('Non-string value handling', () => {
    it('should pass through non-string values unchanged', () => {
      const input = {
        basicField: 123,
        textField: { key: 'value' },
        richTextField: ['array', 'value'],
      };

      const dto = plainToClass(TestDto, input);

      expect(dto.basicField).toBe(123);
      expect(dto.textField).toEqual({ key: 'value' });
      expect(dto.richTextField).toEqual(['array', 'value']);
    });
  });

  describe('Integration with class-validator', () => {
    it('should work alongside validation decorators', () => {
      const input = {
        basicField: "Valid <script>alert('xss')</script> content",
        textField: 'Another <iframe>dangerous</iframe> input',
        richTextField: 'Rich <b>content</b> with <script>script</script>',
        normalField: 'Normal content',
      };

      const dto = plainToClass(TestDto, input);

      // Sanitization should occur
      expect(dto.basicField).not.toContain('<script>');
      expect(dto.textField).not.toContain('<iframe>');
      expect(dto.richTextField).toContain('<b>content</b>');
      expect(dto.richTextField).not.toContain('<script>');

      // Normal field should be unchanged
      expect(dto.normalField).toBe(input.normalField);
    });
  });
});
