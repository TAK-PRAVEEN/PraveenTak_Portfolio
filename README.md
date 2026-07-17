<div align="center">

# Praveen Tak — Portfolio

**Data Science · Machine Learning · Creative Engineering**

🌐 **Live:** [praveentak.vercel.app](https://praveentak.vercel.app) · [GitHub Pages mirror](https://tak-praveen.github.io/PraveenTak_Portfolio/)

</div>

```text
                                               1

                                       1  0  1  0     0        1
                                   0     0     0        1
                                     1  0
                                 0  1
                                                        0
                                              101 10 01 10 010
                                    0        101010101010101 10 0
                                            101 10101010101 10 01 1
                                0          1 1 10101010101010 01 10  1
                                          1   10101010101010101 10 0
                                         1  010101   1  0  1 1 10 0
                                  1     1   10101 101  0  1  0  1
                                  010101   10101010   0  1010101
                                 01010101010101010101 10 0101010
                                 1010101  0101010101010101010101    0
                                  1010101  01010101010101010101010 01
                                   1010101 1 10101010101010101 10 01
                                  10101010 010101010101010101       1
                                   1010 010   01 10101010 0 0  1  01
                                  1 101010  1   10 01         1    0
                                   1010101 1  0 01 1 1  01 10 0 0
                                  10 01010         01 101 1    0  1
                                 10 01 101010            101
                              10        1 1 101        0  1
                                              010
```

<div align="center"><sub>
That's me — rendered in 1s and 0s by the same rules as the live WebGL particle portrait
(sky chroma-keyed out, brightness → digit density). Regenerate anytime:
<code>node scripts/ascii-portrait.mjs</code>
</sub></div>

---

## ✨ What's inside

- **GPU particle portrait hero** — my photo reconstructed live from up to **280,000 particles** with custom GLSL shaders: staged reveal (hair → eyes → beard → face), cold-blue rim lighting, silhouette dust emitters, velocity-aware hover physics (facial features hold, only edge particles fly), and a holographic ~2° depth tilt.
- **Quantum cursor** 🪐 — a tiny Saturn (ringed planet + twinkling orbit stars) with 10 particles that orbit at rest, stretch into a comet tail on fast moves, align toward hovered elements, and fire a shockwave on click.
- **Orbit scrollbar** 🌙 — the thumb is a lit planet with a moon in continuous tilted orbit (passing behind/in front), riding a 2px dark-glass track. Draggable, click-to-jump.
- **Interactive dot-grid background** — graph-paper dots that scatter from the cursor and spring back, layered over a flowing gradient.
- **Polish everywhere** — Name.gif glass loaders on every page open, floating pill navbar, black-glass cards with hover lift, official tech-stack logos, per-route code splitting.

## 🧠 Fun engine numbers

| Device tier | Portrait particles | Dust motes | DPR cap | Point size |
|---|---|---|---|---|
| Desktop | 280,000 | 2,500 + 325 bokeh | 2.0 | 5.4 px |
| Laptop | 180,000 | 1,250 + 250 | 1.75 | 5.8 px |
| Tablet | 90,000 | 625 + 150 | 1.5 | 6.4 px |
| Mobile | 45,000 | 325 + 100 | 1.5 | 6.8 px |

Other values worth knowing (all in `src/components/particles/config.ts`):
reveal speed `0.42/s` (plays once, staged by region) · hover radius `0.24` with edge-weighted push (`0.3 + 0.7·edge` — the face never blows out) · rim lights `#BFD4FF` / `#7AA8FF` cold-blue family · camera dolly `z = 0.80` · idle motion = curl noise + micro-jitter + per-particle oscillation + breathing, all layered in the vertex shader.

## 🛠 Tech stack

React 18 · TypeScript · Vite · Three.js + React Three Fiber (custom GLSL) · Tailwind CSS · Framer Motion · shadcn/ui

## 🚀 Development

```powershell
npm install       # once
npm run dev       # local dev server (hot reload)
npm run build     # production build → dist/
npm run lint      # eslint
```

## 📦 Deployment (two-way)

The same codebase deploys to both hosts — the base path switches automatically (`vite.config.ts`).

```powershell
npm run deploy:all      # 🚀 deploy to BOTH — the usual command
npm run deploy          # GitHub Pages only → tak-praveen.github.io/PraveenTak_Portfolio
npm run deploy:vercel   # Vercel only       → praveentak.vercel.app
```

Each command builds first automatically. Link previews (LinkedIn / WhatsApp / X) use the Open Graph card in `public/opengraph.png`.

---

<div align="center"><sub>© Praveen Tak · Built with an unreasonable number of particles</sub></div>
