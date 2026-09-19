# HyperFrames Composition Brief: SupplyChain Nexus

## Objective
Create a short narrated launch video for SupplyChain Nexus that demonstrates a real operator flow: critical supplier disruption, impact cascade, recovery simulation, and human approval.

## Output
- Composition directory: `brag-output-2026-09-19-205434/composition/`
- Rendered video: `brag-output-2026-09-19-205434/brag.mp4`
- Format: landscape — 1920x1080
- Duration: flex to generated voiceover, target 24 seconds

## Source Material
- Project root: `C:/Users/ACHTWZZ/OneDrive - 3M/Documents/AI-COE STUFF/AWS BUILDER/supplychain-nexus`
- Primary files read: `index.html`, `src/index.css`, `src/App.tsx`, `src/components/ControlTowerView.tsx`, `src/components/RecoveryCommandView.tsx`, `server/agentEngine.ts`, `submission.md`
- Product name: SupplyChain Nexus
- Strongest claim: `See the disruption. Simulate the future. Orchestrate the response.`
- Key UI moment: Control Tower critical disruption banner, topology map, KPI cards, Simulation Lab strategy comparison, and Recovery Command approval gate
- Copy that must appear verbatim:
  - `SUP-042 / CRITICAL`
  - `14 DAYS`
  - `3 PLANTS`
  - `127 ORDERS`
  - `$4.20M REVENUE EXPOSURE`
  - `$4.12M PROTECTED`
  - `HUMAN APPROVAL PENDING`
  - `SEE THE DISRUPTION. SIMULATE THE FUTURE. ORCHESTRATE THE RESPONSE.`

## Creative Direction
- Tone preset: cinematic
- Creative direction: premium command-center incident film with a confident male voice
- Interpretation: dramatic hook, readable data, restrained motion, and a controlled red-to-green emotional arc
- Angle: the product does not merely predict disruption; it turns the disruption into an evidence-backed, approval-ready operating decision
- Hook: `A 14-day supplier delay. Three plants. 127 orders.`
- Outro: `Every number is grounded. Every action is accountable.`
- Avoid: generic SaaS language, abstract filler, fake customer logos, and invented claims outside the source project

## Visual Identity
- Background: `#0f172a` / `#020617`
- Text: `#f8fafc` and slate neutrals
- Accent: `#2563eb`, alert `#e11d48`, recovery `#10b981`
- Display font: Plus Jakarta Sans fallback stack
- Body font: Plus Jakarta Sans; JetBrains Mono for IDs and metrics
- Visual references: dark sticky header, blue active navigation, rose disruption banner, dense white operational panels, topology grid, emerald approval state

## Storyboard
Use `brag-plan.md` as the creative contract.

1. Critical event — 3.2s — 14 DAYS / 3 PLANTS / 127 ORDERS
2. Cascade — 4.1s — network topology, $4.20M exposure, 5.2 days runway
3. Simulate — 4.2s — strategy rows and $4.12M protected
4. Human gate — 4.0s — $192K authorization, policy grounding, pending approval
5. Lockup — 4.0s — red-to-green resolution and source tagline

## Audio
- Audio role: cinematic support with sparse professional SFX
- Audio arc: low bed under narration, lift on recommendation, clean confirmation at brand lockup
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: 0.13-0.18 under voice, brief lift after the recommendation, fade under final lockup
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`; use nearest strong cue for strategy payoff, but preserve text readability
- Audio-reactive treatment: subtle background radial glow breathing with RMS; no waveform or equalizer
- Audio-coupled moments: hook number lock, topology completion, recommendation reveal, approval pending, final brand lockup
- SFX selection guidance: use low-risk interface clicks, a soft impact, and one clean bell/confirmation
- Exact SFX choice: `assets/sfx/interface/click_001.ogg`, `assets/sfx/impact/impactSoft_medium_001.ogg`, `assets/sfx/interface/bong_001.ogg`

## Hyperframes Instructions
- Use a single paused GSAP timeline registered as `window.__timelines["supplychain-nexus-brag"]`.
- Keep the composition deterministic and readable at 1920x1080.
- Show real product language and a recognizable recreation of the Control Tower and Recovery Command views.
- Use the generated Kokoro male voiceover on its own track; duck music below it.
- Use local audio assets only; no external product screenshots or network fetches.
- Run `npx hyperframes check` before render.
- After rendering, extract a settled hook or recommendation frame as `brag.jpg` and bake it into frame 0.
