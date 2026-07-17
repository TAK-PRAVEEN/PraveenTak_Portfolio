# Particle Portrait — Implementation Review

Complete source export of every file involved in the GPU particle-portrait feature.
Stack: **React 18 + Vite + React Three Fiber (v8) + Three.js (r0.169) + GLSL (inline) + Framer Motion + Tailwind**.
The portrait is a live GPU point-cloud reconstruction of a source photo (`public/portrait-source.png`), rendered as the hero of the landing page.

---------------------------------------------------------
PROJECT STRUCTURE
---------------------------------------------------------

```
Portfolio/
 ├── public/
 │    └── portrait-source.png          # source photo sampled into the point cloud (runtime asset)
 ├── src/
 │    ├── pages/
 │    │    └── Index.tsx               # landing page — renders <HeroSection/>
 │    ├── components/
 │    │    ├── HeroSection.tsx         # hero layout; lazy-loads + places <ParticlePortrait/>
 │    │    ├── ParticlePortrait.tsx    # wrapper: device tier, image sampling, <Canvas>, fallback
 │    │    └── particles/
 │    │         ├── ParticleField.tsx  # in-Canvas: geometry + material + useFrame loop + pick-plane
 │    │         ├── DustField.tsx      # in-Canvas: emitter dust + ambient depth field (1 draw call)
 │    │         ├── shaders.ts         # GLSL strings: portrait + dust (vertex/fragment)
 │    │         └── config.ts          # device tiers, palette, rim lights, physics params
 │    ├── lib/
 │    │    ├── particles/
 │    │    │    ├── sampleImage.ts     # CPU: image → point cloud + emitters (typed arrays)
 │    │    │    └── curlNoise.glsl.ts  # GLSL chunk: simplex + curl noise (injected into shaders)
 │    │    └── utils.ts                # cn() className helper (clsx + tailwind-merge)
 │    ├── hooks/
 │    │    └── useScrollAnimation.tsx  # IntersectionObserver hook (in-view → reveal / pause)
 │    └── index.css                    # global stylesheet (theme tokens + .particle-portrait-glow)
 └── package.json                      # dependencies
```

---------------------------------------------------------
DEPENDENCY GRAPH
---------------------------------------------------------

```
Index.tsx  (page)
   │
   └── HeroSection.tsx  ──lazy──►  ParticlePortrait.tsx
          │  (layout, cards,               │
          │   media query,                 ├── useScrollAnimation()      (in-view / pause)
          │   Suspense fallback)           ├── detectDeviceTier(), TIER_CONFIG   (config.ts)
          │                                ├── sampleImage()             (lib/particles/sampleImage.ts)
          │                                │        └── PORTRAIT_PARAMS.positionScale (config.ts)
          │                                └── <Canvas>  (@react-three/fiber)
          │                                        │  camera / dpr / frameloop
          │                                        └── ParticleField.tsx
          │                                               ├── BufferGeometry + BufferAttributes
          │                                               ├── ShaderMaterial (portrait)
          │                                               │       ├── portraitVertex / portraitFragment (shaders.ts)
          │                                               │       │        └── curlNoiseChunk (curlNoise.glsl.ts)
          │                                               │       └── uniforms ◄── PALETTE, RIM, PORTRAIT_PARAMS (config.ts)
          │                                               ├── useFrame  (time, cursor velocity, depth-tilt, reveal)
          │                                               ├── <mesh> invisible pick-plane (pointer → local space)
          │                                               └── DustField.tsx
          │                                                      ├── BufferGeometry (emitters + depth field)
          │                                                      └── ShaderMaterial (dust)
          │                                                              └── dustVertex / dustFragment (shaders.ts)
          │
          └── lucide-react icons, framer-motion, Button (ui)

utils.ts (cn) ──► ParticlePortrait.tsx
index.css (.particle-portrait-glow, --primary/--accent tokens) ──► ParticlePortrait.tsx / shader palette
```

