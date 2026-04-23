/**
 * Unified deliberation client.
 * Routes to the active LLM provider based on model selection.
 */

import { generateDeliberation as kimiDeliberation, generateFullDeliberation as kimiFullDeliberation } from "./kimi";
import { generateDeliberation as minimaxDeliberation, generateFullDeliberation as minimaxFullDeliberation } from "./minimax";

export type DeliberationProvider = "kimi" | "minimax";

export async function generateFullDeliberation(params: {
  briefQuestion: string;
  briefGoal?: string;
  briefDeadline?: string;
  briefConstraints?: string;
  briefKnownFacts?: string;
  briefAttachments?: string;
  memberPrompts: Array<{
    personaName: string;
    personaTitle: string;
    aiPersonaPrompt: string;
    seatRole: string;
    seatRoleLabel: string;
  }>;
  apiKeyOverride?: string;
  provider?: DeliberationProvider;
  platform?: "international" | "china";
}): Promise<string> {
  const provider = params.provider ?? "kimi";

  const baseParams = {
    briefQuestion: params.briefQuestion,
    briefGoal: params.briefGoal,
    briefDeadline: params.briefDeadline,
    briefConstraints: params.briefConstraints,
    briefKnownFacts: params.briefKnownFacts
      ? `${params.briefKnownFacts}${params.briefAttachments ? `\n\nATTACHED DOCUMENTS:\n${params.briefAttachments}` : ""}`
      : params.briefAttachments ?? undefined,
    memberPrompts: params.memberPrompts,
    apiKeyOverride: params.apiKeyOverride,
    platform: params.platform,
  };

  if (provider === "minimax") {
    return minimaxFullDeliberation(baseParams);
  }
  return kimiFullDeliberation(baseParams);
}

export async function generateDeliberation(
  systemPrompt: string,
  userPrompt: string,
  apiKeyOverride?: string,
  provider: DeliberationProvider = "kimi"
): Promise<string> {
  if (provider === "minimax") {
    return minimaxDeliberation(systemPrompt, userPrompt, apiKeyOverride);
  }
  return kimiDeliberation(systemPrompt, userPrompt, apiKeyOverride);
}
