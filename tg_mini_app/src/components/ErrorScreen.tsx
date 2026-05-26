import { useEffect } from 'react';

const tg = window.Telegram.WebApp;

function ErrorScreen() {
  useEffect(() => {
    tg.MainButton.hide();
    tg.SecondaryButton.hide();
  }, []);


  return <p>An error occurred.</p>
}

export default ErrorScreen