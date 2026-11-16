export const categories = [
  { name: "Frontend", desc: "Web interfaces, React, design systems", open: 9, span: 2 },
  { name: "Backend", desc: "APIs, databases, Node and Python", open: 7, span: 1 },
  { name: "Mobile", desc: "iOS, Android, Flutter", open: 4, span: 1 },
  { name: "Data & AI", desc: "Analytics, ML, LLM apps", open: 8, span: 2 },
  { name: "UI/UX Design", desc: "Figma, product design", open: 3, span: 1 },
  { name: "Cybersecurity", desc: "AppSec, networks, CTF", open: 2, span: 1 },
  { name: "Game Dev", desc: "Unity, Unreal, Godot", open: 2, span: 1 },
  { name: "Robotics & IoT", desc: "Arduino, embedded, drones", open: 1, span: 1 },
  { name: "Product & Startup", desc: "Founders, PMs, no-code", open: 2, span: 1 },
];

export type Company = {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  city: string;
  size: string;
  roles: string[];
  tags: string[];
  about: string;
  hue: string; // card accent
};

export const companies: Company[] = [
  { id: "c1", name: "NovaSoft", tagline: "School management software used by 400 schools", industry: "EdTech", city: "Tashkent", size: "80 people", roles: ["Frontend intern", "QA intern"], tags: ["React", "TypeScript", "Hybrid"], about: "Product team of 12. Interns ship real components with a mentor and get a reference letter.", hue: "#1a4ba8" },
  { id: "c2", name: "Zamin Analytics", tagline: "Retail data for the biggest chains in Uzbekistan", industry: "Data", city: "Remote", size: "35 people", roles: ["Junior data analyst program"], tags: ["Python", "SQL", "Remote"], about: "Three-month paid program on real datasets, ending with a dashboard you present to a client.", hue: "#2563c9" },
  { id: "c3", name: "Orbit Mobile", tagline: "Delivery app with 5,000 daily customers in Samarkand", industry: "Logistics", city: "Samarkand", size: "20 people", roles: ["Flutter developer, part-time"], tags: ["Flutter", "Firebase", "Part-time"], about: "Small team, fast releases. You own features end to end from the first week.", hue: "#4f8be0" },
  { id: "c4", name: "SafeNet UZ", tagline: "Application security for banks and fintech", industry: "Security", city: "Tashkent", size: "50 people", roles: ["Security analyst intern"], tags: ["Linux", "AppSec", "CTF"], about: "Vulnerability scanning, report writing and secure code review with the AppSec team.", hue: "#123a86" },
  { id: "c5", name: "Pixel Studio", tagline: "Product design studio for edtech and fintech", industry: "Design", city: "Bukhara", size: "12 people", roles: ["Product design intern"], tags: ["Figma", "Research", "Hybrid"], about: "Work with a senior designer from research to prototype on a real client project.", hue: "#3b7ddd" },
  { id: "c6", name: "GameForge", tagline: "Mobile puzzle games with 2M downloads", industry: "Games", city: "Remote", size: "15 people", roles: ["Junior Unity developer"], tags: ["Unity", "C#", "Remote"], about: "Own small features end to end, from idea to store release.", hue: "#1f56b8" },
  { id: "c7", name: "AI Alliance", tagline: "Community and accelerator for AI startups", industry: "AI", city: "Tashkent", size: "8 people", roles: ["Community intern", "ML intern"], tags: ["LLM apps", "Events", "Python"], about: "Help run meetups and build demos with founders in the accelerator.", hue: "#2a63cc" },
  { id: "c8", name: "Robo-Care", tagline: "Robotics workshops for kids in the regions", industry: "Robotics", city: "Angren", size: "6 people", roles: ["Robotics mentor program"], tags: ["Arduino", "Teaching", "Weekends"], about: "Run Arduino workshops and build demo kits. Certificate and recommendation on completion.", hue: "#4f8be0" },
];

export type Talent = {
  id: string;
  name: string;
  cat: string;
  city: string;
  age: number;
  place: string;
  event: string;
  skills: string[];
  project: string;
  bio: string;
  avail: string;
};

