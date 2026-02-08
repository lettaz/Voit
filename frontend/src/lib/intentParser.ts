/**
 * Simple keyword-based intent parser for MVP.
 * Extracts category, timeframe, preferred time, and specifics from natural language input.
 */

export interface ParsedIntent {
  category: string;
  timeframe: string;
  preferredTime?: string;
  specifics?: string;
  raw: string;
}

const CATEGORY_MAP: Record<string, string[]> = {
  dental: ["dentist", "dental", "teeth", "tooth", "cleaning", "cavity", "braces", "orthodontist"],
  restaurant: ["restaurant", "dinner", "lunch", "brunch", "table", "reservation", "dining", "eat", "food"],
  barber: ["barber", "haircut", "hair", "salon", "trim", "shave", "hairdresser", "stylist"],
  auto: ["car", "auto", "mechanic", "repair", "oil change", "tire", "garage", "vehicle", "brake"],
  doctor: ["doctor", "physician", "medical", "health", "clinic", "general practitioner", "gp"],
  therapist: ["therapist", "therapy", "counselor", "psychologist", "mental health"],
  vet: ["vet", "veterinarian", "pet", "animal"],
  optometrist: ["eye", "optometrist", "optician", "glasses", "vision", "eye doctor"],
};

const TIMEFRAME_MAP: Record<string, string[]> = {
  today: ["today", "right now", "asap", "immediately", "as soon as possible"],
  tomorrow: ["tomorrow"],
  "this week": ["this week", "week"],
  "next week": ["next week"],
  "this month": ["this month", "month"],
};

const TIME_MAP: Record<string, string[]> = {
  morning: ["morning", "early", "before noon", "9am", "10am", "8am"],
  afternoon: ["afternoon", "midday", "noon", "lunch time", "1pm", "2pm", "3pm"],
  evening: ["evening", "night", "after work", "5pm", "6pm", "7pm", "8pm", "late"],
};

function matchKeywords(input: string, map: Record<string, string[]>): string | undefined {
  const lower = input.toLowerCase();
  for (const [key, keywords] of Object.entries(map)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return key;
      }
    }
  }
  return undefined;
}

export function parseIntent(input: string): ParsedIntent {
  const category = matchKeywords(input, CATEGORY_MAP) || "general";
  const timeframe = matchKeywords(input, TIMEFRAME_MAP) || "this week";
  const preferredTime = matchKeywords(input, TIME_MAP);

  // Extract specifics: remove known keywords and keep remaining meaningful words
  const specifics = input.trim();

  return {
    category,
    timeframe,
    preferredTime,
    specifics: specifics.length > 0 ? specifics : undefined,
    raw: input,
  };
}

/** Human-readable category labels */
export const CATEGORY_LABELS: Record<string, string> = {
  dental: "Dentist",
  restaurant: "Restaurant",
  barber: "Barber / Hair Salon",
  auto: "Auto Repair",
  doctor: "Doctor",
  therapist: "Therapist",
  vet: "Veterinarian",
  optometrist: "Optometrist",
  general: "Service Provider",
};
