
'use server';
/**
 * @fileOverview An AI agent that parses natural language queries to find barbershops.
 *
 * - searchShopsByNaturalLanguage: Parses a user's query into structured filters.
 * - NaturalLanguageSearchInput: Input type for the flow.
 * - NaturalLanguageSearchOutput: Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { NaturalLanguageSearchInput, NaturalLanguageSearchOutput, ParsedShopFilters } from '@/lib/types';

const ParsedShopFiltersSchema = z.object({
  serviceKeywords: z.array(z.string()).optional().describe('Keywords related to services (e.g., "haircut", "beard trim", "fade").'),
  locationKeywords: z.array(z.string()).optional().describe('Keywords related to location (e.g., "downtown", "near Main Street", "Styleville", "zip code").'),
  price: z.object({
    max: z.number().optional().describe('Maximum price if specified (e.g., "under $50" means max: 50).'),
    min: z.number().optional().describe('Minimum price if specified (e.g., "over $20" means min: 20).'),
    descriptor: z.enum(['under', 'over', 'around', 'exact', 'cheap', 'expensive', 'any']).optional().describe('Price qualifier like "cheap", "expensive", "under", "around", "over", "exact", or "any". "cheap" implies lower end, "expensive" higher end. "any" or not present means no price constraint.'),
  }).optional().describe('Price related filters.'),
  dateTime: z.object({
    date: z.string().optional().describe('Specific date like "2024-07-25", or relative terms like "today", "tomorrow".'),
    time: z.string().optional().describe('Specific time like "4 PM", "16:00", or general periods like "afternoon", "evening", "morning".'),
    dayOfWeek: z.string().optional().describe('Day of the week like "Saturday", "Monday".'),
  }).optional().describe('Date and time related filters.'),
  rating: z.object({
    min: z.number().optional().describe('Minimum star rating (e.g., 4 for "4 stars and up").'),
  }).optional().describe('Minimum customer rating.'),
  openNow: z.boolean().optional().describe('True if the user explicitly asks for shops that are "open now".'),
  otherFeatures: z.array(z.string()).optional().describe('Other mentioned features or amenities like "kid-friendly", "accepts credit cards", "free wifi".'),
}).describe('Structured filters parsed from the user query.');

const NaturalLanguageSearchInputSchema = z.object({
  query: z.string().describe('The natural language query from the user, e.g., "Find me a cheap barbershop for a haircut in downtown that is open tomorrow afternoon".'),
});

const NaturalLanguageSearchOutputSchema = z.object({
  parsedFilters: ParsedShopFiltersSchema,
  searchSummary: z.string().optional().describe('A brief summary of how the AI interpreted the query and what it will search for.'),
  clarificationNeeded: z.string().optional().describe('A question to the user if the query is too ambiguous or needs more information.'),
});

export async function searchShopsByNaturalLanguage(input: NaturalLanguageSearchInput): Promise<NaturalLanguageSearchOutput> {
  return naturalLanguageShopSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageShopSearchPrompt',
  input: { schema: NaturalLanguageSearchInputSchema },
  output: { schema: NaturalLanguageSearchOutputSchema },
  prompt: `You are an intelligent assistant for ClipperConnect, a barbershop booking platform.
Your task is to parse a user's natural language query and convert it into a structured set of filters.

User Query: "{{{query}}}"

Analyze the query and extract the following information if present:
- Service Keywords: Identify terms related to barber services (e.g., "haircut", "beard trim", "fade", "styling", "shave", "color").
- Location Keywords: Identify terms related to location (e.g., "downtown", "near [street/landmark]", city names, zip codes).
- Price:
    - Identify maximum price (e.g., "under $50", "less than 30 dollars").
    - Identify minimum price (e.g., "over $20", "at least 25").
    - Identify general price descriptors ("cheap", "affordable" imply lower prices; "premium", "expensive" imply higher prices; "moderate", "mid-range"). Set price.descriptor accordingly. If no price is mentioned, do not include the price object or set descriptor to "any".
- Date/Time:
    - Specific date (e.g., "July 25th", "2024-07-25").
    - Relative dates ("today", "tomorrow", "next Monday").
    - Specific time ("4 PM", "16:00").
    - General time periods ("morning", "afternoon", "evening").
    - Day of the week ("Saturday", "on weekdays").
- Rating: Minimum star rating if mentioned (e.g., "4 stars and up", "highly rated").
- Open Now: If the user explicitly asks for shops "open now".
- Other Features: Any other specific requests like "kid-friendly", "accepts cards".

Output a JSON object adhering to the 'NaturalLanguageSearchOutputSchema'.
The 'parsedFilters' object should contain all extracted criteria.
If the query is clear, provide a concise 'searchSummary' of how you interpreted it (e.g., "Searching for affordable barbershops offering haircuts in downtown for tomorrow afternoon.").
If the query is ambiguous or key information is missing for a reasonable search (e.g., "find a barber"), set 'clarificationNeeded' to ask the user for more details (e.g., "Sure, I can help with that! Could you tell me what service you're looking for and any location preference?"). In such a case, 'parsedFilters' might be partially filled or empty.

Example User Query: "I need a cheap men's haircut in South City tomorrow around 2pm, must be good."
Expected 'parsedFilters' (example, adapt to schema):
{
  "serviceKeywords": ["men's haircut"],
  "locationKeywords": ["South City"],
  "price": { "descriptor": "cheap" },
  "dateTime": { "date": "tomorrow", "time": "around 2pm" },
  "rating": { "min": 4 } // "must be good" implies high rating
}
Expected 'searchSummary': "Searching for highly-rated, affordable barbershops in South City for a men's haircut tomorrow around 2 PM."

If a user says "barbershops near me", set locationKeywords to ["near me"] or similar.
If price is "under $X", set price.max = X and price.descriptor = "under".
If price is "around $X", set price.descriptor = "around" and you can optionally set min/max like X-5 to X+5.
Be liberal with serviceKeywords and locationKeywords, include as many relevant terms as possible.
Prioritize user's explicit terms. If they say "cheap" and "under $30", both are relevant for price.

Current Date for context (if needed for "today"/"tomorrow"): ${new Date().toISOString().split('T')[0]}
`,
});

const naturalLanguageShopSearchFlow = ai.defineFlow(
  {
    name: 'naturalLanguageShopSearchFlow',
    inputSchema: NaturalLanguageSearchInputSchema,
    outputSchema: NaturalLanguageSearchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to parse the search query.');
    }
    // Ensure parsedFilters is always an object, even if empty
    if (!output.parsedFilters) {
      output.parsedFilters = {};
    }
    return output;
  }
);
