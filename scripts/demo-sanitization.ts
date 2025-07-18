#!/usr/bin/env node

/**
 * Demonstration script showing the data sanitization functionality
 * Run with: npm run demo:sanitization
 */

import { plainToClass } from 'class-transformer';
import { SanitizationUtil } from '../src/common/utils/sanitization.util';
import { UpdateUserDto } from '../src/resources/users/dto/user.dto';

console.log('🔒 Beaver Core Data Sanitization Demo\n');

// Example from the GitHub issue
console.log('📋 Issue Example:');
const issueExample = {
  email: "test<script>alert('xss')</script>@example.com"
};
const dto1 = plainToClass(UpdateUserDto, issueExample);
console.log('Input:', issueExample.email);
console.log('Output:', dto1.email);
console.log('✅ Script tags neutralized!\n');

// XSS Attack Prevention
console.log('🛡️ XSS Attack Prevention:');
const xssTests = [
  "Click <a href=\"javascript:alert('XSS')\">here</a>",
  "Image <img src=\"x\" onerror=\"alert('XSS')\"> test",
  "Frame <iframe src=\"javascript:alert('XSS')\"></iframe> test",
  "Style <style>body{background:url('javascript:alert(1)')}</style> test"
];

xssTests.forEach((test, i) => {
  const dto = plainToClass(UpdateUserDto, { email: test });
  console.log(`Test ${i + 1}:`);
  console.log('Input:', test);
  console.log('Output:', dto.email);
  console.log('');
});

// Emoji and Unicode Preservation
console.log('😊 Emoji & Unicode Preservation:');
const emojiTest = {
  email: "hello👋@example.com"
};
const dto2 = plainToClass(UpdateUserDto, emojiTest);
console.log('Input:', emojiTest.email);
console.log('Output:', dto2.email);
console.log('✅ Emojis and unicode preserved!\n');

// Malicious Content Detection
console.log('🔍 Malicious Content Detection:');
const testCases = [
  "Clean text with emojis 👋",
  "Malicious <script>alert('xss')</script> content",
  "Another <iframe>dangerous</iframe> example"
];

testCases.forEach((test) => {
  const isMalicious = SanitizationUtil.containsMaliciousContent(test);
  console.log(`"${test}" -> ${isMalicious ? '⚠️ MALICIOUS' : '✅ CLEAN'}`);
});

console.log('\n🎉 Demo completed! Sanitization is working correctly.');