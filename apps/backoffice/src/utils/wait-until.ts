export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitUntil = async (
  predicate: () => boolean,
  interval = 50,
): Promise<void> => {
  while (predicate()) {
    await wait(interval);
  }
};