Render pipeline (per the brief's requested view):

```
Index.tsx → HeroSection → ParticlePortrait → Canvas → ParticleField → ShaderMaterial → GLSL (vertex/fragment)
                                                             └──────► DustField → ShaderMaterial → GLSL
```

---------------------------------------------------------
PACKAGE INFORMATION
---------------------------------------------------------

Packages used by this feature (versions from `package.json`):

| Package | Version | Role in this feature |
|---|---|---|
| `three` | `^0.169.0` | WebGL renderer, BufferGeometry, BufferAttribute, ShaderMaterial, AdditiveBlending, Vector2/Vector3, MathUtils |
| `@react-three/fiber` | `^8.18.0` | React renderer for Three.js — `<Canvas>`, `useFrame`, `useThree`, `<points>`, `<mesh>`, pointer events (React-18-compatible v8) |
| `@react-three/drei` | `^9.122.0` | Installed (R3F helper lib) — **not currently imported** by the particle feature |
| `@types/three` | `^0.169.0` (dev) | TypeScript types for three |
| `react` / `react-dom` | `^18.3.1` | UI runtime |
| `framer-motion` | `^12.23.12` | UI-only animation: canvas fade-in, intro entrance, skill-bar fill |
| `react-router-dom` | `^6.30.1` | `<Link>` for CTAs in the hero |
| `lucide-react` | `^0.462.0` | Icons in the hero cards |
| `clsx` | `^2.1.1` | `cn()` className merge |
| `tailwind-merge` | `^2.6.0` | `cn()` className merge |
| `tailwindcss` | `^3.4.17` (dev) | Utility CSS (all layout/card styling) |
| `vite` | `^5.4.19` (dev) | Build/dev server |
| `@vitejs/plugin-react-swc` | `^3.11.0` (dev) | React plugin |
| `typescript` | `^5.8.3` (dev) | Types |

Notes:
- GLSL is **inlined as template-literal strings** (no `vite-plugin-glsl`).
- No `@react-spring/*` — spring/physics motion is done in-shader + in `useFrame`.
- Path alias `@/*` → `src/*` (Vite + tsconfig).

=========================================================
FILE: src/pages/Index.tsx
=========================================================

```tsx
import Navigation from "@/components/Navigation";
import SkillCard from "@/components/SkillCard";
import InteractiveCard from "@/components/InteractiveCard";
import ProfileUpload from "@/components/ProfileUpload";
import SectionHeader from "@/components/SectionHeader";
import HeroSection from "@/components/HeroSection";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Code, 
  Database, 
  Palette, 
  Brain,
  Download,
  MapPin,
  GraduationCap,
  Trophy,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

const Index = () => {
  const skills = {
    programming: ["Python", "Java", "SQL", "C", "C++", "JavaScript", "HTML", "CSS"],
    ml: ["Scikit-learn", "TensorFlow", "Pandas", "NumPy", "Matplotlib"],
    web: ["MongoDB", "MySQL", "REST APIs", "Railway", "Git", "Figma"],
    tools: ["Problem-Solving", "Teamwork", "Communication", "Time Management"]
  };

  const achievements = [
    "Finalist, Central India Hackathon 2.0",
    "Runner-Up, Overnight Problem (Sandhaanam 2025)",
    "Honours in B.Sc",
    "Winner, MiniHackathon 2024",
    "Winner, Hourly Problem (Sandhaanam 2025)",
  ];

  // Scroll animations
  const aboutSection = useScrollAnimation({ threshold: 0.2 });
  const skillsSection = useScrollAnimation({ threshold: 0.1 });
  const achievementsSection = useScrollAnimation({ threshold: 0.1 });
  const staggeredSkills = useStaggeredAnimation(4, 150);
  const staggeredAchievements = useStaggeredAnimation(achievements.length, 100);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section — full-viewport particle portrait */}
      <HeroSection />

      {/* About Section */}
      <section ref={aboutSection.elementRef} className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="About Me"
            subtitle="Actively seeking opportunities as a Data Scientist Intern or Machine Learning Engineer to contribute to innovative projects."
          />

          {/* Profile Section */}
          <div className={`mb-12 scroll-fade-up ${aboutSection.isVisible ? 'visible' : ''}`} style={{ transitionDelay: '200ms' }}>
            <InteractiveCard className="max-w-4xl mx-auto p-8" glowIntensity="high">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="flex flex-col items-center space-y-4">
                  <img src={`${import.meta.env.BASE_URL}profilePicture.png`} alt="Profile Picture" className="rounded-full w-40"/>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">Praveen Tak</h3>
                    <p className="text-primary">Data Science Enthusiast</p>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group">
                      <div className="shrink-0 p-2 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Focus</p>
                        <p className="text-xs text-muted-foreground">ML & Data Science</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group">
                      <div className="shrink-0 p-2 rounded-full bg-secondary/20 group-hover:bg-secondary/40 transition-colors">
                        <Zap className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-xs text-muted-foreground">1+ Years</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    Passionate about transforming data into actionable insights. Experienced in building machine learning models, 
                    data analysis, and creating innovative solutions for complex problems. Always eager to learn new technologies 
                    and collaborate on challenging projects.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {["Python", "TensorFlow", "Data Analysis", "Machine Learning", "Problem Solving"].map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 transition-colors">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 scroll-slide-left ${aboutSection.isVisible ? 'visible' : ''}`} style={{ transitionDelay: '400ms' }}>
            <Link to="/experience#Education">
              <InteractiveCard className="p-6" glowIntensity="medium">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20 shadow-glow">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Education</h3>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Bachelor of Science (PMCS)</p>
                  <p className="text-primary text-sm">Lachoo Memorial College of Science & Technology</p>
                  <p className="text-muted-foreground text-sm">Sep 2022 - Jul 2025 • 85.00%</p>
                </div>
              </InteractiveCard>
            </Link>
            <InteractiveCard className="p-6" glowIntensity="medium">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Trophy className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold">Key Stats</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center group">
                  <span className="text-muted-foreground">Projects Completed</span>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-primary">3+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-muted-foreground">Certifications</span>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-primary">15+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-muted-foreground">Hackathon Wins</span>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-primary">2</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section ref={skillsSection.elementRef} className="py-16 px-6 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="Skills & Technologies"
            subtitle="My technical expertise spans across multiple domains"
          />

          <div ref={staggeredSkills.containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(0) ? 'visible' : ''}`}>
              <SkillCard
                title="Programming"
                skills={skills.programming}
                icon={Code}
              />
            </div>
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(1) ? 'visible' : ''}`}>
              <SkillCard
                title="ML & Data Science"
                skills={skills.ml}
                icon={Brain}
              />
            </div>
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(2) ? 'visible' : ''}`}>
              <SkillCard
                title="Web & Database"
                skills={skills.web}
                icon={Database}
              />
            </div>
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(3) ? 'visible' : ''}`}>
              <SkillCard
                title="Soft Skills"
                skills={skills.tools}
                icon={Palette}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section
        id="achievements"
        ref={achievementsSection.elementRef}
        className="scroll-mt-24 py-16 px-6"
      >
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="Achievements"
            subtitle="Recognition for excellence in competitions and academics"
          />

          <div ref={staggeredAchievements.containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`scroll-slide-left ${staggeredAchievements.visibleItems.has(index) ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <InteractiveCard glowIntensity="low">
                  <div className="flex items-center space-x-3 p-4">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-glow animate-pulse-glow" />
                    <span className="text-foreground">{achievement}</span>
                  </div>
                </InteractiveCard>
              </div>
            ))}
          </div>

          <div className={`text-center mt-12 scroll-fade-up ${achievementsSection.isVisible ? 'visible' : ''}`} style={{ transitionDelay: '600ms' }}>
            <Link to="/experience#work-experience">
              <Button size="lg" variant="outline" className="hover-scale">
                Explore My Journey
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
```

=========================================================
FILE: src/components/HeroSection.tsx
=========================================================

```tsx
/**
 * HeroSection.tsx
 * ------------------------------------------------------------------
 * Full-viewport hero built to match the reference mockup:
 *   • left  → availability badge, name, tagline, CTAs
 *   • centre→ the large monochrome particle portrait (the star)
 *   • right → Expertise (skill bars) + Tech Stack (icon grid)
 *   • lower-left → Achievements strip
 *   • bottom-centre → "move your cursor over my portrait" hint
 *
 * The portrait is rendered exactly once and slotted into either the
 * desktop layered layout or the mobile stacked layout (a media query
 * decides), so there is never a second WebGL context.
 * ------------------------------------------------------------------
 */
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Brain,
  Boxes,
  Code,
  Cpu,
  Database,
  Download,
  GitBranch,
  LineChart,
  Mouse,
  Rocket,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Code-split Three.js so the hero layout paints instantly; particles hydrate after.
const ParticlePortrait = lazy(() => import("@/components/ParticlePortrait"));
const PORTRAIT_SRC = `${import.meta.env.BASE_URL}portrait-source.png`;
const RESUME_URL =
  "https://drive.google.com/file/d/1LN2AQ5XoojyQJdSyUy1KHfSSpbkF43Lk/view?usp=sharing";

/** Tailwind-free media query hook (client-only SPA). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

// ---- Static content ------------------------------------------------
const EXPERTISE = [
  { label: "Data Science", value: 95 },
  { label: "Machine Learning", value: 90 },
  { label: "Deep Learning", value: 85 },
  { label: "Python", value: 95 },
];

const TECH = [
  { icon: Code, label: "Python", color: "text-yellow-400" },
  { icon: Database, label: "SQL", color: "text-sky-400" },
  { icon: Brain, label: "TensorFlow", color: "text-orange-400" },
  { icon: LineChart, label: "Pandas", color: "text-rose-400" },
  { icon: Cpu, label: "NumPy", color: "text-emerald-400" },
  { icon: GitBranch, label: "Git", color: "text-orange-300" },
  { icon: Terminal, label: "Scikit-learn", color: "text-cyan-400" },
  { icon: Code, label: "JavaScript", color: "text-yellow-300" },
];

const ACHIEVEMENTS = [
  { icon: Boxes, value: "5+", label: "Projects" },
  { icon: Sparkles, value: "3+", label: "Years Learning" },
  { icon: Award, value: "10+", label: "Certifications" },
  { icon: Rocket, value: "Explore", label: "More" },
];

// ---- Reusable glass card shell -------------------------------------
const GlassCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7)] ${className}`}
  >
    {children}
  </div>
);

const CardEyebrow = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
    {children}
  </div>
);