export const talents: Talent[] = [
  { id: "t1", name: "Dilnoza Karimova", cat: "Frontend", city: "Andijan", age: 17, place: "1st place", event: "Andijan IT Case 2026", skills: ["React", "Tailwind", "Figma"], project: "Ilmhub learning app", bio: "I build interfaces fast and care about how they feel. Looking for a frontend internship.", avail: "Part-time" },
  { id: "t2", name: "Jasur Rahimov", cat: "Data & AI", city: "Tashkent", age: 18, place: "3rd place", event: "Andijan IT Case 2026", skills: ["Python", "Pandas", "OpenAI API"], project: "LevelUp weakness detector", bio: "Data and LLM apps. I like turning messy data into something a teacher can use.", avail: "Remote only" },
  { id: "t3", name: "Madina Yusupova", cat: "UI/UX Design", city: "Bukhara", age: 16, place: "1st place", event: "Bukhara IT Case 2026", skills: ["Figma", "Prototyping", "Research"], project: "Classpilot teacher assistant", bio: "Product designer. Research first, then pixels.", avail: "Weekends" },
  { id: "t4", name: "Sardor Tursunov", cat: "Backend", city: "Guliston", age: 19, place: "2nd place", event: "Sirdarya IT Case 2026", skills: ["Node.js", "PostgreSQL", "Telegram bots"], project: "PlacePulse mini app", bio: "Backend and Telegram mini apps. Summer full-time is possible.", avail: "Full-time (summer)" },
  { id: "t5", name: "Nilufar Azimova", cat: "Mobile", city: "Samarkand", age: 17, place: "1st place", event: "Samarkand IT Case 2026", skills: ["Flutter", "Firebase"], project: "Capitalist matching app", bio: "Flutter developer with one published app.", avail: "Part-time" },
  { id: "t6", name: "Bekzod Islomov", cat: "Cybersecurity", city: "Fergana", age: 18, place: "Finalist", event: "Fergana IT Case 2026", skills: ["Linux", "Burp Suite", "Python"], project: "InvestorOS security review", bio: "CTF player. I want to learn AppSec properly.", avail: "Remote only" },
  { id: "t7", name: "Aziza Nurmatova", cat: "Product & Startup", city: "Nukus", age: 16, place: "3rd place", event: "Sirdarya IT Case 2026", skills: ["Pitching", "Notion", "No-code"], project: "Joyida-AI trust score", bio: "Product and pitching. Building no-code prototypes.", avail: "Weekends" },
  { id: "t8", name: "Timur Abdullaev", cat: "Game Dev", city: "Tashkent", age: 17, place: "2nd place", event: "Andijan IT Case 2026", skills: ["Unity", "C#", "Blender"], project: "Pathly study game", bio: "Unity developer. One finished jam game, one in progress.", avail: "Part-time" },
];

export type Opportunity = {
  id: string;
  co: string;
  companyId: string;
  title: string;
  type: "Internship" | "Work program" | "Position" | "Event";
  cats: string[];
  city: string;
  dur: string;
  pay: string;
  desc: string;
  req: string[];
  posted: string;
};

export const opportunities: Opportunity[] = [
  { id: "o1", co: "NovaSoft", companyId: "c1", title: "Frontend intern (React)", type: "Internship", cats: ["Frontend", "UI/UX Design"], city: "Tashkent, hybrid", dur: "8 weeks from 1 Dec 2026", pay: "2,000,000 UZS per month", desc: "Join the product team building a school management web app. You will ship real components with a mentor.", req: ["React basics", "Git", "Portfolio or Lumora project"], posted: "2 days ago" },
  { id: "o2", co: "Zamin Analytics", companyId: "c2", title: "Junior data analyst program", type: "Work program", cats: ["Data & AI"], city: "Remote", dur: "3 months, 10 hours a week", pay: "1,000,000 UZS stipend", desc: "Weekly tasks on real retail datasets, SQL and Python, with a final dashboard project.", req: ["Python or SQL", "Age 16+"], posted: "4 days ago" },
  { id: "o3", co: "Orbit Mobile", companyId: "c3", title: "Flutter developer, part-time", type: "Position", cats: ["Mobile"], city: "Samarkand", dur: "Ongoing", pay: "Negotiable", desc: "Maintain and extend a delivery app used by 5,000 customers.", req: ["Flutter", "One published app or Lumora prototype"], posted: "1 week ago" },
  { id: "o4", co: "SafeNet UZ", companyId: "c4", title: "Security analyst intern", type: "Internship", cats: ["Cybersecurity", "Backend"], city: "Tashkent", dur: "6 weeks, winter", pay: "1,500,000 UZS per month", desc: "Vulnerability scanning, report writing and secure code review with the AppSec team.", req: ["Linux basics", "Curiosity about CTF"], posted: "3 days ago" },
  { id: "o5", co: "Pixel Studio", companyId: "c5", title: "Product design intern", type: "Internship", cats: ["UI/UX Design"], city: "Bukhara, hybrid", dur: "10 weeks", pay: "Certificate and recommendation", desc: "Work with a senior designer on an edtech interface from research to prototype.", req: ["Figma", "Design portfolio"], posted: "5 days ago" },
  { id: "o6", co: "GameForge", companyId: "c6", title: "Junior Unity developer", type: "Position", cats: ["Game Dev"], city: "Remote", dur: "Ongoing, 15 hours a week", pay: "2,500,000 UZS per month", desc: "Mobile puzzle game studio looking for a junior to own small features end to end.", req: ["Unity and C#", "One finished game jam project"], posted: "1 day ago" },
  { id: "o7", co: "Robo-Care", companyId: "c8", title: "Robotics mentor program", type: "Work program", cats: ["Robotics & IoT"], city: "Angren", dur: "Weekends, 2 months", pay: "Volunteer, certificate", desc: "Help run Arduino workshops for kids and build demo kits.", req: ["Arduino basics", "Patience with 10-year-olds"], posted: "1 week ago" },
  { id: "o8", co: "AI Alliance", companyId: "c7", title: "AI Builders Meetup", type: "Event", cats: ["Data & AI", "Product & Startup"], city: "Tashkent", dur: "8 December 2026, 18:00", pay: "Free", desc: "Talks from AI startup founders and a demo table for teen projects.", req: ["Bring a demo (optional)"], posted: "2 days ago" },
  { id: "o9", co: "AI Alliance", companyId: "c7", title: "ML intern", type: "Internship", cats: ["Data & AI"], city: "Tashkent, hybrid", dur: "12 weeks", pay: "1,800,000 UZS per month", desc: "Build demos with accelerator founders: retrieval, evaluation, small fine-tunes.", req: ["Python", "One ML project"], posted: "6 days ago" },
];

