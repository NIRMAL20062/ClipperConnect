
'use server';
/**
 * @fileOverview An AI agent that recommends barbershops to users based on their interests and preferences.
 *
 * - recommendShopsForUser - A function that handles the shop recommendation process.
 * - RecommendShopsInput - The input type for the recommendShopsForUser function.
 * - RecommendShopsOutput - The return type for the recommendShopsForUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { mockShopsArray } from '@/lib/mock-data'; // Using centralized mock data
import type { RecommendShopsInput, RecommendShopsOutput, RecommendedShopInfo } from '@/lib/types';

const RecommendShopsInputSchema = z.object({
  userId: z.string().describe("The ID of the user for whom to generate recommendations. This will be used in the future to fetch their specific preferences and history."),
  serviceInterest: z.string().optional().describe("The type of service the user is interested in, e.g., 'Classic Haircut', 'Beard Trim', 'Modern Fade'."),
});

const RecommendedShopInfoSchema = z.object({
  shopId: z.string().describe("The ID of the recommended barbershop."),
  shopName: z.string().describe("The name of the recommended barbershop."),
  reason: z.string().describe("A brief explanation of why this specific shop is recommended for the user."),
});

const RecommendShopsOutputSchema = z.object({
  recommendations: z.array(RecommendedShopInfoSchema).describe("A list of up to 3 recommended barbershops."),
  overallReasoning: z.string().describe("A general summary explaining the rationale behind the collective recommendations, perhaps highlighting common themes or how they match perceived user needs."),
});

export async function recommendShopsForUser(input: RecommendShopsInput): Promise<RecommendShopsOutput> {
  return recommendShopsFlow(input);
}

// Prepare a string representation of shops for the prompt
// This helps keep the prompt cleaner and ensures the AI has the necessary shop data.
const shopsListForPrompt = mockShopsArray.map(shop => ({
    id: shop.id,
    name: shop.name,
    rating: shop.rating,
    priceRange: shop.priceRange,
    description: shop.description,
    services: shop.services.map(s => s.name).join(', '), // List service names
  }));
const shopsListString = JSON.stringify(shopsListForPrompt, null, 2);

const prompt = ai.definePrompt({
  name: 'recommendShopsPrompt',
  input: { schema: RecommendShopsInputSchema },
  output: { schema: RecommendShopsOutputSchema },
  prompt: `You are a friendly and insightful AI assistant for ClipperConnect, a barbershop booking platform.
  Your goal is to provide personalized barbershop recommendations to users.

  User ID: {{{userId}}}
  Service of Interest: {{#if serviceInterest}}'{{{serviceInterest}}}'{{else}}General interest{{/if}}

  User Preferences (mocked for now, adapt your reasoning as if these were real):
  - Enjoys trendy, modern styles.
  - Values shops with high ratings (4.5+ stars if possible).
  - Looking for a good quality service, price is secondary but not exorbitant.
  - If service interest is specified, prioritize shops known for that service or similar.

  Available Barbershops:
  \`\`\`json
  {{{shopsListString}}}
  \`\`\`

  Based on the user's (mocked) preferences and their service interest (if any), please recommend up to 3 barbershops from the list provided.
  For each recommendation, include the shop's ID, name, and a concise, compelling reason why it's a good fit for this user.
  Also provide a brief overall reasoning statement that summarizes why this set of recommendations is suitable.

  Ensure your output strictly adheres to the requested JSON format.
  The 'recommendations' array should contain objects with 'shopId', 'shopName', and 'reason'.
  The 'overallReasoning' should be a string.
  `,
  // Pass the shopsListString into the prompt's context.
  // It's not directly from the input schema, so we inject it here.
  // This is a way to provide additional context to the prompt that isn't part of the direct user input.
  context: {
    shopsListString: shopsListString,
  }
});

const recommendShopsFlow = ai.defineFlow(
  {
    name: 'recommendShopsFlow',
    inputSchema: RecommendShopsInputSchema,
    outputSchema: RecommendShopsOutputSchema,
  },
  async (input) => {
    // The prompt function automatically includes context variables if defined in ai.definePrompt
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate recommendations.");
    }
    return output;
  }
);
