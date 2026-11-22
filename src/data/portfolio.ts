/**
 * Portfolio content for Aryan Aligeti.
 *
 * Every value below is mapped from the original portfolio repo
 * https://github.com/aryan1429/My-Portfolio (src/pages/{Index,TechProjects,ContentCreation,Contact}.tsx,
 * src/components/FloatingVideos.tsx, src/data/chatResponses.ts, server/data/portfolioKnowledge.js,
 * index.html) and its public/resume.pdf. Facts are not invented: fields the source does not state are
 * omitted, and the UI is expected to handle their absence. Two things ARE editorial (presentation, not
 * source facts): the TechProject `categories` taxonomy (the source has no category field or filter), and
 * the Experience `title`s (see that section).
 *
 * Deliberately not carried over:
 *  - "This Portfolio Website" (chatResponses.ts / groqService.ts): this site replaces it, and the source
 *    has no screenshot for the required `image`.
 *  - server/database/schema.json seed data (profile name "Aryan Ali", Iron Man / Moon listed as Three.js
 *    "tech" projects, edit captions like "Digital art and animation featuring Spider-Man"): legacy
 *    placeholder content that contradicts the real pages, so its per-edit descriptions are not used.
 *  - Spoken languages (chatResponses.ts says English/Hindi/Telugu, groqService.ts says English/Tagalog -
 *    unresolved conflict) and hobbies/sports (no field in Profile).
 *  - chatResponses.ts-only claims with no second source (e-commerce builds, Socket.io chat app, a
 *    "Computer Science" degree).
 *
 * Images were copied from that repo into /public/images/{profile,projects,edits}/ (kebab-case names,
 * original extensions kept). Videos: the source's DigitalOcean Spaces bucket no longer exists. The 7 edits
 * with a local copy in the source repo are re-encoded (H.264, faststart) into /public/videos and served
 * from this site; the other 6 resolve against `NEXT_PUBLIC_VIDEO_CDN` (see `videoSrc` below and README.md).
 */

import type {
  Experience,
  Portfolio,
  Profile,
  SkillGroup,
  SocialLink,
  Stat,
  TechCategory,
  TechProject,
  VideoEdit,
} from "./types";

/** CDN base the source repo builds every video URL from (ContentCreation.tsx `baseUrl`). The bucket is gone. */
const SOURCE_VIDEO_CDN = "https://portfolio-videos.sgp1.cdn.digitaloceanspaces.com";

/**
 * Video host. Set `NEXT_PUBLIC_VIDEO_CDN` (inlined at build time) to any public bucket / CDN base that holds
 * the source files under their original names. Falls back to the original source bucket.
 */
const VIDEO_CDN = (process.env.NEXT_PUBLIC_VIDEO_CDN?.trim() || SOURCE_VIDEO_CDN).replace(/\/+$/, "");

/**
 * Resolve a clip URL. `local` = a web-optimised copy shipped in /public/videos (preferred: it deploys with
 * the site); otherwise the original `file` name on `VIDEO_CDN`.
 */
function videoSrc(file: string, local?: string): string {
  return local ? `/videos/${local}` : `${VIDEO_CDN}/${encodeURIComponent(file)}`;
}

const GITHUB_URL = "https://github.com/aryan1429";
const EMAIL = "aryanaligetibusiness@gmail.com";

/* -------------------------------------------------------------------------------------------------
 * Profile
 * -----------------------------------------------------------------------------------------------*/

