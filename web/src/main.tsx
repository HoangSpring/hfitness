import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppRouter } from './app/router';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(<StrictMode><AuthProvider><AppRouter /></AuthProvider></StrictMode>);