const HeroSection = () => {
  const isLg = useMediaQuery("(min-width: 1024px)");

  // The single portrait instance — sized differently per layout.
  const portrait = (
    <Suspense
      fallback={
        <div className="h-full w-full">
          <img src={PORTRAIT_SRC} alt="Praveen Tak" className="h-full w-full object-contain opacity-40" />
        </div>
      }
    >
      <ParticlePortrait src={PORTRAIT_SRC} alt="Praveen Tak" className="h-full w-full" />
    </Suspense>
  );

  // ---- Content blocks (declared once, placed by each layout) --------
  const intro = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-md space-y-6"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
        AVAILABLE FOR OPPORTUNITIES
      </span>

      <h1 className="text-5xl font-bold leading-tight md:text-6xl">
        <span className="block text-2xl font-medium text-muted-foreground md:text-3xl">Hi, I'm</span>
        <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Praveen Tak
        </span>
      </h1>

      <p className="text-lg text-muted-foreground md:text-xl">Computer Science Graduate</p>

      <p className="max-w-sm leading-relaxed text-muted-foreground">
        Passionate about Data Science, Machine Learning and building intelligent systems that solve
        real-world problems.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Link to="/experience">
          <Button size="lg" className="group shadow-glow">
            View Experience
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <a href={RESUME_URL} target="_blank" rel="noreferrer">
          <Button size="lg" variant="outline">
            Download Resume
            <Download className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>
    </motion.div>
  );

  const expertiseCard = (
    <GlassCard>
      <CardEyebrow>EXPERTISE</CardEyebrow>
      <div className="space-y-4">
        {EXPERTISE.map((s) => (
          <div key={s.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-foreground">{s.label}</span>
              <span className="text-muted-foreground">{s.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                whileInView={{ width: `${s.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );

  const techCard = (
    <GlassCard>
      <CardEyebrow>TECH STACK</CardEyebrow>
      <div className="grid grid-cols-4 gap-3">
        {TECH.map((t) => (
          <div
            key={t.label}
            title={t.label}
            className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
          >
            <t.icon className={`h-5 w-5 ${t.color}`} />
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-muted-foreground">•••</div>
    </GlassCard>
  );

  const achievementsCard = (
    <GlassCard>
      <CardEyebrow>ACHIEVEMENTS</CardEyebrow>
      <div className="grid grid-cols-4 gap-4">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.label} className="space-y-1">
            <a.icon className="h-5 w-5 text-primary" />
            <p className="text-lg font-bold text-foreground">{a.value}</p>
            <p className="text-xs text-muted-foreground">{a.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );

  const scrollHint = (
    <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
      <Mouse className="h-5 w-5 animate-bounce" />
      <span>Move your cursor over my portrait</span>
    </div>
  );

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Near-pure-black stage with a faint purple bloom in the top-left */}
      <div className="pointer-events-none absolute inset-0 bg-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)/0.12),transparent_42%)]" />

      {isLg ? (
        /* ---------------- Desktop: layered layout ---------------- */
        <>
          {/* Big portrait, centred behind the content — allowed to overflow
              its bounds so hair / dust / glow can extend past the face. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto aspect-[3/4] h-screen max-h-[1120px]">{portrait}</div>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="container mx-auto h-full max-w-7xl px-8">
              {/* Intro — upper left */}
              <div className="pointer-events-auto absolute left-8 top-28 xl:left-12">{intro}</div>

              {/* Expertise — upper right */}
              <div className="pointer-events-auto absolute right-8 top-24 w-[300px] xl:right-12">
                {expertiseCard}
              </div>

              {/* Tech stack — lower right */}
              <div className="pointer-events-auto absolute bottom-28 right-8 w-[300px] xl:right-12">
                {techCard}
              </div>

              {/* Achievements — lower left */}
              <div className="pointer-events-auto absolute bottom-16 left-8 w-[460px] xl:left-12">
                {achievementsCard}
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
            {scrollHint}
          </div>
        </>
      ) : (
        /* ---------------- Mobile / tablet: stacked ---------------- */
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 pb-16 pt-24 text-center">
          <div className="text-left">{intro}</div>
          <div className="aspect-[3/4] w-full max-w-[340px]">{portrait}</div>
          <div className="w-full max-w-sm space-y-6">
            {expertiseCard}
            {techCard}
            {achievementsCard}
          </div>
          {scrollHint}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
```

=========================================================
FILE: src/components/ParticlePortrait.tsx
=========================================================

```tsx
/**
 * ParticlePortrait.tsx
 * ------------------------------------------------------------------
 * Drop-in replacement for the static profile <img>. Renders a live,
 * GPU particle reconstruction of the portrait inside an R3F <Canvas>.
 *
 * Responsibilities (kept out of the WebGL layers so they stay pure):
 *   • pick a device tier → particle budget + DPR cap,
 *   • sample the source image into a point cloud (async, off the GPU),
 *   • reveal on scroll-into-view + fade the canvas in (framer-motion),
 *   • pause the render loop while off-screen (battery),
 *   • fall back to the plain <img> on WebGL failure, load error, or
 *     when the user prefers reduced motion.
 * ------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import ParticleField from "./particles/ParticleField";
import { detectDeviceTier, TIER_CONFIG } from "./particles/config";
import { sampleImage, type SampledParticles } from "@/lib/particles/sampleImage";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

interface ParticlePortraitProps {
  /** Image URL to reconstruct (e.g. `${import.meta.env.BASE_URL}portrait.png`). */
  src: string;
  /** Sizing classes for the wrapper (e.g. "w-full max-w-[720px] aspect-[3/4]"). */
  className?: string;
  alt?: string;
  /** Optional particle-count override (defaults to the device tier's budget). */
  count?: number;
}

/** Respect the OS "reduce motion" setting. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

const ParticlePortrait = ({ src, className, alt = "Praveen Tak", count }: ParticlePortraitProps) => {
  // Re-triggerable observer: also used to pause the loop off-screen.
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: false });

  const tier = useMemo(() => detectDeviceTier(), []);
  const cfg = TIER_CONFIG[tier];
  const reducedMotion = usePrefersReducedMotion();

  const [data, setData] = useState<SampledParticles | null>(null);
  const [failed, setFailed] = useState(false);

  const targetCount = count ?? cfg.particleTarget;

  // Sample the image into a point cloud once (skip entirely if reduced motion).
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    sampleImage(src, { targetCount })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [src, targetCount, reducedMotion]);

  // --- Graceful fallback: static image --------------------------------
  if (reducedMotion || failed) {
    return (
      <div ref={elementRef} className={cn("relative", className)}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-2xl object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // --- Live particle portrait -----------------------------------------
  return (
    <div ref={elementRef} className={cn("relative", className)}>
      {/* Soft ambient glow behind the canvas (theme tokens, CSS). */}
      <div className="particle-portrait-glow" aria-hidden />

      <motion.div
        className="absolute inset-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: data ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {data && (
          <Canvas
            gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, cfg.dprCap]}
            camera={{ fov: 50, position: [0, 0, 1.1], near: 0.1, far: 10 }}
            // Pause the render loop entirely while scrolled away.
            frameloop={isVisible ? "always" : "never"}
          >
            <ParticleField
              data={data}
              inView={isVisible}
              emitterCount={cfg.emitterCount}
              depthCount={cfg.depthCount}
              pointSize={cfg.pointSize}
              glow={cfg.glow}
            />
          </Canvas>
        )}
      </motion.div>

      {/* Accessible name / SEO — visually hidden, no layout impact. */}
      <img src={src} alt={alt} className="sr-only" />
    </div>
  );
};

export default ParticlePortrait;
```

=========================================================
FILE: src/components/particles/ParticleField.tsx
=========================================================

```tsx
/**
 * ParticleField.tsx
 * ------------------------------------------------------------------
 * Mounted inside the R3F <Canvas>. Owns:
 *   • the portrait BufferGeometry (from the sampled point cloud),
 *   • the additive ShaderMaterial + every uniform,
 *   • an invisible pick-plane that maps the cursor into local space,
 *   • the ambient DustField (emitters + depth field),
 *   • the single useFrame loop: layered time, cursor velocity, holographic
 *     depth-tilt, and the play-once reveal — mutating a handful of uniforms.
 *
 * All per-particle simulation stays on the GPU; the CPU loop only touches
 * scalars/vectors, keeping this a single draw call per layer.
 * ------------------------------------------------------------------
 */
import { useEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import DustField, { DustUniforms } from "./DustField";
import { portraitFragment, portraitVertex } from "./shaders";
import { DUST_PARAMS, PALETTE, PORTRAIT_PARAMS, RIM } from "./config";
import type { SampledParticles } from "@/lib/particles/sampleImage";

interface ParticleFieldProps {
  data: SampledParticles;
  inView: boolean;
  emitterCount: number;
  depthCount: number;
  pointSize: number;
  glow: number;
}

const v3 = (c: [number, number, number]) => new THREE.Vector3(c[0], c[1], c[2]);
const REF_SPEED = 5.0; // cursor speed (local units/s) that counts as "fast"

const ParticleField = ({ data, inView, emitterCount, depthCount, pointSize, glow }: ParticleFieldProps) => {
  const gl = useThree((s) => s.gl);
  const groupRef = useRef<THREE.Group>(null);

  const pointer = useRef({ x: 0, y: 0, active: 0 });
  const prevPointer = useRef({ x: 0, y: 0 });
  const reveal = useRef(0);
  const revealedOnce = useRef(false);

  // --- Portrait geometry ---------------------------------------------
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(data.sizes, 1));
    g.setAttribute("aRandom", new THREE.BufferAttribute(data.randoms, 1));
    g.setAttribute("aEdge", new THREE.BufferAttribute(data.edges, 1));
    g.setAttribute("aBrightness", new THREE.BufferAttribute(data.brightness, 1));
    g.setAttribute("aReveal", new THREE.BufferAttribute(data.reveal, 1));
    return g;
  }, [data]);

  const dpr = gl.getPixelRatio();

  // --- Portrait uniforms (created once, mutated per frame) -----------
  const portraitUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseActive: { value: 0 },
      uMouseVel: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: dpr },
      uSize: { value: pointSize },
      uMouseRadius: { value: PORTRAIT_PARAMS.mouseRadius },
      uMouseStrength: { value: PORTRAIT_PARAMS.mouseStrength },
      uMouseVelScale: { value: PORTRAIT_PARAMS.mouseVelScale },
      uIdleDrift: { value: PORTRAIT_PARAMS.idleDrift },
      uJitter: { value: PORTRAIT_PARAMS.jitter },
      uOsc: { value: PORTRAIT_PARAMS.osc },
      uBreath: { value: PORTRAIT_PARAMS.breath },
      uEdgeDissolve: { value: PORTRAIT_PARAMS.edgeDissolve },
      uRimStrength: { value: PORTRAIT_PARAMS.rimStrength },
      uGlow: { value: glow },
      uWind: { value: new THREE.Vector2(PORTRAIT_PARAMS.windX, PORTRAIT_PARAMS.windY) },
      uOpacity: { value: PORTRAIT_PARAMS.opacity },
      uColorCore: { value: v3(PALETTE.core) },
      uColorViolet: { value: v3(PALETTE.violet) },
      uColorBlue: { value: v3(PALETTE.blue) },
      uColorAccent: { value: v3(PALETTE.accent) },
      uRimTL: { value: v3(RIM.topLeft) },
      uRimTR: { value: v3(RIM.topRight) },
      uRimB: { value: v3(RIM.bottom) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const dustUniforms = useMemo<DustUniforms>(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: dpr },
      uEmitterSize: { value: DUST_PARAMS.emitterSize },
      uDepthSize: { value: DUST_PARAMS.depthSize },
      uOpacity: { value: DUST_PARAMS.opacity * glow },
      uColorViolet: { value: v3(PALETTE.violet) },
      uColorBlue: { value: v3(PALETTE.blue) },
      uColorCore: { value: v3(PALETTE.core) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: portraitUniforms as unknown as Record<string, THREE.IUniform>,
        vertexShader: portraitVertex,
        fragmentShader: portraitFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [portraitUniforms],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // --- Pointer → local space via an invisible pick-plane -------------
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    pointer.current.x = e.point.x;
    pointer.current.y = e.point.y;
    pointer.current.active = 1;
  };
  const onPointerOut = () => {
    pointer.current.active = 0;
  };

  // --- Single per-frame update ---------------------------------------
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const P = portraitUniforms;

    P.uTime.value = t;
    dustUniforms.uTime.value = t;

    // Reveal — plays once, monotonic (never replays on scroll).
    if (inView) revealedOnce.current = true;
    if (revealedOnce.current && reveal.current < 1) {
      reveal.current = Math.min(1, reveal.current + dt * PORTRAIT_PARAMS.revealSpeed);
    }
    P.uReveal.value = reveal.current;
    dustUniforms.uReveal.value = reveal.current;

    // Cursor velocity (normalised 0..1) from raw target movement.
    const vx = (pointer.current.x - prevPointer.current.x) / Math.max(dt, 1e-3);
    const vy = (pointer.current.y - prevPointer.current.y) / Math.max(dt, 1e-3);
    const velNorm = Math.min(1, Math.hypot(vx, vy) / REF_SPEED) * pointer.current.active;
    prevPointer.current.x = pointer.current.x;
    prevPointer.current.y = pointer.current.y;
    P.uMouseVel.value += (velNorm - P.uMouseVel.value) * Math.min(1, dt * 8);

    // Ease mouse position (lag → outer particles trail the cursor).
    const m = P.uMouse.value;
    m.x += (pointer.current.x - m.x) * Math.min(1, dt * 12);
    m.y += (pointer.current.y - m.y) * Math.min(1, dt * 12);
    P.uMouseActive.value += (pointer.current.active - P.uMouseActive.value) * Math.min(1, dt * 6);

    // Holographic depth-tilt (~2°), returns to flat when the cursor leaves.
    if (groupRef.current) {
      const tilt = PORTRAIT_PARAMS.depthTilt;
      const targetRy = m.x * 2.0 * tilt * P.uMouseActive.value;
      const targetRx = -m.y * 2.0 * tilt * P.uMouseActive.value;
      groupRef.current.rotation.y += (targetRy - groupRef.current.rotation.y) * Math.min(1, dt * 4);
      groupRef.current.rotation.x += (targetRx - groupRef.current.rotation.x) * Math.min(1, dt * 4);
    }

    const ratio = state.gl.getPixelRatio();
    P.uPixelRatio.value = ratio;
    dustUniforms.uPixelRatio.value = ratio;
  });

  return (
    <>
      {/* Portrait + dust tilt together for holographic depth */}
      <group ref={groupRef}>
        <points geometry={geometry} material={material} frustumCulled={false} />
        <DustField
          emitterCount={emitterCount}
          depthCount={depthCount}
          emitters={data.emitters}
          emitterRegions={data.emitterRegions}
          aspect={data.aspect}
          uniforms={dustUniforms}
        />
      </group>

      {/* Invisible cursor pick-plane (world space, does not tilt) */}
      <mesh onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
};

export default ParticleField;
```

=========================================================
FILE: src/components/particles/DustField.tsx
=========================================================

```tsx
/**
 * DustField.tsx
 * ------------------------------------------------------------------
 * Two ambient layers packed into ONE draw call, distinguished by aType:
 *
 *   aType = 1  Silhouette emitters — spawn on the real portrait edge
 *              (hair-biased), detach, rise, fade, then respawn. This is
 *              the continuous cinematic dust around hair / shoulders /
 *              beard / shirt edges.
 *   aType = 0  Ambient depth field — soft bokeh scattered through space
 *              at varied depth (far = large & soft, near = small), with
 *              very slow parallax drift, so the portrait feels in a volume.
 *
 * Geometry is built once; time/reveal uniforms are driven by the parent
 * ParticleField's single useFrame loop.
 * ------------------------------------------------------------------
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { dustFragment, dustVertex } from "./shaders";
import { PORTRAIT_PARAMS } from "./config";

export interface DustUniforms {
  uTime: { value: number };
  uReveal: { value: number };
  uPixelRatio: { value: number };
  uEmitterSize: { value: number };
  uDepthSize: { value: number };
  uOpacity: { value: number };
  uColorViolet: { value: THREE.Vector3 };
  uColorBlue: { value: THREE.Vector3 };
  uColorCore: { value: THREE.Vector3 };
}

interface DustFieldProps {
  emitterCount: number;
  depthCount: number;
  emitters: Float32Array; // xyz silhouette spawn points
  emitterRegions: Float32Array; // 0..1 "hairness"
  aspect: number;
  uniforms: DustUniforms;
}

const DustField = ({
  emitterCount,
  depthCount,
  emitters,
  emitterRegions,
  aspect,
  uniforms,
}: DustFieldProps) => {
  const geometry = useMemo(() => {
    const total = emitterCount + depthCount;
    const position = new Float32Array(total * 3);
    const vel = new Float32Array(total * 3);
    const seed = new Float32Array(total);
    const size = new Float32Array(total);
    const type = new Float32Array(total);
    const region = new Float32Array(total);

    const available = Math.floor(emitters.length / 3);
    const halfW = 0.5 * aspect;

    // --- Silhouette emitters ---
    for (let i = 0; i < emitterCount; i++) {
      let sx: number, sy: number, sz: number, reg: number;
      if (available > 0) {
        const e = Math.floor(Math.random() * available);
        sx = emitters[e * 3] + (Math.random() - 0.5) * 0.01;
        sy = emitters[e * 3 + 1] + (Math.random() - 0.5) * 0.01;
        sz = emitters[e * 3 + 2];
        reg = emitterRegions[e];
      } else {
        // Fallback: spread around the portrait if no edges were found.
        sx = (Math.random() - 0.5) * halfW * 2;
        sy = Math.random() - 0.5;
        sz = 0;
        reg = Math.max(0, 1 - (0.5 - sy) * 1.7);
      }
      position[i * 3] = sx;
      position[i * 3 + 1] = sy;
      position[i * 3 + 2] = sz;

      // Directional "wind": motes stream up-and-right off the silhouette
      // (matching the mockup's dispersion), plus a little random spread.
      const spd = 0.12 + Math.random() * 0.2;
      vel[i * 3] = PORTRAIT_PARAMS.windX * spd + (Math.random() - 0.5) * 0.06;
      vel[i * 3 + 1] = PORTRAIT_PARAMS.windY * spd + (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      seed[i] = Math.random();
      size[i] = 0.6 + Math.random() * 1.3;
      type[i] = 1;
      region[i] = reg;
    }

    // --- Ambient depth field ---
    for (let j = 0; j < depthCount; j++) {
      const i = emitterCount + j;
      const depth = Math.random(); // 0 = far .. 1 = near
      position[i * 3] = (Math.random() - 0.5) * halfW * 3.2;
      position[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      position[i * 3 + 2] = THREE.MathUtils.lerp(-2.6, 0.2, depth);

      // Very slow parallax drift amplitude.
      vel[i * 3] = (Math.random() - 0.5) * 0.08;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
      vel[i * 3 + 2] = 0;

      seed[i] = Math.random();
      size[i] = THREE.MathUtils.lerp(2.6, 0.5, depth); // far → large & soft
      type[i] = 0;
      region[i] = 0;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aType", new THREE.BufferAttribute(type, 1));
    g.setAttribute("aRegion", new THREE.BufferAttribute(region, 1));
    return g;
  }, [emitterCount, depthCount, emitters, emitterRegions, aspect]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} frustumCulled={false} />;
};

export default DustField;
```

=========================================================
FILE: src/components/particles/config.ts
=========================================================

```ts
/**
 * config.ts
 * ------------------------------------------------------------------
 * Central tuning surface for the particle portrait: device tiers,
 * particle budgets, the colour palette / rim lights, and the physics
 * constants fed into the GLSL uniforms.
 *
 * Data only (no Three.js objects) so it stays cheap to import anywhere.
 * ------------------------------------------------------------------
 */

export type DeviceTier = "desktop" | "laptop" | "tablet" | "mobile";

export interface TierConfig {
  /** Portrait particles (the reconstructed face). */
  particleTarget: number;
  /** Silhouette emitter motes (rise / fade / respawn). */
  emitterCount: number;
  /** Ambient depth-field motes (bokeh in space). */
  depthCount: number;
  /** Renderer device-pixel-ratio cap. */
  dprCap: number;
  /** Base sprite size (device px, before perspective attenuation). */
  pointSize: number;
  /** Global glow/opacity multiplier (lower on mobile). */
  glow: number;
}

/**
 * Budgets per tier. Densities are high enough that from a normal viewing
 * distance the portrait reads as solid, with individual particles only
 * resolving on zoom. Mobile keeps the SAME experience at lower counts.
 */
export const TIER_CONFIG: Record<DeviceTier, TierConfig> = {
  desktop: { particleTarget: 210_000, emitterCount: 1400, depthCount: 260, dprCap: 2, pointSize: 2.9, glow: 1.0 },
  laptop: { particleTarget: 140_000, emitterCount: 1000, depthCount: 200, dprCap: 1.75, pointSize: 3.1, glow: 0.95 },
  tablet: { particleTarget: 60_000, emitterCount: 500, depthCount: 120, dprCap: 1.5, pointSize: 3.5, glow: 0.85 },
  mobile: { particleTarget: 30_000, emitterCount: 260, depthCount: 80, dprCap: 1.5, pointSize: 3.7, glow: 0.75 },
};

/**
 * Palette as raw sRGB triples (0..1). Fed to the shader as plain vec3
 * uniforms with gl_FragColor written directly, so we bypass Three's
 * colour management (what we author == what is displayed).
 * Derived from src/index.css tokens (primary/secondary/accent).
 */
export const PALETTE = {
  core: [1.0, 1.0, 1.0] as Vec3, // white-hot core
  violet: [0.49, 0.36, 0.94] as Vec3, // primary
  blue: [0.34, 0.7, 1.0] as Vec3, // secondary
  accent: [0.78, 0.44, 0.92] as Vec3, // accent
};

/**
 * Directional rim lights (shader-side only — never CSS). Each colour is
 * applied where a particle's outward direction faces that light.
 */
export const RIM = {
  topLeft: [0.85, 0.92, 1.0] as Vec3, // cool white
  topRight: [0.2, 0.6, 1.0] as Vec3, // electric blue
  bottom: [0.55, 0.3, 0.95] as Vec3, // purple ambient
};

type Vec3 = [number, number, number];

/**
 * Physics / look constants (uniforms). Spatial values are in the
 * portrait's local space (image height ≈ 1 unit before positionScale).
 */
export const PORTRAIT_PARAMS = {
  /** Fit the portrait into this fraction of the view, leaving a margin
   *  so hair / dust / glow can extend beyond the face without clipping. */
  positionScale: 0.82,

  // --- Hover (velocity aware) ---
  mouseRadius: 0.24,
  mouseStrength: 0.09, // base push at rest
  mouseVelScale: 0.14, // extra push at full cursor speed (uMouseVel is 0..1)

  // --- Layered idle motion ---
  idleDrift: 0.006, // slow curl-noise float
  jitter: 0.0016, // high-frequency micro jitter
  osc: 0.0038, // per-particle random oscillation
  breath: 0.008, // breathing scale pulse
  edgeDissolve: 0.02, // gentle outward silhouette shedding

  // --- Look ---
  rimStrength: 1.15, // strong glowing edge (hair rim, à la the mockup)
  opacity: 0.6,

  // --- Directional dispersion "wind" (up-and-right, matching the mockup) ---
  windX: 0.55,
  windY: 0.42,

  // --- Depth tilt (holographic parallax, radians ≈ 2°) ---
  depthTilt: 0.035,

  // --- Reconstruction ---
  revealSpeed: 0.42, // units of reveal progress per second (plays once)
};

export const DUST_PARAMS = {
  emitterSize: 2.6,
  depthSize: 6.0, // ambient bokeh are larger + softer
  opacity: 0.5,
};

/** Detect a coarse device tier from viewport, pointer type, hardware. */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "laptop";

  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (coarse) return width < 640 ? "mobile" : "tablet";
  if (cores <= 4 || mem <= 4 || width < 1440) return "laptop";
  return "desktop";
}
```

=========================================================
FILE: src/components/particles/shaders.ts
=========================================================

```ts
/**
 * shaders.ts
 * ------------------------------------------------------------------
 * GLSL for the two particle layers (GLSL ES 1.00 — ShaderMaterial default).
 *
 *   portraitVertex / portraitFragment → reconstructed face
 *   dustVertex     / dustFragment      → emitters + ambient depth field
 * ------------------------------------------------------------------
 */
import { curlNoiseChunk } from "@/lib/particles/curlNoise.glsl";

/* ------------------------------------------------------------------ *
 *  PORTRAIT — vertex
 *  Layered idle motion, velocity-aware hover, directional rim lighting,
 *  staged reveal, perspective depth.
 * ------------------------------------------------------------------ */
export const portraitVertex = /* glsl */ `
uniform float uTime;
uniform vec2  uMouse;
uniform float uMouseActive;
uniform float uMouseVel;       // cursor speed (local units / s)
uniform float uReveal;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseVelScale;
uniform float uIdleDrift;
uniform float uJitter;
uniform float uOsc;
uniform float uBreath;
uniform float uEdgeDissolve;
uniform float uRimStrength;
uniform float uGlow;
uniform vec2  uWind;   // directional dispersion (up-and-right)

uniform vec3 uColorCore;
uniform vec3 uColorViolet;
uniform vec3 uColorBlue;
uniform vec3 uColorAccent;
uniform vec3 uRimTL;   // top-left  (cool white)
uniform vec3 uRimTR;   // top-right (electric blue)
uniform vec3 uRimB;    // bottom    (purple)

attribute vec3  aColor;
attribute float aSize;
attribute float aRandom;
attribute float aEdge;
attribute float aBrightness;
attribute float aReveal;

varying vec3  vColor;
varying float vAlpha;
varying float vGlow;

${curlNoiseChunk}

void main() {
  vec3 origin = position;
  float t = uTime;

  // ---- Layered idle motion (no single repetitive sine) -------------
  // 1) slow curl-noise drift
  vec3 noiseP = origin * 2.2 + vec3(0.0, 0.0, t * 0.12);
  vec3 drift = curlNoise(noiseP) * uIdleDrift * (0.6 + aRandom);
  // 2) high-frequency micro jitter
  drift += curlNoise(origin * 34.0 + t * 0.7) * uJitter;
  // 3) per-particle oscillation with randomised frequency & phase
  float f = 0.5 + aRandom * 1.7;
  drift += vec3(
    sin(t * f + aRandom * 40.0),
    cos(t * (f * 0.8) + aRandom * 27.0),
    sin(t * (f * 1.3) + aRandom * 13.0)
  ) * uOsc * (0.4 + 0.6 * aRandom);
  // 4) silhouette shedding — leans into the directional wind (up-right)
  float shed = 0.6 + 0.8 * sin(t * 0.5 + aRandom * 6.2831);
  vec3 wind = vec3(uWind, 0.02);
  drift += (wind * 0.7 + curlNoise(noiseP * 1.7 + 12.0) * 0.3) * (uEdgeDissolve * aEdge * shed);
  // 5) breathing scale pulse
  float breath = 1.0 + sin(t * 0.75) * uBreath;

  vec3 pos = origin * breath + drift;

  // ---- Velocity-aware magnetic hover -------------------------------
  vec2 toMouse = pos.xy - uMouse;
  float d = length(toMouse);
  float influence = smoothstep(uMouseRadius, 0.0, d) * uMouseActive;
  float strength = uMouseStrength + uMouseVel * uMouseVelScale;
  vec2 dir = d > 1e-4 ? toMouse / d : vec2(0.0, 1.0);
  pos.xy += dir * (influence * strength);
  pos.z  += influence * strength * 0.5 * aRandom;

  // ---- Staged reveal: converge from a floating cloud, in order ------
  vec3 scatter = origin + vec3(
    (aRandom - 0.5),
    (fract(aRandom * 31.7) - 0.5),
    (fract(aRandom * 91.3) - 0.5) + 0.6
  ) * 1.6;
  // Map order into [0, 0.8] so the last particles still finish at reveal=1,
  // and everything is hidden at reveal=0.
  float e0 = aReveal * 0.8;
  float appear = smoothstep(e0, e0 + 0.2, uReveal);
  pos = mix(scatter, pos, appear);

  // ---- Project + perspective size attenuation ----------------------
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float atten = 1.0 / max(-mvPosition.z, 0.1);
  gl_PointSize = uSize * aSize * uPixelRatio * atten * (0.85 + 0.3 * breath);
  gl_Position = projectionMatrix * mvPosition;

  // ---- Colour: real face + white cores + directional rim light -----
  float lum = dot(aColor, vec3(0.299, 0.587, 0.114));
  vec3 col = aColor;
  col = mix(col, uColorViolet, (1.0 - lum) * 0.20);
  col = mix(col, uColorCore,   pow(lum, 2.0) * 0.5);

  // Outward direction ≈ surface normal for a point cloud.
  vec2 nrm = normalize(origin.xy + 1e-4);
  float tl = max(0.0, dot(nrm, normalize(vec2(-1.0, 1.0))));
  float tr = max(0.0, dot(nrm, normalize(vec2( 1.0, 1.0))));
  float bt = max(0.0, dot(nrm, vec2(0.0, -1.0)));
  float rimMask = mix(0.22, 1.0, aEdge) * (0.55 + 0.45 * (1.0 - lum));
  col += (uRimTL * tl + uRimTR * tr + uRimB * bt) * (uRimStrength * rimMask);

  col = mix(col, uColorAccent, influence * 0.4);

  vColor = col;
  vGlow  = (0.5 + lum * 0.85 + influence * 0.6) * uGlow;
  // Shadow side dissolves further into black; lit side stays solid.
  vAlpha = appear * (0.32 + 0.68 * lum);
}
`;

/* ------------------------------------------------------------------ *
 *  PORTRAIT — fragment
 *  White-hot core → coloured halo (blue / purple from rim), additive.
 * ------------------------------------------------------------------ */
export const portraitFragment = /* glsl */ `
uniform float uOpacity;

varying vec3  vColor;
varying float vAlpha;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  float core = smoothstep(0.5, 0.0, dist);
  float halo = pow(core, 1.5);
  vec3 color = mix(vColor, vec3(1.0), pow(core, 3.5)) * vGlow; // white-hot centre
  gl_FragColor = vec4(color, halo * vAlpha * uOpacity);
}
`;

/* ------------------------------------------------------------------ *
 *  DUST — vertex
 *  aType 1 → silhouette emitter (rise / fade / respawn, hair rises more)
 *  aType 0 → ambient depth field (soft bokeh in space, very slow drift)
 * ------------------------------------------------------------------ */
export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uReveal;
uniform float uPixelRatio;
uniform float uEmitterSize;
uniform float uDepthSize;

attribute vec3  aVel;
attribute float aSeed;
attribute float aSize;
attribute float aType;    // 1 = emitter, 0 = depth field
attribute float aRegion;  // emitter "hairness" (rises more when high)

varying float vAlpha;
varying float vTint;
varying float vType;

void main() {
  vec3 pos;
  float alpha;

  if (aType > 0.5) {
    // ---- Silhouette emitter: detach, rise, fade, respawn ----------
    float life = fract(uTime * (0.05 + aSeed * 0.06) + aSeed);
    vec3 rise = vec3(0.0, 0.3 + aRegion * 0.55, 0.0); // hair rises strongly
    pos = position + aVel * life + rise * life;
    pos.x += sin(uTime * 0.5 + aSeed * 30.0) * 0.02 * life;
    float fin = smoothstep(0.0, 0.12, life);
    float fout = smoothstep(1.0, 0.5, life);
    alpha = fin * fout;
    gl_PointSize = uEmitterSize * aSize * uPixelRatio;
  } else {
    // ---- Ambient depth field: slow parallax twinkle in space ------
    pos = position + aVel * sin(uTime * 0.1 + aSeed * 6.2831) * 0.5;
    alpha = (0.35 + 0.35 * sin(uTime * 0.3 + aSeed * 10.0));
    gl_PointSize = uDepthSize * aSize * uPixelRatio;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float atten = 1.0 / max(-mvPosition.z, 0.1);
  gl_PointSize *= atten;
  gl_Position = projectionMatrix * mvPosition;

  vAlpha = alpha * uReveal;
  vTint = aSeed;
  vType = aType;
}
`;

/* ------------------------------------------------------------------ *
 *  DUST — fragment
 * ------------------------------------------------------------------ */
export const dustFragment = /* glsl */ `
uniform float uOpacity;
uniform vec3  uColorViolet;
uniform vec3  uColorBlue;
uniform vec3  uColorCore;

varying float vAlpha;
varying float vTint;
varying float vType;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  float core = smoothstep(0.5, 0.0, dist);
  vec3 col = mix(uColorViolet, uColorBlue, vTint);
  col = mix(col, uColorCore, pow(core, 3.0) * 0.6);

  // Depth-field motes fall off softer (blurrier bokeh) than emitters.
  float soft = vType > 0.5 ? 1.5 : 2.6;
  gl_FragColor = vec4(col, pow(core, soft) * vAlpha * uOpacity);
}
`;
```

=========================================================
FILE: src/lib/particles/sampleImage.ts
=========================================================

```ts
/**
 * sampleImage.ts
 * ------------------------------------------------------------------
 * Turns a source portrait into a GPU-ready point cloud + emitter set.
 *
 * Pipeline:
 *   1. Load image → offscreen canvas at a working resolution scaled from
 *      the target particle count (denser than before for a solid look).
 *   2. Read pixels → luminance buffer + background mask (alpha cut-out,
 *      else blue-sky / bright-cloud chroma key).
 *   3. Sobel gradient → the "feature" signal (eyes, brows, hairline,
 *      beard, nose, lips get the strongest response).
 *   4. Importance-sample, strongly biasing density + size toward features
 *      (sweater / background stay sparse).
 *   5. Emit flat Float32Arrays: position (scaled to leave an overflow
 *      margin), colour, size, random seed, silhouette edge, brightness,
 *      and a per-particle REVEAL ORDER (hair → eyes → beard → face).
 *   6. Emit a subsampled set of silhouette EMITTERS (hair-biased) that the
 *      dust layer uses as continuous spawn points.
 *
 * The face is never redrawn — every particle carries the real sampled
 * RGB, so facial identity is preserved exactly.
 * ------------------------------------------------------------------
 */
import { PORTRAIT_PARAMS } from "@/components/particles/config";

export interface SampledParticles {
  count: number;
  positions: Float32Array; // xyz, centred, aspect-correct, scaled for margin
  colors: Float32Array; // rgb 0..1 straight from the photo
  sizes: Float32Array; // per-particle base size (feature weighted)
  randoms: Float32Array; // 0..1 phase seed
  edges: Float32Array; // 0..1 silhouette proximity
  brightness: Float32Array; // 0..1 luminance
  reveal: Float32Array; // 0..1 reconstruction order (0 = appears first)
  aspect: number;
  // Silhouette emitters (spawn points for the continuous dust).
  emitterCount: number;
  emitters: Float32Array; // xyz
  emitterRegions: Float32Array; // 0..1 "hairness" (1 = top → rises strongly)
}

export interface SampleOptions {
  targetCount: number;
  alphaThreshold?: number;
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

const MAX_EMITTER_CANDIDATES = 6000;

export async function sampleImage(
  src: string,
  { targetCount, alphaThreshold = 200 }: SampleOptions,
): Promise<SampledParticles> {
  const img = await loadImage(src);
  const aspect = img.width / img.height;
  const S = PORTRAIT_PARAMS.positionScale; // shrink to leave an overflow margin

  // --- 1. Working resolution from the target count --------------------
  const subjectFraction = 0.42;
  const desiredPixels = Math.min(1_800_000, Math.round(targetCount / (subjectFraction * 0.55)));
  let h = Math.round(Math.sqrt(desiredPixels / aspect));
  h = Math.max(200, Math.min(1200, h));
  const w = Math.max(1, Math.round(h * aspect));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const pixelCount = w * h;

  // --- 2. Luminance + background mask ---------------------------------
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < alphaThreshold) transparent++;
  const hasAlpha = transparent > pixelCount * 0.03;

  const lumaBuf = new Float32Array(pixelCount);
  const bg = new Uint8Array(pixelCount);

  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const L = luma(r, g, b);
    lumaBuf[p] = L;

    if (hasAlpha) {
      bg[p] = a < 128 ? 1 : 0;
    } else {
      const isSky = b > 110 && b >= g - 5 && g >= r && b - r > 12 && L > 100;
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
      const isCloud = L > 212 && sat < 0.12;
      bg[p] = isSky || isCloud ? 1 : 0;
    }
  }

  // --- 3. Sobel gradient (feature strength) ---------------------------
  const grad = new Float32Array(pixelCount);
  let gradMax = 1e-5;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (bg[p]) continue;
      const tl = lumaBuf[p - w - 1], tc = lumaBuf[p - w], tr = lumaBuf[p - w + 1];
      const ml = lumaBuf[p - 1], mr = lumaBuf[p + 1];
      const bl = lumaBuf[p + w - 1], bc = lumaBuf[p + w], br = lumaBuf[p + w + 1];
      const gx = tr + 2 * mr + br - (tl + 2 * ml + bl);
      const gy = bl + 2 * bc + br - (tl + 2 * tc + tr);
      const mag = Math.sqrt(gx * gx + gy * gy);
      grad[p] = mag;
      if (mag > gradMax) gradMax = mag;
    }
  }
  const invGradMax = 1 / gradMax;

  // --- 4. Importance sampling (strong feature bias) -------------------
  let weightSum = 0;
  for (let p = 0; p < pixelCount; p++) {
    if (bg[p]) continue;
    const gN = grad[p] * invGradMax;
    weightSum += 0.28 + 0.95 * gN * gN; // squared → sharper feature focus
  }
  const scale = weightSum > 0 ? targetCount / weightSum : 1;

  const px: number[] = [], py: number[] = [], pz: number[] = [];
  const cr: number[] = [], cg: number[] = [], cb: number[] = [];
  const sz: number[] = [], rnd: number[] = [], edg: number[] = [];
  const bri: number[] = [], rev: number[] = [];

  // Emitter candidates (silhouette points, hair-biased).
  const emX: number[] = [], emY: number[] = [], emZ: number[] = [], emR: number[] = [];

  const isBg = (x: number, y: number): boolean =>
    x < 0 || y < 0 || x >= w || y >= h || bg[y * w + x] === 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bg[p]) continue;

      const gN = grad[p] * invGradMax;
      const weight = 0.28 + 0.95 * gN * gN;
      if (Math.random() > Math.min(1, weight * scale)) continue;

      const i = p * 4;
      const L = lumaBuf[p] / 255;

      // Position — centred, aspect-correct, scaled to leave a margin.
      const X = (x / w - 0.5) * aspect * S;
      const Y = (0.5 - y / h) * S;
      px.push(X);
      py.push(Y);
      pz.push(((Math.random() - 0.5) * 0.035 + (L - 0.5) * 0.05) * S);

      cr.push(data[i] / 255);
      cg.push(data[i + 1] / 255);
      cb.push(data[i + 2] / 255);

      sz.push(0.5 + gN * 1.7 + L * 0.25);
      rnd.push(Math.random());
      bri.push(L);

      // Silhouette proximity (1 boundary, 0.5 within a 2px ring).
      let edge = 0;
      if (
        isBg(x - 1, y) || isBg(x + 1, y) || isBg(x, y - 1) || isBg(x, y + 1) ||
        isBg(x - 1, y - 1) || isBg(x + 1, y - 1) || isBg(x - 1, y + 1) || isBg(x + 1, y + 1)
      ) edge = 1;
      else if (isBg(x - 2, y) || isBg(x + 2, y) || isBg(x, y - 2) || isBg(x, y + 2)) edge = 0.5;
      edg.push(edge);

      // Reveal order: hair (top) first → face → sweater last; features lead.
      const yTop = y / h; // 0 top .. 1 bottom
      rev.push(Math.max(0, Math.min(1, yTop - gN * 0.28 + (Math.random() - 0.5) * 0.06)));

      // Collect silhouette points as dust emitters, concentrated where the
      // mockup disperses: the hair (top) and the right edge. Left-side edges
      // are dropped so particles don't blow back across the face.
      if (edge >= 1 && emX.length < MAX_EMITTER_CANDIDATES) {
        const hairness = Math.max(0, Math.min(1, 1 - yTop * 1.7));
        if (hairness > 0.2 || X > -0.05) {
          emX.push(X);
          emY.push(Y);
          emZ.push(pz[pz.length - 1]);
          emR.push(hairness);
        }
      }
    }
  }

  const count = px.length;
  if (count === 0) throw new Error("No subject particles were sampled (background key too aggressive?)");

  // --- 5. Pack particle arrays ----------------------------------------
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count);
  const edges = new Float32Array(count);
  const brightness = new Float32Array(count);
  const reveal = new Float32Array(count);

  for (let n = 0; n < count; n++) {
    positions[n * 3] = px[n];
    positions[n * 3 + 1] = py[n];
    positions[n * 3 + 2] = pz[n];
    colors[n * 3] = cr[n];
    colors[n * 3 + 1] = cg[n];
    colors[n * 3 + 2] = cb[n];
    sizes[n] = sz[n];
    randoms[n] = rnd[n];
    edges[n] = edg[n];
    brightness[n] = bri[n];
    reveal[n] = rev[n];
  }

  // --- 6. Pack emitters -----------------------------------------------
  const emitterCount = emX.length;
  const emitters = new Float32Array(emitterCount * 3);
  const emitterRegions = new Float32Array(emitterCount);
  for (let n = 0; n < emitterCount; n++) {
    emitters[n * 3] = emX[n];
    emitters[n * 3 + 1] = emY[n];
    emitters[n * 3 + 2] = emZ[n];
    emitterRegions[n] = emR[n];
  }

  return {
    count, positions, colors, sizes, randoms, edges, brightness, reveal, aspect,
    emitterCount, emitters, emitterRegions,
  };
}
```

=========================================================
FILE: src/lib/particles/curlNoise.glsl.ts
=========================================================

```ts
/**
 * curlNoise.glsl.ts
 * ------------------------------------------------------------------
 * Reusable GLSL chunk: Ashima/Gustavson 3D simplex noise (`snoise`)
 * plus a divergence-free `curlNoise` field built from it.
 *
 * curlNoise gives smooth, swirling, volume-preserving motion — perfect
 * for the idle "floating" drift and the elegant hover scatter. Injected
 * as a string into the vertex shaders (no vite-plugin-glsl needed).
 * ------------------------------------------------------------------
 */

