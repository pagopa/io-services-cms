export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitUntil = async (
  condition: () => boolean,
  interval = 50,
): Promise<void> => {
  while (condition()) {
    await wait(interval);
  }
};
