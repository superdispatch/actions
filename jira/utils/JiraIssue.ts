export function parseIssue(input: string) {
  const match = /([A-Z]{2,}-\d+)/.exec(input);
  return match?.[1];
}
