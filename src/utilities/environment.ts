export const applicationName = process.env.APPLICATION_NAME!;

export const environment = process.env.NODE_ENV!;

export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

export function isTesting() {
  return process.env.NODE_ENV === 'testing';
}

export function isStaging() {
  return process.env.NODE_ENV === 'staging';
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}
