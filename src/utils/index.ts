import { randomBytes } from "crypto";

export function generateRoomId(): string {
  return randomBytes(3).toString("hex");
}


export function generateUserId(): string {
  return randomBytes(8).toString("hex");
}


export function sanitizeMessage(content: string): string {
  if (typeof content !== "string") {
    throw new Error("Message content must be a string");
  }

  
  return content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()
    .slice(0, 1000); // Limit to 1000 characters
}


export function isValidRoomId(roomId: string): boolean {
  if (typeof roomId !== "string") return false;
  return /^[a-f0-9]{6}$/.test(roomId);
}


export function isValidUserName(name: string): boolean {
  if (typeof name !== "string") return false;
  return name.trim().length >= 1 && name.trim().length <= 50;
}


export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export function getCurrentTimestamp(): number {
  return Date.now();
}
