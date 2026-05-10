// Game configuration constants
export const GAME_WIDTH = 800;
export const HEADER_HEIGHT = 50; // Height reserved for title at top
export const GRID_TOP_MARGIN = 10; // Extra space below header for breathing room
export const GAME_HEIGHT = 600; // Total canvas height - reduced from 650 to 600 for better desktop/tablet fit
export const TOOLBAR_HEIGHT = 120; // Height reserved for toolbar at bottom (increased for 2 rows)
export const PLAYABLE_HEIGHT = GAME_HEIGHT - HEADER_HEIGHT - TOOLBAR_HEIGHT; // 430px for grid
export const GRID_SIZE = 50; // Size of each grid cell in pixels
export const GRID_COLS = 16; // 800 / 50 = 16 columns
export const GRID_ROWS = 8; // 430 / 50 = 8 rows (reduced from 9 for better fit)

// Block types
export const BLOCK_TYPES = {
    EMPTY: 'empty',
    // Basic colors
    GRASS: 'grass',
    PINK: 'pink',
    BLUE: 'blue',
    YELLOW: 'yellow',
    PURPLE: 'purple',
    ORANGE: 'orange',
    RED: 'red',
    TEAL: 'teal',
    WHITE: 'white',
    GREY: 'grey',
    BLACK: 'black',
    // Pattern blocks (magical building blocks)
    HEART_PINK: 'heartPink',
    GLITTER_PINK: 'glitterPink',
    WATER: 'water',
    STAR_YELLOW: 'starYellow',
    //LEAF_GREEN: 'leafGreen',
    // Special blocks
    RAINBOW: 'rainbow',
    // Objects
    GIRL: 'girl',
    BOY: 'boy',
    BUNNY: 'bunny',
    UNICORN: 'unicorn',
    FLOWER: 'flower',
    BUSH_PINK_FLOWER: 'bushPinkFlower',
    PALM_TREE: 'palmTree',
    TREE: 'tree',
    BUSH_REINDEER: 'bushReindeer'
};

// Block colors for rendering
export const BLOCK_COLORS = {
    [BLOCK_TYPES.EMPTY]: null,
    // Basic colors
    [BLOCK_TYPES.GRASS]: 0x4CAF50,
    [BLOCK_TYPES.PINK]: 0xFF69B4,
    [BLOCK_TYPES.BLUE]: 0x3498DB,
    [BLOCK_TYPES.YELLOW]: 0xFFEB3B,
    [BLOCK_TYPES.PURPLE]: 0x9B59B6,
    [BLOCK_TYPES.ORANGE]: 0xFF8C00,
    [BLOCK_TYPES.RED]: 0xE74C3C,
    [BLOCK_TYPES.TEAL]: 0x1ABC9C,
    [BLOCK_TYPES.WHITE]: 0xFFFFFF,
    [BLOCK_TYPES.GREY]: 0x808080,
    [BLOCK_TYPES.BLACK]: 0x333333,
    // Pattern blocks (base colors)
    [BLOCK_TYPES.HEART_PINK]: 0xFFB6D9,
    [BLOCK_TYPES.GLITTER_PINK]: 0xFFD4E5,
    [BLOCK_TYPES.WATER]: 0x6EC6E8,
    [BLOCK_TYPES.STAR_YELLOW]: 0xFFF9C4,
    //[BLOCK_TYPES.LEAF_GREEN]: 0xC8E6C9,
    // Special blocks
    [BLOCK_TYPES.RAINBOW]: 0xFF69B4, // Starting color, will cycle
    // Objects
    [BLOCK_TYPES.GIRL]: 0xFFFFFF,
    [BLOCK_TYPES.BOY]: 0xFFFFFF,
    [BLOCK_TYPES.BUNNY]: 0xFFFFFF,
    [BLOCK_TYPES.UNICORN]: 0xFFFFFF,
    [BLOCK_TYPES.FLOWER]: 0xFFFFFF,
    [BLOCK_TYPES.BUSH_PINK_FLOWER]: 0xFFFFFF,
    [BLOCK_TYPES.PALM_TREE]: 0xFFFFFF,
    [BLOCK_TYPES.TREE]: 0xFFFFFF,
    [BLOCK_TYPES.BUSH_REINDEER]: 0xFFFFFF
};

