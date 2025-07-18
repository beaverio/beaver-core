import { SanitizationUtil } from './sanitization.util';

describe('SanitizationUtil', () => {
  describe('sanitizeText', () => {
    it('should remove script tags and malicious content', () => {
      const maliciousInput = "Hello <script>alert('xss')</script> world!";
      const result = SanitizationUtil.sanitizeText(maliciousInput);
      expect(result).toBe(
        "Hello &lt;script&gt;alert('xss')&lt;/script&gt; world!",
      );
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove iframe tags', () => {
      const maliciousInput =
        'Content <iframe src="javascript:alert(1)"></iframe> more content';
      const result = SanitizationUtil.sanitizeText(maliciousInput);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('</iframe>');
      expect(result).toContain('Content');
      expect(result).toContain('more content');
    });

    it('should remove img tags with malicious src', () => {
      const maliciousInput =
        'Image <img src="javascript:alert(1)" onerror="alert(1)"> here';
      const result = SanitizationUtil.sanitizeText(maliciousInput);
      expect(result).not.toContain('<img');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onerror=');
      expect(result).toContain('Image');
      expect(result).toContain('here');
    });

    it('should remove link tags with malicious href', () => {
      const maliciousInput = 'Click <a href="javascript:alert(1)">here</a>';
      const result = SanitizationUtil.sanitizeText(maliciousInput);
      expect(result).not.toContain('<a');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Click');
      expect(result).toContain('here');
    });

    it('should preserve emojis and unicode characters', () => {
      const inputWithEmojis = 'Hello 👋 world! 🌍 Testing unicode: αβγ';
      const result = SanitizationUtil.sanitizeText(inputWithEmojis);
      expect(result).toBe(inputWithEmojis);
      expect(result).toContain('👋');
      expect(result).toContain('🌍');
      expect(result).toContain('αβγ');
    });

    it('should preserve normal text without HTML', () => {
      const normalText =
        'This is just normal text with numbers 123 and symbols !@#$%';
      const result = SanitizationUtil.sanitizeText(normalText);
      expect(result).toBe(normalText);
    });

    it('should handle empty strings', () => {
      expect(SanitizationUtil.sanitizeText('')).toBe('');
      expect(SanitizationUtil.sanitizeText('   ')).toBe('   ');
    });

    it('should handle null and undefined gracefully', () => {
      expect(SanitizationUtil.sanitizeText(null as unknown as string)).toBe(
        null,
      );
      expect(
        SanitizationUtil.sanitizeText(undefined as unknown as string),
      ).toBe(undefined);
    });

    it('should handle non-string types gracefully', () => {
      expect(SanitizationUtil.sanitizeText(123 as unknown as string)).toBe(123);
      expect(SanitizationUtil.sanitizeText({} as unknown as string)).toEqual(
        {},
      );
      expect(SanitizationUtil.sanitizeText([] as unknown as string)).toEqual(
        [],
      );
    });

    it('should trim whitespace after tag removal', () => {
      const input =
        '  <script>alert(1)</script>  valid content  <script>alert(2)</script>  ';
      const result = SanitizationUtil.sanitizeText(input);
      expect(result.startsWith('  ')).toBe(false);
      expect(result.endsWith('  ')).toBe(false);
      expect(result).toContain('valid content');
    });

    it('should handle nested tags', () => {
      const input = '<div><script>alert(1)</script><p>Content</p></div>';
      const result = SanitizationUtil.sanitizeText(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<div>');
      expect(result).not.toContain('<p>');
      expect(result).toContain('Content');
    });

    it('should handle malformed HTML', () => {
      const input = '<script>alert(1)<script>alert(2)</script>';
      const result = SanitizationUtil.sanitizeText(input);
      expect(result).not.toContain('<script>');
      // Content is escaped, so alert( is still present as text
      expect(result).toContain('alert(1)');
      expect(result).toContain('alert(2)');
    });

    it('should handle mixed content with special characters', () => {
      const input =
        'User & Company <script>alert("XSS")</script> said "Hello" & goodbye';
      const result = SanitizationUtil.sanitizeText(input);
      // Ampersands get escaped to &amp; by sanitize-html
      expect(result).toContain('User &amp; Company');
      expect(result).toContain('said "Hello" &amp; goodbye');
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow basic formatting tags', () => {
      const input = 'This is <b>bold</b> and <i>italic</i> text';
      const result = SanitizationUtil.sanitizeRichText(input);
      expect(result).toContain('<b>bold</b>');
      expect(result).toContain('<i>italic</i>');
    });

    it('should still remove dangerous tags', () => {
      const input = 'Safe <b>bold</b> but dangerous <script>alert(1)</script>';
      const result = SanitizationUtil.sanitizeRichText(input);
      expect(result).toContain('<b>bold</b>');
      expect(result).not.toContain('<script>');
    });

    it('should allow strong and em tags', () => {
      const input = 'Text with <strong>strong</strong> and <em>emphasis</em>';
      const result = SanitizationUtil.sanitizeRichText(input);
      expect(result).toContain('<strong>strong</strong>');
      expect(result).toContain('<em>emphasis</em>');
    });

    it('should allow underline tags', () => {
      const input = 'Text with <u>underline</u>';
      const result = SanitizationUtil.sanitizeRichText(input);
      expect(result).toContain('<u>underline</u>');
    });
  });

  describe('containsMaliciousContent', () => {
    it('should detect malicious content', () => {
      const maliciousInput = "Hello <script>alert('xss')</script> world!";
      expect(SanitizationUtil.containsMaliciousContent(maliciousInput)).toBe(
        true,
      );
    });

    it('should not flag clean content', () => {
      const cleanInput = 'This is just normal text with emojis 👋';
      expect(SanitizationUtil.containsMaliciousContent(cleanInput)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(SanitizationUtil.containsMaliciousContent('')).toBe(false);
    });

    it('should handle non-string types', () => {
      expect(
        SanitizationUtil.containsMaliciousContent(null as unknown as string),
      ).toBe(false);
      expect(
        SanitizationUtil.containsMaliciousContent(123 as unknown as string),
      ).toBe(false);
    });
  });

  describe('custom sanitization options', () => {
    it('should respect custom allowed tags', () => {
      const input = 'Text with <span>custom</span> and <div>tags</div>';
      const result = SanitizationUtil.sanitize(input, {
        allowedTags: ['span'],
      });
      expect(result).toContain('<span>custom</span>');
      expect(result).not.toContain('<div>');
      expect(result).toContain('tags'); // content should remain
    });

    it('should handle custom allowed attributes', () => {
      const input = 'Text with <span class="test" id="example">content</span>';
      const result = SanitizationUtil.sanitize(input, {
        allowedTags: ['span'],
        allowedAttributes: { span: ['class'] },
      });
      expect(result).toContain('class="test"');
      expect(result).not.toContain('id="example"');
    });
  });

  describe('edge cases', () => {
    it('should handle very long malicious strings', () => {
      const longMalicious = '<script>' + 'alert(1);'.repeat(1000) + '</script>';
      const result = SanitizationUtil.sanitizeText(longMalicious);
      expect(result).not.toContain('<script>');
      // Content gets escaped so length may actually increase
      expect(result).toContain('alert(1);');
    });

    it('should handle special unicode characters', () => {
      const unicodeText = '𝕳𝖊𝖑𝖑𝖔 𝖂𝖔𝖗𝖑𝖉! 🚀';
      const result = SanitizationUtil.sanitizeText(unicodeText);
      expect(result).toBe(unicodeText);
    });

    it('should handle HTML entities correctly', () => {
      const input = 'Text with &lt;script&gt; and &amp; entities';
      const result = SanitizationUtil.sanitizeText(input);
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&amp;');
    });
  });
});
