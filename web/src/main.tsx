import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/oswald/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import { AuthProvider } from './features/auth/AuthProvider';
import { LocaleProvider } from './i18n/LocaleProvider';
import { AppRouter } from './app/router';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(<StrictMode><AuthProvider><LocaleProvider><AppRouter /></LocaleProvider></AuthProvider></StrictMode>);
