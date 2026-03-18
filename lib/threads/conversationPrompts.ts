/**
 * [us] conversation prompts
 *
 * CONVERSATION_PROMPTS: shuffled in the chat input on the conversation page
 * THREAD_PROMPTS: static contextual bubble shown above input on each thread
 */

export const CONVERSATION_PROMPTS: string[] = [
  "what brings you here?",
  "say whatever's true right now.",
  "start anywhere.",
  "what are you looking for?",
  "what's on your mind?",
  "something brought you here.",
  "what do you want to say?",
  "where do you want to begin?",
  "what matters to you right now?",
  "what are you hoping for?",
  "say the thing you haven't said yet.",
  "what would you want someone to know about you?",
  "what kind of connection are you looking for?",
  "what does a good day look like for you?",
  "what are you in the middle of right now?",
  "what do you protect?",
  "what do you give in relationships?",
  "what do you need but rarely ask for?",
  "what's something you're figuring out?",
  "what would you want [u] to know first?",
  "where are you going?",
  "what does connection mean to you?",
  "what kind of person do you resonate with?",
  "what are you building toward?",
  "what do you tend to notice first about someone?",
  "what do you wish people understood about you?",
  "what's been on your mind lately?",
  "what would you say if you knew it would land?",
  "what are you ready for?",
  "what's something you've never quite named?",
  "what does depth mean to you?",
  "just say something true.",
]

export const THREAD_CONTEXT_PROMPTS: Record<string, string> = {
  connections: "want me to walk you through your matches?",
  insights: "want to look at what [u] has been noticing?",
  journal: "something worth noting?",
  about: "ask me anything about [us].",
  profile: "want to look at your portrait together?",
  settings: "want to change something? just tell me.",
  messages: "your connection is here. say something.",
  terms: "want me to walk you through what matters in the terms?",
  privacy: "want to know how your data works here?",
}
