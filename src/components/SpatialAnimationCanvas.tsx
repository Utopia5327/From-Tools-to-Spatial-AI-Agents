import React, { useEffect, useRef } from 'react';

const PHASES = [
    { id: 'GRID', dur: 3200 },
    { id: 'GENERATIVE', dur: 7500 },
    { id: 'SEMANTIC', dur: 6000 },
    { id: 'AGENTIC', dur: 7000 },
    { id: 'PARTICIPATORY', dur: 6500 },
    { id: 'FADEOUT', dur: 2500 },
];

export default function SpatialAnimationCanvas({ isVisible }: { isVisible?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = 0, H = 0;
        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                W = canvas.width = parent.clientWidth;
                H = canvas.height = parent.clientHeight;
            } else {
                W = canvas.width = window.innerWidth;
                H = canvas.height = window.innerHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const px = (x: number) => x * W;
        const py = (y: number) => y * H;
        const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
        const eio = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const eout = (t: number) => 1 - Math.pow(1 - t, 3);

        // Floor plan layout
        const P = { L: 0.1, R: 0.9, T: 0.1, B: 0.9 };
        const VD = 0.60;
        const HD = 0.50;
        const CD = 0.35;

        const WALL_POLYS = [
            [[P.L, P.T], [P.R, P.T], [P.R, P.B], [P.L, P.B], [P.L, P.T]],
            [[VD, P.T], [VD, P.B]],
            [[P.L, HD], [VD, HD]],
            [[CD, HD], [CD, P.B]],
        ];

        const SEGS: any[] = [];
        for (const poly of WALL_POLYS) {
            for (let i = 0; i < poly.length - 1; i++) {
                SEGS.push({ x1: poly[i][0], y1: poly[i][1], x2: poly[i + 1][0], y2: poly[i + 1][1] });
            }
        }
        const TOTAL_LEN = SEGS.reduce((s, g) => s + Math.hypot(g.x2 - g.x1, g.y2 - g.y1), 0);

        // Adapted to Exhibition theme colors
        const ROOMS = [
            { label: 'Open Office', area: '248 m²', x1: P.L, y1: P.T, x2: VD, y2: HD, r: 216, g: 49, b: 33 }, // Red
            { label: 'Studio', area: '92 m²', x1: P.L, y1: HD, x2: CD, y2: P.B, r: 26, g: 26, b: 26 },      // Ink
            { label: 'Workshop', area: '156 m²', x1: CD, y1: HD, x2: VD, y2: P.B, r: 100, g: 100, b: 100 }, // Grey
            { label: 'Commons', area: '288 m²', x1: VD, y1: P.T, x2: P.R, y2: P.B, r: 232, g: 184, b: 75 }, // Gold/Yellow
        ];

        class Agent {
            wp: number[][]; r: number; g: number; b: number; idx: number; t: number; speed: number; trail: any[]; pos: { x: number, y: number };
            constructor(wps: number[][], r: number, g: number, b: number) {
                this.wp = wps; this.r = r; this.g = g; this.b = b;
                this.idx = 0; this.t = Math.random();
                this.speed = 0.0045 + Math.random() * 0.003;
                this.trail = [];
                this.pos = { x: wps[0][0], y: wps[0][1] };
            }
            step() {
                this.t += this.speed;
                if (this.t >= 1) { this.t -= 1; this.idx = (this.idx + 1) % this.wp.length; }
                const a = this.wp[this.idx], b = this.wp[(this.idx + 1) % this.wp.length];
                const et = eio(this.t);
                this.pos = { x: a[0] + (b[0] - a[0]) * et, y: a[1] + (b[1] - a[1]) * et };
                this.trail.unshift({ ...this.pos });
                if (this.trail.length > 45) this.trail.pop();
            }
            draw(alpha: number) {
                if (alpha <= 0) return;
                const { r, g, b, pos, trail } = this;
                for (let i = 0; i < trail.length; i++) {
                    const a = (1 - i / trail.length) * 0.5 * alpha;
                    ctx!.fillStyle = `rgba(${r},${g},${b},${a})`;
                    ctx!.beginPath(); ctx!.arc(px(trail[i].x), py(trail[i].y), 2.2, 0, 6.28); ctx!.fill();
                }
                const grd = ctx!.createRadialGradient(px(pos.x), py(pos.y), 0, px(pos.x), py(pos.y), 28);
                grd.addColorStop(0, `rgba(${r},${g},${b},${0.4 * alpha})`); // Increased glow
                grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx!.fillStyle = grd;
                ctx!.beginPath(); ctx!.arc(px(pos.x), py(pos.y), 28, 0, 6.28); ctx!.fill();
                ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx!.beginPath(); ctx!.arc(px(pos.x), py(pos.y), 5, 0, 6.28); ctx!.fill();
            }
        }

        const AGENTS = [
            new Agent([[0.22, 0.28], [0.52, 0.28], [0.52, 0.32], [0.22, 0.32], [0.22, 0.28]], 216, 49, 33),
            new Agent([[0.72, 0.22], [0.82, 0.50], [0.72, 0.78], [0.67, 0.50], [0.72, 0.22]], 26, 26, 26),
            new Agent([[0.38, 0.62], [0.55, 0.62], [0.45, 0.32], [0.14, 0.32], [0.14, 0.62], [0.38, 0.62]], 216, 49, 33),
        ];

        const CNODES = [
            { x: 0.05, y: 0.28, r: 216, g: 49, b: 33, tx: 0.14, ty: 0.32 },
            { x: 0.05, y: 0.70, r: 26, g: 26, b: 26, tx: 0.14, ty: 0.68 },
            { x: 0.44, y: 0.05, r: 216, g: 49, b: 33, tx: 0.44, ty: 0.2 },
            { x: 0.80, y: 0.05, r: 26, g: 26, b: 26, tx: 0.80, ty: 0.22 },
            { x: 0.95, y: 0.50, r: 216, g: 49, b: 33, tx: 0.87, ty: 0.50 },
        ];

        let phaseIdx = 0;
        let phaseStart: number | null = null;
        function curPhase() { return PHASES[phaseIdx]; }
        function phaseT(now: number) { return clamp((now - (phaseStart || now)) / curPhase().dur, 0, 1); }

        function fillBG(alpha = 1) {
            ctx!.fillStyle = `rgba(244,244,240,${alpha})`; // Background
            ctx!.fillRect(0, 0, W, H);
        }
        function drawDotGrid(alpha: number) {
            if (alpha <= 0) return;
            const cw = W / 26, ch = H / 16;
            ctx!.fillStyle = `rgba(26,26,26,${0.1 * alpha})`; // Ink dots
            for (let r = 0; r < 16; r++) for (let c = 0; c < 26; c++) {
                ctx!.beginPath(); ctx!.arc((c + 0.5) * cw, (r + 0.5) * ch, 1.1, 0, 6.28); ctx!.fill();
            }
        }
        function drawWalls(wallProgress: number, cdShift = 0, wallAlpha = 0.85) {
            if (wallProgress <= 0) return;
            ctx!.save();
            ctx!.strokeStyle = `rgba(26,26,26,${wallAlpha})`; // Dark walls
            ctx!.lineWidth = 3;
            ctx!.lineCap = 'square';

            let drawn = 0;
            const target = wallProgress * TOTAL_LEN;

            for (const seg of SEGS) {
                if (drawn >= target) break;
                const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
                const frac = clamp((target - drawn) / len, 0, 1);

                let x1 = seg.x1, x2 = seg.x2;
                if (Math.abs(seg.x1 - CD) < 0.001 && Math.abs(seg.x2 - CD) < 0.001) {
                    x1 = CD + cdShift; x2 = CD + cdShift;
                }

                const ex = x1 + (x2 - x1) * frac;
                const ey = seg.y1 + (seg.y2 - seg.y1) * frac;

                ctx!.beginPath();
                ctx!.moveTo(px(x1), py(seg.y1));
                ctx!.lineTo(px(ex), py(ey));
                ctx!.stroke();
                drawn += len;
            }

            if (wallProgress > 0.01 && wallProgress < 0.99) {
                let acc = 0; let cx2 = P.L, cy2 = P.T;
                for (const seg of SEGS) {
                    const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
                    if (acc + len >= target) { const f = (target - acc) / len; cx2 = seg.x1 + (seg.x2 - seg.x1) * f; cy2 = seg.y1 + (seg.y2 - seg.y1) * f; break; }
                    acc += len;
                }
                const grd = ctx!.createRadialGradient(px(cx2), py(cy2), 0, px(cx2), py(cy2), 20);
                grd.addColorStop(0, 'rgba(216,49,33,0.9)'); // Red glowing tip
                grd.addColorStop(1, 'rgba(216,49,33,0)');
                ctx!.fillStyle = grd;
                ctx!.beginPath(); ctx!.arc(px(cx2), py(cy2), 20, 0, 6.28); ctx!.fill();
            }
            ctx!.restore();
        }
        function drawRoomFills(roomAlpha: number, scanY = -1) {
            if (roomAlpha <= 0) return;
            ctx!.save();
            for (const rm of ROOMS) {
                let a = roomAlpha;
                if (scanY >= 0) {
                    a = roomAlpha * clamp((scanY - rm.y1) / (rm.y2 - rm.y1), 0, 1);
                }
                if (a <= 0) continue;
                ctx!.fillStyle = `rgba(${rm.r},${rm.g},${rm.b},${0.3 * a})`;
                ctx!.fillRect(px(rm.x1), py(rm.y1), px(rm.x2 - rm.x1), py(rm.y2 - rm.y1));
            }
            ctx!.restore();
        }
        function drawRoomLabels(alpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            for (const rm of ROOMS) {
                const cx = px((rm.x1 + rm.x2) / 2), cy = py((rm.y1 + rm.y2) / 2);
                ctx!.fillStyle = `rgba(26,26,26,${0.9 * alpha})`;
                ctx!.font = `700 ${Math.max(9, W * 0.012)}px 'Helvetica Neue', sans-serif`;
                ctx!.letterSpacing = '0.15em';
                ctx!.textAlign = 'center';
                ctx!.fillText(rm.label.toUpperCase(), cx, cy);
            }
            ctx!.restore();
        }
        function drawScanLine(scanY: number, alpha: number) {
            if (alpha <= 0) return;
            const y = py(scanY);
            const grd = ctx!.createLinearGradient(0, y - 15, 0, y + 15);
            grd.addColorStop(0, 'rgba(216,49,33,0)');
            grd.addColorStop(0.5, `rgba(216,49,33,${0.6 * alpha})`);
            grd.addColorStop(1, 'rgba(216,49,33,0)');
            ctx!.fillStyle = grd;
            ctx!.fillRect(0, y - 15, W, 30);
            ctx!.strokeStyle = `rgba(216,49,33,${0.9 * alpha})`;
            ctx!.lineWidth = 2;
            ctx!.setLineDash([6, 4]);
            ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke();
            ctx!.setLineDash([]);
        }
        function drawCommunityNodes(alpha: number, lineAlpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            for (const n of CNODES) {
                const { r, g, b, x, y, tx, ty } = n;
                if (lineAlpha > 0) {
                    ctx!.strokeStyle = `rgba(${r},${g},${b},${0.6 * lineAlpha})`;
                    ctx!.lineWidth = 2;
                    ctx!.setLineDash([3, 4]);
                    ctx!.beginPath(); ctx!.moveTo(px(x), py(y)); ctx!.lineTo(px(tx), py(ty)); ctx!.stroke();
                    ctx!.setLineDash([]);
                }
                ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx!.beginPath(); ctx!.arc(px(x), py(y), 8, 0, 6.28); ctx!.fill();
                ctx!.strokeStyle = `rgba(26,26,26,${0.8 * alpha})`;
                ctx!.lineWidth = 2;
                ctx!.beginPath(); ctx!.arc(px(x), py(y), 8, 0, 6.28); ctx!.stroke();
            }
            ctx!.restore();
        }
        function drawDimLines(alpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            ctx!.strokeStyle = `rgba(26,26,26,${0.4 * alpha})`;
            ctx!.lineWidth = 1;
            ctx!.setLineDash([4, 4]);
            const mid = py((P.T + HD) / 2);
            ctx!.beginPath(); ctx!.moveTo(px(P.L) - 20, mid); ctx!.lineTo(px(VD) + 20, mid); ctx!.stroke();
            const mid2 = px((P.L + CD) / 2);
            ctx!.beginPath(); ctx!.moveTo(mid2, py(HD) - 15); ctx!.lineTo(mid2, py(P.B) + 15); ctx!.stroke();
            ctx!.setLineDash([]);
            ctx!.restore();
        }

        const currentPhaseDiv = document.getElementById('spatial-anim-phase');
        let animId: number;
        let nowOffset = 0;

        function frame(now: number) {
            now = now + nowOffset;
            if (!phaseStart) phaseStart = now;
            const t = phaseT(now);

            if (t >= 1) {
                phaseIdx = (phaseIdx + 1) % PHASES.length;
                phaseStart = now;
                if (currentPhaseDiv) {
                    const p = curPhase();
                    currentPhaseDiv.innerHTML = `<span class="uppercase font-bold tracking-widest text-xs">${String(phaseIdx + 1).padStart(2, '0')} / PHASE // </span> <span class="uppercase tracking-widest text-xs ml-2">${p.id}</span>`;
                }
            }

            const p = curPhase();
            fillBG();

            if (p.id === 'GRID') {
                drawDotGrid(eout(clamp(t * 3, 0, 1)));
            }
            else if (p.id === 'GENERATIVE') {
                const wallP = clamp(t * 1.1, 0, 1);
                drawDotGrid(clamp(1 - t * 4, 0, 1) * 0.4);
                drawWalls(eout(wallP), 0, 0.85);
            }
            else if (p.id === 'SEMANTIC') {
                drawWalls(1, 0, 0.7);
                const scanY = P.T + (P.B - P.T) * clamp(t * 1.3, 0, 1);
                drawRoomFills(clamp(t * 2, 0, 1), scanY);
                drawScanLine(scanY, clamp(t * 6 * (1 - t * 0.9), 0, 1));
                drawDimLines(clamp((t - 0.4) * 3, 0, 1));
                drawRoomLabels(clamp((t - 0.5) * 4, 0, 1));
                drawWalls(1, 0, 0.85);
            }
            else if (p.id === 'AGENTIC') {
                drawRoomFills(0.7, -1);
                drawWalls(1, 0, 0.7);
                const agentA = clamp(t * 3, 0, 1) * clamp((1 - t) * 6, 0, 1);
                for (const a of AGENTS) { a.step(); a.draw(agentA); }
            }
            else if (p.id === 'PARTICIPATORY') {
                const cdShift = 0.07 * eout(clamp((t - 0.4) * 2.5, 0, 1));
                drawRoomFills(0.6, -1);
                drawWalls(1, cdShift, 0.7);
                const nA = clamp(t * 3, 0, 1);
                const lA = clamp((t - 0.15) * 3, 0, 1);
                drawCommunityNodes(nA, lA);
                if (cdShift > 0.005) {
                    const pulse = (Math.sin(now * 0.004) * 0.5 + 0.5);
                    const wx = px(CD + cdShift), wy = py((HD + P.B) / 2);
                    const grd = ctx!.createRadialGradient(wx, wy, 0, wx, wy, 40 * pulse + 10);
                    grd.addColorStop(0, `rgba(216,49,33,${0.3 * lA})`);
                    grd.addColorStop(1, 'rgba(216,49,33,0)');
                    ctx!.fillStyle = grd;
                    ctx!.beginPath(); ctx!.arc(wx, wy, 40 * pulse + 10, 0, 6.28); ctx!.fill();
                }
            }
            else if (p.id === 'FADEOUT') {
                const fadeA = 1 - eout(t);
                ctx!.save(); ctx!.globalAlpha = fadeA;
                drawRoomFills(0.6, -1);
                drawWalls(1, 0, 0.7);
                ctx!.restore();
                fillBG(1 - fadeA);
            }

            animId = window.requestAnimationFrame(frame);
        }

        if (isVisible !== false) {
            animId = window.requestAnimationFrame(frame);
        }

        return () => {
            window.removeEventListener('resize', resize);
            window.cancelAnimationFrame(animId);
        };
    }, [isVisible]);

    return (
        <div className="relative w-full h-full pb-8">
            <canvas ref={canvasRef} className="w-full h-full border-4 border-stark shadow-[8px_8px_0_var(--color-primary)] bg-surface block" />
            <div id="spatial-anim-phase" className="absolute top-4 right-4 font-mono font-bold text-stark bg-background border-2 border-stark px-3 py-1 z-10 shadow-stark">
                Initializing...
            </div>
        </div>
    );
}
