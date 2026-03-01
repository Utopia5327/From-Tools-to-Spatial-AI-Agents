import React, { useState, useEffect, useRef } from 'react';
import { Layers, Activity, Pause, Play, RefreshCw, Zap, FileText, Eye, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import NYCSimulationCanvas from './components/NYCSimulationCanvas';
import UrbanAnimationCanvas from './components/UrbanAnimationCanvas';
import SpatialAnimationCanvas from './components/SpatialAnimationCanvas';
import SpatialAgencyStack from './components/SpatialAgencyStack';
import { useInView } from 'react-intersection-observer';

function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 hidden md:flex justify-between items-center px-8 lg:px-12 h-[80px] transition-all duration-300 font-mono ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-stark/10' : 'bg-transparent'}`}>
      <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-textmain cursor-pointer">
        <a href="#home">FROM TOOLS TO AGENTS</a>
      </div>
      <ul className="flex gap-4 lg:gap-8 list-none m-0 p-0 text-[10px] uppercase">
        <li><a href="#domains" className="font-bold tracking-[0.15em] text-stark/60 hover:text-textmain transition-colors text-decoration-none">Domains</a></li>
        <li><a href="#stack" className="font-bold tracking-[0.15em] text-stark/60 hover:text-textmain transition-colors text-decoration-none">Agency Stack</a></li>
        <li><a href="#simulator" className="font-bold tracking-[0.15em] text-stark/60 hover:text-textmain transition-colors text-decoration-none">Simulator</a></li>
        <li><a href="#synthesis" className="font-bold tracking-[0.15em] text-stark/60 hover:text-textmain transition-colors text-decoration-none">Critical Gaps</a></li>
        <li><a href="#future" className="font-bold tracking-[0.15em] text-stark/60 hover:text-textmain transition-colors text-decoration-none">Future</a></li>
      </ul>
    </nav>
  );
}

