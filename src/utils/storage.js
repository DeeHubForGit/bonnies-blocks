import { STORAGE_KEY, CHILD_NAME_KEY } from '../data/constants.js';

const WORLDS_KEY = STORAGE_KEY + '_worlds';

/**
 * Get the stored child name or default to 'Bunnies'
 */
export function getChildName() {
    const storedName = localStorage.getItem(CHILD_NAME_KEY);
    return storedName && storedName.trim() ? storedName.trim() : 'Bunnies';
}

/**
 * Save the child name to localStorage
 * Enforces 20-character limit
 */
export function saveChildName(name) {
    const trimmed = name ? name.trim() : '';
    // Enforce 20-character limit
    const limited = trimmed.substring(0, 20);
    const finalName = limited || 'Bunnies';
    localStorage.setItem(CHILD_NAME_KEY, finalName);
    return finalName;
}

/**
 * Migrate old single-save format to new multi-save format
 */
function migrateOldSave() {
    try {
        const oldSave = localStorage.getItem(STORAGE_KEY);
        if (oldSave && !localStorage.getItem(WORLDS_KEY)) {
            const parsed = JSON.parse(oldSave);
            const migratedWorld = {
                name: `${getChildName()} 1`,
                grid: parsed.grid,
                playerPosition: parsed.playerPosition,
                savedAt: parsed.timestamp || Date.now()
            };
            localStorage.setItem(WORLDS_KEY, JSON.stringify([migratedWorld]));
            localStorage.removeItem(STORAGE_KEY);
            console.log('[Storage] Migrated old save to new format');
        }
    } catch (error) {
        console.error('[Storage] Migration failed:', error);
    }
}

/**
 * Get all saved worlds
 */
export function getAllWorlds() {
    try {
        // Check for old save format and migrate
        migrateOldSave();
        
        const data = localStorage.getItem(WORLDS_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('[Storage] Failed to get worlds:', error);
        return [];
    }
}

/**
 * Save a named world
 */
export function saveWorld(name, worldData) {
    try {
        const worlds = getAllWorlds();
        
        const saveData = {
            name: name,
            grid: worldData.grid,
            playerPosition: worldData.playerPosition,
            savedAt: Date.now()
        };

        // Check if world with this name exists (case-insensitive)
        const normalisedName = (name || '').trim().toLowerCase();
        const existingIndex = worlds.findIndex(w => (w.name || '').trim().toLowerCase() === normalisedName);
        if (existingIndex >= 0) {
            // Overwrite existing world
            worlds[existingIndex] = saveData;
        } else {
            // Add new world
            worlds.push(saveData);
        }

        localStorage.setItem(WORLDS_KEY, JSON.stringify(worlds));
        console.log('[Storage] World saved successfully:', name);
        return true;
    } catch (error) {
        console.error('[Storage] Failed to save world:', error);
        return false;
    }
}

/**
 * Load a specific world by name
 */
export function loadWorld(name) {
    try {
        const worlds = getAllWorlds();
        const world = worlds.find(w => w.name === name);
        
        if (!world) {
            console.log('[Storage] World not found:', name);
            return null;
        }
        
        console.log('[Storage] World loaded successfully:', name);
        return {
            grid: world.grid,
            playerPosition: world.playerPosition
        };
    } catch (error) {
        console.error('[Storage] Failed to load world:', error);
        return null;
    }
}

/**
 * Find a world by name (case-insensitive)
 */
export function findWorldByName(name) {
    const searchName = (name || '').trim().toLowerCase();
    if (!searchName) {
        return null;
    }

    const worlds = getAllWorlds();
    return worlds.find(w => (w.name || '').trim().toLowerCase() === searchName) || null;
}

/**
 * Delete a specific world
 */
export function deleteWorld(name) {
    try {
        const worlds = getAllWorlds();
        const normalisedName = (name || '').trim().toLowerCase();
        const filtered = worlds.filter(w => (w.name || '').trim().toLowerCase() !== normalisedName);
        localStorage.setItem(WORLDS_KEY, JSON.stringify(filtered));
        console.log('[Storage] World deleted:', name);
        return true;
    } catch (error) {
        console.error('[Storage] Failed to delete world:', error);
        return false;
    }
}

/**
 * Generate a default world name
 */
export function generateDefaultWorldName() {
    const worlds = getAllWorlds();
    const childName = getChildName();
    let counter = 1;
    let name = `${childName} ${counter}`;
    
    while (worlds.some(w => (w.name || '').trim().toLowerCase() === name.toLowerCase())) {
        counter++;
        name = `${childName} ${counter}`;
    }
    
    return name;
}

/**
 * Clear all saved world data
 */
export function clearWorld() {
    try {
        localStorage.removeItem(WORLDS_KEY);
        console.log('[Storage] All world data cleared');
        return true;
    } catch (error) {
        console.error('[Storage] Failed to clear worlds:', error);
        return false;
    }
}
