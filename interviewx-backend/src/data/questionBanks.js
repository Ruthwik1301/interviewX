import { getDSAFallbackQuestions } from "./dsaFallbackQuestions.js";

const DSA_TRACKS = ["dsa-fundamentals", "competitive"];

export const TRACK_META = {
  // DSA
  "dsa-fundamentals": {
    title: "DSA Fundamentals Interview",
    role: "Software Engineer",
    count: 5,
  },
  competitive: {
    title: "Competitive Programming Interview",
    role: "Software Engineer",
    count: 4,
  },
  // Domain
  swe: {
    title: "Software Engineer Interview",
    role: "Software Engineer",
    count: 6,
  },
  fullstack: {
    title: "Full Stack Developer Interview",
    role: "Full Stack Developer",
    count: 6,
  },
  mern: {
    title: "MERN Stack Developer Interview",
    role: "MERN Stack Developer",
    count: 6,
  },
  frontend: {
    title: "Frontend Developer Interview",
    role: "Frontend Developer",
    count: 6,
  },
  backend: {
    title: "Backend Developer Interview",
    role: "Backend Developer",
    count: 6,
  },
  devops: {
    title: "DevOps / Cloud Engineer Interview",
    role: "DevOps Engineer",
    count: 6,
  },
  database: {
    title: "Database Engineer Interview",
    role: "Database Engineer",
    count: 5,
  },
  // Cybersecurity
  "soc-analyst": {
    title: "SOC Analyst Interview",
    role: "SOC Analyst",
    count: 6,
  },
  "penetration-tester": {
    title: "Penetration Tester Interview",
    role: "Penetration Tester",
    count: 6,
  },
  cybersecurity: {
    title: "Cybersecurity Engineer Interview",
    role: "Cybersecurity Eng",
    count: 6,
  },
  "soc-compliance": {
    title: "SOC 1/2 Compliance Interview",
    role: "Compliance Analyst",
    count: 5,
  },
  // System
  "system-design": {
    title: "System Design Interview",
    role: "Staff Engineer",
    count: 3,
  },
  // HR
  hr: { title: "HR & Behavioural Interview", role: "Candidate", count: 8 },
  leadership: {
    title: "Leadership & Management Interview",
    role: "Engineering Manager",
    count: 6,
  },
  // Legacy
  technical: {
    title: "Technical Interview",
    role: "Senior Software Engineer",
    count: 6,
  },
  coding: { title: "Coding Interview", role: "Software Engineer", count: 4 },
};

// ─── Question pools ────────────────────────────────────────────────────────────
// Each pool has MORE questions than the session needs.
// pickQuestions() randomly selects `count` unique ones every session.

