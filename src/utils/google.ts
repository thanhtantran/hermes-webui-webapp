interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityServices {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
      logo_alignment?: 'left' | 'center';
    }
  ): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdentityServices;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Google sign-in could not be loaded.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Google sign-in could not be loaded.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function getGoogleIdentity(): GoogleIdentityServices | null {
  return window.google?.accounts?.id ?? null;
}
