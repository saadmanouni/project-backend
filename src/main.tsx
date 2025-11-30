import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminContentManager } from './components/admin/AdminContentManager';
import './index.css';

const root = createRoot(document.getElementById('root')!);

// If you visit /admin-content in the dev server, render the AdminContentManager directly
if (window.location.pathname === '/admin-content') {
  root.render(
    <StrictMode>
      <AdminContentManager />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
