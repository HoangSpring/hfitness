export const en = {
  brand: 'HFitness',
  tagline: 'Personalized gym training and nutrition powered by AI.',
  auth: {
    login: { title: 'Welcome back', submit: 'Log in', switch: 'Create an account', switchPrompt: "Don't have an account?", error: "Couldn't log you in. Check your email and password and try again." },
    register: { title: 'Create your account', submit: 'Create account', switch: 'Log in', switchPrompt: 'Already have an account?', success: 'Account created. Welcome to HFitness.' },
    email: 'Email address', emailPlaceholder: 'athlete@domain.com', password: 'Password', confirmPassword: 'Confirm password', passwordPlaceholder: 'Enter your password', showPassword: 'Show password', hidePassword: 'Hide password', invalidEmail: 'Enter a valid email address.', passwordShort: 'Password must be at least 8 characters.', passwordMismatch: 'Passwords do not match.', genericError: 'Something went wrong. Please try again.',
  },
  navigation: { dashboard: 'Dashboard', workout: 'Workout', exercises: 'Exercises', nutrition: 'Nutrition', progress: 'Progress', coach: 'AI Coach', profile: 'Profile', home: 'Home', more: 'More', logout: 'Log out' },
  shell: { menu: 'Main navigation', comingSoon: 'Coming soon', placeholder: 'This part of your fitness journey is being prepared.', notFound: 'Page not found', notFoundDescription: "The page you're looking for doesn't exist.", backDashboard: 'Back to dashboard' },
  common: { required: 'Required', loading: 'Loading', retry: 'Retry', error: 'Error', dismiss: 'Dismiss' },
} as const;

export type TranslationDictionary = typeof en;
export type Locale = 'en' | 'vi';
export type TranslationKey = string;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const value = key.split('.').reduce<unknown>((current, part) => {
    return current && typeof current === 'object' && part in current ? (current as Record<string, unknown>)[part] : undefined;
  }, en);
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, name: string) => String(params?.[name] ?? `{${name}}`));
}

