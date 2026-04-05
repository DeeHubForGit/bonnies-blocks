// Game configuration constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TOOLBAR_HEIGHT = 80; // Height reserved for toolbar at bottom
export const PLAYABLE_HEIGHT = GAME_HEIGHT - TOOLBAR_HEIGHT; // 520px for grid
export const GRID_SIZE = 40; // Size of each grid cell in pixels
export const GRID_COLS = 20; // 800 / 40 = 20 columns
export const GRID_ROWS = 13; // 520 / 40 = 13 rows

// Block types
export const BLOCK_TYPES = {
    EMPTY: 'empty',
    GRASS: 'grass',
    PINK: 'pink',
    BLUE: 'blue',
    YELLOW: 'yellow',
    PURPLE: 'purple',
    BUNNY: 'bunny'
};

// Block colors for rendering
export const BLOCK_COLORS = {
    [BLOCK_TYPES.EMPTY]: null,
    [BLOCK_TYPES.GRASS]: 0x4CAF50,
    [BLOCK_TYPES.PINK]: 0xFF69B4,
    [BLOCK_TYPES.BLUE]: 0x3498DB,
    [BLOCK_TYPES.YELLOW]: 0xFFEB3B,
    [BLOCK_TYPES.PURPLE]: 0x9B59B6,
    [BLOCK_TYPES.BUNNY]: 0xFFFFFF
};

// Tool modes
export const TOOL_MODES = {
    PLACE: 'place',
    ERASE: 'erase'
};

// Player settings
export const PLAYER_COLOR = 0xFF6B6B;
export const PLAYER_SPEED = 200; // pixels per second

// Storage key
export const STORAGE_KEY = 'bonnies_blocks_save';
