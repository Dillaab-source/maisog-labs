export const projects = [
  {
    number: "01",
    slug: "clinicflow",
    category: "AI AUTOMATION",
    title: "ClinicFlow",
    text: "AI receptionist and appointment automation for dental clinics.",
    stack: ["n8n", "LLM", "Webhooks", "Calendar"],
    accent: "gold",
  },
  {
    number: "02",
    slug: "automation-hub",
    category: "SYSTEMS",
    title: "Automation Hub",
    text: "Workflows, integrations, and reusable systems for real-world tasks.",
    stack: ["APIs", "Automation", "AI", "n8n"],
    accent: "blue",
  },
  {
    number: "03",
    slug: "cybersecurity-lab",
    category: "CYBERSECURITY",
    title: "Cybersecurity Lab",
    text: "Hands-on labs, notes, and practical security experiments.",
    stack: ["Security", "Detection", "Research"],
    accent: "steel",
  },
  {
    number: "04",
    slug: "experimental-projects",
    category: "EXPERIMENTS",
    title: "Experimental Projects",
    text: "A sandbox for useful ideas, prototypes, and what comes next.",
    stack: ["Agents", "Integrations", "Web", "More"],
    accent: "gold",
  },
];

export const processSteps = [
  { number: "01", icon: "experience", title: "Explore", text: "Start with the real problem and the people living with it." },
  { number: "02", icon: "lab", title: "Test", text: "Turn assumptions into small, useful prototypes." },
  { number: "03", icon: "systems", title: "Build", text: "Connect the right tools into a dependable system." },
  { number: "04", icon: "foundation", title: "Refine", text: "Measure what works, document it, and improve." },
];

export const site = {
  version: "4.0.0-alpha.2",
  name: "Maisog Labs",
  tagline: "Human potential. AI possibilities.",
  eyebrow: "INDEPENDENT TECHNOLOGY LAB · LEYTE, PHILIPPINES",
  description:
    "Maisog Labs turns practical ideas into useful automation, secure systems, and human-centered AI experiences.",
  email: "hello@maisoglabs.com",
  adminEmail: "paulo@maisoglabs.com",
};

export const navigation = [
  { label: "Projects", href: "#projects" },
  { label: "Process", href: "#process" },
  { label: "About", href: "#about" },
];

export const foundations = [
  { icon: "foundation", label: "Foundation", text: "Identity and structure", href: "#home" },
  { icon: "experience", label: "Experience", text: "Responsive and immersive", href: "#projects" },
  { icon: "systems", label: "Systems", text: "Automation that works", href: "#process" },
  { icon: "security", label: "Trust", text: "Security by design", href: "#about" },
];
