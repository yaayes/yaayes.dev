import readingTime from "reading-time";

export function getReadingTime(body: string): string {
  const { minutes } = readingTime(body);
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} min read`;
}