export type Hackathon = {
  id: string;
  name: string;
  org: string;
  city: string;
  date: string; // ISO
  dateLabel: string;
  format: string;
  prize: string;
  teams: string;
  desc: string;
  tracks: string[];
  partner?: boolean;
};

export const hackathons: Hackathon[] = [
  { id: "h1", name: "Tashkent IT Case Competition", org: "Lumora", city: "Tashkent", date: "2026-12-20T10:00:00", dateLabel: "20 December 2026", format: "Offline, one day", prize: "Prizes up to 2,000,000 UZS", teams: "Teams of 3 to 6", desc: "Flagship case competition with a partner company case. Pitch to a jury of founders and CTOs.", tracks: ["Frontend", "Backend", "Mobile", "Data & AI", "UI/UX Design", "Product & Startup"] },
  { id: "h2", name: "Namangan IT Case", org: "Lumora", city: "Namangan", date: "2027-01-24T10:00:00", dateLabel: "24 January 2027", format: "Offline, one day", prize: "Prizes up to 1,500,000 UZS", teams: "Teams of 3 to 5", desc: "First Lumora round in Namangan. Regional case from a local logistics company.", tracks: ["Frontend", "Backend", "Mobile", "Product & Startup"] },
  { id: "h3", name: "AI Weekend", org: "AI Alliance", city: "Tashkent", date: "2027-02-13T09:00:00", dateLabel: "13 to 14 February 2027", format: "Offline, two days", prize: "Accelerator fast track", teams: "Teams of 2 to 4", desc: "Partner hackathon. Build an LLM app in 36 hours with mentors from the accelerator.", tracks: ["Data & AI", "Product & Startup"], partner: true },
  { id: "h4", name: "Lumora Online Sprint", org: "Lumora", city: "Online", date: "2027-03-06T12:00:00", dateLabel: "6 March 2027", format: "Online, 48 hours", prize: "Internship interviews with partners", teams: "Solo or teams of 2", desc: "Remote sprint for participants outside the big cities.", tracks: ["Frontend", "Backend", "Mobile", "Data & AI", "Game Dev"] },
];

export const pastHackathons = [
  { name: "Andijan IT Case 2026", city: "Andijan", teams: 24, winner: "Ilmhub, learning app" },
  { name: "Bukhara IT Case 2026", city: "Bukhara", teams: 18, winner: "Classpilot, teacher assistant" },
  { name: "Samarkand IT Case 2026", city: "Samarkand", teams: 21, winner: "Capitalist, founder matching" },
  { name: "Sirdarya IT Case 2026", city: "Guliston", teams: 15, winner: "PlacePulse, mini app" },
  { name: "Fergana IT Case 2026", city: "Fergana", teams: 19, winner: "InvestorOS, security review" },
];

export const partners = ["NovaSoft", "Zamin Analytics", "Orbit Mobile", "SafeNet UZ", "Pixel Studio", "Robo-Care", "AI Alliance", "GameForge"];

export const me = {
  talent: { name: "Nuriddin Karimov", cat: "Frontend", city: "Tashkent", age: 19, place: "2nd place", event: "Tashkent IT Case 2025", skills: ["React", "TypeScript", "Figma", "Node.js"], project: "Lumora Connect prototype", bio: "Frontend developer and Lumora team member. Looking for a part-time internship while studying.", avail: "Part-time", contact: "@nuriddin" },
  company: { name: "NovaSoft", industry: "EdTech", city: "Tashkent", size: "80 people", about: "School management software used by 400 schools. Hiring interns into the product team.", contact: "hr@novasoft.uz" },
};
