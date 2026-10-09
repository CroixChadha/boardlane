import { ConvexError } from "convex/values";

// The longest name or title the app accepts, in characters.
export const MAX_TITLE_LENGTH = 200;

// Checks a name or title typed by the user and returns the cleaned-up version.
// Used for bucket names, card titles and checklist item text.
//   - removes spaces from both ends (like Python's .strip())
//   - rejects text that is empty or too long
// "throw new ConvexError(...)" is like Python's "raise ValueError(...)": it
// stops the function, nothing is saved, and the page can show the message.
export function cleanTitle(text: string): string {
  const cleaned = text.trim();
  if (cleaned.length === 0) {
    throw new ConvexError("This can't be empty.");
  }
  if (cleaned.length > MAX_TITLE_LENGTH) {
    throw new ConvexError(
      `This can be at most ${MAX_TITLE_LENGTH} characters long.`,
    );
  }
  return cleaned;
}