export const profile: Profile = {
  name: "Aryan Aligeti",
  firstName: "Aryan",
  lastName: "Aligeti",
  // Index.tsx:145 hero line + Index.tsx:395 marquee ('Full Stack Dev', 'Video Editor', 'Content Creator',
  // 'UI/UX', 'Mobile Dev', 'Script Writer'); primary pair first.
  // First two roles are as Aryan states them in the build brief; the rest come from the source repo (Index.tsx marquee).
  roles: ["Full-Stack Developer", "Video Editor & Motion Graphics Artist", "Content Creator", "Mobile Developer", "Script Writer", "UI/UX"],
  tagline: "I build things for the web and edit things for the screen.",
  bio: [
    "I'm a Full Stack Developer and Video Editor with 3+ years of experience building web apps, mobile apps, and creating cinematic video content. I love combining technical skills with creative storytelling to deliver impactful digital experiences.",
    "On the engineering side I have hands-on experience in AI-driven applications, cloud deployment, and containerized architectures — building scalable web and mobile applications with modern frameworks like Next.js, React, FastAPI and Flutter.",
    "On the editing side I've made 100+ professional video edits for YouTube, social media, and creative projects — cinematic edits and motion graphics in Adobe After Effects, color grading in DaVinci Resolve — and have written scripts and created content for multiple YouTube channels.",
  ],
  location: "Hyderabad, India (IST)",
  education: "Bachelor's Degree (AIML), Anurag University · 2022 – 2026 · GPA 8.0 / 10",
  email: EMAIL,
  avatar: "/images/profile/aryan-aligeti.jpeg",
  resume: "/resume.pdf",
  availability:
    "Available for work — open to internships, collaborations, freelance projects, and full-time opportunities. Typically replies within 24 hours.",
};

/* -------------------------------------------------------------------------------------------------
 * Stats (Index.tsx "About" bento card). The source's "Projects Completed: 100+" conflicts with its own
 * hero "50+ Projects" (Index.tsx:174); portfolioKnowledge.js achievements resolve it as 100+ video edits
 * (also Index.tsx "Cinematic Video Edits" card) and 50+ technical projects, so it is split here.
 * -----------------------------------------------------------------------------------------------*/

export const stats: Stat[] = [
  { label: "Video Edits", value: "100+" },
  { label: "Tech Projects", value: "50+" },
  { label: "Years Experience", value: "3+" },
  { label: "Hackathons Won", value: "5+" },
  { label: "YT Channels Run", value: "3+" },
];

/* -------------------------------------------------------------------------------------------------
 * Skills — tech side from Index.tsx tech marquee + resume skills + portfolioKnowledge.js;
 * edits side from Index.tsx skill cards + chatResponses.ts (editing software, motion graphics,
 * thumbnail design) + resume "Other Skills". Visual Effects, Sound Design and Thumbnail Design are stated only
 * by the chatbot sources (chatResponses.ts + groqService.ts system prompt), not the resume.
 * -----------------------------------------------------------------------------------------------*/

export const skills: SkillGroup[] = [
  {
    side: "tech",
    title: "Frontend",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "Bootstrap",
      "Shadcn/UI",
      "Zustand",
      "Redux Toolkit",
      "Three.js",
      "Vite",
    ],
  },
  {
    side: "tech",
    title: "Backend",
    items: ["Node.js", "Express.js", "Python", "FastAPI", "Flask", "Django", "JWT", "WebSockets"],
  },
  {
    side: "tech",
    title: "Databases",
    items: ["PostgreSQL", "MongoDB (Mongoose)", "MySQL", "SQLite", "Redis", "Supabase", "Firebase"],
  },
  {
    side: "tech",
    title: "Cloud & DevOps",
    items: ["Docker", "AWS (EC2, S3)", "Google Cloud (Cloud Storage, App Engine)", "Vercel", "Render", "Git & GitHub", "NPM"],
  },
  {
    side: "tech",
    title: "Mobile",
    items: ["Flutter", "Dart"],
  },
  {
    side: "tech",
    title: "AI / ML",
    items: [
      "TensorFlow",
      "PyTorch",
      "Keras",
      "OpenCV",
      "Hugging Face Transformers",
      "OpenAI API",
      "Speech-to-Text",
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Jupyter Notebook",
    ],
  },
  {
    side: "tech",
    title: "Languages",
    items: ["Python", "TypeScript", "JavaScript", "Java", "C", "C++", "Dart"],
  },
  {
    side: "tech",
    title: "Design & Tools",
    items: ["UI/UX", "Figma", "VS Code"],
  },
  {
    side: "edits",
    title: "Editing Suite",
    items: ["Adobe After Effects", "Premiere Pro", "DaVinci Resolve"],
  },
  {
    side: "edits",
    title: "Craft",
    items: ["Video Editing", "Motion Graphics", "Visual Effects", "Color Grading", "Sound Design"],
  },
  {
    side: "edits",
    title: "Content",
    items: ["Content Creation", "Script Writing", "YouTube", "Thumbnail Design (Photoshop, Canva)"],
  },
];

