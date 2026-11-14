import type { Profile } from '../features/profile/profile';

export function shouldShowAdminNav(profileKnown: boolean, role?: Profile['role']): boolean {
  // This is a UX convenience only; RLS and the server admin functions enforce authorization.
  return profileKnown && role === 'ADMIN';
}