// Pattern overlays for pattern blocks
export const BLOCK_PATTERNS = {
    [BLOCK_TYPES.HEART_PINK]: '💗',
    [BLOCK_TYPES.GLITTER_PINK]: '✨', // Has animated sparkle effect
    [BLOCK_TYPES.WATER]: '🌊',
    [BLOCK_TYPES.STAR_YELLOW]: '⭐',
    //[BLOCK_TYPES.LEAF_GREEN]: '🌿',
    [BLOCK_TYPES.RAINBOW]: '🌈'
};

// Animated block types - blocks with special visual effects
export const ANIMATED_BLOCKS = {
    [BLOCK_TYPES.GLITTER_PINK]: 'sparkle', // Twinkling sparkle particles
    [BLOCK_TYPES.RAINBOW]: 'colorCycle' // Color cycling animation
};

// Item categories for toolbar organization
export const ITEM_CATEGORIES = {
    COLOR: 'color',
    PATTERN_COLOR: 'patternColor', // Special colors with patterns
    PRETTY_COLOR: 'prettyColor', // Future: softer, pastel colors
    OBJECT: 'object',
    TOOL: 'tool',
    ACTION: 'action'
};

// Palette items - data-driven configuration

// Row 1: Basic building block colors (grouped by color family for kids)
export const PALETTE_COLORS = [
    // Greens
    { type: BLOCK_TYPES.GRASS, label: 'Green', color: BLOCK_COLORS[BLOCK_TYPES.GRASS], category: ITEM_CATEGORIES.COLOR },
    // Teals/Blues
    { type: BLOCK_TYPES.TEAL, label: 'Teal', color: BLOCK_COLORS[BLOCK_TYPES.TEAL], category: ITEM_CATEGORIES.COLOR },
    { type: BLOCK_TYPES.BLUE, label: 'Blue', color: BLOCK_COLORS[BLOCK_TYPES.BLUE], category: ITEM_CATEGORIES.COLOR },
    // Purples
    { type: BLOCK_TYPES.PURPLE, label: 'Purple', color: BLOCK_COLORS[BLOCK_TYPES.PURPLE], category: ITEM_CATEGORIES.COLOR },
    // Pinks/Reds
    { type: BLOCK_TYPES.PINK, label: 'Pink', color: BLOCK_COLORS[BLOCK_TYPES.PINK], category: ITEM_CATEGORIES.COLOR },
    { type: BLOCK_TYPES.RED, label: 'Red', color: BLOCK_COLORS[BLOCK_TYPES.RED], category: ITEM_CATEGORIES.COLOR },
    // Oranges/Yellows
    { type: BLOCK_TYPES.ORANGE, label: 'Orange', color: BLOCK_COLORS[BLOCK_TYPES.ORANGE], category: ITEM_CATEGORIES.COLOR },
    { type: BLOCK_TYPES.YELLOW, label: 'Yellow', color: BLOCK_COLORS[BLOCK_TYPES.YELLOW], category: ITEM_CATEGORIES.COLOR },
    // Neutrals
    { type: BLOCK_TYPES.WHITE, label: 'White', color: BLOCK_COLORS[BLOCK_TYPES.WHITE], category: ITEM_CATEGORIES.COLOR },
    { type: BLOCK_TYPES.GREY, label: 'Grey', color: BLOCK_COLORS[BLOCK_TYPES.GREY], category: ITEM_CATEGORIES.COLOR },
    { type: BLOCK_TYPES.BLACK, label: 'Black', color: BLOCK_COLORS[BLOCK_TYPES.BLACK], category: ITEM_CATEGORIES.COLOR }
];

