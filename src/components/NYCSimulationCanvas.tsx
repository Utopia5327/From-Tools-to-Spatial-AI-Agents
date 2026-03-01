import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as d3 from 'd3-geo';
import { washingtonSquareReviews } from '../data/washingtonSquareReviews';

// --- Types ---
type AgentType = 'gemini' | 'claude' | 'codex' | 'baseline';

interface Agent {
    id: number;
    type: AgentType;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    goal: THREE.Vector3;
    targetNodeIdx: number;
    color: string;
}

interface Props {
    isPlaying: boolean;
    counts: Record<AgentType, number>;
    layers: { heatmaps: boolean, paths: boolean, bottlenecks: boolean };
}
// --- Global Textures (Static SVG Billboards) ---
const treeSvgData = `data:image/svg+xml;utf8,<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64 120 Q68 80 66 70 M66 120 Q68 90 64 60" stroke="%23ffffff" stroke-width="4" fill="none" stroke-linecap="round" /><path d="M64 20 Q90 10 100 30 Q120 50 100 70 Q80 90 64 80 Q40 90 24 70 Q10 50 30 30 Q40 10 64 20 Z" stroke="%23ffffff" stroke-width="6" fill="%23ffffff" stroke-linejoin="round" /><path d="M40 40 Q70 20 90 40 Q110 60 90 80 Q60 90 40 80 Q20 60 40 40 Z" stroke="%23ffffff" stroke-width="4" fill="none" opacity="0.5" /></svg>`;
const humanSvg = '/human-icon.svg';

