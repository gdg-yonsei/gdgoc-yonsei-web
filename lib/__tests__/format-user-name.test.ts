/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import formatUserName from '../format-user-name';

/**
 * Tests for the formatUserName function.
 */
describe('formatUserName', () => {
  /**
   * Tests that the full name is formatted correctly for non-foreigners.
   */
  it('formats full name when not foreigner', () => {
    const result = formatUserName('gh', 'John', 'Doe', false);
    expect(result).toBe('Doe John');
  });

  /**
   * Tests that the full name is formatted correctly for foreigners.
   */
  it('formats full name when foreigner', () => {
    const result = formatUserName('gh', 'John', 'Doe', true);
    expect(result).toBe('John Doe');
  });

  /**
   * Tests that the function falls back to the GitHub name when the first and last names are not provided.
   */
  it('falls back to GitHub name', () => {
    const result = formatUserName('githubName', null, null, false);
    expect(result).toBe('githubName');
  });

  /**
   * Tests that the function returns 'Unknown User' when no information is provided.
   */
  it('returns Unknown User when no info', () => {
    const result = formatUserName(null, null, null);
    expect(result).toBe('Unknown User');
  });
});