// Pattern blocks - the magical Minecraft-style blocks kids love!
// Ordered to group with related base colors
export const PALETTE_PATTERN_COLORS = [
    // Green family
    //{ type: BLOCK_TYPES.LEAF_GREEN, label: 'Leaves', color: BLOCK_COLORS[BLOCK_TYPES.LEAF_GREEN], pattern: BLOCK_PATTERNS[BLOCK_TYPES.LEAF_GREEN], category: ITEM_CATEGORIES.PATTERN_COLOR },
    // Blue family - water terrain
    { type: BLOCK_TYPES.WATER, label: 'Water', color: BLOCK_COLORS[BLOCK_TYPES.WATER], pattern: BLOCK_PATTERNS[BLOCK_TYPES.WATER], category: ITEM_CATEGORIES.PATTERN_COLOR },
    // Pink family
    { type: BLOCK_TYPES.GLITTER_PINK, label: 'Glitter', color: BLOCK_COLORS[BLOCK_TYPES.GLITTER_PINK], pattern: BLOCK_PATTERNS[BLOCK_TYPES.GLITTER_PINK], category: ITEM_CATEGORIES.PATTERN_COLOR },
    // Special - always last
    { type: BLOCK_TYPES.RAINBOW, label: 'Rainbow', color: BLOCK_COLORS[BLOCK_TYPES.RAINBOW], pattern: BLOCK_PATTERNS[BLOCK_TYPES.RAINBOW], category: ITEM_CATEGORIES.PATTERN_COLOR, special: 'cycling' }
];

// Pretty colors - future expansion (light pink, hot pink, lavender, mint, turquoise, peach, baby blue, lilac)
export const PALETTE_PRETTY_COLORS = [
    // Empty for now - easy to add later without changing architecture
];

// Objects - characters and decorations
export const PALETTE_OBJECTS = [
    { type: BLOCK_TYPES.GIRL, label: 'Girl', icon: 'icon-girl', width: 1, height: 1 },
    { type: BLOCK_TYPES.BOY, label: 'Boy', icon: 'icon-boy', width: 1, height: 1 },
    { type: BLOCK_TYPES.BUNNY, label: 'Bunny', icon: 'icon-bunny', width: 1, height: 1 },
    { type: BLOCK_TYPES.UNICORN, label: 'Unicorn', icon: 'icon-unicorn', width: 1, height: 1 },
    { type: BLOCK_TYPES.FLOWER, label: 'Flower', icon: 'icon-flower', width: 1, height: 1 },
    { type: BLOCK_TYPES.BUSH_PINK_FLOWER, label: 'Bush', icon: 'icon-bush-pink-flower', width: 1, height: 1 },
    { type: BLOCK_TYPES.PALM_TREE, label: 'Palm Trees', icon: 'icon-palm-tree', width: 1, height: 1 },
    { type: BLOCK_TYPES.TREE, label: 'Tree', icon: 'icon-tree', width: 1, height: 1 },
    { type: BLOCK_TYPES.BUSH_REINDEER, label: 'Bush Reindeer', icon: 'icon-bush-reindeer', width: 1, height: 1 }
];

// Tool modes
export const TOOL_MODES = {
    PLACE: 'place',
    ERASE: 'erase'
};

// Game modes
export const GAME_MODES = {
    BUILD: 'build',
    PLAY: 'play'
};

// World sprite mappings for Play Mode
// Maps block types to world-appropriate sprite keys
// Toolbar uses 'icon-*' assets, Play Mode uses 'world-*' assets
export const WORLD_SPRITES = {
    // Objects - use world-facing sprites in Play Mode
    [BLOCK_TYPES.GIRL]: 'world-girl',
    [BLOCK_TYPES.BOY]: 'world-boy',
    [BLOCK_TYPES.BUNNY]: 'world-bunny',
    [BLOCK_TYPES.UNICORN]: 'world-unicorn',
    [BLOCK_TYPES.FLOWER]: 'world-flower',
    [BLOCK_TYPES.BUSH_PINK_FLOWER]: 'world-bush-pink-flower',
    [BLOCK_TYPES.PALM_TREE]: 'world-palm-tree',
    [BLOCK_TYPES.TREE]: 'world-tree',
    [BLOCK_TYPES.BUSH_REINDEER]: 'world-bush-reindeer'
    // Ground tiles
    //GRASS_TILE: 'world-grass-tile'
};

