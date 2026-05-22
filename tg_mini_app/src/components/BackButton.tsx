import { useEffect } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';

const tg = window.Telegram.WebApp;

// Index routes where back button should NOT be shown
const INDEX_ROUTES = ['/', '/user', '/user/', '/admin', '/admin/'];

function getParentRoute(path: string): string {
  // Remove trailing slash for consistency
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;

  // Get parent by removing the last path segment
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash <= 0) return '/';

  return normalized.slice(0, lastSlash) || '/';
}

export function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const isIndexRoute = INDEX_ROUTES.includes(currentPath);
  const parentRoute = getParentRoute(currentPath);

  useEffect(() => {
    if (isIndexRoute) {
      tg.BackButton.hide();
      return;
    }

    tg.BackButton.show();

    const handleBackClick = () => {
      navigate({ to: parentRoute });
    };

    tg.BackButton.onClick(handleBackClick);

    return () => {
      tg.BackButton.offClick(handleBackClick);
      tg.BackButton.hide();
    };
  }, [currentPath, isIndexRoute, parentRoute, navigate]);

  return null;
}
