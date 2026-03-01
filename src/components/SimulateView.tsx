import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export function SimulateView({ onNext }: { onNext: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = canvas.offsetWidth;
        let h = canvas.height = canvas.offsetHeight;

        // Boids matching scrapbook style (red and charcoal)
        const agents = Array.from({ length: 300 }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            goalX: Math.random() * w,
            goalY: Math.random() * h,
            color: Math.random() > 0.8 ? '#D32F2F' : '#1A1A1A' // Primary Red & Charcoal Main
        }));

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, w, h);

            agents.forEach(agent => {
                // move towards goal gently
                const dx = agent.goalX - agent.x;
                const dy = agent.goalY - agent.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 10) {
                    agent.goalX = Math.random() * w;
                    agent.goalY = Math.random() * h;
                } else {
                    agent.vx += (dx / dist) * 0.05;
                    agent.vy += (dy / dist) * 0.05;
                }

                agent.vx *= 0.95;
                agent.vy *= 0.95;
                agent.x += agent.vx;
                agent.y += agent.vy;

                if (agent.x < 0 || agent.x > w) agent.vx *= -1;
                if (agent.y < 0 || agent.y > h) agent.vy *= -1;

                ctx.beginPath();
                ctx.arc(agent.x, agent.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = agent.color;
                ctx.fill();

                // trails - sharp, architectural connecting lines
                ctx.beginPath();
                ctx.moveTo(agent.x, agent.y);
                ctx.lineTo(agent.x - agent.vx * 4, agent.y - agent.vy * 4);
                ctx.strokeStyle = agent.color + '60';
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setTimeout(onNext, 1000);
                    return 100;
                }
                return p + 0.3;
            });
        }, 50);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(interval);
        };
    }, [onNext]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
            className="h-full w-full flex flex-col relative overflow-hidden bg-background border-4 border-stark shadow-stark"
        >
            <div className="absolute inset-0 z-0 bg-surface">
                <img src="/floorplan.png" alt="Floorplan" className="w-full h-full object-cover opacity-50 grayscale contrast-125 mix-blend-multiply" />
            </div>

            <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-10 mix-blend-multiply" />

            {/* Brutalist Progress Indicator */}
            <div className="absolute bottom-10 left-10 right-10 z-20 bg-background border-4 border-stark shadow-stark p-6 flex flex-col overflow-hidden group">
                {/* Diagonal stripes background just for style */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1A1A1A 0, #1A1A1A 2px, transparent 2px, transparent 12px)' }}></div>

                <div className="flex justify-between text-sm mb-4 relative z-10">
                    <span className="text-textmain font-mono font-bold uppercase tracking-widest flex items-center">
                        <Terminal className="w-5 h-5 mr-3 text-primary" /> Processing spatial behaviors...
                    </span>
                    <span className="font-mono text-primary font-bold text-xl">{Math.floor(progress)}%</span>
                </div>

                <div className="h-4 w-full bg-surface border-2 border-stark relative z-10">
                    <div className="h-full bg-textmain transition-all duration-75 relative" style={{ width: `${progress}%` }}>
                        <div className="absolute top-0 right-0 w-2 h-full bg-primary animate-pulse" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
