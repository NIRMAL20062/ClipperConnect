
'use server';
/**
 * @fileOverview An AI agent that generates compelling descriptions for barbershop services.
 *
 * - generateServiceDescription: A function that handles the service description generation process.
 * - GenerateServiceDescriptionInput: The input type for the generateServiceDescription function.
 * - GenerateServiceDescriptionOutput: The return type for the generateServiceDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenerateServiceDescriptionInput, GenerateServiceDescriptionOutput } from '@/lib/types';

const GenerateServiceDescriptionInputSchema = z.object({
  serviceName: z.string().describe('The name of the barbershop service (e.g., "Men\'s Haircut", "Beard Trim").'),
  keywords: z.string().optional().describe('Optional keywords to guide the description (e.g., "modern", "classic", "quick", "relaxing").'),
});

const GenerateServiceDescriptionOutputSchema = z.object({
  description: z.string().describe('The AI-generated service description, typically 1-2 sentences long.'),
});

export async function generateServiceDescription(input: GenerateServiceDescriptionInput): Promise<GenerateServiceDescriptionOutput> {
  return generateServiceDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateServiceDescriptionPrompt',
  input: { schema: GenerateServiceDescriptionInputSchema },
  output: { schema: GenerateServiceDescriptionOutputSchema },
  prompt: `You are an expert copywriter specializing in barbershop services.
Your task is to generate a concise, appealing, and professional description for a given barbershop service.
The description should ideally be 1-2 sentences long.

Service Name: {{{serviceName}}}
{{#if keywords}}
Keywords to consider: {{{keywords}}}
{{/if}}

Focus on highlighting the key benefits or the experience of the service.
Make it sound inviting to customers.
`,
});

const generateServiceDescriptionFlow = ai.defineFlow(
  {
    name: 'generateServiceDescriptionFlow',
    inputSchema: GenerateServiceDescriptionInputSchema,
    outputSchema: GenerateServiceDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a service description.');
    }
    return output;
  }
);
