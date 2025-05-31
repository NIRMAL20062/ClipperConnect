
'use server';
/**
 * @fileOverview An AI agent that acts as a customer support chatbot for ClipperConnect.
 *
 * - chatWithSupportBot: A function that handles user queries for the chatbot.
 * - CustomerSupportChatbotInput: The input type for the chatWithSupportBot function.
 * - CustomerSupportChatbotOutput: The return type for the chatWithSupportBot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { CustomerSupportChatbotInput, CustomerSupportChatbotOutput } from '@/lib/types';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

const CustomerSupportChatbotInputSchema = z.object({
  userQuery: z.string().describe('The latest query or message from the user.'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('Optional: The preceding conversation history to provide context to the AI. Each message has a role ("user" or "model") and parts (the text).'),
});

const CustomerSupportChatbotOutputSchema = z.object({
  botResponse: z.string().describe('The AI chatbot\'s response to the user\'s query.'),
});

export async function chatWithSupportBot(input: CustomerSupportChatbotInput): Promise<CustomerSupportChatbotOutput> {
  return customerSupportChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerSupportChatbotPrompt',
  input: { schema: CustomerSupportChatbotInputSchema },
  output: { schema: CustomerSupportChatbotOutputSchema },
  prompt: `You are Clipper, a friendly and helpful AI assistant for ClipperConnect, a barbershop booking platform.
Your primary goal is to assist users with their questions about using the platform, finding barbershops, understanding services, and the booking process.

Keep your answers concise, clear, and friendly.
You have general knowledge about common barbershop services (e.g., haircuts, beard trims, shaves, hair coloring, styling).
You understand how a typical appointment booking system works.
Do NOT make up specific shop names, real-time availability, or access/disclose any user's personal account information.
If a user asks for something highly specific that you don't know (e.g., "Is 'The Sharp Edge' open at 3 PM next Tuesday?"), politely state that you don't have access to real-time shop-specific details and suggest they check the shop's page or contact the shop directly if the feature exists.
If a user asks about their own bookings, direct them to their user dashboard.

{{#if chatHistory}}
Here is the conversation history (user is 'user', you are 'model'):
{{#each chatHistory}}
{{#each parts}}
{{../role}}: {{text}}
{{/each}}
{{/each}}
{{/if}}

User: {{{userQuery}}}
Clipper:`,
});


const customerSupportChatbotFlow = ai.defineFlow(
  {
    name: 'customerSupportChatbotFlow',
    inputSchema: CustomerSupportChatbotInputSchema,
    outputSchema: CustomerSupportChatbotOutputSchema,
  },
  async (input) => {
    // Construct the prompt input, including history if available
    const promptPayload: CustomerSupportChatbotInput = {
        userQuery: input.userQuery,
    };
    if (input.chatHistory && input.chatHistory.length > 0) {
        promptPayload.chatHistory = input.chatHistory;
    }

    const { output } = await prompt(promptPayload);
    if (!output) {
      throw new Error('AI chatbot failed to generate a response.');
    }
    return output;
  }
);

