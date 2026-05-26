import { useEffect } from 'react';

const tg = window.Telegram.WebApp;

function LoadingScreen() {
  useEffect(() => {
    tg.MainButton.hide();
    tg.SecondaryButton.hide();
  }, []);

  return <p>Loading...</p>
}

export default LoadingScreen