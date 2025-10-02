import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  platform: string;      // mobile, desktop, tablet
  brand: string | null;  // Apple, Samsung, etc.
  model: string | null;  // iPhone, Galaxy S21, etc.
  os: string | null;     // iOS, Android, Windows, macOS
  osVersion: string | null;
  browser: string | null; // Chrome, Safari, Firefox
  browserVersion: string | null;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    platform: result.device.type || 'desktop',
    brand: result.device.vendor || null,
    model: result.device.model || null,
    os: result.os.name || null,
    osVersion: result.os.version || null,
    browser: result.browser.name || null,
    browserVersion: result.browser.version || null,
  };
}