export const curlNoiseChunk = /* glsl */ `
// --- Ashima simplex noise (public domain) --------------------------
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Vector-valued noise sampled at decorrelated offsets.
vec3 snoiseVec3(vec3 x) {
  float s  = snoise(x);
  float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
  float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
  return vec3(s, s1, s2);
}

// Divergence-free curl of the noise field.
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 p_x0 = snoiseVec3(p - dx);
  vec3 p_x1 = snoiseVec3(p + dx);
  vec3 p_y0 = snoiseVec3(p - dy);
  vec3 p_y1 = snoiseVec3(p + dy);
  vec3 p_z0 = snoiseVec3(p - dz);
  vec3 p_z1 = snoiseVec3(p + dz);

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor);
}
`;
```

=========================================================
FILE: src/hooks/useScrollAnimation.tsx
=========================================================

```tsx
import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible };
};

export const useStaggeredAnimation = (itemCount: number, delay = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the animation of child items
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => new Set([...prev, i]));
            }, i * delay);
          }
          observer.unobserve(container);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [itemCount, delay]);

  return { containerRef, visibleItems };
};
```

=========================================================
FILE: src/lib/utils.ts
=========================================================

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

=========================================================
FILE: src/index.css  (EXCERPT — particle-related CSS only)
=========================================================

The global stylesheet is large; only the particle-portrait-related CSS is reproduced here.
`.particle-portrait-glow` is the ambient glow behind the canvas (used by `ParticlePortrait.tsx`).
The shader `PALETTE`/`RIM` colours are derived from the theme's HSL design tokens shown below.

```css
/* --- The only class specific to the particle portrait --- */
@layer utilities {
  /* Ambient radial glow behind the particle portrait canvas */
  .particle-portrait-glow {
    position: absolute;
    inset: -18%;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(
      circle at 50% 45%,
      hsl(var(--primary) / 0.28),
      hsl(var(--accent) / 0.12) 42%,
      transparent 70%
    );
    filter: blur(26px);
  }
}

