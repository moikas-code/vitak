export type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'unknown';
export type Browser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'unknown';

export interface DeviceInfo {
  platform: Platform;
  browser: Browser;
  is_mobile: boolean;
  is_standalone: boolean;
  can_install: boolean;
}

export function detect_device(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'unknown',
      browser: 'unknown',
      is_mobile: false,
      is_standalone: false,
      can_install: false,
    };
  }

  const user_agent = window.navigator.userAgent.toLowerCase();
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const is_standalone = window.matchMedia('(display-mode: standalone)').matches || 
    (nav.standalone === true) || 
    document.referrer.includes('android-app://');

  // Detect platform
  let platform: Platform = 'unknown';
  if (/iphone|ipad|ipod/.test(user_agent)) {
    platform = 'ios';
  } else if (/android/.test(user_agent)) {
    platform = 'android';
  } else if (/windows/.test(user_agent)) {
    platform = 'windows';
  } else if (/macintosh|mac os x/.test(user_agent)) {
    platform = 'macos';
  }

  // Detect browser
  let browser: Browser = 'unknown';
  if (/edg\//.test(user_agent)) {
    browser = 'edge';
  } else if (/chrome|chromium|crios/.test(user_agent) && !/edg\//.test(user_agent)) {
    browser = 'chrome';
  } else if (/firefox|fxios/.test(user_agent)) {
    browser = 'firefox';
  } else if (/safari/.test(user_agent) && !/chrome|chromium|crios/.test(user_agent)) {
    browser = 'safari';
  } else if (/samsungbrowser/.test(user_agent)) {
    browser = 'samsung';
  }

  // Detect if mobile
  const is_mobile = /mobile|tablet|android|iphone|ipad/.test(user_agent);

  // Determine if PWA can be installed
  const can_install = !is_standalone && (
    // iOS Safari
    (platform === 'ios' && browser === 'safari') ||
    // Android Chrome/Samsung Browser
    (platform === 'android' && (browser === 'chrome' || browser === 'samsung')) ||
    // Desktop Chrome/Edge
    (!is_mobile && (browser === 'chrome' || browser === 'edge'))
  );

  return {
    platform,
    browser,
    is_mobile,
    is_standalone,
    can_install,
  };
}

export function get_install_prompt_supported(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}