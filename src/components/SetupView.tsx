import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Settings2, FileImage } from 'lucide-react';

export function SetupView({ onNext }: { onNext: () => void }) {
    const [profile, setProfile] = useState('office');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="h-full w-full flex space-x-8 bg-background p-6 border-4 border-stark font-sans text-textmain shadow-stark"
        >
            <div className="flex-1 flex flex-col border-2 border-stark bg-surface p-4 relative">
                {/* Crosshairs corner marks */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary translate-x-1 translate-y-1"></div>

                <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 flex items-center border-b-2 border-stark pb-2">
                    <Settings2 className="w-4 h-4 mr-2" /> Plan Extraction Preview
                </div>
                <div className="flex-1 relative border-2 border-textmain overflow-hidden bg-background">
                    <div className="absolute top-2 left-2 z-10 bg-textmain text-background px-2 py-1 text-[10px] font-mono flex items-center font-bold">
                        <FileImage size={12} className="mr-2" /> Base_Layer.pdf
                    </div>
                    <img src="/floorplan.png" alt="Parsed Plan" className="w-full h-full object-cover opacity-80 mix-blend-multiply grayscale contrast-125" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-50"></div>
                </div>
            </div>

            <div className="w-[400px] flex flex-col space-y-6">
                <div className="border-b-4 border-stark pb-4">
                    <h3 className="text-3xl font-serif font-bold text-textmain mb-2 leading-none">Simulation Context</h3>
                    <p className="text-sm font-serif italic text-textmain/80 pt-2 border-t border-stark/30">Define the demographic mix and behavioral parameters.</p>
                </div>

                <div className="space-y-6 flex-1 font-mono">
                    <div className="space-y-3">
                        <label className="text-xs uppercase font-bold tracking-widest flex items-center">
                            <span className="w-2 h-2 bg-primary mr-2"></span>
                            Population Model
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            <PresetCard
                                active={profile === 'office'}
                                title="Standard Tech Office"
                                desc="80% ambulatory, 10% reduced mobility, generic."
                                onClick={() => setProfile('office')}
                            />
                            <PresetCard
                                active={profile === 'inclusive'}
                                title="Extreme Accessibility"
                                desc="30% wheelchair/walker, 20% neurodivergent."
                                onClick={() => setProfile('inclusive')}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t-2 border-stark border-dashed">
                        <label className="text-xs uppercase font-bold tracking-widest flex items-center">
                            <span className="w-2 h-2 bg-secondary mr-2"></span>
                            Capacity Bounds
                        </label>
                        <div className="border-2 border-stark p-5 bg-surface relative">
                            {/* Tape accent */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#D32F2F] opacity-20 rotate-2"></div>

                            <div className="flex items-center justify-between mb-3 text-sm font-bold uppercase">
                                <span className="flex items-center"><Users size={16} className="mr-2 text-primary" /> Agents</span>
                                <span className="bg-background border border-stark px-2 py-1">250</span>
                            </div>
                            <input type="range" className="w-full accent-textmain h-2 border border-stark bg-background appearance-none cursor-pointer" min="50" max="1000" defaultValue="250" />

                            <div className="flex items-center justify-between mt-6 mb-3 text-sm font-bold uppercase">
                                <span className="flex items-center"><Clock size={16} className="mr-2 text-primary" /> Duration</span>
                                <span className="bg-background border border-stark px-2 py-1">8 HRS</span>
                            </div>
                            <input type="range" className="w-full accent-textmain h-2 border border-stark bg-background appearance-none cursor-pointer" min="1" max="24" defaultValue="8" />
                        </div>
                    </div>
                </div>

                <button onClick={onNext} className="w-full bg-textmain hover:bg-primary text-background font-mono font-bold uppercase tracking-widest py-4 border-2 border-stark transition-all shadow-stark hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--color-textmain)]">
                    Execute Analysis Mode
                </button>
            </div>
        </motion.div>
    );
}

function PresetCard({ active, title, desc, onClick }: { active: boolean, title: string, desc: string, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer border-2 p-4 transition-all relative ${active ? 'border-primary bg-textmain text-background shadow-stark' : 'border-stark bg-background text-textmain hover:bg-surface'}`}
        >
            <div className={`text-sm font-bold uppercase mb-2 ${active ? 'text-primary' : ''}`}>{title}</div>
            <div className="text-xs opacity-90 leading-relaxed max-w-[90%]">{desc}</div>
            {active && <div className="absolute top-4 right-4 w-3 h-3 bg-primary border-2 border-background"></div>}
        </div>
    )
}
