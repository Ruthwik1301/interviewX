// Per-track question banks for the interview room.
// Each track maps to the cards shown on CreateInterviewPage (src/features/create-interview/CreateInterviewPage.jsx).
// Keep `questions.length` in sync with the `questions` count shown on each card there.

export const QUESTION_BANKS = {
  technical: {
    title: "Technical Interview",
    questions: [
      "Tell me about yourself and why you applied for this role.",
      "Describe a time you had to solve a technically complex problem under pressure. What was your approach?",
      "How would you design a distributed rate limiter for an API serving 10M requests per day?",
      "Walk me through your understanding of CAP theorem and when you would sacrifice consistency for availability.",
      "What is your experience with system observability — logging, metrics, and tracing?",
      "Where do you see yourself in 3 years, and how does this role fit into that path?",
    ],
  },
  coding: {
    title: "Coding Interview",
    questions: [
      "Walk me through how you'd approach an unfamiliar coding problem before writing any code.",
      "Given an array of integers, write a function to find two numbers that add up to a target value. Talk through your approach and complexity.",
      "How would you detect a cycle in a linked list? Discuss time and space trade-offs.",
      "Implement a function to find the longest substring without repeating characters. Explain your reasoning as you go.",
    ],
  },
  cybersecurity: {
    title: "Cybersecurity Interview",
    questions: [
      "Walk me through how you'd triage an alert showing unusual outbound traffic from a production server.",
      "Explain the difference between a vulnerability scan and a penetration test, and when you'd use each.",
      "Describe your process for performing root-cause analysis after a confirmed security incident.",
      "How would you design defense-in-depth for a public-facing web application?",
      "Walk me through how you'd respond to a suspected ransomware infection on a critical system.",
      "What's your experience with SIEM tooling, and how do you tune alerts to reduce false positives?",
    ],
  },
  "system-design": {
    title: "System Design Interview",
    questions: [
      "Design a URL shortening service like bit.ly. Walk through your high-level architecture.",
      "How would you design a scalable notification system that supports email, SMS, and push?",
      "Design the backend for a real-time collaborative document editor. What are the hardest parts?",
    ],
  },
  hr: {
    title: "HR & Behavioural Interview",
    questions: [
      "Tell me about yourself and what's drawing you to this role.",
      "Describe a time you disagreed with a teammate or manager. How did you handle it?",
      "Tell me about a project that failed or fell short. What did you learn?",
      "Describe a time you had to learn something new quickly to get a job done.",
      "How do you prioritize when you have multiple competing deadlines?",
      "Tell me about a time you received critical feedback. How did you respond?",
      "Describe a situation where you had to influence someone without direct authority.",
      "Where do you see yourself in 3 years, and how does this role fit into that path?",
    ],
  },
};

export const DEFAULT_TRACK = "technical";

export function getQuestionBank(trackId) {
  return QUESTION_BANKS[trackId] ?? QUESTION_BANKS[DEFAULT_TRACK];
}
