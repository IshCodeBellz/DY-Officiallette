export function debug(tag: string, ...args: any[]) {
  if (process.env.TEST_DEBUG === "1") {
    // eslint-disable-next-line no-console
    console.log(`[${tag}]`, ...args);
  }
}
