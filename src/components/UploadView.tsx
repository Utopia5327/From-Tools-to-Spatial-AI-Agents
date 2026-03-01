import { motion } from 'framer-motion';
import { Upload, FileArchive } from 'lucide-react';

export function UploadView({ onNext }: { onNext: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="h-full w-full flex flex-col items-center justify-center p-6 bg-background border-4 border-stark shadow-stark"
        >
            <div className="max-w-xl w-full text-center relative mt-10">
                {/* Decorative staple/tape marks */}
                <div className="absolute top-0 left-10 w-12 h-4 bg-textmain opacity-10 rotate-3 z-10 skew-x-12"></div>
                <div className="absolute -top-4 right-10 w-16 h-4 bg-[#0033A0] opacity-20 -rotate-2 z-10 skew-x-3"></div>

                <div className="w-16 h-16 bg-textmain text-background flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_var(--color-primary)]">
                    <FileArchive size={32} />
                </div>

                <h3 className="text-4xl font-serif font-bold text-textmain mb-4 leading-tight">Initialize Workspace</h3>
                <p className="text-textmain/80 mb-10 text-sm font-sans mx-auto max-w-md">Upload a PDF or PNG base layer to begin spatial evaluation. The engine automatically parses structural boundaries.</p>

                <div className="border-4 border-dashed border-stark bg-surface hover:bg-background transition-colors duration-300 h-64 flex flex-col items-center justify-center cursor-pointer group mb-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:16px_16px] opacity-10 mix-blend-multiply transition-opacity group-hover:opacity-20" />

                    <div className="w-16 h-16 border-2 border-stark bg-background group-hover:bg-primary group-hover:text-background flex items-center justify-center transition-all mb-4 z-10 shadow-stark">
                        <Upload size={28} strokeWidth={1.5} />
                    </div>
                    <span className="text-textmain font-bold font-mono uppercase tracking-widest z-10 mt-2">Append Floor Plan</span>
                    <span className="text-xs text-textmain/60 mt-2 font-mono z-10">Supports PDF, PNG, DWG (Max 50MB)</span>
                </div>

                <button onClick={onNext} className="bg-primary hover:bg-textmain text-background font-mono font-bold uppercase tracking-widest py-4 px-10 border-2 border-stark transition-all duration-300 shadow-[4px_4px_0_var(--color-textmain)] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--color-textmain)]">
                    Load Demo Artifact
                </button>
            </div>
        </motion.div>
    );
}
