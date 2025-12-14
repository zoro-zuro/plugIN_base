export function isTrivialInput(text: string): boolean {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "");
  const trivialPhrases = [
    "hi",
    "hello",
    "hey",
    "hola",
    "greetings",
    "good morning",
    "good afternoon",
    "bye",
    "goodbye",
    "cya",
    "see ya",
    "good night",
    "have a good day",
    "thanks",
    "thank you",
    "thx",
    "cool",
    "ok",
    "okay",
    "got it",
    "great",
    "who are you",
    "what are you",
    "are you real",
    "help",
  ];

  // Match exact phrase OR short starts-with (e.g., "Hi there")
  return (
    trivialPhrases.includes(t) ||
    (t.length < 20 && trivialPhrases.some((phrase) => t.startsWith(phrase)))
  );
}