function InteractiveDashboard() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [runSeconds, setRunSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [agentCounts, setAgentCounts] = useState({
    gemini: 150,
    claude: 50,
    codex: 20,
    baseline: 80
  });

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => setRunSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const [systemPrompts, setSystemPrompts] = useState({
    gemini: "System Initialized: Optimize geometry based on visual sightlines, camera paths, and aesthetic context.",
    claude: "System Initialized: Avoid central corridors to maximize acoustic quiet zones and contemplative 'reading' spaces.",
    codex: "System Initialized: Evaluate strict routing constraints, shortest paths, and infrastructure syntax.",
    baseline: ""
  });

  // Dynamic Agent Log Simulation
  useEffect(() => {
    if (!isPlaying) return;

    const logs = {
      gemini: [
        "Analyzing crowd visual density...",
        "Geometry optimized based on camera sightlines.",
        "Re-meshing aesthetic context near coordinate x41.",
        "Adjusting facade transparency for optimal daylight.",
      ],
      claude: [
        "Acoustic friction detected. Rerouting agents.",
        "Maximizing quiet zones along the perimeter.",
        "Contemplative space rating increased by 14%.",
        "Evaluating conversational density in central node.",
      ],
      codex: [
        "Recalculating shortest path trajectory.",
        "Infrastructure syntax validation complete.",
        "Strict routing constraints applied to bottleneck.",
        "Optimizing flow tensor across 12 intersecting nodes.",
      ]
    };

    const interval = setInterval(() => {
      setSystemPrompts(prev => ({
        ...prev,
        gemini: Math.random() > 0.6 ? logs.gemini[Math.floor(Math.random() * logs.gemini.length)] : prev.gemini,
        claude: Math.random() > 0.6 ? logs.claude[Math.floor(Math.random() * logs.claude.length)] : prev.claude,
        codex: Math.random() > 0.6 ? logs.codex[Math.floor(Math.random() * logs.codex.length)] : prev.codex,
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const [activeLayers, setActiveLayers] = useState({
    heatmaps: true,
    paths: false,
    bottlenecks: false
  });

  return (
    <div className="flex flex-col md:flex-row w-full bg-background text-textmain font-sans border-t-2 border-stark box-border relative z-0">

      {/* Main Simulation Viewport (Canvas) */}
      <main className="h-[60vh] md:h-auto md:flex-1 relative flex flex-col bg-surface border-b-2 md:border-b-0 md:border-r-2 border-stark">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #1A1A1A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Top Floating Header */}
        <header className="absolute top-6 left-6 right-6 h-16 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center bg-background px-4 py-2 border-2 border-stark shadow-stark pointer-events-auto">
            <div className="w-8 h-8 bg-textmain text-background flex items-center justify-center mr-4">
              <Layers size={16} />
            </div>
            <div>
              <h1 className="font-mono text-sm tracking-widest font-bold leading-tight uppercase">Spatial Simulator</h1>
              <p className="text-[10px] text-primary uppercase font-mono tracking-widest">Exhibition Mode v0.9 (Draft) • Created by Manas Bhatia</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pointer-events-auto bg-background px-4 py-2 border-2 border-stark shadow-stark">
            <div className="flex items-center mr-4 pr-4 border-r-2 border-stark shadow-[0px]">
              <Activity className="text-primary mr-2" size={16} />
              <span className="text-xs font-mono uppercase">
                Active: <span className="font-bold">{Object.values(agentCounts).reduce((a: number, b: number) => a + b, 0)}</span> Agents
              </span>
            </div>

            <button onClick={() => setIsPlaying(!isPlaying)} className={`w-10 h-10 border-2 border-stark flex items-center justify-center transition-all ${isPlaying ? 'bg-textmain text-background' : 'bg-primary text-background shadow-stark hover:translate-y-0.5 hover:shadow-none'}`}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
            </button>
            <button className="w-10 h-10 border-2 border-stark bg-surface hover:bg-textmain hover:text-background flex items-center justify-center transition-all">
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* The Simulation Canvas Component */}
        <div className="absolute inset-0 z-0 mix-blend-multiply">
          <React.Suspense fallback={
            <div className="w-full h-full flex items-center justify-center font-mono text-sm uppercase tracking-widest text-primary animate-pulse">
              Compiling Spatial Data...
            </div>
          }>
            <NYCSimulationCanvas
              isPlaying={isPlaying}
              counts={agentCounts}
              layers={activeLayers}
            />
          </React.Suspense>
        </div>

        {/* Floating Live Analysis (Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-20 bg-background p-4 border-2 border-stark shadow-stark pointer-events-auto min-w-[240px]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-textmain mb-3 flex items-center border-b-2 border-stark pb-2">
            <Zap size={14} className="mr-2 text-primary" /> Live Telemetry
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="opacity-70">Duration</span>
              <span className="font-bold">
                {`${String(Math.floor(runSeconds / 60)).padStart(2, '0')}:${String(runSeconds % 60).padStart(2, '0')}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">AI Agents</span>
              <span className="text-secondary font-bold">{agentCounts.gemini + agentCounts.claude + agentCounts.codex}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">Human Baselines</span>
              <span className="font-bold">{agentCounts.baseline}</span>
            </div>
            <div className="border-t-2 border-stark pt-2 mt-2" />
            <p className="text-[10px] uppercase opacity-70 mb-1.5 flex items-center"><FileText size={12} className="mr-1" /> Sentiment Key</p>
            <div className="flex flex-col gap-1 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 border border-stark bg-secondary" />
                <span>High-rated zones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 border border-stark bg-primary" />
                <span>Low-rated / Friction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 border border-stark bg-[#EAEAE4]" />
                <span>Neutral / unscored</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Control Panel Sidebar */}
      <aside className="w-full md:w-80 lg:w-[28rem] bg-background flex flex-col z-20 relative shadow-none md:shadow-[-4px_0px_0px_rgba(17,17,17,1)] h-auto overflow-visible">
        <div className="inline-block border-stark border-2 bg-surface p-3 mb-2 mt-4 mx-4 shadow-stark shrink-0">
          <h2 className="text-3xl lg:text-4xl font-serif font-bold uppercase tracking-widest leading-none">
            Ready to <span className="text-primary italic">Simulate?</span>
          </h2>
        </div>

        <div className="flex-1 p-6 space-y-8 font-mono">
          {/* Agent Personas Control */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest border-b-2 border-stark pb-2 font-bold mb-4">Future Spatial Agents</h3>

            <AgentControl
              title="Gemini (Multimodal)"
              desc="Evaluates visual sightlines and aesthetic context."
              color="bg-secondary"
              value={agentCounts.gemini}
              onChange={(v) => setAgentCounts((p: any) => ({ ...p, gemini: v }))}
              prompt={systemPrompts.gemini}
              onPromptChange={(p) => setSystemPrompts((s: any) => ({ ...s, gemini: p }))}
              showPrompt={false}
              icon="/gemini-color.svg"
            />

            <AgentControl
              title="Claude (Analytical)"
              desc="Evaluates acoustic footprint and quiet zones."
              color="bg-[#1A1A1A]"
              value={agentCounts.claude}
              onChange={(v) => setAgentCounts((p: any) => ({ ...p, claude: v }))}
              prompt={systemPrompts.claude}
              onPromptChange={(p) => setSystemPrompts((s: any) => ({ ...s, claude: p }))}
              showPrompt={false}
              icon="/Claude_AI_symbol.svg.png"
            />

            <AgentControl
              title="Codex (Structural)"
              desc="Evaluates tight constraints and pathing syntax."
              color="bg-primary"
              value={agentCounts.codex}
              onChange={(v) => setAgentCounts((p: any) => ({ ...p, codex: v }))}
              prompt={systemPrompts.codex}
              onPromptChange={(p) => setSystemPrompts((s: any) => ({ ...s, codex: p }))}
              showPrompt={false}
              icon="/Openai-Logo-1--Streamline-Ultimate.png"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest border-b-2 border-stark pb-2 font-bold mb-4">Baseline Entities</h3>

            <AgentControl
              title="Human Baselines"
              desc="Wander independently. Raw spatial feedback."
              color="bg-surface"
              value={agentCounts.baseline}
              onChange={(v) => setAgentCounts((p: any) => ({ ...p, baseline: v }))}
              prompt=""
              onPromptChange={() => { }}
              showPrompt={false}
              icon="/human-icon.svg"
            />
          </div>

          {/* Visual Layers Control */}
          <div className="space-y-4 pt-4 border-t-2 border-stark">
            <h3 className="text-xs uppercase tracking-widest pb-2 font-bold">Visualization Layers</h3>

            <ToggleControl title="Layer 4: Memory Heatmap" active={activeLayers.heatmaps} onClick={() => setActiveLayers((p: { heatmaps: boolean; paths: boolean; bottlenecks: boolean; }) => ({ ...p, heatmaps: !p.heatmaps }))} />
            <ToggleControl title="Layer 2: Active Path Traces" active={activeLayers.paths} onClick={() => setActiveLayers((p: { heatmaps: boolean; paths: boolean; bottlenecks: boolean; }) => ({ ...p, paths: !p.paths }))} />
            <ToggleControl title="Layer 3: Bottleneck Frictions" active={activeLayers.bottlenecks} onClick={() => setActiveLayers((p: { heatmaps: boolean; paths: boolean; bottlenecks: boolean; }) => ({ ...p, bottlenecks: !p.bottlenecks }))} />
          </div>
        </div>
      </aside>

    </div>
  );
}



function SectionDomains() {
  const domains = [
    {
      num: "I", title: "Generative Spatial Synthesis", role: "AI as Spatial Creator",
      desc: "Deep generative models capable of instantiating spatial configurations from normative constraints — moving beyond deterministic CAD into probabilistic topological exploration.",
      color: "border-[#1B4D8E]"
    },
    {
      num: "II", title: "Semantic Spatial Understanding", role: "AI as Spatial Reader",
      desc: "Multimodal systems that perceive, interpret, and explicitly reason about the affordances of physical space, moving from geometric recognition to phenomenological inference.",
      color: "border-[#0F7D6B]"
    },
    {
      num: "III", title: "Agentic Spatial Orchestration", role: "AI as Spatial Actor",
      desc: "Autonomous, goal-directed AI entities capable of making consequential operational decisions, actively modulating environmental states, and managing infrastructural flows.",
      color: "border-[#B89A5A]"
    },
    {
      num: "IV", title: "Participatory Co-Creation", role: "AI as Civic Mediator",
      desc: "Democratized spatial interfaces where AI acts as a communicative bridge between diverse civic stakeholders, expert planners, and complex urban constraints.",
      color: "border-[#C92D2D]"
    }
  ];

  return (
    <section id="domains" className="scroll-mt-[80px] w-full flex flex-col items-center bg-surface border-b-2 border-stark py-24 md:py-32">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-8 md:mb-12">
          <div className="inline-flex border-4 border-stark px-4 py-1.5 md:px-6 md:py-2 mb-4 md:mb-6 bg-background shadow-stark self-start">
            <h2 className="text-textmain font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase font-black">Literature Review</h2>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-serif font-bold text-textmain leading-[1.1] tracking-tight mb-4">The Evolution of AI Spatial Intelligence</h2>
          <p className="font-serif text-lg text-stark/80 max-w-3xl border-l-4 border-stark pl-6">
            An analysis of recent computational design literature reveals four distinct paradigms, culminating in the realization of AI as an active spatial agent.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 hover:!opacity-100 group-hover:opacity-50">
          {domains.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative bg-background p-6 md:p-8 lg:p-8 border-stark shadow-stark ${d.color} border-l-[8px] md:border-l-[12px] group/card hover:-translate-y-1 transition-transform`}
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-black text-stark/10 leading-none mb-4 absolute right-6 top-6 md:right-8 md:top-8 group-hover/card:text-primary/20 transition-colors pointer-events-none">{d.num}</div>
              <div className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] font-bold text-secondary mb-2 pr-12">{d.role}</div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-textmain mb-2 md:mb-4 pr-12">{d.title}</h3>
              <p className="text-sm md:text-base text-stark/80 font-serif leading-relaxed pr-8">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionUrbanPrototype() {
  return (
    <section id="urban-scale" className="w-full flex flex-col items-center relative bg-background py-24 md:py-32 border-b-2 border-stark">
      <div className="max-w-[90rem] w-full px-8 mx-auto space-y-8 relative">
        <div className="inline-flex items-center gap-4 bg-surface px-6 py-3 border-stark shadow-stark self-start relative z-20 mb-4">
          <div className="w-4 h-4 rounded-none border-stark border-2 bg-primary animate-pulse" />
          <h2 className="text-textmain font-mono text-sm tracking-[0.2em] uppercase font-black">Prototype I / The Urban Scale</h2>
        </div>

        <div className="w-full aspect-video md:aspect-[21/9] border-stark border-[4px] bg-background relative overflow-hidden shadow-stark">
          <UrbanAnimationCanvas />
        </div>

        <div className="max-w-2xl font-serif text-xl border-l-8 border-secondary pl-6 text-stark/80 italic">
          "Simulating friction points, accessibility failures, and pedestrian congestion in advance by deploying autonomous, embodied personas into the New York City fabric."
        </div>
      </div>
    </section>
  )
}

function SectionHumanPrototype() {
  return (
    <section id="human-scale" className="w-full flex flex-col items-center relative bg-surface py-24 md:py-32 border-b-2 border-stark">
      <div className="max-w-[85rem] w-full px-8 mx-auto space-y-8 relative">
        <div className="inline-flex items-center gap-4 bg-background px-6 py-3 border-stark shadow-stark self-start relative z-20 mb-4">
          <div className="w-4 h-4 rounded-none border-stark bg-textmain animate-pulse" />
          <h2 className="text-textmain font-mono text-sm tracking-[0.2em] uppercase font-black">Prototype II / The Human Scale</h2>
        </div>

        <div className="w-full aspect-square md:aspect-video border-stark border-[4px] bg-background relative overflow-hidden shadow-stark">
          <SpatialAnimationCanvas />
        </div>

        <div className="max-w-2xl font-serif text-xl border-l-8 border-primary pl-6 text-stark/80 italic">
          "A physical-digital simulation platform deploying specialized Spatial Agents into geographic contexts, resolving the geometry-experience gap through embodied AI evaluation."
        </div>
      </div>
    </section>
  )
}

function SectionNarrativeWrapup() {
  return (
    <section id="synthesis" className="py-24 md:py-32 w-full flex flex-col items-center relative bg-background border-b-2 border-stark scroll-mt-[80px]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1A1A1A 0, #1A1A1A 2px, transparent 2px, transparent 16px)' }} />
      <motion.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20%" }} transition={{ duration: 0.8 }}
        className="max-w-5xl px-8 relative z-10 bg-background p-16 md:p-24 border-stark border-[4px] shadow-stark mx-6 w-full"
      >
        <div className="w-32 h-32 border-stark rounded-full flex items-center justify-center mb-16 mx-auto shadow-stark bg-surface relative">
          <div className="absolute inset-0 animate-ping opacity-20 border-stark rounded-full"></div>
          <Zap className="text-primary" size={56} />
        </div>

        <div className="relative z-10 space-y-8 max-w-4xl mx-auto px-6 mb-16 border-b-2 border-stark pb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-textmain leading-[1.2] tracking-tight text-center">
            "To bridge the Geometry-Experience gap, we must transition from <span className="text-primary italic">passive generation</span> to <span className="bg-textmain text-background px-2 mx-1 not-italic">active spatial orchestration.</span>"
          </h2>
          <p className="font-mono text-[10px] md:text-xs tracking-widest uppercase opacity-60 text-center pt-8">
            Synthesis & System Prompt
          </p>
        </div>

        <div className="font-serif text-lg md:text-xl leading-relaxed space-y-8 opacity-90 pb-16 pt-8 max-w-3xl mx-auto flex flex-col items-center">
          <p className="pl-6 border-l-4 border-stark">
            Rather than asking AI to draw a building, we ask it to inhabit one. By deploying embodied, persona-driven AI agents into simulated urban contexts, we can mathematically evaluate the friction points, accessibility failures, and spatial phenomenology of a design <em>before</em> it is constructed.
          </p>
          <div className="w-24 h-px bg-stark/30 my-8"></div>
          <p className="pl-6 border-l-4 border-primary">
            No generative model has a physical body; they cannot perceive spatial affordances, only represent them symbolically. The subsequent simulation introduces an agent-based methodology to translate geometric coordinates back into experiential data.
          </p>
        </div>

        <a href="#simulator" className="inline-flex flex-col items-center group cursor-pointer relative mt-8 text-decoration-none absolute left-1/2 -translate-x-1/2">
          <span className="text-sm font-mono uppercase font-black tracking-[0.3em] text-background bg-primary px-8 py-3 border-stark shadow-stark group-hover:translate-y-1 transition-transform">Initialize Simulator</span>
        </a>
      </motion.div>
    </section>
  )
}

function HeroSection() {
  return (
    <section id="home" className="min-h-screen w-full flex items-center justify-center relative bg-background border-b-2 border-stark scroll-mt-[80px]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjAsIDIwLCAyMCwgMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>

      <div className="max-w-[70rem] z-10 px-6 mx-auto flex flex-col items-center pt-20 pb-32">
        <div className="inline-block border-2 border-primary bg-primary/10 px-4 py-1 mb-10 shadow-stark">
          <span className="font-mono text-[10px] md:text-xs font-bold tracking-widest text-primary uppercase">M.S. Computational Design Practices, Columbia GSAPP</span>
        </div>

        <h1 className="text-5xl md:text-8xl lg:text-[7rem] font-sans font-black tracking-tighter leading-[0.85] text-center text-textmain mb-12 border-b-4 border-stark pb-10 w-full">
          FROM TOOLS<br />
          <span className="text-primary italic font-serif">TO AGENTS</span>
        </h1>

        <p className="text-lg md:text-2xl font-serif leading-relaxed text-center text-stark/80 max-w-4xl bg-surface p-8 md:p-12 border-l-4 border-stark shadow-stark relative">
          <span className="absolute -top-4 -left-3 text-6xl text-stark/20 font-serif leading-none">"</span>
          The integration of artificial intelligence into the design, planning, and occupation of physical space represents one of the most consequential technological transitions in the history of the built environment.
          <span className="absolute -bottom-8 -right-3 text-6xl text-stark/20 font-serif leading-none rotate-180">"</span>
        </p>

        <a href="#context" className="mt-20 inline-flex flex-col items-center group cursor-pointer text-decoration-none">
          <span className="text-xs font-mono uppercase font-black tracking-[0.3em] text-textmain mb-4 group-hover:-translate-y-1 transition-transform">Begin Abstract</span>
          <ArrowDown size={24} className="text-primary animate-bounce" />
        </a>
      </div>
    </section>
  );
}

function SectionPaperTransition() {
  return (
    <section id="context" className="flex flex-col bg-background border-b-2 border-stark scroll-mt-[80px] py-24 md:py-32 relative">
      {/* Decorative architectural grid background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 relative z-10 w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">

          {/* Left Column: The Problem */}
          <div className="flex-1 space-y-8">
            <h2 className="text-xs font-mono font-bold tracking-[0.3em] text-primary uppercase flex items-center">
              <span className="w-8 h-[2px] bg-primary mr-3 inline-block"></span>
              The Problem Context
            </h2>
            <h3 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-textmain leading-[1.1]">
              The Geometry<br />Experience Gap
            </h3>
            <div className="w-full h-[1px] bg-stark/20"></div>
            <p className="font-serif text-lg leading-relaxed text-stark/80">
              AI systems learn spatial patterns from data representing space through objective, measurable properties. But human spatial experience is not exhausted by objective coordinates.
            </p>
            <p className="font-sans text-sm leading-relaxed text-stark/60 pl-4 border-l-2 border-stark">
              The fenestration that floods a room with afternoon light; the acoustic softness of a high-ceilinged hall; the compression and release of a narrow entrance opening onto a generous garden — these qualities are relational, temporal, and embodied. Current AI architectures can generate geometrically plausible configurations, but they remain profoundly disconnected from the phenomenological reality of inhabited space.
            </p>
          </div>

          {/* Right Column: The Framework */}
          <div className="flex-1 bg-surface border-2 border-stark p-8 shadow-stark mt-8 md:mt-24">
            <h2 className="text-xs font-mono font-bold tracking-[0.3em] text-textmain uppercase mb-6 flex items-center">
              <span className="w-2 h-2 bg-textmain mr-3 inline-block"></span>
              Theoretical Framework
            </h2>
            <p className="font-serif text-xl leading-relaxed text-textmain mb-8 font-medium">
              AI is evolving from a passive computational tool into an <span className="text-primary italic">active spatial agent</span> — one that perceives, interprets, and dynamically reshapes physical space.
            </p>
            <div className="space-y-4">
              <p className="font-sans text-sm text-stark/70 leading-relaxed">
                Drawing on a systematic review of over 40 peer-reviewed works spanning generative design models, embodied AI navigation systems, multi-agent urban simulations, and agentic urban planning frameworks, we identify four converging waves of AI spatial intelligence:
              </p>
              <ul className="font-mono text-xs space-y-2 text-textmain">
                <li className="flex items-start"><span className="text-primary mr-2">01/</span> Generative Spatial Synthesis</li>
                <li className="flex items-start"><span className="text-primary mr-2">02/</span> Semantic Spatial Understanding</li>
                <li className="flex items-start"><span className="text-primary mr-2">03/</span> Agentic Spatial Orchestration</li>
                <li className="flex items-start"><span className="text-primary mr-2">04/</span> Participatory Spatial Co-creation</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function App() {
  const { ref: simulatorRef, inView: isSimulatorInView } = useInView({
    triggerOnce: false,
    threshold: 0.1, // Trigger when 10% of the simulator section is visible
  });

  return (
    <div className="bg-background text-textmain font-sans min-h-screen relative max-w-[100vw] overflow-x-hidden pt-[80px]">
      <Navigation />

      <main className="w-full">
        <HeroSection />

        <SectionPaperTransition />

        <div id="domains" className="scroll-mt-[80px] border-b-2 border-stark relative z-20 bg-background">
          <SectionDomains />
        </div>

        <div id="stack" className="scroll-mt-[80px] border-b-2 border-t-2 border-dashed border-stark relative z-20 bg-background">
          <section className="w-full flex flex-col items-center relative bg-textmain py-24 md:py-32 text-background">
            <div className="w-full max-w-[85rem] mx-auto mb-16 px-12">
              <div className="inline-flex border-2 border-background/20 px-6 py-2 mb-8 bg-black/50 self-start">
                <h2 className="text-background font-mono text-xs tracking-[0.3em] uppercase font-black">Theoretical Architecture</h2>
              </div>
              <h2 className="text-5xl md:text-7xl font-sans font-black text-background leading-[0.9] tracking-tight mb-6">The Spatial<br /> <span className="italic font-serif text-primary">Agency Stack</span></h2>
              <p className="font-serif text-lg md:text-xl text-background/50 max-w-xl border-l-4 border-primary pl-6">
                A unified taxonomy describing how AI progresses from pixel-level spatial generation to full autonomous environmental governance.
              </p>
            </div>
            <div className="w-full max-w-[85rem] mx-auto z-10">
              <SpatialAgencyStack />
            </div>
          </section>
        </div>

        <div id="urban-scale" className="scroll-mt-[80px] border-b-2 border-stark relative z-20 bg-background">
          <SectionUrbanPrototype />
        </div>

        <div id="human-scale" className="scroll-mt-[80px] border-b-2 border-stark relative z-20 bg-background">
          <SectionHumanPrototype />
        </div>

        <div id="synthesis" className="scroll-mt-[80px] border-b-2 border-stark relative z-20 bg-background">
          <SectionNarrativeWrapup />
        </div>

        <div id="simulator" className="scroll-mt-[80px] relative z-10 border-b-2 border-stark bg-background" ref={simulatorRef}>
          <section className="w-full relative min-h-[calc(100vh-80px)] xl:min-h-0 flex flex-col">
            {isSimulatorInView ? (
              <InteractiveDashboard />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-surface border-t-2 border-stark">
                <div className="inline-block border-stark bg-primary/10 px-4 py-2 mb-8 shadow-stark">
                  <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase animate-pulse">Initializing Spatial Intelligence System</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-textmain mb-6 uppercase text-center max-w-lg">Entering Simulation<br />Environment</h2>
                <div className="w-24 h-1.5 bg-stark/20 mx-auto relative overflow-hidden border border-stark">
                  <div className="absolute top-0 left-0 h-full bg-primary animate-[slide_1.5s_ease-in-out_infinite]"></div>
                </div>
              </div>
            )}
          </section>
        </div>

        <SectionFuture />
      </main>
    </div>
  );
}

function SectionFuture() {
  return (
    <section id="future" className="w-full flex flex-col bg-primary scroll-mt-[80px]">
      <div className="w-full flex flex-col md:flex-row max-w-[100vw] justify-center py-24 md:py-32 px-12 md:px-24 gap-12 md:gap-24">
        {/* Left huge quote */}
        <div className="flex-1 max-w-3xl">
          <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-sans font-black text-background leading-[1.1] tracking-tight">
            "The question is not whether AI will shape our physical environments — it is whether it will do so in ways that serve human flourishing or merely optimize for efficiency."
          </h2>
        </div>

        {/* Right text blocks */}
        <div className="flex-1 max-w-2xl text-background space-y-8 font-sans text-lg md:text-xl leading-relaxed">
          <p>
            The transformation of AI from spatial tool to spatial agent is not a future possibility but a present reality. Buildings are already being designed with AI assistance; urban systems are already being managed by autonomous AI agents; community consultations are already being mediated by generative AI platforms.
          </p>
          <p>
            This paper has argued that the built environment — the material substrate of human life — demands more than technically sophisticated AI. It demands AI that is embodied, culturally sensitive, temporally aware, and democratically accountable.
          </p>

          <div className="pt-8 border-t border-background/30 text-xs md:text-sm tracking-widest opacity-90 font-mono uppercase">
            Manas Bhatia · M.S. Computational Design Practices · Columbia GSAPP<br />
            Design Technology Specialist, HLW, New York, NY · Submitted Feb. 2026
          </div>
        </div>
      </div>

      {/* Black footer */}
      <footer className="w-full bg-textmain text-background py-8 px-8 md:px-12 flex flex-col md:flex-row justify-between items-center font-mono text-[10px] uppercase tracking-widest gap-4 border-t-2 border-stark relative z-20">
        <div>FROM TOOLS TO AGENTS — MANAS BHATIA, 2026</div>
        <div>VISUALIZATION · MOMA EXHIBITION</div>
      </footer>
    </section>
  )
}

// --- Control Components ---

function AgentControl({ title, desc, color, value, onChange, prompt, onPromptChange, showPrompt, icon }: { title: string, desc: string, color: string, value: number, onChange: (v: number) => void, prompt: string, onPromptChange: (p: string) => void, showPrompt?: boolean, icon?: string }) {
  return (
    <div className="border-2 border-stark p-4 bg-background shadow-[2px_2px_0px_0px_var(--color-textmain)] flex flex-col space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-wrap items-center">
            {icon ? (
              <img src={icon} alt={title} className="w-5 h-5 mr-3 object-contain" />
            ) : (
              <div className={`w-3 h-3 ${color} border border-stark mr-3`} />
            )}
            <span className="text-sm font-bold uppercase">{title}</span>
          </div>
          <span className="text-sm font-mono border border-stark bg-surface px-2 py-0.5">{value}</span>
        </div>
        <p className="text-[10px] opacity-80 leading-relaxed font-sans">{desc}</p>
      </div>

      <input
        type="range"
        className="w-full accent-textmain h-2 bg-surface border border-stark rounded-none appearance-none cursor-pointer"
        min="0" max="300"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />

      {showPrompt && (
        <div className="pt-3 border-t-2 border-stark border-dashed">
          <label className="text-[10px] font-bold uppercase tracking-widest bg-primary text-background px-1 inline-block mb-2">System.Prompt</label>
          <textarea
            className="w-full bg-surface border-2 border-stark p-3 text-[10px] text-textmain resize-none font-mono focus:outline-none focus:bg-background transition-colors leading-relaxed shadow-inner"
            rows={3}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

function ToggleControl({ title, active, onClick }: { title: string, active: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 border-2 border-stark cursor-pointer transition-all font-mono text-xs uppercase font-bold
        ${active
          ? 'bg-textmain text-background shadow-stark'
          : 'bg-surface text-textmain hover:bg-background'
        }`}
    >
      <span className="flex items-center">
        <Eye size={16} className={`mr-3 ${active ? 'text-primary' : 'opacity-70'}`} /> {title}
      </span>
      <div className={`w-8 h-4 border-2 p-0.5 transition-colors ${active ? 'bg-primary border-primary' : 'bg-surface border-stark'}`}>
        <div className={`w-2 h-2 bg-background transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </div>
  )
}

export default App;