const POOLS = {
  swe: [
    "Tell me about yourself and your software engineering background.",
    "Describe the most complex system you have ever built. What were the key design decisions?",
    "How do you approach debugging a production issue you have never seen before?",
    "Walk me through how you would design a REST API for a social media feed.",
    "How do you ensure code quality in a fast-moving team?",
    "What is your experience with microservices versus monolithic architecture?",
    "Describe a time you had to refactor a large codebase. What was your approach?",
    "How do you handle technical debt when business timelines are tight?",
    "What strategies do you use for writing maintainable code?",
    "Walk me through your process for reviewing someone else's code.",
    "How do you stay current with new technologies and best practices?",
    "Describe a time you had to make a difficult architectural decision with incomplete information.",
    "How do you approach performance optimization in a backend service?",
    "What is your experience with CI/CD pipelines?",
    "How do you handle disagreements about technical approaches in a team?",
  ],
  fullstack: [
    "Walk me through how a request flows from the browser through your full stack application.",
    "How do you decide whether to put logic on the frontend or backend?",
    "Explain how you would implement authentication in a full stack app from login to protected routes.",
    "How would you approach optimizing a full stack application that is running slowly?",
    "Describe your experience with databases — how do you choose between SQL and NoSQL?",
    "How do you handle state management in a large frontend application?",
    "What is your approach to error handling across the full stack?",
    "How do you manage environment configuration across development and production?",
    "Describe how you would implement real-time features in a full stack app.",
    "How do you approach testing — unit, integration, and end-to-end?",
    "What strategies do you use for managing API versioning?",
    "How do you handle file uploads securely in a full stack application?",
  ],
  mern: [
    "How does the React component lifecycle work and where do you put side effects?",
    "Walk me through how you would structure a MERN application from scratch.",
    "How does Mongoose handle schema validation and what are its limitations?",
    "Explain how you would implement JWT authentication across a React frontend and Express backend.",
    "How do you handle CORS in a MERN stack application?",
    "What strategies do you use for optimizing MongoDB queries at scale?",
    "How does Redux or Context API help manage state in a React app?",
    "Explain the difference between useEffect and useLayoutEffect.",
    "How do you implement pagination in a MERN application?",
    "What is your approach to error boundaries in React?",
    "How do you handle real-time updates in a MERN stack app?",
    "Describe how you would implement role-based access control in Express.",
  ],
  frontend: [
    "Explain the difference between CSS Flexbox and Grid and when you would use each.",
    "How does the browser render a webpage? Walk through the critical rendering path.",
    "What is the virtual DOM and how does React use it to optimize updates?",
    "How would you optimize a React application that is re-rendering too often?",
    "Explain accessibility and what makes a web application accessible.",
    "How do you approach cross-browser compatibility issues?",
    "What is your experience with CSS-in-JS versus traditional stylesheets?",
    "How do you handle responsive design for different screen sizes?",
    "Explain the difference between server-side rendering and client-side rendering.",
    "What strategies do you use to reduce bundle size?",
    "How do you approach lazy loading in a React application?",
    "Describe how you would implement a complex animated UI component.",
    "What is your approach to web performance metrics like LCP, FID, and CLS?",
  ],
  backend: [
    "How would you design a RESTful API for a resource with full CRUD operations?",
    "Explain the difference between SQL and NoSQL databases and when you would choose each.",
    "How would you implement caching in a backend service? What are the trade-offs?",
    "Walk me through how you would handle background jobs and async processing.",
    "How do you approach rate limiting in an API you are building?",
    "Describe a time you had to optimize a slow database query.",
    "How do you handle database migrations in a production system?",
    "What is your approach to API security — authentication, authorization, and input validation?",
    "How would you design a webhook system?",
    "Explain how you would implement idempotency in a payment API.",
    "How do you handle distributed transactions across multiple services?",
    "What strategies do you use for horizontal scaling of a backend service?",
  ],
  devops: [
    "Walk me through a CI/CD pipeline you have designed or worked with.",
    "How does container orchestration work in Kubernetes? Explain pods, services, and deployments.",
    "How would you approach setting up monitoring and alerting for a production system?",
    "Explain infrastructure as code and what tools you have used.",
    "How do you handle secrets management in a cloud environment?",
    "Describe a major production incident you were involved in — how did you respond?",
    "What is your approach to blue-green deployments versus canary releases?",
    "How do you manage infrastructure costs in a cloud environment?",
    "Explain how you would set up a disaster recovery plan.",
    "What is your experience with service mesh technologies like Istio?",
    "How do you approach capacity planning for a growing application?",
    "Describe how you would implement auto-scaling for a stateless service.",
  ],
  database: [
    "Explain the difference between a clustered and non-clustered index.",
    "How does database replication work and what are the consistency trade-offs?",
    "Walk me through how you would optimize a slow SQL query.",
    "Explain ACID properties and give a real-world example of where each matters.",
    "When would you use a NoSQL database over a relational one?",
    "How would you design a database schema for a multi-tenant SaaS application?",
    "Explain the differences between OLTP and OLAP systems.",
    "How do you handle database connection pooling?",
    "What is your experience with database sharding?",
    "Explain the CAP theorem in the context of distributed databases.",
  ],
  "soc-analyst": [
    "Walk me through how you would triage an alert showing unusual outbound traffic from a production server.",
    "Explain the difference between a false positive and a false negative — which is more dangerous?",
    "How do you perform root-cause analysis after a confirmed security incident?",
    "What is a SIEM and how have you used one in your work?",
    "Walk me through how you would respond to a suspected phishing attack on an employee.",
    "How do you stay current with evolving threat intelligence and IOCs?",
    "Describe the kill chain framework and how you use it in your analysis.",
    "What is your process for escalating a security incident?",
    "How would you investigate a compromised user account?",
    "Explain the difference between IDS and IPS systems.",
    "How do you tune SIEM rules to reduce alert fatigue?",
    "Describe your experience with threat hunting.",
  ],
  "penetration-tester": [
    "Walk me through a full penetration test engagement from scoping to final report.",
    "How do you approach privilege escalation on a compromised Linux system?",
    "Explain the difference between black-box, grey-box, and white-box pentests.",
    "How would you test for SQL injection manually without using automated tools?",
    "What tools do you use for reconnaissance and how do you stay within scope?",
    "How do you write a pentest report useful for both technical and executive audiences?",
    "Describe a creative vulnerability you have discovered in a real engagement.",
    "How do you approach social engineering in a red team exercise?",
    "What is your methodology for testing web application security?",
    "How do you handle a situation where you accidentally go out of scope?",
    "Explain how you would approach lateral movement after initial compromise.",
    "What is your experience with Active Directory attacks?",
  ],
  cybersecurity: [
    "Walk me through how you would triage an alert showing unusual outbound traffic from a production server.",
    "Explain the difference between a vulnerability scan and a penetration test.",
    "How would you design defense-in-depth for a public-facing web application?",
    "Walk me through how you would respond to a suspected ransomware infection.",
    "How do you approach threat modeling for a new system?",
    "What is your experience with SIEM tooling and how do you tune alerts?",
    "Describe how you would implement a zero-trust security architecture.",
    "How do you approach security in a DevOps pipeline — DevSecOps?",
    "What is your experience with cloud security in AWS or Azure?",
    "Explain how you would conduct a security review of a new application.",
    "How do you handle a security breach involving customer data?",
    "Describe your experience with identity and access management.",
  ],
  "soc-compliance": [
    "Explain the difference between SOC 1 and SOC 2 reports.",
    "What are the five Trust Service Criteria in SOC 2 and why do they matter?",
    "Walk me through how you would prepare a company for its first SOC 2 audit.",
    "How do you handle a control gap identified during an audit?",
    "What evidence do auditors typically request for access control reviews?",
    "How do you maintain continuous compliance rather than point-in-time?",
    "Explain the difference between Type I and Type II SOC reports.",
    "How do you manage vendor risk in a SOC 2 compliance program?",
    "Describe your experience with GRC tools.",
    "How do you communicate compliance requirements to engineering teams?",
  ],
  "system-design": [
    "Design a URL shortening service like bit.ly — walk through your high-level architecture.",
    "How would you design a scalable notification system supporting email, SMS, and push?",
    "Design the backend for a real-time collaborative document editor.",
    "Design a ride-sharing system like Uber — focus on matching and location tracking.",
    "How would you design a distributed cache like Redis?",
    "Design a video streaming platform — focus on storage and delivery.",
    "How would you design a search autocomplete system?",
    "Design a rate limiter that works across distributed servers.",
    "How would you design a social media news feed?",
    "Design a distributed job queue system.",
  ],
  hr: [
    "Tell me about yourself and what is drawing you to this role.",
    "Describe a time you disagreed with a teammate or manager. How did you handle it?",
    "Tell me about a project that failed or fell short. What did you learn?",
    "Describe a time you had to learn something new quickly to get a job done.",
    "How do you prioritize when you have multiple competing deadlines?",
    "Tell me about a time you received critical feedback. How did you respond?",
    "Describe a situation where you had to influence someone without direct authority.",
    "Where do you see yourself in 3 years and how does this role fit into that path?",
    "Tell me about your greatest professional achievement.",
    "Describe a time you had to work with a difficult colleague.",
    "How do you handle stress and pressure?",
    "Tell me about a time you went above and beyond what was expected.",
    "Describe a situation where you had to make a decision with incomplete information.",
    "How do you approach giving constructive feedback to others?",
    "Tell me about a time you failed. What did you do next?",
    "Describe how you have contributed to building team culture.",
  ],
  leadership: [
    "Tell me about a time you had to make a difficult decision with incomplete information.",
    "How do you handle an underperforming team member?",
    "Describe how you have built and maintained team culture, especially in a remote setting.",
    "Tell me about a time you had to push back on a product or stakeholder request.",
    "How do you balance technical debt against shipping new features?",
    "Describe a time you had to influence a major technical direction without direct authority.",
    "How do you approach hiring — what do you look for in candidates?",
    "Tell me about a time you had to deliver bad news to your team or stakeholders.",
    "How do you ensure your team stays aligned on goals and priorities?",
    "Describe your approach to one-on-ones with your team.",
    "How do you handle conflict between two team members?",
    "Tell me about a time you had to change direction mid-project.",
  ],
  // Legacy
  technical: [
    "Tell me about yourself and why you applied for this role.",
    "Describe a time you had to solve a technically complex problem under pressure.",
    "How would you design a distributed rate limiter for an API serving 10M requests per day?",
    "Walk me through your understanding of CAP theorem.",
    "What is your experience with system observability?",
    "Where do you see yourself in 3 years?",
  ],
  coding: [
    "Walk me through how you would approach an unfamiliar coding problem before writing any code.",
    "Given an array of integers, find two numbers that add up to a target value.",
    "How would you detect a cycle in a linked list?",
    "Find the longest substring without repeating characters.",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const DEFAULT_TRACK = "swe";

export function getTrackMeta(trackId) {
  return TRACK_META[trackId] ?? TRACK_META[DEFAULT_TRACK];
}

/**
 * Pick `count` random unique questions from the pool for this track.
 * Shuffles the pool so every session is different.
 * If the pool is smaller than count, questions cycle.
 */
export function getFallbackQuestions(trackId) {
  if (DSA_TRACKS.includes(trackId)) {
    const meta = TRACK_META[trackId] ?? TRACK_META[DEFAULT_TRACK];
    return getDSAFallbackQuestions(trackId, meta.count);
  }

  const pool = POOLS[trackId] ?? POOLS[DEFAULT_TRACK];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const meta = TRACK_META[trackId] ?? TRACK_META[DEFAULT_TRACK];
  const count = meta.count;

  const result = [];
  while (result.length < count) result.push(...shuffled);
  return result.slice(0, count);
}

/**
 * Main export used by the controller.
 * Returns questions directly from the bank — no Groq needed.
 */
export function getQuestionsForSession(trackId, level) {
  return getFallbackQuestions(trackId);
}
