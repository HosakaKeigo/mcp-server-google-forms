import { describe, it, expect } from 'vitest';
import { extractFormId } from './extract-form-id';

describe('extractFormId', () => {
  // Test cases for valid Google Form URLs
  it('should extract form ID from URL pattern /d/e/{formId}/viewform', () => {
    const url = 'https://docs.google.com/forms/d/e/1FAIpQLScLp9N9_N3Y71RONH2Hdl0x0Z5k2IuL2FA8E2TSS89LzL0hbA/viewform';
    const expectedFormId = '1FAIpQLScLp9N9_N3Y71RONH2Hdl0x0Z5k2IuL2FA8E2TSS89LzL0hbA';
    expect(extractFormId(url)).toBe(expectedFormId);
  });

  it('should extract form ID from URL pattern /d/e/{formId}/edit', () => {
    const url = 'https://docs.google.com/forms/d/e/1FAIpQLScLp9N9_N3Y71RONH2Hdl0x0Z5k2IuL2FA8E2TSS89LzL0hbA/edit';
    const expectedFormId = '1FAIpQLScLp9N9_N3Y71RONH2Hdl0x0Z5k2IuL2FA8E2TSS89LzL0hbA';
    expect(extractFormId(url)).toBe(expectedFormId);
  });
  
  it('should extract form ID from URL pattern /d/{formId}/edit', () => {
    const url = 'https://docs.google.com/forms/d/FORM_ID_123/edit';
    const expectedFormId = 'FORM_ID_123';
    expect(extractFormId(url)).toBe(expectedFormId);
  });

  it('should extract form ID from URL pattern /d/{formId}/viewform', () => {
    const url = 'https://docs.google.com/forms/d/FORM_ID_456/viewform';
    const expectedFormId = 'FORM_ID_456';
    expect(extractFormId(url)).toBe(expectedFormId);
  });

  // Test cases for invalid inputs
  it('should throw error for an invalid URL string', () => {
    const invalidUrl = 'not a url';
    expect(() => extractFormId(invalidUrl)).toThrowError(/Error parsing form URL: Invalid URL/);
  });

  it('should throw error for a valid URL that is not a Google Forms URL', () => {
    const url = 'https://www.google.com';
    expect(() => extractFormId(url)).toThrowError(/Error parsing form URL: Invalid Google Forms URL/);
  });
  
  it('should throw error for a Google Forms URL with an unrecognized path structure (no /d/)', () => {
    const url = 'https://docs.google.com/forms/somethingelse/FORM_ID_789/edit';
    expect(() => extractFormId(url)).toThrowError(/Error parsing form URL: Invalid Google Forms URL/);
  });

  it('should throw error for a Google Forms URL missing form ID after /d/e/', () => {
    const url = 'https://docs.google.com/forms/d/e//edit';
    expect(() => extractFormId(url)).toThrowError(/Error parsing form URL: Form ID not found in URL path/);
  });

  it('should throw error for a Google Forms URL missing form ID after /d/', () => {
    const url = 'https://docs.google.com/forms/d//edit';
    expect(() => extractFormId(url)).toThrowError(/Error parsing form URL: Form ID not found in URL path/);
  });

  it('should throw error for a Google Forms URL with /d/e/ but no further path segments', () => {
    const url = 'https://docs.google.com/forms/d/e/';
    expect(() => extractFormId(url)).toThrowError(/Error parsing form URL: Form ID not found in URL path/);
  });

  it('should throw error for a Google Forms URL with /d/ but no further path segments', () => {
    const url = 'https://docs.google.com/forms/d/';
    expect(() => extractFormId(url)).toThrowError(/Error parsing form URL: Form ID not found in URL path/);
  });
});