// Player settings
export const PLAYER_COLOR = 0xFF6B6B;
export const PLAYER_SPEED = 200; // pixels per second

// Storage keys
export const STORAGE_KEY = 'bonnies_blocks_save';
export const CHILD_NAME_KEY = 'bonnies_blocks_child_name';

// Mobile breakpoint
export const MOBILE_BREAKPOINT = 600; // px

// Mobile favorites - subset of blocks/objects shown by default on mobile
export const MOBILE_FAVORITES = {
    // All basic colors (including Grey and Black)
    colors: [
        BLOCK_TYPES.GRASS,
        BLOCK_TYPES.TEAL,
        BLOCK_TYPES.BLUE,
        BLOCK_TYPES.PURPLE,
        BLOCK_TYPES.PINK,
        BLOCK_TYPES.RED,
        BLOCK_TYPES.ORANGE,
        BLOCK_TYPES.YELLOW,
        BLOCK_TYPES.WHITE,
        BLOCK_TYPES.GREY,
        BLOCK_TYPES.BLACK
    ],
    // All pattern colors
    patterns: [
        BLOCK_TYPES.WATER,
        BLOCK_TYPES.GLITTER_PINK,
        BLOCK_TYPES.RAINBOW
    ],
    // All objects
    objects: [
        BLOCK_TYPES.GIRL,
        BLOCK_TYPES.BOY,
        BLOCK_TYPES.BUNNY,
        BLOCK_TYPES.UNICORN,
        BLOCK_TYPES.FLOWER,
        BLOCK_TYPES.BUSH_PINK_FLOWER,
        BLOCK_TYPES.PALM_TREE,
        BLOCK_TYPES.TREE,
        BLOCK_TYPES.BUSH_REINDEER
    ]
};

// Helper function to check if mobile view
export function isMobileView() {
    // Check window width
    const windowWidth = window.innerWidth;
    
    // Also check game container width if available
    const gameContainer = document.getElementById('game-container');
    const containerWidth = gameContainer ? gameContainer.clientWidth : windowWidth;
    
    // Check canvas width if available
    const canvas = document.querySelector('canvas');
    const canvasWidth = canvas ? canvas.clientWidth : windowWidth;
    
    // Use the smallest width (most restrictive) for mobile detection
    const effectiveWidth = Math.min(windowWidth, containerWidth, canvasWidth);
    
    const isMobile = effectiveWidth <= MOBILE_BREAKPOINT;
    
    return isMobile;
}

// Helper function to check if a block type is a color (including patterns)
export function isColorBlock(blockType) {
    return PALETTE_COLORS.some(color => color.type === blockType) ||
           PALETTE_PATTERN_COLORS.some(color => color.type === blockType) ||
           PALETTE_PRETTY_COLORS.some(color => color.type === blockType);
}

// Helper function to check if a block has a pattern overlay
export function hasPattern(blockType) {
    return BLOCK_PATTERNS[blockType] !== undefined;
}

// Helper function to get pattern for a block type
export function getPattern(blockType) {
    return BLOCK_PATTERNS[blockType];
}

// Helper function to check if a block type is a world object (not flat terrain)
export function isWorldObject(blockType) {
    const objects = [
        BLOCK_TYPES.GIRL,
        BLOCK_TYPES.BOY,
        BLOCK_TYPES.BUNNY,
        BLOCK_TYPES.UNICORN,
        BLOCK_TYPES.FLOWER,
        BLOCK_TYPES.BUSH_PINK_FLOWER,
        BLOCK_TYPES.PALM_TREE,
        BLOCK_TYPES.TREE,
        BLOCK_TYPES.BUSH_REINDEER
    ];
    return objects.includes(blockType);
}

// Helper function to check if a block type is solid (blocks player movement)
export function isSolidBlock(blockType) {
    // Only world objects are solid (block movement)
    // Color/pattern tiles are walkable ground
    return isWorldObject(blockType);
}