/* -------------------------------------------------------------------------------------------------
 * Tech projects (TechProjects.tsx, in source order; extra facts from resume.pdf and
 * server/data/portfolioKnowledge.js)
 * -----------------------------------------------------------------------------------------------*/

export const techProjects: TechProject[] = [
  {
    slug: "bro-ai-study-buddy",
    title: "Bro - AI Study Buddy",
    summary: "Web-based AI study buddy with notes, quizzes, and flashcards. Deployed on AWS EC2.",
    description:
      "Bro is a web-based AI study buddy that lets users upload notes and interact with them through a clean, modern chat interface with source-style references and a dedicated Study Mode for quizzes and flashcards. Built with scalable architecture, containerized with Docker, deployed on AWS EC2.",
    categories: ["Full-Stack", "AI / ML", "Backend / Systems"],
    stack: ["Next.js", "TypeScript", "Python", "FastAPI", "Docker", "AWS EC2", "Qdrant", "PostgreSQL", "Groq LLM"],
    highlights: [
      "Upload study material and chat with it through a modern chat interface with source-style references.",
      "Responsive 3-panel workspace — Documents, Chat and Sources side by side.",
      "Dedicated Study Mode for MCQs and flashcards.",
      "Fully Dockerized and hosted on AWS EC2 for consistent development and deployment.",
    ],
    image: "/images/projects/bro-study-buddy-3.png",
    gallery: [
      "/images/projects/bro-study-buddy-1.png",
      "/images/projects/bro-study-buddy-2.png",
      "/images/projects/bro-study-buddy-3.png",
      "/images/projects/bro-study-buddy-4.png",
    ],
    liveUrl: "https://brostudybuddy.live/",
    liveLabel: "Live demo",
    repoUrl: "https://github.com/aryan1429/Bro-StudyBuddy.git",
    featured: true,
  },
  {
    slug: "snakebite-detection-system",
    title: "Snakebite Detection System",
    summary: "Flutter app that identifies venomous snakes with machine learning and gives immediate first-aid guidance.",
    description:
      "A Flutter mobile application for snakebite detection using machine learning. Identifies venomous snake species and provides immediate first-aid guidance. Developed complete mobile frontend with real-time snake identification and emergency response features.",
    categories: ["Mobile", "AI / ML"],
    stack: ["Flutter", "Dart", "Machine Learning", "TensorFlow Lite", "Firebase", "Camera API"],
    highlights: [
      "Developed the complete Flutter mobile frontend for an emergency-focused AI solution.",
      "Intuitive Flutter interface for real-time snake identification, symptom analysis and first-aid guidance.",
      "Integrated backend AI predictions and emergency SMS alerts into the mobile UI.",
    ],
    role: "Frontend Mobile Application Developer",
    image: "/images/projects/snakebite-detection-1.png",
    gallery: [
      "/images/projects/snakebite-detection-1.png",
      "/images/projects/snakebite-detection-2.png",
      "/images/projects/snakebite-detection-3.png",
    ],
    liveUrl: "https://github.com/manohari3299/AI_Based_SnakeBite_Detection_TreatmentAid/releases/latest",
    liveLabel: "Download APK",
    repoUrl: "https://github.com/manohari3299/AI_Based_SnakeBite_Detection_TreatmentAid.git",
  },
  {
    slug: "chest-xray-report-generator",
    title: "Chest X-ray Report Generator",
    summary: "Complete Frontend/UI with full-stack integration, Supabase, and Google Auth.",
    description:
      "Built the complete Frontend/UI for a Chest X-ray report generation system. Handled full integration of backend and frontend, database setup with Supabase, and authentication via Google Auth.",
    categories: ["Full-Stack", "Frontend"],
    stack: ["React", "Supabase", "Google Auth", "Full-Stack Integration"],
    highlights: [
      "Built the complete frontend / UI of the report generator.",
      "Handled the full integration between the backend and the frontend.",
      "Set up the Supabase database and Google Auth sign-in.",
    ],
    role: "Frontend / UI & full-stack integration",
    image: "/images/projects/chest-xray-report-generator.png",
    liveUrl: "https://chestxray.tech/",
    liveLabel: "Live demo",
    repoUrl: "https://github.com/aryan1429/CXR-report-generator.git",
    featured: true,
  },
  {
    slug: "gym-tracker",
    title: "Gym Tracker",
    summary: "Flutter workout tracker with a premium Glass & Neon UI, calendar planning and smart timers.",
    description:
      "Flutter mobile application for tracking gym workouts with premium Glass & Neon UI. Includes workout planning, calendar integration, progress photos, weather-based smart timers.",
    categories: ["Mobile"],
    stack: ["Flutter", "Dart", "Firebase", "Weather API", "Glassmorphism"],
    highlights: [
      "Cross-platform Flutter app with a premium Glass & Neon, mobile-first UI.",
      "Workout planning with calendar integration and set / reps / weight logging.",
      "Progress photos and progress monitoring over time.",
      "Weather-based smart timers.",
    ],
    image: "/images/projects/gym-tracker-1.png",
    gallery: [
      "/images/projects/gym-tracker-1.png",
      "/images/projects/gym-tracker-2.png",
      "/images/projects/gym-tracker-3.png",
      "/images/projects/gym-tracker-4.png",
    ],
    liveUrl: "https://github.com/aryan1429/gym-tracker/releases/latest",
    liveLabel: "Download APK",
    repoUrl: "https://github.com/aryan1429/gym-tracker",
  },
  {
    slug: "mr-sarcastic",
    title: "Mr Sarcastic",
    summary: "AI chatbot with a sarcastic personality that reads your mood and recommends music to match.",
    description:
      "AI-powered chatbot with sarcastic personality that detects user mood and provides personalized music recommendations. Features Firebase Auth, real-time chat, and mood-based song suggestions.",
    categories: ["Full-Stack", "AI / ML"],
    stack: ["React", "TypeScript", "Node.js", "Express", "Google Cloud Storage", "JWT", "Tailwind CSS", "Firebase Auth"],
    highlights: [
      "Sarcastic AI personality that detects the user's mood.",
      "Mood-based, personalised song suggestions.",
      "Real-time chat with Firebase Auth (Google sign-in) and JWT authentication.",
    ],
    image: "/images/projects/mr-sarcastic.png",
    liveUrl: "https://www.mrsarcastic.me/",
    liveLabel: "Live demo",
    repoUrl: "https://github.com/aryan1429/mr-sarcastic",
  },
  {
    slug: "expense-tracker",
    title: "Expense Tracker",
    summary: "MERN-stack expense tracker with category charts for daily spending.",
    description:
      "Full-stack personal expense tracker built with MERN stack. Add, view, and delete daily expenses, visualized in charts by category.",
    categories: ["Full-Stack"],
    stack: ["React", "MongoDB", "Express", "Node.js"],
    highlights: [
      "Full MERN stack implementation — MongoDB, Express, React and Node.js.",
      "Add, view and delete daily expenses.",
      "Spending visualised in charts by category.",
    ],
    image: "/images/projects/expense-tracker.png",
    liveUrl: "https://expense-tracker-sigma-green.vercel.app/",
    liveLabel: "Live demo",
    repoUrl: "https://github.com/aryan1429/Expense_tracker.git",
  },
  {
    slug: "text-mood-dj",
    title: "TextMoodDJ",
    summary: "AI music assistant that detects emotion from text or voice and recommends matching songs.",
    description:
      "AI-powered mood-based music assistant. Detects emotions from text or voice, recommends matching songs/memes using sentiment analysis and YouTube Music API.",
    categories: ["AI / ML", "Full-Stack"],
    stack: ["Python", "FastAPI", "React", "Tailwind CSS", "Hugging Face", "YouTube Music API (ytmusicapi)", "Redis / SQLite"],
    highlights: [
      "Emotion detection from typed text or voice via speech-to-text.",
      "Sentiment analysis with Hugging Face Transformers.",
      "Recommends matching songs and memes through the YouTube Music API.",
      "Dynamic React UI.",
    ],
    image: "/images/projects/text-mood-dj.png",
    liveUrl: "https://text-mood-dj.vercel.app/",
    liveLabel: "Live demo",
    repoUrl: "https://github.com/aryan1429/Text-MoodDJ.git",
  },
];

