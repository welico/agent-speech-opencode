import { z } from 'zod';

export const SpeakTextInputSchema = z.object({
  text: z.string().min(1).describe('Text to speak'),
  voice: z.string().optional().describe('Voice name (e.g., Samantha, Alex)'),
  rate: z.number().min(50).max(400).optional().describe('Speech rate in WPM (50-400)'),
  volume: z.number().min(0).max(100).optional().describe('Volume level (0-100)'),
});

export type SpeakTextInput = z.infer<typeof SpeakTextInputSchema>;

export function safeValidateSpeakTextInput(
  data: unknown
): { success: true; data: SpeakTextInput } | { success: false; error: string } {
  const result = SpeakTextInputSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    error: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
}
