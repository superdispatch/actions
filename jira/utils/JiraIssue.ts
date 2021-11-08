export function parseIssue(input: string) {
  const match = /([a-z]{2,}-\d+)/.exec(input);
  return match?.[1].toUpperCase();
}
