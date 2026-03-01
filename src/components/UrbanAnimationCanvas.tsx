import React, { useEffect, useRef } from 'react';

// Using the same phase system logic from the HTML prototype
const PHASES = [
    { id: 'GRID', dur: 2800 },
    { id: 'GENERATIVE', dur: 8000 },
    { id: 'SEMANTIC', dur: 7000 },
    { id: 'AGENTIC', dur: 8000 },
    { id: 'PARTICIPATORY', dur: 7000 },
    { id: 'FADEOUT', dur: 2800 }
];

export default function UrbanAnimationCanvas({ isVisible }: { isVisible?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = 0; let H = 0;
        const resize = () => {
            // Find parent container dimensions to make it responsive instead of full window
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

        // City Grid config
        const VX = [0.05, 0.21, 0.37, 0.53, 0.69, 0.85, 0.93];
        const HY = [0.07, 0.23, 0.39, 0.55, 0.71, 0.89];
        const CITY_CX = 0.49; const CITY_CY = 0.45;
        const SMARG = 0.005;

        // Theme Overrides for Exhibition 
        // F4F4F0 base, 1A1A1A Stark Ink, D83121 Red
        const Z: any = {
            com: { r: 26, g: 26, b: 26, den: 0.88, wr: 255, wg: 255, wb: 255, label: 'Commercial' },
            res: { r: 60, g: 60, b: 60, den: 0.48, wr: 200, wg: 200, wb: 200, label: 'Residential' },
            mix: { r: 100, g: 100, b: 100, den: 0.60, wr: 220, wg: 220, wb: 220, label: 'Mixed Use' },
            ind: { r: 150, g: 150, b: 150, den: 0.70, wr: 255, wg: 255, wb: 255, label: 'Industrial' },
            park: { r: 216, g: 49, b: 33, den: 0.10, wr: 255, wg: 255, wb: 255, label: 'Green Space' }, // Red for park in this aesthetic
            wat: { r: 230, g: 230, b: 230, den: 0.0, wr: 255, wg: 255, wb: 255, label: 'Waterfront' }
        };

        const ZONE_MAP = [
            ['park', 'com', 'com', 'com', 'res', 'res'],
            ['park', 'com', 'com', 'mix', 'res', 'res'],
            ['ind', 'com', 'com', 'mix', 'mix', 'res'],
            ['ind', 'res', 'res', 'res', 'res', 'res'],
            ['wat', 'wat', 'wat', 'wat', 'wat', 'wat']
        ];

        const BLOCKS: any[] = [];
        let maxDist = 0;

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                const zId = ZONE_MAP[row][col];
                const z = Z[zId];
                const x1 = VX[col] + SMARG, y1 = HY[row] + SMARG;
                const x2 = VX[col + 1] - SMARG, y2 = HY[row + 1] - SMARG;
                const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
                const dist = Math.hypot(cx - CITY_CX, cy - CITY_CY);
                maxDist = Math.max(maxDist, dist);

                const lights = [];
                const area = (x2 - x1) * (y2 - y1);
                const count = Math.floor(z.den * area * 1100);
                for (let i = 0; i < count; i++) {
                    lights.push({
                        x: x1 + Math.random() * (x2 - x1),
                        y: y1 + Math.random() * (y2 - y1),
                        ph: Math.random() * 6.28,
                        br: 0.5 + Math.random() * 0.5
                    });
                }
                BLOCKS.push({ col, row, zId, ...z, x1, y1, x2, y2, cx, cy, dist, lights });
            }
        }
        for (const b of BLOCKS) b.dn = b.dist / maxDist;

        // Vehicles
        class Vehicle {
            horiz: boolean; fixed: number; s0: number; s1: number; dir: number; t: number; spd: number; r: number; g: number; b: number; trail: any[];
            constructor(horiz: boolean, fixedN: number, s0: number, s1: number, dir: number) {
                this.horiz = horiz; this.fixed = fixedN; this.s0 = s0; this.s1 = s1; this.dir = dir;
                this.t = Math.random();
                this.spd = 0.002 + Math.random() * 0.003;
                // Theme: Red forward, stark backward
                this.r = dir > 0 ? 216 : 26; this.g = dir > 0 ? 49 : 26; this.b = dir > 0 ? 33 : 26;
                this.trail = [];
            }
            pos() {
                const a = this.s0 + (this.s1 - this.s0) * this.t;
                return this.horiz ? { x: a, y: this.fixed } : { x: this.fixed, y: a };
            }
            step() {
                this.t = (this.t + this.spd * this.dir + 1) % 1;
                this.trail.unshift({ ...this.pos() });
                if (this.trail.length > 9) this.trail.pop();
            }
            draw(alpha: number) {
                if (alpha <= 0) return;
                const { r, g, b, trail } = this;
                for (let i = 0; i < trail.length; i++) {
                    const a = (1 - i / trail.length) * 0.5 * alpha;
                    ctx!.fillStyle = `rgba(${r},${g},${b},${a})`;
                    ctx!.beginPath(); ctx!.arc(px(trail[i].x), py(trail[i].y), 1.3, 0, 6.28); ctx!.fill();
                }
                const p = this.pos();
                const grd = ctx!.createRadialGradient(px(p.x), py(p.y), 0, px(p.x), py(p.y), 9);
                grd.addColorStop(0, `rgba(${r},${g},${b},${0.3 * alpha})`);
                grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx!.fillStyle = grd; ctx!.beginPath(); ctx!.arc(px(p.x), py(p.y), 9, 0, 6.28); ctx!.fill();
                ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx!.beginPath(); ctx!.arc(px(p.x), py(p.y), 1.8, 0, 6.28); ctx!.fill();
            }
        }

        const VEHICLES: Vehicle[] = [];
        for (const hy of HY) {
            for (let i = 0; i < 3; i++) {
                VEHICLES.push(new Vehicle(true, hy, VX[0], VX[VX.length - 1], 1));
                VEHICLES.push(new Vehicle(true, hy, VX[0], VX[VX.length - 1], -1));
            }
        }
        for (const vx of VX.slice(1, -1)) {
            for (let i = 0; i < 2; i++) {
                VEHICLES.push(new Vehicle(false, vx, HY[0], HY[HY.length - 1], 1));
                VEHICLES.push(new Vehicle(false, vx, HY[0], HY[HY.length - 1], -1));
            }
        }

        const CNODES = [
            { x: 0.01, y: 0.20, r: 216, g: 49, b: 33, tx: VX[0] + 0.04, ty: (HY[2] + HY[3]) / 2, label: 'Residents' },
            { x: 0.01, y: 0.63, r: 26, g: 26, b: 26, tx: VX[0] + 0.04, ty: (HY[3] + HY[4]) / 2, label: 'Community' },
            { x: 0.49, y: 0.01, r: 216, g: 49, b: 33, tx: (VX[2] + VX[3]) / 2, ty: HY[1] + 0.05, label: 'Planners' },
            { x: 0.81, y: 0.01, r: 26, g: 26, b: 26, tx: (VX[4] + VX[5]) / 2, ty: HY[0] + 0.05, label: 'Investors' },
            { x: 0.97, y: 0.45, r: 216, g: 49, b: 33, tx: VX[5] - 0.03, ty: (HY[2] + HY[3]) / 2, label: 'Policy' }
        ];

        let phaseIdx = 0;
        let phaseStart: number | null = null;
        function curP() { return PHASES[phaseIdx]; }
        function phaseT(now: number) { return clamp((now - (phaseStart || now)) / curP().dur, 0, 1); }

        function fillBG(a = 1) {
            ctx!.fillStyle = `rgba(244,244,240,${a})`; // #F4F4F0 Theme Background
            ctx!.fillRect(0, 0, W, H);
        }
        function drawDotGrid(alpha: number) {
            if (alpha <= 0) return;
            const cw = W / 24, ch = H / 14;
            ctx!.fillStyle = `rgba(26,26,26,${0.1 * alpha})`; // #1A1A1A Stark Ink
            for (let r = 0; r < 14; r++) for (let c = 0; c < 24; c++) {
                ctx!.beginPath(); ctx!.arc((c + 0.5) * cw, (r + 0.5) * ch, 1, 0, 6.28); ctx!.fill();
            }
        }
        function drawStreets(genP: number, alpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            for (let i = 0; i < HY.length; i++) {
                const hy = HY[i];
                const d = Math.abs(hy - CITY_CY) / 0.44;
                const sa = clamp((genP - d * 0.35) * 4, 0, 1) * alpha;
                if (sa <= 0) continue;
                ctx!.strokeStyle = `rgba(26,26,26,${sa * 0.8})`;
                ctx!.lineWidth = 1.5;
                ctx!.beginPath(); ctx!.moveTo(px(VX[0]), py(hy)); ctx!.lineTo(px(VX[VX.length - 1]), py(hy)); ctx!.stroke();
            }
            for (let i = 0; i < VX.length; i++) {
                const vx = VX[i];
                const d = Math.abs(vx - CITY_CX) / 0.46;
                const sa = clamp((genP - d * 0.35) * 4, 0, 1) * alpha * 0.75;
                if (sa <= 0) continue;
                ctx!.strokeStyle = `rgba(26,26,26,${sa * 0.8})`;
                ctx!.lineWidth = 1.5;
                ctx!.beginPath(); ctx!.moveTo(px(vx), py(HY[0])); ctx!.lineTo(px(vx), py(HY[HY.length - 1])); ctx!.stroke();
            }
            ctx!.restore();
        }
        function drawWindowLights(genP: number, now: number, masterAlpha = 1) {
            if (masterAlpha <= 0) return;
            for (const blk of BLOCKS) {
                const bA = clamp((genP - blk.dn * 0.45 - 0.12) * 5, 0, 1) * masterAlpha;
                if (bA <= 0) continue;
                for (const l of blk.lights) {
                    const flicker = l.br + 0.1 * Math.sin(now * 0.0025 + l.ph);
                    ctx!.fillStyle = `rgba(${blk.wr},${blk.wg},${blk.wb},${flicker * bA})`;
                    ctx!.beginPath(); ctx!.arc(px(l.x), py(l.y), 1.1, 0, 6.28); ctx!.fill();
                }
            }
        }
        function drawZoneFills(alpha: number, scanRadiusPx = -1) {
            if (alpha <= 0) return;
            ctx!.save();
            for (const blk of BLOCKS) {
                let fa = alpha;
                if (scanRadiusPx >= 0) {
                    const blockR = Math.hypot(px(blk.cx) - px(CITY_CX), py(blk.cy) - py(CITY_CY));
                    fa = alpha * clamp((scanRadiusPx - blockR) / 70, 0, 1);
                }
                if (fa <= 0) continue;
                ctx!.fillStyle = `rgba(${blk.r},${blk.g},${blk.b},${fa * 0.5})`;
                ctx!.fillRect(px(blk.x1), py(blk.y1), px(blk.x2 - blk.x1), py(blk.y2 - blk.y1));

                // Add wireframe border
                ctx!.strokeStyle = `rgba(26,26,26,${fa * 0.8})`;
                ctx!.lineWidth = 1;
                ctx!.strokeRect(px(blk.x1), py(blk.y1), px(blk.x2 - blk.x1), py(blk.y2 - blk.y1));
            }
            ctx!.restore();
        }
        function drawScanRing(radiusPx: number, alpha: number) {
            if (alpha <= 0 || radiusPx <= 0) return;
            ctx!.save();
            const grd = ctx!.createRadialGradient(px(CITY_CX), py(CITY_CY), Math.max(0, radiusPx - 18), px(CITY_CX), py(CITY_CY), Math.max(1, radiusPx + 6));
            grd.addColorStop(0, 'rgba(216,49,33,0)');
            grd.addColorStop(0.45, `rgba(216,49,33,${0.55 * alpha})`);
            grd.addColorStop(1, 'rgba(216,49,33,0)');
            ctx!.fillStyle = grd;
            ctx!.beginPath(); ctx!.arc(px(CITY_CX), py(CITY_CY), radiusPx + 6, 0, 6.28); ctx!.fill();
            ctx!.restore();
        }
        function drawZoneLabels(alpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
            for (const blk of BLOCKS) {
                if (blk.zId === 'wat') continue;
                const bwPx = px(blk.x2 - blk.x1);
                const fs = Math.min(bwPx / blk.label.length * 1.3, 13);
                if (fs < 7) continue;
                ctx!.font = `700 ${fs}px 'Helvetica Neue',sans-serif`;
                // Contrasting label text
                ctx!.fillStyle = `rgba(26,26,26,${0.8 * alpha})`;
                ctx!.fillText(blk.label.toUpperCase(), px(blk.cx), py(blk.cy));
            }
            ctx!.restore();
        }
        function drawVehicles(alpha: number) {
            if (alpha <= 0) return;
            for (const v of VEHICLES) { v.step(); v.draw(alpha); }
        }
        function drawDensityHeat(alpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            for (const blk of BLOCKS) {
                let nearby = 0;
                for (const v of VEHICLES) {
                    const vp = v.pos();
                    if (Math.abs(vp.x - blk.cx) < 0.18 && Math.abs(vp.y - blk.cy) < 0.18) nearby++;
                }
                if (nearby < 1) continue;
                const da = Math.min(nearby / 8, 1) * 0.2 * alpha;
                ctx!.fillStyle = `rgba(216,49,33,${da})`; // Red Heat
                ctx!.fillRect(px(blk.x1), py(blk.y1), px(blk.x2 - blk.x1), py(blk.y2 - blk.y1));
            }
            ctx!.restore();
        }
        function drawBlockTransition(progress: number, now: number) {
            if (progress <= 0) return;
            const blk = BLOCKS.find(b => b.col === 0 && b.row === 3);
            if (!blk) return;
            const { r: pr, g: pg, b: pb } = Z.park;
            const { r: ir, g: ig, b: ib } = Z.ind;
            const r2 = Math.round(ir + (pr - ir) * progress);
            const g2 = Math.round(ig + (pg - ig) * progress);
            const b2 = Math.round(ib + (pb - ib) * progress);
            ctx!.fillStyle = `rgba(${r2},${g2},${b2},${progress * 0.8})`;
            ctx!.fillRect(px(blk.x1), py(blk.y1), px(blk.x2 - blk.x1), py(blk.y2 - blk.y1));
            if (progress > 0.2) {
                const pA = (progress - 0.2) / 0.8;
                const grd = ctx!.createRadialGradient(px(blk.cx), py(blk.cy), 0, px(blk.cx), py(blk.cy), 40);
                grd.addColorStop(0, `rgba(${pr},${pg},${pb},${pA * 0.8})`);
                grd.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
                ctx!.fillStyle = grd; ctx!.beginPath(); ctx!.arc(px(blk.cx), py(blk.cy), 40, 0, 6.28); ctx!.fill();
            }
        }
        function drawPedestrianZone(alpha: number) {
            if (alpha <= 0) return;
            const x1 = px(VX[1] + SMARG * 2), x2 = px(VX[4] - SMARG * 2), y = py(HY[2]);
            ctx!.save();
            ctx!.fillStyle = `rgba(216,49,33,${0.22 * alpha})`;
            ctx!.fillRect(x1, y - 7, x2 - x1, 14);
            ctx!.fillStyle = `rgba(26,26,26,${0.85 * alpha})`;
            const n = Math.floor((x2 - x1) / 30);
            for (let i = 0; i < n; i++) {
                const tx2 = x1 + (x2 - x1) * i / (n - 1);
                ctx!.beginPath(); ctx!.arc(tx2, y, 3, 0, 6.28); ctx!.fill();
            }
            ctx!.font = `700 ${Math.max(8, W * 0.008)}px 'Helvetica Neue',sans-serif`;
            ctx!.fillStyle = `rgba(216,49,33,${0.9 * alpha})`;
            ctx!.textAlign = 'center'; ctx!.textBaseline = 'bottom';
            ctx!.letterSpacing = '0.15em';
            ctx!.fillText('PEDESTRIAN ZONE', (x1 + x2) / 2, y - 9);
            ctx!.restore();
        }
        function drawCommunityNodes(alpha: number, lineAlpha: number) {
            if (alpha <= 0) return;
            ctx!.save();
            for (const n of CNODES) {
                const { r, g, b, x, y, tx, ty } = n;
                if (lineAlpha > 0) {
                    ctx!.strokeStyle = `rgba(${r},${g},${b},${0.42 * lineAlpha})`;
                    ctx!.lineWidth = 1.5; ctx!.setLineDash([3, 4]);
                    ctx!.beginPath(); ctx!.moveTo(px(x), py(y)); ctx!.lineTo(px(tx), py(ty)); ctx!.stroke();
                    ctx!.setLineDash([]);
                    const ang = Math.atan2(py(ty) - py(y), px(tx) - px(x));
                    ctx!.strokeStyle = `rgba(${r},${g},${b},${0.65 * lineAlpha})`;
                    ctx!.lineWidth = 2;
                    ctx!.beginPath();
                    ctx!.moveTo(px(tx) - 10 * Math.cos(ang - 0.45), py(ty) - 10 * Math.sin(ang - 0.45));
                    ctx!.lineTo(px(tx), py(ty));
                    ctx!.lineTo(px(tx) - 10 * Math.cos(ang + 0.45), py(ty) - 10 * Math.sin(ang + 0.45));
                    ctx!.stroke();
                }
                const grd = ctx!.createRadialGradient(px(x), py(y), 0, px(x), py(y), 24);
                grd.addColorStop(0, `rgba(${r},${g},${b},${0.38 * alpha})`);
                grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx!.fillStyle = grd; ctx!.beginPath(); ctx!.arc(px(x), py(y), 24, 0, 6.28); ctx!.fill();
                ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx!.beginPath(); ctx!.arc(px(x), py(y), 6, 0, 6.28); ctx!.fill();
                ctx!.strokeStyle = `rgba(26,26,26,${0.8 * alpha})`; ctx!.lineWidth = 2;
                ctx!.beginPath(); ctx!.arc(px(x), py(y), 6, 0, 6.28); ctx!.stroke();
                ctx!.font = `700 ${Math.max(9, W * 0.009)}px 'Helvetica Neue',sans-serif`;
                ctx!.fillStyle = `rgba(${r},${g},${b},${alpha * 0.9})`;
                ctx!.textBaseline = 'middle'; ctx!.textAlign = 'center';
                ctx!.fillText(n.label.toUpperCase(), px(x), py(y) + (py(0.08)));
            }
            ctx!.restore();
        }

        // HUDs
        const currentPhaseDiv = document.getElementById('urban-anim-phase');

        let animId: number;
        function frame(now: number) {
            if (!phaseStart) phaseStart = now;
            const t = phaseT(now);

            if (t >= 1) {
                phaseIdx = (phaseIdx + 1) % PHASES.length;
                phaseStart = now;
                if (currentPhaseDiv) {
                    const p = curP();
                    currentPhaseDiv.innerHTML = `<span class="uppercase font-bold tracking-widest text-xs">${String(phaseIdx + 1).padStart(2, '0')} / PHASE // </span> <span class="uppercase tracking-widest text-xs ml-2">${p.id}</span>`;
                }
            }

            const p = curP();
            fillBG();

            if (p.id === 'GRID') {
                drawDotGrid(eout(clamp(t * 3, 0, 1)));
            }
            else if (p.id === 'GENERATIVE') {
                const gP = eout(t);
                drawDotGrid(clamp(1 - t * 4, 0, 1) * 0.35);
                drawWindowLights(gP, now, clamp(gP * 2, 0, 1));
                drawStreets(gP, 0.85);
                if (t < 0.6) {
                    const eA = clamp(t * 4, 0, 1) * clamp((0.6 - t) * 5, 0, 1) * 0.4;
                    const grd = ctx!.createRadialGradient(px(CITY_CX), py(CITY_CY), 0, px(CITY_CX), py(CITY_CY), Math.max(1, px(0.25) * gP));
                    grd.addColorStop(0, `rgba(216,49,33,${eA})`);
                    grd.addColorStop(1, 'rgba(216,49,33,0)');
                    ctx!.fillStyle = grd;
                    ctx!.beginPath(); ctx!.arc(px(CITY_CX), py(CITY_CY), px(0.25) * gP, 0, 6.28); ctx!.fill();
                }
            }
            else if (p.id === 'SEMANTIC') {
                const maxR = Math.hypot(W, H) * 0.75;
                const scanR = maxR * eout(clamp(t * 1.3, 0, 1));
                const fillA = clamp(t * 1.8, 0, 1);
                drawWindowLights(1, now, 0.6);
                drawZoneFills(fillA, scanR);
                drawScanRing(scanR, clamp(t * 5 * (1 - t * 0.8), 0, 1));
                drawStreets(1, 0.7);
                drawZoneLabels(clamp((t - 0.4) * 3, 0, 1));
            }
            else if (p.id === 'AGENTIC') {
                const vA = clamp(t * 3, 0, 1) * clamp((1 - t) * 5, 0, 1);
                drawZoneFills(0.55, -1);
                drawWindowLights(1, now, 0.5);
                drawDensityHeat(clamp(t * 3, 0, 1) * 0.7);
                drawStreets(1, 0.65);
                drawVehicles(vA);
            }
            else if (p.id === 'PARTICIPATORY') {
                const nA = clamp(t * 3, 0, 1);
                const lA = clamp((t - 0.15) * 3, 0, 1);
                const transP = eout(clamp((t - 0.3) * 2, 0, 1));
                const pedA = clamp((t - 0.45) * 4, 0, 1);
                drawZoneFills(0.5, -1);
                drawWindowLights(1, now, 0.45);
                drawBlockTransition(transP, now);
                drawStreets(1, 0.6);
                drawPedestrianZone(pedA);
                drawCommunityNodes(nA, lA);
            }
            else if (p.id === 'FADEOUT') {
                const fadeA = 1 - eout(t);
                ctx!.save(); ctx!.globalAlpha = fadeA;
                drawZoneFills(0.5, -1);
                drawWindowLights(1, now, 0.45);
                drawStreets(1, 0.6);
                ctx!.restore();
                fillBG(1 - fadeA);
            }

            animId = window.requestAnimationFrame(frame);
        }

        // Start animation if visible, else placeholder
        if (isVisible !== false) {
            animId = window.requestAnimationFrame(frame);
        }

        return () => {
            window.removeEventListener('resize', resize);
            window.cancelAnimationFrame(animId);
        }
    }, [isVisible]);

    return (
        <div className="relative w-full h-full pb-8">
            <canvas ref={canvasRef} className="w-full h-full border-4 border-stark shadow-stark bg-background block" />
            <div id="urban-anim-phase" className="absolute top-4 left-4 font-mono font-bold text-stark bg-surface border-2 border-stark px-3 py-1 z-10 shadow-stark">
                Initializing...
            </div>
        </div>
    );
}