/* --- Theme design tokens the shader palette is derived from (from :root) --- */
:root {
  --background: 220 25% 6%;   /* near-black navy — hero backdrop */
  --foreground: 210 40% 98%;
  --primary: 250 80% 65%;     /* violet  → PALETTE.violet */
  --primary-glow: 250 100% 80%;
  --secondary: 200 80% 60%;   /* blue    → PALETTE.blue / RIM.topRight */
  --accent: 290 80% 70%;      /* magenta → PALETTE.accent */
  /* ...other tokens omitted (not used by the particle feature)... */
}
```

---------------------------------------------------------
NOTES
---------------------------------------------------------

**src/pages/Index.tsx**
- Purpose: landing page; renders `<HeroSection/>` as the hero (plus the unrelated About/Skills/Achievements sections).
- Imported by: the router (`App.tsx`, not part of this feature).
- Imports (feature-relevant): `HeroSection`.
- Affects rendering: yes (mounts the hero). Animation: no (particle animation lives deeper). Particle generation: no. Shaders: no.

**src/components/HeroSection.tsx**
- Purpose: full-viewport hero layout (badge, name, CTAs, Expertise/Tech-Stack/Achievements glass cards, scroll hint) and the container that positions the portrait. Chooses a desktop *layered* vs mobile *stacked* layout via a `useMediaQuery` hook so the portrait mounts exactly once.
- Imported by: `Index.tsx`.
- Imports: lazy `ParticlePortrait`, `framer-motion`, `react-router-dom` `Link`, `lucide-react` icons, `Button`. Defines `PORTRAIT_SRC` (`public/portrait-source.png`).
- Affects rendering: yes (composition, sizing, `overflow-hidden` stage, black background + faint purple bloom). Animation: UI only (intro entrance, skill bars). Particle generation: no. Shaders: no.

**src/components/ParticlePortrait.tsx**
- Purpose: the feature's public component / integration seam. Picks a device tier, kicks off async image sampling, mounts the R3F `<Canvas>` (camera, DPR cap, `frameloop` pause when off-screen), fades the canvas in, and falls back to a static `<img>` on load failure or `prefers-reduced-motion`.
- Imported by: `HeroSection.tsx` (lazy).
- Imports: `@react-three/fiber` `Canvas`, `framer-motion`, `ParticleField`, `config` (`detectDeviceTier`, `TIER_CONFIG`), `sampleImage`, `useScrollAnimation`, `cn`.
- Affects rendering: yes (Canvas + DPR + fallback). Animation: indirectly (drives `inView` reveal + fade; pauses loop). Particle generation: yes (calls `sampleImage`). Shaders: no (delegates to `ParticleField`).

**src/components/particles/ParticleField.tsx**
- Purpose: the core in-Canvas component. Builds the portrait `BufferGeometry` + `BufferAttributes` from the sampled arrays, creates the additive `ShaderMaterial` and **all uniforms**, renders the `<points>` + the `<DustField>` inside a tiltable `<group>`, adds the invisible cursor pick-plane, and runs the **single `useFrame` loop** (time, cursor velocity, holographic depth-tilt, play-once reveal, DPR sync). Disposes geometry/material on unmount.
- Imported by: `ParticlePortrait.tsx`.
- Imports: `@react-three/fiber` (`useFrame`, `useThree`, `ThreeEvent`), `three`, `DustField` (+`DustUniforms`), `shaders` (`portraitVertex`/`portraitFragment`), `config` (`PALETTE`, `RIM`, `PORTRAIT_PARAMS`, `DUST_PARAMS`), `SampledParticles` type.
- Affects rendering: yes. Animation: yes (owns the frame loop, hover, reveal, tilt). Particle generation: no (consumes the sampled data). Shaders: yes (wires vertex/fragment + uniforms).

**src/components/particles/DustField.tsx**
- Purpose: ambient particle layer packed into one draw call — `aType=1` silhouette **emitters** (hair-biased, rise/fade/respawn, up-right wind) and `aType=0` **depth-field** bokeh (varied Z, slow parallax). Builds its own geometry from the emitter spawn points; uniforms are shared/driven by `ParticleField`.
- Imported by: `ParticleField.tsx`.
- Imports: `three`, `shaders` (`dustVertex`/`dustFragment`), `config` (`PORTRAIT_PARAMS` for wind). Exports the `DustUniforms` interface.
- Affects rendering: yes. Animation: yes (in-shader life/drift). Particle generation: yes (its own dust geometry). Shaders: yes (dust vertex/fragment).

**src/components/particles/config.ts**
- Purpose: single tuning surface — device tiers (`TIER_CONFIG`: particle/emitter/depth counts, DPR cap, point size, glow), `PALETTE`, `RIM` lights, `PORTRAIT_PARAMS` (hover, layered motion, rim, wind, depth-tilt, reveal speed, `positionScale`), `DUST_PARAMS`, and `detectDeviceTier()`.
- Imported by: `ParticleField.tsx`, `ParticlePortrait.tsx`, `DustField.tsx`, `sampleImage.ts`.
- Affects rendering: yes (counts, sizes, glow, DPR). Animation: yes (all physics constants). Particle generation: yes (`positionScale`, tier counts). Shaders: yes (palette/rim/params become uniforms). Pure data — no Three.js objects.

**src/components/particles/shaders.ts**
- Purpose: the four GLSL programs as template strings. Portrait vertex = layered idle motion (curl + jitter + per-particle oscillation + breathing + wind-shed), velocity-aware magnetic hover, staged reveal, directional rim lighting, perspective sizing; portrait fragment = white-hot core → halo (additive). Dust vertex/fragment = emitter vs depth-field behaviour + soft sprites. Injects `curlNoiseChunk`.
- Imported by: `ParticleField.tsx` (portrait), `DustField.tsx` (dust).
- Imports: `curlNoiseChunk` from `curlNoise.glsl.ts`.
- Affects rendering: yes. Animation: yes (all per-frame motion is here, GPU-side). Particle generation: no. Shaders: yes (this *is* the shaders).

**src/lib/particles/sampleImage.ts**
- Purpose: the CPU pipeline that converts the source photo into GPU-ready typed arrays — offscreen-canvas draw at a count-derived resolution, luminance + background key (alpha or blue-sky/cloud chroma key), Sobel feature gradient, importance sampling (feature-biased density + size), per-particle reveal order, and a hair/right-biased set of silhouette emitters. Preserves identity (samples real RGB; never redraws).
- Imported by: `ParticlePortrait.tsx` (function + `SampledParticles` type re-used by `ParticleField.tsx`).
- Imports: `PORTRAIT_PARAMS` (`positionScale`) from `config.ts`.
- Affects rendering: indirectly (defines what exists). Animation: no. Particle generation: **yes (this is it)**. Shaders: no (produces the attribute buffers the shaders read).

**src/lib/particles/curlNoise.glsl.ts**
- Purpose: reusable GLSL chunk — Ashima 3D simplex noise + a divergence-free curl field, injected into the portrait vertex shader for smooth swirling drift/scatter.
- Imported by: `shaders.ts`.
- Affects rendering: no (helper). Animation: yes (drift/scatter math). Particle generation: no. Shaders: yes (GLSL functions).

**src/hooks/useScrollAnimation.tsx**
- Purpose: `IntersectionObserver` hooks. `useScrollAnimation` provides `{ elementRef, isVisible }` used by `ParticlePortrait` to trigger the play-once reveal and to pause the render loop off-screen. (`useStaggeredAnimation` is used only by the non-hero sections of `Index.tsx`.)
- Imported by: `ParticlePortrait.tsx`, `Index.tsx`.
- Affects rendering: indirectly (drives `frameloop`). Animation: yes (in-view gate for reveal/pause). Particle generation: no. Shaders: no.

**src/lib/utils.ts**
- Purpose: `cn()` className merge helper (`clsx` + `tailwind-merge`).
- Imported by: `ParticlePortrait.tsx` (and much of the app).
- Affects rendering: no (styling utility). Animation: no. Particle generation: no. Shaders: no.

**src/index.css (excerpt)**
- Purpose: global stylesheet. Feature-relevant parts: `.particle-portrait-glow` (ambient CSS glow behind the canvas) and the `:root` HSL design tokens (`--primary`/`--secondary`/`--accent`) that the shader `PALETTE`/`RIM` colours were derived from.
- Imported by: app entry (global). Used by `ParticlePortrait.tsx` (glow class) and conceptually by the palette.
- Affects rendering: yes (glow + background tokens). Animation: no. Particle generation: no. Shaders: no (the shader colours are hard-coded sRGB in `config.ts`, matched to these tokens).

---------------------------------------------------------
RUNTIME ASSET
---------------------------------------------------------

- **public/portrait-source.png** — the source photo sampled into the point cloud. Referenced at runtime via `` `${import.meta.env.BASE_URL}portrait-source.png` `` in `HeroSection.tsx`. Not code; required for the feature to render. (Currently a full-resolution PNG; can be replaced with a background-removed / web-optimized version at the same path without code changes.)
```
