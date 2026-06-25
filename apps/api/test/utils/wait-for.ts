/** Polls an async predicate until it resolves truthy or the timeout elapses. */
export async function waitFor(predicate: () => Promise<boolean> | boolean, timeoutMs = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return predicate();
}
