/* Real facts about Lumora, collected from the previous Lumora website
   (ivyonaire.com/lumora) and the Lumora Telegram channel (t.me/thelumoraa).
   Everything here describes real events and organizations. Demo people and demo
   companies live in src/api/seed.ts and are marked as demo in the interface. */

import type { Lang } from "../i18n";

type L = Record<Lang, string>;

export const lumora = {
  links: {
    telegram: "https://t.me/thelumoraa",
    instagram: "https://www.instagram.com/lumora2025_/",
    linkedin: "https://www.linkedin.com/company/lumora-uz/",
  },

  /** headline numbers from the previous site */
  numbers: {
    hackathons: 50,
    students: 2700,
    regions: 14,
    partners: 30,
    /** "100% real company cases" */
    realCases: 100,
  },

  /** cities in the city selector of the previous site's About page */
  cities: ["Tashkent", "Fergana", "Samarkand", "Namangan", "Jizzakh", "Nukus", "Qarshi"],

  /** all 14 regions, as listed in the previous site's application form. Names: home.region.<key> */
  regions: ["karakalpakstan", "khorezm", "navoiy", "bukhara", "samarkand", "kashkadarya", "surkhandarya", "jizzakh", "syrdarya", "tashkentRegion", "tashkent", "namangan", "andijan", "fergana"],

  /** the next round, as announced by the team on 26 Nov 2026. The start time is not announced yet:
      10:00 Tashkent time is a stand-in for the countdown; the city is assumed from the venue. */
  nextRound: {
    date: "2026-12-06",
    start: "2026-12-06T10:00:00+05:00",
    venue: "Holiday Inn",
    city: "Tashkent",
    partner: "Samsung",
    teamMin: 2,
    teamMax: 5,
  },

  /** the four stages of a round, in order (previous site, tournaments page). Texts: home.format.* */
  stages: ["register", "case", "prototype", "pitch"] as const,

  /** what a team brings to the jury (previous site). Texts: home.format.d.* */
  deliverables: ["prototype", "story", "pitch"] as const,

  /** team sizes offered by the previous site's application form; each announcement confirms the real one */
  teamSizes: [2, 3, 4, 5],

  slogans: {
    hero: { en: "Here, students solve real tech problems.", ru: "Здесь студенты решают настоящие технологические задачи.", uz: "Bu yerda talabalar haqiqiy texnologik muammolarni hal qiladi." } as L,
    demo: { en: "A case does not end with an idea. It ends with a demonstration.", ru: "Кейс не заканчивается идеей. Он заканчивается демонстрацией.", uz: "Keys g'oya bilan tugamaydi. U namoyish bilan tugaydi." } as L,
    postcode: { en: "Talent should not depend on a postcode.", ru: "Талант не должен зависеть от адреса.", uz: "Iqtidor yashash manziliga bog'liq bo'lmasligi kerak." } as L,
  },

  /** what the jury asks at every Lumora round (set by the team on 26 Nov 2026) */
  judging: [
    { key: "problem", q: { en: "What problem do you solve?", ru: "Какую проблему вы решаете?", uz: "Qaysi muammoni hal qilyapsiz?" } as L },
    { key: "tech", q: { en: "What technology do you use?", ru: "Какие технологии вы используете?", uz: "Qanday texnologiyalardan foydalanasiz?" } as L },
    { key: "edge", q: { en: "Why are you better than others?", ru: "Чем вы лучше других?", uz: "Nimasi bilan boshqalardan yaxshiroqsiz?" } as L },
    { key: "money", q: { en: "Who will pay for it?", ru: "Кто будет за это платить?", uz: "Buning uchun kim pul to'laydi?" } as L },
  ],

  /** core team from the previous site's About page; photos in public/photos/team/<photo>.webp, roles in home.about.role.<key> */
  team: [
    { name: "Kamron Sobirjonov", role: "Chief Executive Officer", key: "ceo", photo: "kamron-sobirjonov" },
    { name: "Anvarjon Sobirov", role: "Chief Operating Officer", key: "coo", photo: "anvarjon-sobirov" },
    { name: "Nuriddin Mukhiddinjonov", role: "Chief Financial Officer", key: "cfo", photo: "nuriddin-mukhiddinjonov" },
    { name: "Nurulloxon Valixonov", role: "Chief Technology Officer", key: "cto", photo: "nurulloxon-valixonov" },
  ],

  /** organizations named on the previous site and in channel posts */
  partners: [
    "StartUp Garage",
    "AICA",
    "AI Alliance",
    "IT Park Uzbekistan",
    "Najot Ta'lim",
    "Capitalist",
    "RoboContest",
    "M-Faktor",
    "Aisha AI",
    "AloqaVentures",
    "TeamIT",
    "EduOn",
    "School 21",
    "MediaPark",
    "UzCombinator",
    "FoundersHub",
  ],

  /** the jury of the Tashkent round, 31 October 2026, as announced in the channel */
  judges: [
    { name: "Amirkhon Koriev", org: "AI Alliance" },
    { name: "Laylo Xondamirova", org: "UzCombinator" },
    { name: "Abdumalik Abdukhalimov", org: "FoundersHub" },
    { name: "Elzodxon Sharofaddinov", org: "VoiceLab" },
    { name: "Umid Azamkulov", org: "Scholify" },
  ],

  /** winning projects described in channel posts, for the project gallery */
  projects: [
    {
      team: "La Peace",
      project: "ClassPilot",
      event: "Bukhara IT Case",
      date: "2026-09-27",
      place: 1,
      prize: "1,000,000 UZS",
      partner: "AICA, AI Alliance",
      photo: "bukhara-build",
      summary: {
        en: "A grading assistant that keeps the teacher in charge: AI drafts scores tied to rubric points, the teacher reviews, the school records.",
        ru: "Помощник для проверки работ, где решает учитель: ИИ предлагает оценки по пунктам рубрики, учитель проверяет, школа фиксирует.",
        uz: "O'qituvchi nazoratida qoladigan baholash yordamchisi: SI rubrika bo'yicha baho taklif qiladi, o'qituvchi tekshiradi, maktab qayd etadi.",
      } as L,
    },
    {
      team: "Flux",
      project: "InvestorOS",
      event: "Fergana IT Case",
      date: "2026-08-02",
      place: 1,
      prize: "",
      partner: "StartUp Garage",
      photo: "fergana-pitch",
      summary: {
        en: "One workspace for an investor: a morning brief, a deal pipeline and a diligence section, shipped as a working MVP with a database.",
        ru: "Единое рабочее место инвестора: утренняя сводка, воронка сделок и раздел проверки. Рабочий MVP с базой данных.",
        uz: "Investor uchun yagona ish joyi: ertalabki brif, bitimlar voronkasi va tekshiruv bo'limi. Ma'lumotlar bazasi bilan ishlaydigan MVP.",
      } as L,
    },
    {
      team: "Synapse",
      project: "RoboAI Mentor 2.0",
      event: "Tashkent final round",
      date: "2026-08-02",
      place: 1,
      prize: "",
      partner: "StartUp Garage, Codigo",
      photo: "tashkent-final",
      summary: {
        en: "Turns Codigo into a place to learn, compete and get hired: an AI mentor that explains why code failed and adapts the next problem.",
        ru: "Превращает Codigo в место, где учатся, соревнуются и находят работу: ИИ-наставник объясняет ошибки и подбирает следующую задачу.",
        uz: "Codigo'ni o'rganish, bellashish va ishga kirish joyiga aylantiradi: SI murabbiy xatoni tushuntiradi va keyingi masalani moslaydi.",
      } as L,
    },
    {
      team: "RealCoders",
      project: "Capitalist Dealfeed",
      event: "Samarkand IT Case",
      date: "2026-08-09",
      place: 1,
      prize: "",
      partner: "Capitalist, StartUp Garage",
      photo: "regional-winners",
      summary: {
        en: "A deal feed where founders and investors find each other and request an introduction, with chat and AI matching on the roadmap.",
        ru: "Лента сделок, где основатели и инвесторы находят друг друга и просят знакомства. В планах чат и подбор с помощью ИИ.",
        uz: "Asoschilar va investorlar bir-birini topib tanishuv so'raydigan bitimlar lentasi. Rejada chat va SI yordamida moslash.",
      } as L,
    },
    {
      team: "ForkBomb",
      project: "Fiscal-backed reviews",
      event: "Sirdaryo IT Case",
      date: "2026-10-04",
      place: 1,
      prize: "1,000,000 UZS",
      partner: "AICA, AI Alliance",
      photo: "andijan-teams",
      summary: {
        en: "Restaurant reviews you can trust because each one is tied to a real fiscal receipt, closing the gap between advertised and real quality.",
        ru: "Отзывы о заведениях, которым можно верить: каждый привязан к настоящему фискальному чеку.",
        uz: "Ishonsa bo'ladigan sharhlar: har biri haqiqiy fiskal chekka bog'langan.",
      } as L,
    },
    {
      team: "Finance Academia",
      project: "First Lumora case",
      event: "Lumora x MFaktor, Tashkent",
      date: "2025-07-08",
      place: 1,
      prize: "",
      partner: "M-Faktor",
      photo: "teamwork-table",
      summary: {
        en: "Winners of Uzbekistan's first IT case competition: 50+ students in 9 teams solving a real company case in one day.",
        ru: "Победители первого IT-кейс-чемпионата Узбекистана: более 50 студентов в 9 командах решали реальный кейс компании за один день.",
        uz: "O'zbekistondagi birinchi IT keys musobaqasi g'oliblari: 9 jamoadagi 50 dan ortiq talaba bir kunda haqiqiy kompaniya keysini yechdi.",
      } as L,
    },
  ],

  /** past rounds, newest first. Real data, except the fields listed in `placeholder`: the previous site and
      the channel publish no participant count or no winners for those rounds, so on 22 Nov 2026 the team asked
      for stand-in values (participants between 50 and 80, invented team names). Replace them with the real
      figures when they are known and remove the field from `placeholder`. */
  rounds: [
    { id: "r-tashkent-2026-10", city: "Tashkent", venue: "School 21", date: "2026-10-31", participants: 120, teams: 21, partners: ["AICA", "AI Alliance", "IT Park Uzbekistan", "MediaPark"], podium: ["ByteCraft", "NeoLab", "Pixel Forge"], placeholder: ["podium"], case: "" },
    { id: "r-andijan-2026-10", city: "Andijan", venue: "SAT Tashkent", date: "2026-10-04", participants: 64, teams: 0, partners: ["AICA", "AI Alliance"], podium: ["LaDele", "Technest", "Marshals"], case: "Students are losing interest in paper tests. How to digitalize learning?", placeholder: ["participants"] },
    { id: "r-sirdaryo-2026-10", city: "Guliston", venue: "Guliston Academy", date: "2026-10-04", participants: 58, teams: 0, partners: ["AICA", "AI Alliance"], podium: ["ForkBomb", "SayxunDev", "PlacePulse"], case: "The gap between advertised image and real quality in service places. How to build trust?", placeholder: ["participants"] },
    { id: "r-bukhara-2026-09", city: "Bukhara", venue: "Presidential School", date: "2026-09-27", participants: 72, teams: 0, partners: ["AICA", "AI Alliance"], podium: ["La Peace", "Eden", "Marvarid"], case: "Teachers lose hours every week to grading and paperwork.", placeholder: ["participants"] },
    { id: "r-nukus-2026-08", city: "Nukus", venue: "", date: "2026-08-23", participants: 40, teams: 0, partners: ["StartUp Garage"], podium: ["Aral Devs", "CodeSteppe", "Amu Stack"], case: "", placeholder: ["podium"] },
    { id: "r-samarkand-2026-08", city: "Samarkand", venue: "", date: "2026-08-09", participants: 67, teams: 0, partners: ["StartUp Garage", "Capitalist"], podium: ["RealCoders", "Galaxy Zip", "Summok"], case: "Help startup founders and investors find each other.", placeholder: ["participants"] },
    { id: "r-fergana-2026-08", city: "Fergana", venue: "", date: "2026-08-02", participants: 61, teams: 0, partners: ["StartUp Garage"], podium: ["Flux", "Grid", "Al Xorazmiy"], case: "Investment information is scattered across spreadsheets, emails and notes.", placeholder: ["participants"] },
    { id: "r-tashkent-2026-08", city: "Tashkent", venue: "", date: "2026-08-02", participants: 50, teams: 0, partners: ["StartUp Garage"], podium: ["Synapse", "UTOPIA", "IVY-Rocks"], case: "Where does the Codigo programming platform grow next?" },
    { id: "r-tashkent-2026-07", city: "Tashkent", venue: "", date: "2026-07-20", participants: 100, teams: 0, partners: ["StartUp Garage"], podium: ["DataNomads", "Silk Stack", "Team Orion"], case: "", placeholder: ["podium"] },
    { id: "r-tour-2025-12", city: "Tashkent, Fergana, Samarkand, Namangan", venue: "Najot Ta'lim centres", date: "2025-12-27", participants: 200, teams: 0, partners: ["Najot Ta'lim"], podium: ["Orbitals", "Kodchilar", "BlueShift"], case: "", placeholder: ["podium"] },
    { id: "r-tour-2025-11", city: "Karshi, Andijan, Samarkand, Nukus, Tashkent", venue: "", date: "2025-10-28", participants: 200, teams: 0, partners: ["RoboContest", "IT Park Uzbekistan"], podium: ["RoboMinds", "Sparkline", "CodeCaravan"], case: "", placeholder: ["podium"] },
    { id: "r-tashkent-2025-09", city: "Tashkent", venue: "Al-Khwarizmi IT school", date: "2025-09-28", participants: 75, teams: 0, partners: [], podium: ["Avocado", "Unique", "Knickerboxers"], case: "", placeholder: ["participants"] },
    { id: "r-jizzakh-2025-09", city: "Jizzakh", venue: "Presidential School", date: "2025-09-28", participants: 30, teams: 6, partners: ["TeamIT"], podium: ["InfiniteX", "Elite Krew", "CodeUp"], case: "" },
    { id: "r-namangan-2025-09", city: "Namangan", venue: "", date: "2025-09-28", participants: 54, teams: 0, partners: ["Capitalist", "NIS"], podium: ["NIS Chortoq", "BroGroup", "Next Page"], case: "", placeholder: ["participants"] },
    { id: "r-tashkent-2025-07", city: "Tashkent", venue: "", date: "2025-07-08", participants: 50, teams: 9, partners: ["M-Faktor", "Domino's Pizza", "EduOn"], podium: ["Finance Academia", "Hojilar", "Sodiq"], case: "" },
  ],

  /** event photos from the Lumora Telegram channel, in public/photos as <name>-800.webp and <name>-1600.webp */
  photos: {
    "school21-group": "Lumora Tashkent at School 21, 31 October 2026",
    "school21-teams": "Teams at work, Tashkent, 31 October 2026",
    "school21-pitch": "A team pitching to the jury, Tashkent",
    "school21-hallway": "Participants between rounds, Tashkent",
    "school21-judge": "A judge reviewing a pitch, Tashkent",
    "bukhara-build": "Building a prototype, Bukhara",
    "andijan-teams": "Teams at work, October 2026",
    "andijan-room": "The competition room, October 2026",
    "tashkent-final": "Tashkent final round, August 2026",
    "regional-winners": "Regional winners with certificates",
    "tashkent-stage": "Winners on stage, Tashkent",
    "teamwork-table": "Team at work, Tashkent",
    "fergana-pitch": "A pitch in Fergana",
    "tashkent-pitch-duo": "Two teammates presenting",
  } as Record<string, string>,
};

/** URL of a core team photo */
export function teamPhoto(name: string): string {
  return `${import.meta.env.BASE_URL}photos/team/${name}.webp`;
}

/** URL of an exported event photo that works under any base path */
export function photo(name: string, size: 800 | 1600 = 1600): string {
  return `${import.meta.env.BASE_URL}photos/${name}-${size}.webp`;
}
