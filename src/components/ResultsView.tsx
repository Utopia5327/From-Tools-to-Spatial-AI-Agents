import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, XCircle, Navigation, Users, Zap } from 'lucide-react';

export function ResultsView() {
    const [activeLayer, setActiveLayer] = useState<'circulation' | 'bottlenecks' | 'accessibility'>('circulation');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="h-full w-full flex space-x-8 bg-background text-textmain font-sans p-6 border-4 border-stark shadow-stark"
        >
            {/* Canvas / Image Area */}
            <div className="flex-1 relative overflow-hidden border-2 border-stark bg-surface group flex flex-col">
                <div className="absolute top-4 left-4 z-20 flex space-x-2 bg-background p-1 border-2 border-stark shadow-stark font-mono uppercase font-bold">
                    <LayerBtn icon={<Users size={14} />} label="Flow" active={activeLayer === 'circulation'} onClick={() => setActiveLayer('circulation')} />
                    <LayerBtn icon={<Zap size={14} />} label="Stress" active={activeLayer === 'bottlenecks'} onClick={() => setActiveLayer('bottlenecks')} />
                    <LayerBtn icon={<Navigation size={14} />} label="Access" active={activeLayer === 'accessibility'} onClick={() => setActiveLayer('accessibility')} />
                </div>

                <div className="flex-1 relative w-full h-full mix-blend-multiply">
                    <img src="/floorplan.png" alt="Floorplan Base" className="w-full h-full object-cover opacity-60 grayscale contrast-125" />

                    {/* Layer Overlays */}
                    {activeLayer === 'circulation' && (
                        <div className="absolute inset-0 z-10 mix-blend-multiply opacity-80">
                            {/* Archival ink styling for heatmaps */}
                            <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-secondary rounded-full blur-[60px]"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-primary rounded-full blur-[60px]"></div>
                        </div>
                    )}

                    {activeLayer === 'bottlenecks' && (
                        <div className="absolute inset-0 z-10">
                            {/* Graphic markers instead of glowing dots */}
                            <div className="absolute top-[34%] left-[51%]">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-dashed animate-spin-slow absolute -top-4 -left-4"></div>
                                <div className="w-4 h-4 bg-primary border-2 border-textmain absolute -top-2 -left-2 flex items-center justify-center">
                                    <span className="text-[8px] font-mono text-background font-bold">!</span>
                                </div>
                            </div>
                            <div className="absolute bottom-[26%] right-[34%]">
                                <div className="w-12 h-12 rounded-full border-2 border-[#FF5722] border-dashed animate-[spin_4s_linear_infinite_reverse] absolute -top-6 -left-6"></div>
                                <div className="w-4 h-4 bg-[#FF5722] border-2 border-textmain absolute -top-2 -left-2 flex items-center justify-center">
                                    <span className="text-[8px] font-mono text-background font-bold">X</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Analytics Sidebar */}
            <div className="w-[450px] flex flex-col flex-shrink-0 bg-surface border-2 border-stark p-6 relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-stark bg-background flex flex-col items-center justify-center font-mono opacity-80 pointer-events-none text-textmain">
                    <span className="text-[10px] uppercase font-bold border-b border-textmain pb-1 mb-1">Vol</span>
                    <span className="font-bold text-lg">04</span>
                </div>

                <div className="mb-8 pt-4">
                    <h3 className="text-4xl font-serif font-bold text-textmain mb-2 tracking-tight">Post-Occupancy <br /> Audit Report</h3>
                    <p className="text-textmain/80 font-mono text-sm border-t-2 border-stark pt-3 mt-4 flex justify-between">
                        <span>Agents: <span className="font-bold">250</span></span>
                        <span>Sim.Time: <span className="font-bold">8 HRS</span></span>
                    </p>
                </div>

                <div className="space-y-6">
                    <h4 className="text-xs uppercase font-bold tracking-widest text-textmain font-mono bg-textmain text-background px-3 py-1 inline-block">Critical Findings</h4>

                    <div className="space-y-4">
                        <RecommendationCard
                            type="high"
                            title="Severe Corridor Bottleneck"
                            desc="The 1,200mm corridor between Zone B and the main exit restricts peak departure flow by 40%. Requires plan revision."
                            icon={<AlertTriangle className="text-background" size={16} />}
                        />

                        <RecommendationCard
                            type="medium"
                            title="Underutilized Node"
                            desc="The north-west breakout area experienced <5% occupancy. Weak social anchor properties detected."
                            icon={<Zap className="text-background" size={16} />}
                        />

                        <RecommendationCard
                            type="low"
                            title="Accessibility Friction"
                            desc="Turning radius in the southern block is marginal for motorized wheelchairs. Suggest adjusting wall line."
                            icon={<XCircle className="text-background" size={16} />}
                        />
                    </div>
                </div>

                <button className="w-full mt-10 bg-textmain hover:bg-background text-background hover:text-textmain border-2 border-textmain py-4 font-mono font-bold uppercase tracking-widest transition-colors shadow-stark flex justify-center items-center group">
                    <FileText className="mr-2 group-hover:scale-110 transition-transform" size={18} /> Append to Master File
                </button>
            </div>
        </motion.div>
    );
}

function LayerBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-[10px] tracking-widest transition-all border-2 flex items-center ${active ? 'bg-textmain border-textmain text-background outline outline-1 outline-offset-2 outline-textmain' : 'bg-surface border-stark text-textmain hover:bg-background'}`}
        >
            <span className="mr-2 opacity-80">{icon}</span> {label}
        </button>
    )
}

function RecommendationCard({ title, desc, icon, type }: { title: string, desc: string, icon: React.ReactNode, type: 'high' | 'medium' | 'low' }) {
    const themeCol = type === 'high' ? 'bg-primary' : type === 'medium' ? 'bg-[#FF5722]' : 'bg-secondary';

    return (
        <div className="border-2 border-stark bg-background relative flex items-stretch">
            <div className={`w-10 flex-shrink-0 flex items-center justify-center border-r-2 border-stark ${themeCol}`}>
                {icon}
            </div>
            <div className="p-4 flex-1">
                <h5 className="text-sm font-bold font-mono uppercase mb-2 border-b-2 border-surface pb-1">{title}</h5>
                <p className="text-sm font-serif leading-relaxed italic opacity-90">{desc}</p>
            </div>
        </div>
    )
}
