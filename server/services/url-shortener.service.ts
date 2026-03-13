import { dbService } from "./mongodb.service.js";

export function generateShortCode(length: number = 6): string {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export async function generateUniqueShortCode(
  maxAttempts: number = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const length = 6 + Math.floor(attempt / 3);
    const shortCode = generateShortCode(length);

    const existing = await dbService.getShortenedUrlByCode(shortCode);

    if (!existing) {
      return shortCode;
    }

    console.log(
      `⚠️ Short code collision: ${shortCode} (attempt ${attempt + 1}/${maxAttempts})`,
    );
  }

  throw new Error(
    `Failed to generate unique short code after ${maxAttempts} attempts`,
  );
}

export async function createShortUrl(
  longUrl: string,
  originalUrl: string,
): Promise<{ shortCode: string; shortUrl: string }> {
  const existing = await dbService.getShortenedUrlByLongUrl(longUrl);
  
  if (existing) {
    const baseUrl = process.env.SERVER_URL || "http://localhost:3001";
    const shortUrl = `${baseUrl}/${existing.shortCode}`;
    console.log(
      `♻️ Reusing existing short code: ${existing.shortCode} for ${longUrl}`,
    );
    return { shortCode: existing.shortCode, shortUrl };
  }

  const maxRetries = 5;
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      const shortCode = await generateUniqueShortCode();

      await dbService.createShortenedUrl({
        shortCode,
        longUrl,
        originalUrl,
      });

      const baseUrl = process.env.SERVER_URL || "http://localhost:3001";
      const shortUrl = `${baseUrl}/${shortCode}`;

      console.log(`✅ Created new short code: ${shortCode} for ${originalUrl}`);
      return { shortCode, shortUrl };
    } catch (error: any) {
      if (error.message?.includes("Duplicate short code") && retry < maxRetries - 1) {
        console.log(
          `⚠️ Duplicate detected during insert, retrying... (${retry + 1}/${maxRetries})`,
        );
        continue;
      }
      
      throw error;
    }
  }

  throw new Error("Failed to create shortened URL after multiple retries");
}

export async function getLongUrl(shortCode: string): Promise<string | null> {
  const urlEntry = await dbService.getShortenedUrlByCode(shortCode);

  if (!urlEntry) {
    return null;
  }

  await dbService.incrementUrlClicks(shortCode);

  return urlEntry.longUrl;
}
