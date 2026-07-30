import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppNew from './app/AppNew';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppNew />
  </StrictMode>,
);
