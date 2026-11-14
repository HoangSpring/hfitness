import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import { AuthProvider } from './features/auth/AuthProvider';
import { LocaleProvider } from './i18n/LocaleProvider';
import { AppRouter } from './app/router';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(<StrictMode><AuthProvider><LocaleProvider><AppRouter /></LocaleProvider></AuthProvider></StrictMode>);
