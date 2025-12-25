import { getCachedModel } from "@/lib/getChacedModel";
import { ChatGroq } from "@langchain/groq";
import z from "zod";

const responseformat = z.object({
  keywords: z
    .array(z.string())
    .describe(
      "5-15 relevant keywords or short phrases for routing queries to this document",
    ),
});

/**
 * Generate keywords from document description for routing
 * Uses regular invoke (not structured output) to avoid Groq tool errors
 */
export const generateKeywords = async (
  description: string,
  model: ChatGroq,
): Promise<string[]> => {
  const prompt = `You are a keyword extraction specialist for an intelligent chatbot routing system.

Your task: Given a brief file description, infer what types of questions users might ask about this document, then generate search keywords that would match those questions.

Document description:
"${description}"

Instructions:
1. **Understand the document type and purpose** from the description
2. **Infer likely user questions** even if not explicitly mentioned
3. **Generate 25-30 keywords/phrases** covering:
   - Core topics mentioned in description
   - Related concepts users would ask about
   - Diversify the keywords - don't mention twice, each keyword must be unique & represent different meaning
   - Question keywords (who, what, when, where, how much)
   - Entity types (names, dates, locations, technical terms)

Rules:
- Lowercase only
- 1-3 words per keyword
- Include both broad and specific terms
- Focus on search intent, not just description words

Examples:

Description: "Employee handbook with vacation policies"
Keywords: ["employee", "handbook", "vacation", "policy", "leave", "pto", "time off", "days off", "holiday", "sick leave", "benefits", "hr", "human resources", "request", "approval", "annual leave", "personal days", "absence", "eligibility", "accrual", "balance", "carryover", "unused", "how many days"]

Description: "Resume of John Doe, software engineer"
Keywords: ["john doe", "resume", "cv", "candidate", "software engineer", "developer", "experience", "education", "skills", "projects", "work history", "qualifications", "background", "programming", "languages", "frameworks", "university", "degree", "contact", "email", "phone", "linkedin", "github", "certifications", "achievements", "portfolio", "references", "employment"]

Description: "Q3 2024 financial report"
Keywords: ["financial", "report", "q3", "quarter", "2024", "revenue", "profit", "earnings", "sales", "expenses", "budget", "forecast", "growth", "performance", "metrics", "quarterly", "income", "balance sheet", "cash flow", "expenditure", "year over year", "yoy", "comparison", "analysis", "summary", "highlights", "loss", "margin"]

Description: "Product pricing guide for enterprise customers"
Keywords: ["pricing", "price", "cost", "fee", "charge", "enterprise", "plan", "subscription", "tier", "package", "quote", "estimate", "how much", "payment", "billing", "license", "seat", "user", "annual", "monthly", "contract", "discount", "volume", "bulk", "custom", "negotiable", "roi", "value", "comparison"]

Now analyze the given description and generate 25-30 keywords. Consider:
- What would someone search for to find this document?
- What questions would this document answer?
- What related topics might users ask about?

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{"keywords": ["keyword1", "keyword2", "keyword3", ...]}`;

  try {
    // ✅ Use regular invoke instead of withStructuredOutput
    const response = await model.invoke(prompt);
    const content = response.content.toString();

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      console.error("❌ No JSON found in response:", content.substring(0, 200));
      throw new Error("No JSON in model response");
    }

    // Parse JSON
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.keywords || !Array.isArray(parsed.keywords)) {
      console.error("❌ Invalid JSON structure:", parsed);
      throw new Error("Invalid keyword array in response");
    }

    // Post-process: dedupe, lowercase, filter empty
    const cleanedKeywords = Array.from(
      new Set(
        (parsed.keywords as string[])
          .map((kw: string) => kw.trim().toLowerCase())
          .filter((kw: string) => kw.length > 1 && kw.length < 50),
      ),
    ) as string[];

    console.log(
      `✅ Generated ${cleanedKeywords.length} keywords from description`,
    );
    return cleanedKeywords.slice(0, 30); // Cap at 30
  } catch (error) {
    console.error("❌ Keyword generation failed:", error);

    // Fallback: extract words from description
    const fallbackKeywords = description
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 3)
      .slice(0, 15);

    console.log(
      `⚠️ Using fallback keywords (${fallbackKeywords.length}):`,
      fallbackKeywords,
    );
    return fallbackKeywords;
  }
};
