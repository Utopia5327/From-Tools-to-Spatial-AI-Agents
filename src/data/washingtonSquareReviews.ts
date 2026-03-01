export interface LocationReview {
    targetId: string; // Could be a general descriptor
    name: string;
    bounds: { x: number, z: number, radius: number }; // Physical coordinates mapped in the 3D grid
    reviews: { text: string; rating: number; personaFocus: 'gemini' | 'claude' | 'codex' | 'general' }[];
}

// Simulated subset of Google Reviews for Washington Square Park Area
export const washingtonSquareReviews: LocationReview[] = [
    {
        targetId: 'arch',
        name: 'Washington Square Arch',
        bounds: { x: -80, z: -40, radius: 45 },
        reviews: [
            { text: "Too many tourists crowding the central path, but great place to meet up.", rating: 4, personaFocus: 'gemini' },
            { text: "The paving stones underneath the arch are uneven, making it hard to roll over smoothly.", rating: 3, personaFocus: 'codex' },
            { text: "I try to avoid the monument area entirely during peak hours; the noise echo is overwhelming.", rating: 2, personaFocus: 'claude' },
            { text: "Beautiful architecture but completely lacks any quiet seating.", rating: 3, personaFocus: 'claude' }
        ]
    },
    {
        targetId: 'dog_run',
        name: 'Dog Run',
        bounds: { x: 70, z: -60, radius: 40 },
        reviews: [
            { text: "Amazing energy, always bump into fellow dog owners here to chat.", rating: 5, personaFocus: 'gemini' },
            { text: "The fencing is a bit narrow at the entrance, tough to navigate a wheelchair if someone's dog is blocking the gate.", rating: 3, personaFocus: 'codex' },
            { text: "Too loud and chaotic. I prefer the benches on the east side.", rating: 2, personaFocus: 'claude' }
        ]
    },
    {
        targetId: 'fountain',
        name: 'Central Fountain',
        bounds: { x: 0, z: 0, radius: 60 },
        reviews: [
            { text: "The acoustics are amazing when the musicians play, love finding a spot nearby to hang out with friends.", rating: 5, personaFocus: 'gemini' },
            { text: "There is no ramp directly to the inner circle seating, you have to go all the way around.", rating: 2, personaFocus: 'codex' },
            { text: "I like sitting on the outer ring facing away from the water to read a book in peace.", rating: 4, personaFocus: 'claude' },
            { text: "Great place to observe the city, but the pedestrian flow clashes terribly right here.", rating: 3, personaFocus: 'gemini' }
        ]
    },
    {
        targetId: 'nyu_building',
        name: 'NYU Bobst Library Area',
        bounds: { x: 90, z: 60, radius: 50 },
        reviews: [
            { text: "The sidewalk gets way too dense between classes, impossible to have a walking meeting.", rating: 2, personaFocus: 'gemini' },
            { text: "Curb cuts are excellent on this block, very smooth transition to the crosswalk.", rating: 5, personaFocus: 'codex' },
            { text: "I detour through the smaller alleys to avoid this corner entirely during transition hours.", rating: 4, personaFocus: 'claude' }
        ]
    },
    {
        targetId: 'general_paths',
        name: 'Park Walkways',
        bounds: { x: 0, z: 0, radius: 500 }, // Fallback for anywhere
        reviews: [
            { text: "Love the wide paths, perfect for group walks.", rating: 5, personaFocus: 'gemini' },
            { text: "Some of the older asphalt paths have deep cracks, creating friction hazards.", rating: 2, personaFocus: 'codex' },
            { text: "The shaded paths near the chess tables are my sanctuary.", rating: 5, personaFocus: 'claude' },
            { text: "I wish the foot traffic was managed better, there's severe bottlenecking near the subway entrance.", rating: 3, personaFocus: 'gemini' }
        ]
    }
];
