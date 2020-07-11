function base64(data: string): string {
  return Buffer.from(data, 'utf8').toString('base64');
}

export function unBase64(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8');
}