// 1. Load and parse GeoJSON
function NYCCityBlock({ isPlaying, counts, layers }: Props) {
    const agentsRef = useRef<Agent[]>([]);
    const [geoData, setGeoData] = useState<any>(null);
    const [roadsData, setRoadsData] = useState<any>(null);
    const [treesData, setTreesData] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            fetch('/nyc_buildings.geojson').then(r => r.json()),
            fetch('/nyc_roads.geojson').then(r => r.json()),
            fetch('/nyc_trees.geojson').then(r => r.json())
        ]).then(([buildings, roads, trees]) => {
            setGeoData(buildings);
            setRoadsData(roads);
            setTreesData(trees);
        }).catch((err) => console.error("Failed to load NYC data", err));
    }, []);

    const projection = useMemo(() => {
        if (!geoData) return null;

        // Force projection center exactly at Washington Square Park
        // so that the buildings, roads, trees, and park polygons
        // are perfectly aligned with the hardcoded (0,0) camera and grid.
        const centerLon = -73.9973;
        const centerLat = 40.7308;

        return d3.geoMercator()
            .center([centerLon, centerLat])
            .translate([0, 0])
            .scale(8000000);
    }, [geoData]);

    const shapes = useMemo(() => {
        if (!geoData || !projection) return [];

        const result: { shape: THREE.Shape, height: number, center: THREE.Vector3 }[] = [];

        geoData.features.forEach((feature: any) => {
            const height = parseFloat(feature.properties?.height_roof || '50') * 0.1; // Scale down height

            try {
                let polygons = [];
                if (feature.geometry && feature.geometry.type === 'Polygon') {
                    polygons = [feature.geometry.coordinates];
                } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
                    polygons = feature.geometry.coordinates;
                }

                polygons.forEach((polygon: any) => {
                    const shape = new THREE.Shape();
                    // Reverse the ring to fix the winding order because we are inverting the Y axis later!
                    const ring = polygon[0] ? [...polygon[0]].reverse() : [];

                    if (ring && ring.length > 0) {
                        ring.forEach((coord: [number, number], i: number) => {
                            const projected = projection(coord);
                            if (!projected) return;
                            const [x, y] = projected;

                            if (i === 0) {
                                shape.moveTo(x, -y); // -y because SVG/Screen coords are inverted compared to 3D Z
                            } else {
                                shape.lineTo(x, -y);
                            }
                        });

                        const geom = new THREE.ShapeGeometry(shape);
                        geom.computeBoundingBox();
                        const center = new THREE.Vector3();
                        if (geom.boundingBox) geom.boundingBox.getCenter(center);
                        // Shape's Y is our world's -Z because of the -Math.PI/2 rotation on X
                        const worldCenter = new THREE.Vector3(center.x, 0, -center.y);

                        result.push({ shape, height, center: worldCenter });
                    }
                });
            } catch (e) {
                // Skip malformed geometry
            }
        });

        return result;
    }, [geoData, projection]);



    const extrudeSettings = {
        depth: 1, // Will be overridden per shape later, or we scale it
        bevelEnabled: false,
    };

    const roadGeometry = useMemo(() => {
        if (!roadsData || !projection) return null;
        const points: number[] = [];
        roadsData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.type === 'LineString') {
                const coords = feature.geometry.coordinates;
                for (let i = 0; i < coords.length - 1; i++) {
                    const p1 = projection(coords[i]);
                    const p2 = projection(coords[i + 1]);
                    if (p1 && p2) {
                        // Project to XZ plane with slight Y offset
                        points.push(p1[0], 0.1, p1[1]);
                        points.push(p2[0], 0.1, p2[1]);
                    }
                }
            }
        });
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        return geometry;
    }, [roadsData, projection]);

    const treePositions = useMemo(() => {
        if (!treesData || !projection) return [];
        const result: THREE.Vector3[] = [];
        treesData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.coordinates) {
                const projected = projection(feature.geometry.coordinates);
                if (projected) {
                    const [x, y] = projected;
                    // Apply the matching coordinate mapping: X over X, and due to shape orientation (-90 deg rotation on X), Y over Z.
                    result.push(new THREE.Vector3(x, 0, y));
                }
            }
        });
        return result;
    }, [treesData, projection]);

    const roadGraph = useMemo(() => {
        if (!roadsData || !projection) return [];

        type Node = { pos: THREE.Vector3; edges: number[] };
        const nodes: Node[] = [];
        const nodeMap = new Map<string, number>();

        const getOrAddNode = (p: [number, number]) => {
            const key = `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
            if (nodeMap.has(key)) return nodeMap.get(key)!;

            const idx = nodes.length;
            // Align Y=1.5 so agents float on the path
            nodes.push({ pos: new THREE.Vector3(p[0], 1.5, p[1]), edges: [] });
            nodeMap.set(key, idx);
            return idx;
        };

        roadsData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.type === 'LineString') {
                const coords = feature.geometry.coordinates;
                for (let i = 0; i < coords.length - 1; i++) {
                    const p1 = projection(coords[i]);
                    const p2 = projection(coords[i + 1]);
                    if (p1 && p2) {
                        const idx1 = getOrAddNode(p1 as [number, number]);
                        const idx2 = getOrAddNode(p2 as [number, number]);
                        if (!nodes[idx1].edges.includes(idx2)) nodes[idx1].edges.push(idx2);
                        if (!nodes[idx2].edges.includes(idx1)) nodes[idx2].edges.push(idx1);
                    }
                }
            }
        });
        return nodes;
    }, [roadsData, projection]);

    const textures = useMemo(() => {
        const loader = new THREE.TextureLoader();
        return {
            tree: loader.load(treeSvgData),
            gemini: loader.load('/gemini-color.svg'),
            claude: loader.load('/Claude_AI_symbol.svg.png'),
            codex: loader.load('/Openai-Logo-1--Streamline-Ultimate.png'),
            human: loader.load(humanSvg),
        };
    }, []);

    const treeMatrices = useMemo(() => {
        const matrices: THREE.Matrix4[] = [];
        const dummy = new THREE.Object3D();
        treePositions.forEach((pos) => {
            const scaleY = 1.5 + Math.random() * 2.0;
            const scaleX = 1.5 + Math.random() * 1.5;
            dummy.position.set(pos.x, scaleY * 1.5, pos.z);
            dummy.scale.set(scaleX, scaleY, 1);
            dummy.rotation.set(0, (Math.random() - 0.5) * 0.5, 0); // Slight billboard flutter
            dummy.updateMatrix();
            matrices.push(dummy.matrix.clone());
        });
        return matrices;
    }, [treePositions]);

    return (
        <group>
            {/* Ground Plane representing the Lots (Off-white paper) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[2000, 2000]} />
                <meshBasicMaterial color="#F4F4F0" />
            </mesh>

            {/* City Grid Lines (Abstract Floorplan feel) */}
            <gridHelper args={[1000, 100, '#1A1A1A', '#1A1A1A']} position={[0, -0.05, 0]} material-opacity={0.08} material-transparent={true} />

            {/* OpenStreetMap Roads Network - Highly Visible Arteries */}
            {roadGeometry && (
                <lineSegments geometry={roadGeometry}>
                    <lineBasicMaterial color="#1A1A1A" transparent opacity={0.8} linewidth={3} />
                </lineSegments>
            )}

            {/* Hand-Drawn Trees Representation */}
            {treePositions.length > 0 && (
                <instancedMesh args={[new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({
                    map: textures.tree, alphaTest: 0.5, transparent: true, color: "#2E8B57", opacity: 0.8, side: THREE.DoubleSide
                }), treePositions.length]}
                    ref={(mesh) => {
                        if (mesh) {
                            treeMatrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
                            mesh.instanceMatrix.needsUpdate = true;
                        }
                    }}
                />
            )}

            {/* Extruded Buildings */}
            {shapes.map((s, i) => (
                <ReactiveBuilding key={i} shapeData={s} extrudeSettings={extrudeSettings} agentsRef={agentsRef} />
            ))}

            {/* 3. The Flocking Agents along the road graph */}
            <AgentSwarm isPlaying={isPlaying} counts={counts} roadGraph={roadGraph} agentsRef={agentsRef} layers={layers}
                geminiTex={textures.gemini} claudeTex={textures.claude} codexTex={textures.codex} humanTex={textures.human} />
        </group>
    );
}

// 2. Reactive Architectural Massing
function ReactiveBuilding({ shapeData, extrudeSettings, agentsRef }: { shapeData: { shape: THREE.Shape, height: number, center: THREE.Vector3 }, extrudeSettings: any, agentsRef: React.MutableRefObject<Agent[]> }) {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const baseColor = useMemo(() => new THREE.Color('#F4F4F0'), []);
    const activeColor = useMemo(() => new THREE.Color('#D83121'), []); // Editorial Red
    const growSpeed = 0.15;
    const shrinkSpeed = 0.05;

    useFrame(() => {
        if (!materialRef.current || agentsRef.current.length === 0 || !meshRef.current) return;

        let minDistanceSq = Infinity;
        for (let i = 0; i < agentsRef.current.length; i++) {
            const agent = agentsRef.current[i];
            const distSq = agent.position.distanceToSquared(shapeData.center);
            if (distSq < minDistanceSq) minDistanceSq = distSq;
        }

        // If an agent is very close (e.g. radius of 30 units), lerp towards active color and GROW
        if (minDistanceSq < 900) {
            const intensity = 1.0 - (Math.sqrt(minDistanceSq) / 30);
            // Snap to 80% intensity instantly so it feels super reactive
            materialRef.current.color.lerpColors(baseColor, activeColor, 0.2 + intensity * 0.8);
            materialRef.current.opacity = 0.9 + (intensity * 0.1);

            // Dynamic scale: Stretch up to 3x height when agents are extremely close
            const targetZ = 1.0 + (intensity * 2.0);
            meshRef.current.scale.z += (targetZ - meshRef.current.scale.z) * growSpeed;
        } else {
            materialRef.current.color.lerp(baseColor, 0.1); // Fade back
            materialRef.current.opacity = 0.9;
            meshRef.current.scale.z += (1.0 - meshRef.current.scale.z) * shrinkSpeed;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <extrudeGeometry args={[shapeData.shape, { ...extrudeSettings, depth: shapeData.height }]} />
            <meshStandardMaterial ref={materialRef} color="#F4F4F0" roughness={1.0} metalness={0.0} transparent opacity={0.9} side={THREE.DoubleSide} />
            <lineSegments>
                <edgesGeometry args={[new THREE.ExtrudeGeometry(shapeData.shape, { ...extrudeSettings, depth: shapeData.height })]} />
                {/* Thick dark charcoal border for physical sketch effect */}
                <lineBasicMaterial color="#1A1A1A" linewidth={2} opacity={0.6} transparent />
            </lineSegments>
        </mesh>
    );
}

// 3. The 3D Agent Personas System
interface ActiveBubble {
    id: string;
    agentIdx: number;
    text: string;
    agentName?: string;
    sentiment?: number;
    lifetime: number;
    type: 'human' | 'ai';
    offset?: THREE.Vector3;
}

function AgentSwarm({ isPlaying, counts, roadGraph, agentsRef, layers, geminiTex, claudeTex, codexTex, humanTex }: { isPlaying: boolean, counts: Record<AgentType, number>, roadGraph: { pos: THREE.Vector3, edges: number[] }[], agentsRef: React.MutableRefObject<Agent[]>, layers: { heatmaps: boolean, paths: boolean, bottlenecks: boolean }, geminiTex: THREE.Texture, claudeTex: THREE.Texture, codexTex: THREE.Texture, humanTex: THREE.Texture }) {
    const collabMeshRef = useRef<THREE.InstancedMesh>(null);
    const introvertMeshRef = useRef<THREE.InstancedMesh>(null);
    const accessMeshRef = useRef<THREE.InstancedMesh>(null);
    const humanMeshRef = useRef<THREE.InstancedMesh>(null);

    const MAX_HEATMAP_DROPS = 3000;
    const heatmapMeshRef = useRef<THREE.InstancedMesh>(null);
    const heatmapIdx = useRef(0);

    const MAX_PATH_DROPS = 1500;
    const pathsMeshRef = useRef<THREE.InstancedMesh>(null);
    const pathsIdx = useRef(0);

    const bottleneckMeshRef = useRef<THREE.InstancedMesh>(null);

    const BOUNDS = 2000;

    const frameCountRef = useRef(0);
    const [activeBubbles, setActiveBubbles] = useState<ActiveBubble[]>([]);
    const bubblesLogicRef = useRef<ActiveBubble[]>([]);
    const bubbleGroupsRef = useRef<Record<string, THREE.Group | null>>({});

    // Sync agent counts
    useEffect(() => {
        let currentAgents = [...agentsRef.current];

        const defineAgent = (type: AgentType, idOffset: number): Agent => {
            const isGemini = type === 'gemini';
            const isCodex = type === 'codex';
            const isBaseline = type === 'baseline';

            // Spawn on a random road node
            let startIdx = 0;
            if (roadGraph.length > 0) {
                startIdx = Math.floor(Math.random() * roadGraph.length);
            }
            const startNode = roadGraph[startIdx];
            const startPos = startNode ? startNode.pos.clone() : new THREE.Vector3((Math.random() - 0.5) * BOUNDS, 1.5, (Math.random() - 0.5) * BOUNDS);

            let tIdx = startIdx;
            if (startNode && startNode.edges.length > 0) {
                tIdx = startNode.edges[Math.floor(Math.random() * startNode.edges.length)];
            }

            return {
                id: Math.random() + idOffset,
                type,
                position: startPos,
                velocity: new THREE.Vector3(),
                goal: new THREE.Vector3(),
                targetNodeIdx: tIdx,
                color: isGemini ? '#0033A0' : isCodex ? '#D32F2F' : isBaseline ? '#1A1A1A' : '#FF5722' // Claude gets orange
            };
        };

        (['gemini', 'claude', 'codex', 'baseline'] as AgentType[]).forEach(type => {
            const targetCount = counts[type];
            const currentOfType = currentAgents.filter(a => a.type === type);

            if (currentOfType.length < targetCount) {
                const toAdd = targetCount - currentOfType.length;
                for (let i = 0; i < toAdd; i++) currentAgents.push(defineAgent(type, i));
            } else if (currentOfType.length > targetCount) {
                const toKeep = targetCount;
                let kept = 0;
                currentAgents = currentAgents.filter(a => {
                    if (a.type !== type) return true;
                    if (kept < toKeep) { kept++; return true; }
                    return false;
                });
            }
        });

        agentsRef.current = currentAgents;
    }, [counts, roadGraph]);

    // Animation Loop / Physics update
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const colorObj = useMemo(() => new THREE.Color(), []);

    useFrame(() => {
        if (!isPlaying) return;

        frameCountRef.current++;

        // Speech Bubbles Logic (Run every few frames)
        if (frameCountRef.current % 120 === 0 && bubblesLogicRef.current.length < 8 && agentsRef.current.length > 0) {
            const humanAgents = agentsRef.current.map((a, i) => ({ a, i })).filter(item => item.a.type === 'baseline');

            if (humanAgents.length > 0) {
                const randItem = humanAgents[Math.floor(Math.random() * humanAgents.length)];
                const agent = randItem.a;
                const randIdx = randItem.i;
                const isTalking = bubblesLogicRef.current.some(b => b.agentIdx === randIdx);

                if (!isTalking) {
                    // Filter reviews by physical proximity to the mapped coordinates
                    const validLocations = washingtonSquareReviews.filter(loc => {
                        const center = new THREE.Vector3(loc.bounds.x, 0, loc.bounds.z);
                        const dist = agent.position.distanceTo(center);
                        return dist <= loc.bounds.radius;
                    });

                    if (validLocations.length > 0) {
                        const location = validLocations[Math.floor(Math.random() * validLocations.length)];
                        if (location.reviews.length > 0) {
                            const review = location.reviews[Math.floor(Math.random() * location.reviews.length)];

                            // 1. Human Bubble — short quote with sentiment
                            const humanBubble = {
                                id: Math.random().toString(),
                                agentIdx: randIdx,
                                text: review.text,
                                sentiment: review.rating,
                                lifetime: 240 + Math.floor(Math.random() * 300),
                                type: 'human' as const,
                                offset: new THREE.Vector3((Math.random() - 0.5) * 15, 6 + Math.random() * 6, (Math.random() - 0.5) * 15)
                            };
                            bubblesLogicRef.current.push(humanBubble);

                            // 2. AI Response Bubble — compact chip
                            const aiAgents = agentsRef.current.map((a, i) => ({ a, i })).filter(item => item.a.type !== 'baseline' && (review.personaFocus === 'general' || review.personaFocus === item.a.type));

                            let bubblesChanged = false;
                            for (let i = bubblesLogicRef.current.length - 1; i >= 0; i--) {
                                const b = bubblesLogicRef.current[i];
                                b.lifetime--;
                                if (b.lifetime <= 0) {
                                    bubblesLogicRef.current.splice(i, 1);
                                    bubblesChanged = true;
                                } else {
                                    const group = bubbleGroupsRef.current[b.id];
                                    const agent = agentsRef.current[b.agentIdx];
                                    if (group && agent) {
                                        // Apply the saved offset to the agent's current position so it floats nearby without stacking
                                        const offset = b.offset || new THREE.Vector3(0, 5, 0);
                                        group.position.copy(agent.position).add(offset);
                                    }
                                }
                            }
                            if (bubblesChanged) setActiveBubbles([...bubblesLogicRef.current]);
                        }
                    }
                }
            }
        }

        // --- UPDATE BUBBLE LIFETIMES AND POSITIONS EVERY FRAME ---
        let bubblesChanged = false;
        for (let i = bubblesLogicRef.current.length - 1; i >= 0; i--) {
            const b = bubblesLogicRef.current[i];
            b.lifetime--;
            if (b.lifetime <= 0) {
                bubblesLogicRef.current.splice(i, 1);
                bubblesChanged = true;
            } else {
                const group = bubbleGroupsRef.current[b.id];
                const agent = agentsRef.current[b.agentIdx];
                if (group && agent) {
                    const offset = b.offset || new THREE.Vector3(0, 5, 0);
                    group.position.copy(agent.position).add(offset);
                }
            }
        }
        if (bubblesChanged) setActiveBubbles([...bubblesLogicRef.current]);

        // --- AGENT MOVEMENT AND INSTANCED MESH UPDATES EVERY FRAME ---
        let cCollab = 0, cIntro = 0, cAccess = 0, cHuman = 0;

        agentsRef.current.forEach((agent) => {
            if (isPlaying && agent.type !== 'baseline') {
                // AI Agents wander randomly around the park
                const zeroVec = new THREE.Vector3();
                if (agent.goal.equals(zeroVec) || agent.position.distanceTo(agent.goal) < 1.0) {
                    agent.goal = new THREE.Vector3((Math.random() - 0.5) * BOUNDS, 1.5, (Math.random() - 0.5) * BOUNDS);
                }
                const dir = new THREE.Vector3().subVectors(agent.goal, agent.position);
                dir.y = 0;
                const speed = agent.type === 'gemini' ? 0.3 : agent.type === 'codex' ? 0.2 : 0.25;
                dir.normalize().multiplyScalar(speed);
                agent.velocity.lerp(dir, 0.05);
                agent.position.add(agent.velocity);
            } else if (isPlaying && roadGraph.length > 0) {
                // Baseline agents strictly follow paths
                const targetNode = roadGraph[agent.targetNodeIdx];
                if (targetNode) {
                    const dir = new THREE.Vector3().subVectors(targetNode.pos, agent.position);
                    dir.y = 0; // Constrain to ground
                    const dist = dir.length();

                    if (dist < 1.0) {
                        // Node reached, pick next random adjoining node to simulate pathfinding
                        if (targetNode.edges.length > 0) {
                            agent.targetNodeIdx = targetNode.edges[Math.floor(Math.random() * targetNode.edges.length)];
                        }
                    } else {
                        const speed = 0.1;
                        dir.normalize().multiplyScalar(speed);
                        // Slight lerp for smooth turning onto new street segments
                        agent.velocity.lerp(dir, 0.4);
                        agent.position.add(agent.velocity);
                    }
                }
            }

            // Update InstancedMesh positions and colors
            dummy.position.copy(agent.position);

            // Logos should lay completely flat on the ground map and not stretch sideways
            dummy.rotation.set(-Math.PI / 2, 0, 0);

            // Size differences based on persona
            const scale = agent.type === 'baseline' ? 4.0 : 5.0;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();

            if (agent.type === 'gemini' && collabMeshRef.current && cCollab < counts.gemini) {
                collabMeshRef.current.setMatrixAt(cCollab, dummy.matrix);
                collabMeshRef.current.setColorAt(cCollab, colorObj.set('#ffffff'));
                cCollab++;
            } else if (agent.type === 'claude' && introvertMeshRef.current && cIntro < counts.claude) {
                introvertMeshRef.current.setMatrixAt(cIntro, dummy.matrix);
                introvertMeshRef.current.setColorAt(cIntro, colorObj.set('#ffffff'));
                cIntro++;
            } else if (agent.type === 'codex' && accessMeshRef.current && cAccess < counts.codex) {
                accessMeshRef.current.setMatrixAt(cAccess, dummy.matrix);
                accessMeshRef.current.setColorAt(cAccess, colorObj.set('#ffffff'));
                cAccess++;
            } else if (agent.type === 'baseline' && humanMeshRef.current && cHuman < counts.baseline) {
                humanMeshRef.current.setMatrixAt(cHuman, dummy.matrix);
                humanMeshRef.current.setColorAt(cHuman, colorObj.set('#ffffff'));
                cHuman++;
            }
        });

        if (collabMeshRef.current) {
            collabMeshRef.current.count = cCollab;
            collabMeshRef.current.instanceMatrix.needsUpdate = true;
            if (collabMeshRef.current.instanceColor) collabMeshRef.current.instanceColor.needsUpdate = true;
        }
        if (introvertMeshRef.current) {
            introvertMeshRef.current.count = cIntro;
            introvertMeshRef.current.instanceMatrix.needsUpdate = true;
            if (introvertMeshRef.current.instanceColor) introvertMeshRef.current.instanceColor.needsUpdate = true;
        }
        if (accessMeshRef.current) {
            accessMeshRef.current.count = cAccess;
            accessMeshRef.current.instanceMatrix.needsUpdate = true;
            if (accessMeshRef.current.instanceColor) accessMeshRef.current.instanceColor.needsUpdate = true;
        }
        if (humanMeshRef.current) {
            humanMeshRef.current.count = cHuman;
            humanMeshRef.current.instanceMatrix.needsUpdate = true;
            if (humanMeshRef.current.instanceColor) humanMeshRef.current.instanceColor.needsUpdate = true;
        }

        // --- Visual Layers ---
        if (isPlaying && layers.heatmaps && heatmapMeshRef.current) {
            const posColor = new THREE.Color('#0033A0'); // High rated
            const negColor = new THREE.Color('#D32F2F'); // Low rated
            const neutColor = new THREE.Color('#1A1A1A'); // Neutral
            const qFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
            const dummyHeat = new THREE.Matrix4();
            for (let i = 0; i < 5; i++) {
                const agent = agentsRef.current[Math.floor(Math.random() * agentsRef.current.length)];
                if (agent) {
                    dummyHeat.compose(agent.position, qFlat, new THREE.Vector3(1, 1, 1));
                    heatmapMeshRef.current.setMatrixAt(heatmapIdx.current, dummyHeat);
                    // Sentiment color from nearby review zone
                    const nearbyLoc = washingtonSquareReviews.find(loc =>
                        Math.hypot(agent.position.x - loc.bounds.x, agent.position.z - loc.bounds.z) <= loc.bounds.radius
                    );
                    if (nearbyLoc && nearbyLoc.targetId !== 'general_paths' && nearbyLoc.reviews.length > 0) {
                        const avgRating = nearbyLoc.reviews.reduce((s, r) => s + r.rating, 0) / nearbyLoc.reviews.length;
                        const t = Math.max(0, Math.min(1, (avgRating - 1) / 4));
                        const heatColor = new THREE.Color().lerpColors(negColor, posColor, t);
                        heatmapMeshRef.current.setColorAt(heatmapIdx.current, heatColor);
                    } else {
                        heatmapMeshRef.current.setColorAt(heatmapIdx.current, neutColor);
                    }
                    heatmapIdx.current = (heatmapIdx.current + 1) % MAX_HEATMAP_DROPS;
                }
            }
            heatmapMeshRef.current.count = MAX_HEATMAP_DROPS;
            heatmapMeshRef.current.instanceMatrix.needsUpdate = true;
            if (heatmapMeshRef.current.instanceColor) heatmapMeshRef.current.instanceColor.needsUpdate = true;
        } else if (!layers.heatmaps && heatmapMeshRef.current) {
            heatmapMeshRef.current.count = 0;
        }

        if (isPlaying && layers.paths && pathsMeshRef.current) {
            const dummyPath = new THREE.Matrix4();
            const qFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
            for (let i = 0; i < 20; i++) {
                const agent = agentsRef.current[Math.floor(Math.random() * agentsRef.current.length)];
                if (agent && agent.velocity.lengthSq() > 0.001) {
                    dummyPath.compose(agent.position, qFlat, new THREE.Vector3(1, 1, 1));
                    pathsMeshRef.current.setMatrixAt(pathsIdx.current, dummyPath);
                    pathsIdx.current = (pathsIdx.current + 1) % MAX_PATH_DROPS;
                }
            }
            pathsMeshRef.current.count = MAX_PATH_DROPS;
            pathsMeshRef.current.instanceMatrix.needsUpdate = true;
        } else if (!layers.paths && pathsMeshRef.current) {
            pathsMeshRef.current.count = 0;
        }

        if (layers.bottlenecks && bottleneckMeshRef.current && roadGraph.length > 0) {
            const traffic = new Float32Array(roadGraph.length);
            agentsRef.current.forEach(a => traffic[a.targetNodeIdx]++);
            let activeCount = 0;
            const matrix = new THREE.Matrix4();
            const colorObj = new THREE.Color('#ef4444'); // Red
            traffic.forEach((t, i) => {
                if (t > 2) {
                    matrix.setPosition(roadGraph[i].pos);
                    // Vastly expand the scale since it's a flat plane now, and rotate it parallel to the ground
                    const scale = Math.min(40, 10 + t * 4);
                    // Use compose to rotate the plane flat and scale it natively
                    matrix.compose(
                        new THREE.Vector3(roadGraph[i].pos.x, 0.2, roadGraph[i].pos.z),
                        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
                        new THREE.Vector3(scale, scale, 1)
                    );
                    bottleneckMeshRef.current!.setMatrixAt(activeCount, matrix);
                    bottleneckMeshRef.current!.setColorAt(activeCount, colorObj);
                    activeCount++;
                }
            });
            bottleneckMeshRef.current.count = activeCount;
            bottleneckMeshRef.current.instanceMatrix.needsUpdate = true;
            if (bottleneckMeshRef.current.instanceColor) bottleneckMeshRef.current.instanceColor.needsUpdate = true;
        } else if (bottleneckMeshRef.current) {
            bottleneckMeshRef.current.count = 0;
        }
        // Speech Bubble Scope Closed Early
    });

    return (
        <group>
            {/* The Gemini Multi-modal Agent - Sparkle navigates space fast */}
            <instancedMesh ref={collabMeshRef} args={[new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({
                map: geminiTex, transparent: false, alphaTest: 0.5, depthWrite: true, side: THREE.DoubleSide
            }), Math.max(1, counts.gemini)]} count={counts.gemini} />

            {/* The Claude Agent - Analytical Nodes */}
            <instancedMesh ref={introvertMeshRef} args={[new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({
                map: claudeTex, transparent: false, alphaTest: 0.5, depthWrite: true, side: THREE.DoubleSide
            }), Math.max(1, counts.claude)]} count={counts.claude} />

            {/* Codex (Structural/Syntax) */}
            <instancedMesh ref={accessMeshRef} args={[new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({
                map: codexTex, transparent: false, alphaTest: 0.5, depthWrite: true, side: THREE.DoubleSide
            }), Math.max(1, counts.codex)]} count={counts.codex} />

            {/* Human Pedestrians (Baseline) */}
            <instancedMesh ref={humanMeshRef} args={[new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({
                map: humanTex, transparent: false, alphaTest: 0.5, depthWrite: true, side: THREE.DoubleSide
            }), Math.max(1, counts.baseline)]} count={counts.baseline} />

            {/* Heatmaps (Layer 4) - sentiment colored */}
            <instancedMesh ref={heatmapMeshRef} args={[undefined, undefined, MAX_HEATMAP_DROPS]} count={0}>
                <circleGeometry args={[2.5, 16]} />
                <meshBasicMaterial vertexColors transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
            </instancedMesh>

            {/* Path Traces (Layer 2) */}
            <instancedMesh ref={pathsMeshRef} args={[undefined, undefined, MAX_PATH_DROPS]} count={0}>
                <circleGeometry args={[0.8, 12]} />
                <meshBasicMaterial color="#ff4444" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
            </instancedMesh>

            {/* Bottlenecks (Layer 3) */}
            <instancedMesh ref={bottleneckMeshRef} args={[undefined, undefined, 1000]} count={0}>
                {/* Use a flat plane facing upwards to render a 2D heat ring */}
                <ringGeometry args={[0.8, 1.0, 32]} />
                <meshBasicMaterial
                    color="#D83121"
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </instancedMesh>

            {/* Speech Bubbles Overlay */}
            {activeBubbles.map(b => (
                <group key={b.id} ref={(el) => bubbleGroupsRef.current[b.id] = el}>
                    <Html center style={{ pointerEvents: 'none', zIndex: b.type === 'ai' ? 10 : 5 }}>
                        {b.type === 'ai' ? (
                            // Compact AI chip in scrapbook style
                            <div className="flex items-center gap-1.5 bg-background border-2 border-stark shadow-[2px_2px_0_var(--color-textmain)] px-3 py-1 whitespace-nowrap">
                                <img src={b.agentName?.toLowerCase() === 'gemini' ? '/gemini-color.svg' : b.agentName?.toLowerCase() === 'claude' ? '/Claude_AI_symbol.svg.png' : '/Openai-Logo-1--Streamline-Ultimate.png'} alt={b.agentName} className="w-4 h-4 object-contain flex-shrink-0" />
                                <span className="font-mono text-[10px] text-textmain font-bold uppercase">{b.agentName}</span>
                                <span className="text-[10px] text-textmain opacity-50">·</span>
                                <span className="font-serif text-[10px] text-textmain italic scale-110">{b.text}</span>
                            </div>
                        ) : (
                            // Human review — stark border, typewriter aesthetic
                            <div className={`bg-surface p-2 border-2 text-textmain max-w-[150px] shadow-[4px_4px_0_var(--color-textmain)] font-serif leading-snug ${(b.sentiment ?? 3) >= 4 ? 'border-secondary' : (b.sentiment ?? 3) <= 2 ? 'border-primary' : 'border-stark'}`}>
                                <div className="flex items-center gap-1 mb-1 border-b border-stark/30 pb-1">
                                    <span className="font-mono font-bold text-[8px] uppercase tracking-widest">Human Subj.</span>
                                </div>
                                <p className="italic text-[10px] font-mono leading-relaxed tracking-tight">"{b.text}"</p>
                            </div>
                        )}
                    </Html>
                </group>
            ))}
        </group>
    );
}

export default function NYCSimulationCanvas({ isPlaying, counts, layers }: Props) {
    return (
        <div className="w-full h-full absolute inset-0 z-10 bg-[#F4F4F0]">
            <Canvas
                camera={{ position: [300, 300, 300], fov: 45, near: 1, far: 2000 }}
                shadows
            >
                {/* Ensure canvas follows paper background */}
                <color attach="background" args={['#F4F4F0']} />

                {/* Environmental Lighting for paper/sketch aesthetic */}
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[100, 200, 50]}
                    intensity={1.0}
                    color="#ffffff"
                    castShadow
                />
                <pointLight position={[-50, 100, -50]} intensity={0.2} color="#D32F2F" />

                <OrbitControls
                    makeDefault
                    target={[0, 0, 0]}
                    maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below ground
                    minDistance={50}
                    maxDistance={500}
                    enableDamping
                    dampingFactor={0.05}
                />

                <NYCCityBlock isPlaying={isPlaying} counts={counts} layers={layers} />

                {/* Post-processing could go here later */}
            </Canvas>
        </div>
    );
}
