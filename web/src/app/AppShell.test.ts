import { describe, expect, it } from 'vitest';
import { shouldShowAdminNav } from './adminNavigation';

describe('admin navigation visibility', () => {
  it('does not render for normal users or while the role is loading', () => {
    expect(shouldShowAdminNav(false, 'ADMIN')).toBe(false);
    expect(shouldShowAdminNav(true, 'USER')).toBe(false);
  });

  it('renders only for a known admin profile', () => {
    expect(shouldShowAdminNav(true, 'ADMIN')).toBe(true);
  });
});
