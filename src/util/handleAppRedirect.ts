const IOS_APP_URL = 'https://apps.apple.com/pl/app/jingle-pay/id1493392189';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.jinglepay&hl=en';

type OperatingSystem = 'iOS' | 'Android' | 'other';

/**
 * Detects the user's operating system based on the user agent string.
 * @returns {'iOS' | 'Android' | 'other'} The detected operating system.
 */
function detectOS(): OperatingSystem {
  // Ensure this code runs only in the browser
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'other';
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'iOS';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  // Other OS
  return 'other';
}

/**
 * Handles the click event on an app download link.
 * Prevents default navigation and redirects to the appropriate app store
 * if the user is on iOS or Android. Otherwise, allows default link behavior.
 * @param {MouseEvent} event - The click event object.
 */
export function triggerAppRedirect(event: MouseEvent): void {
  const os = detectOS();

  if (os === 'iOS') {
    event.preventDefault(); // Stop the browser from following the link's href
    window.location.href = IOS_APP_URL;
  } else if (os === 'Android') {
    event.preventDefault(); // Stop the browser from following the link's href
    window.location.href = ANDROID_APP_URL;
  }
  // If os is 'other', do nothing and let the default link behavior occur.
}
