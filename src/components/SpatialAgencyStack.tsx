import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const layers = [
    {
        id: 1,
        title: "Layer 1 · Generative Substrate",
        name: "Generative Substrate",
        subtitle: "(Passive, Retrospective)",
        desc: "AI systems trained on historical spatial data to generate new spatial configurations statistically consistent with learned patterns. Lacks spatial understanding; possesses spatial memory encoded as statistical distributions.",
        color: "bg-[#2A2460]",
        width: "w-[60%]"
    },
    {
        id: 2,
        title: "Layer 2 · Semantic Interpreter",
        name: "Semantic Spatial Interpreter",
        subtitle: "(Active Perception, Present-Oriented)",
        desc: "Perceives existing spatial configurations and builds semantic representations that support inference and reasoning. Links spatial observations to linguistic and conceptual knowledge, but remains extrinsic.",
        color: "bg-[#1B4D8E]",
        width: "w-[72%]"
    },
    {
        id: 3,
        title: "Layer 3 · Planning Agent",
        name: "Spatial Planning Agent",
        subtitle: "(Proactive, Future-Oriented)",
        desc: "Actively plans within space: setting goals, selecting strategies, anticipating consequences, and coordinating with other agents. Represents a transfer of design agency from humans to AI systems.",
        color: "bg-[#0F7D6B]",
        width: "w-[82%]"
    },
    {
        id: 4,
        title: "Layer 4 · Governance Agent",
        name: "Environmental Governance Agent",
        subtitle: "(Continuous, Adaptive)",
        desc: "Operates continuously within physical environments, dynamically reconfiguring spatial conditions in response to real-time occupancy data and evolving user needs.",
        color: "bg-[#C47C28]",
        width: "w-[92%]"
    },
    {
        id: 5,
        title: "Layer 5 · Spatial Intelligence",
        name: "Spatial Intelligence System",
        subtitle: "AI UNDERSTANDS SPACE",
        desc: "The aspirational frontier. AI systems capable of normative spatial judgment — understanding not just the geometry of space but its social, cultural, and phenomenological dimensions. No current system operates at this level. It requires genuinely embodied AI.",
        color: "bg-primary",
        width: "w-full"
    }
];

export default function SpatialAgencyStack() {
    const [activeLayer, setActiveLayer] = useState(5);
    const layer = layers.find(l => l.id === activeLayer)!;

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-16 md:gap-24 relative font-sans items-start px-4">
            {/* Left visual stack */}
            <div className="flex-1 flex flex-col gap-[3px] w-full">
                {layers.map(l => (
                    <div
                        key={l.id}
                        onClick={() => setActiveLayer(l.id)}
                        className={`cursor-pointer h-16 flex items-center px-6 transition-all relative overflow-hidden group ${l.color} ${l.width}`}
                    >
                        <div className={`absolute inset-0 transition-colors group-hover:bg-white/10 ${activeLayer === l.id ? 'bg-white/10' : 'bg-transparent'}`} />
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/90 relative z-10 font-mono pointer-events-none">
                            {l.title}
                        </span>
                        <span className="ml-auto text-4xl font-black text-white/15 leading-none relative z-10 pointer-events-none">
                            {l.id}
                        </span>
                    </div>
                ))}
                <div className="flex justify-between w-full mt-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 font-mono">
                    <span>&larr; Passive</span>
                    <span>Active &rarr;</span>
                </div>
            </div>

            {/* Right details */}
            <div className="flex-[1.6]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={layer.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-8xl font-black text-white/10 leading-none mb-4 -ml-2">{`0${layer.id}`}</div>
                        <h3 className="text-3xl md:text-5xl font-black mb-6 leading-[1.1] text-white font-sans tracking-tight">
                            {layer.name}
                        </h3>
                        <div className="inline-block bg-primary text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1 mb-8 font-mono">
                            {layer.subtitle}
                        </div>
                        <p className="text-base md:text-lg leading-[1.8] text-white/70 font-serif">
                            {layer.desc}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
