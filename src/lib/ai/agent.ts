// Agent orchestrator. Runs a provider-agnostic tool-call loop: ask the provider
// for the next turn; if it returns tool calls, execute them and feed the results
// back; repeat until the provider returns a final reply. The same loop works
// for the mock provider and for a real LLM provider.

import { mockLLM } from "@/lib/ai/providers/mock-llm";
import { runTool, TOOLS } from "@/lib/ai/tools";
import type {
  AgentContext,
  AgentResponse,
  Card,
  ChatMessage,
  LLMProvider,
} from "@/lib/ai/types";

const MAX_ITERATIONS = 8;

// Swap point: choose the provider (e.g. from an env flag) here.
const provider: LLMProvider = mockLLM;

export async function runAgent(params: {
  messages: ChatMessage[];
  context: AgentContext;
}): Promise<AgentResponse> {
  const messages: ChatMessage[] = [...params.messages];
  let context: AgentContext = params.context ?? {};
  const cards: Card[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const turn = await provider.next({ messages, context, tools: TOOLS });

    if (turn.kind === "final") {
      return {
        reply: turn.content,
        cards: [...cards, ...(turn.cards ?? [])],
        quickReplies: turn.quickReplies ?? [],
        context: turn.context ?? context,
      };
    }

    for (const call of turn.calls) {
      const result = await runTool(call.tool, call.args);
      messages.push({
        role: "tool",
        name: call.tool,
        content: JSON.stringify(result),
      });
      if (result.ok && result.card) cards.push(result.card);
    }
  }

  return {
    reply:
      "Sorry, I got a bit tangled up there. Could you rephrase, or pick one of the options below?",
    cards,
    quickReplies: ["Book a room", "Ask about rooms", "Guest request"],
    context,
  };
}
