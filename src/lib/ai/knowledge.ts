// Knowledge base lookup used by the general-support intent. Simple keyword
// scoring over active KnowledgeBaseItem rows — stands in for vector search /
// retrieval that a real LLM integration would use.

import { prisma } from "@/lib/prisma";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "you", "your", "i", "we",
  "what", "when", "where", "how", "can", "could", "have", "has", "to", "of",
  "for", "and", "or", "in", "on", "at", "me", "my", "about", "with", "any",
  "there", "this", "that", "it", "please", "tell",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export type KnowledgeMatch = { title: string; content: string; score: number };

export async function searchKnowledgeBase(
  query: string,
  limit = 2,
): Promise<KnowledgeMatch[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const items = await prisma.knowledgeBaseItem.findMany({
    where: { isActive: true },
  });

  const scored = items
    .map((item) => {
      const haystack = `${item.title} ${item.content} ${item.category}`.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 1;
        if (item.title.toLowerCase().includes(token)) score += 1;
        if (item.category.toLowerCase().includes(token)) score += 1;
      }
      return { title: item.title, content: item.content, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