/* -------------------------------------------------------------------------------------------------
 * Video edits (ContentCreation.tsx `videos`, in source order). Category = the source filter label
 * ("Edits" / "Shorts"). `featured` = the edits the source's home page FloatingVideos showcase rotates
 * through. Aspect and duration come from local copies of the same-named files in the source repo;
 * entries without a local copy leave them out.
 * Per-edit description / tools / breakdown are not taken from the source: the only per-edit captions are in
 * the legacy server/database/schema.json seed data (see header), which was deliberately rejected.
 * -----------------------------------------------------------------------------------------------*/

export const videoEdits: VideoEdit[] = [
  {
    slug: "cartoons-finale",
    title: "Cartoons Finale",
    category: "Edits",
    thumbnail: "/images/edits/cartoons-finale.png",
    videoUrl: videoSrc("Cartoons_FINALE.mp4"),
  },
  {
    slug: "steve",
    title: "Steve Edit",
    category: "Edits",
    thumbnail: "/images/edits/steve.jpg",
    videoUrl: videoSrc("steve.mp4", "steve.mp4"),
    aspect: "1:1",
    duration: "00:29",
    featured: true,
  },
  {
    slug: "jon-snow",
    title: "Jon Snow Edit",
    category: "Edits",
    thumbnail: "/images/edits/jon-snow.png",
    thumbnailPosition: "26% center",
    videoUrl: videoSrc("Jon Snow - Funk Criminal.mp4"),
    featured: true,
  },
  {
    slug: "william-butcher",
    title: "William Butcher Edit",
    category: "Edits",
    thumbnail: "/images/edits/william-butcher.jpg",
    videoUrl: videoSrc("William_Butcher_Final.mp4"),
    featured: true,
  },
  {
    slug: "spiderman-x-funk",
    title: "Spiderman X Funk Edit",
    category: "Edits",
    thumbnail: "/images/edits/spiderman-x-funk.jpg",
    videoUrl: videoSrc("SpidermanXFunk_FINALs.mp4"),
    featured: true,
  },
  {
    slug: "soldier-boy",
    title: "Soldier Boy Edit",
    category: "Edits",
    thumbnail: "/images/edits/soldier-boy.png",
    thumbnailPosition: "center 20%",
    videoUrl: videoSrc("SoldierBoy_bestCC.mp4"),
    featured: true,
  },
  {
    slug: "spider-x-doakes",
    title: "Spider x Doakes Edit",
    category: "Edits",
    thumbnail: "/images/edits/spider-x-doakes.png",
    videoUrl: videoSrc("finalspiderxdoakes_optimized.mp4", "spider-x-doakes.mp4"),
    aspect: "1:1",
    duration: "00:20",
  },
  {
    slug: "2-broke-girls",
    title: "2 Broke Girls Edit",
    category: "Edits",
    thumbnail: "/images/edits/2-broke-girls.jpg",
    videoUrl: videoSrc("sample bettermp4.mp4"),
  },
  {
    slug: "spiderman",
    title: "Spiderman Edit",
    category: "Edits",
    thumbnail: "/images/edits/spiderman.jpg",
    videoUrl: videoSrc("Spiderman_edit.mp4", "spiderman.mp4"),
    aspect: "1:1",
    duration: "00:42",
    featured: true,
  },
  {
    slug: "how-did-our-moon-form",
    title: "How did our Moon Form?",
    category: "Shorts",
    thumbnail: "/images/edits/how-did-our-moon-form.png",
    videoUrl: videoSrc("MoonFinal.mp4", "how-did-our-moon-form.mp4"),
    aspect: "9:16",
    duration: "00:44",
  },
  {
    slug: "can-wolverine-survive-a-black-hole",
    title: "Can Wolverine Survive a Black Hole?",
    category: "Shorts",
    thumbnail: "/images/edits/can-wolverine-survive-a-black-hole.png",
    videoUrl: videoSrc("WolverineFinal.mp4", "can-wolverine-survive-a-black-hole.mp4"),
    aspect: "9:16",
    duration: "00:52",
    featured: true,
  },
  {
    slug: "ironman",
    title: "IronMan Edit",
    category: "Edits",
    thumbnail: "/images/edits/ironman.jpg",
    videoUrl: videoSrc("Ironman-edit.mp4", "ironman.mp4"),
    aspect: "1:1",
    duration: "00:36",
    featured: true,
  },
  {
    slug: "salesman",
    title: "Salesman Edit",
    category: "Edits",
    thumbnail: "/images/edits/salesman.avif",
    videoUrl: videoSrc("Salesman2.mp4", "salesman.mp4"),
    aspect: "1:1",
    duration: "00:23",
  },
];

/* -------------------------------------------------------------------------------------------------
 * Experience (resume.pdf "Work Experience"). The resume gives no job titles, only "Self-Employed" + a
 * description; the titles below are derived from those descriptions and the Index.tsx:395 marquee wording.
 * -----------------------------------------------------------------------------------------------*/

export const experience: Experience[] = [
  {
    title: "Script Writer & Content Creator",
    org: "Self-Employed",
    period: "Jan 2020 – Present",
    description: "Worked on script writing and content creation for multiple YouTube channels.",
  },
  {
    title: "Video Editor",
    org: "Self-Employed",
    period: "Jan 2025 – Present",
    description: "Delivered multiple video editing projects using Adobe After Effects.",
  },
];

/* -------------------------------------------------------------------------------------------------
 * Socials (Contact.tsx + TechProjects.tsx GitHub CTA + Index.tsx resume download)
 * -----------------------------------------------------------------------------------------------*/

export const socials: SocialLink[] = [
  { id: "github", label: "GitHub", href: GITHUB_URL, handle: "aryan1429" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/aryan-aligeti-099ab825b/" },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/aryan_alejandro_aligeti/",
    handle: "@aryan_alejandro_aligeti",
  },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UCqJLSH1DtEDUdJmJz1mk8gQ" },
  { id: "email", label: "Email", href: `mailto:${EMAIL}`, handle: EMAIL },
  { id: "resume", label: "Resume", href: "/resume.pdf" },
];

/* -------------------------------------------------------------------------------------------------
 * Derived
 * -----------------------------------------------------------------------------------------------*/

const CATEGORY_ORDER: readonly TechCategory[] = ["Full-Stack", "Frontend", "Backend / Systems", "AI / ML", "Mobile"];

/** Categories actually used by `techProjects`, in canonical order (for filter UIs). */
export const techCategories: TechCategory[] = CATEGORY_ORDER.filter((category) =>
  techProjects.some((project) => project.categories.includes(category)),
);

export const portfolio: Portfolio = {
  profile,
  stats,
  skills,
  techProjects,
  videoEdits,
  experience,
  socials,
  githubUrl: GITHUB_URL,
};
