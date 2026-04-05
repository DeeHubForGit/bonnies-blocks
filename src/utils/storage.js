import { STORAGE_KEY } from '../data/constants.js';

/**
 * Save the game world state to localStorage
 */
export function saveWorld(worldData) {
    try {
        const saveData = {
            grid: worldData.grid,
            playerPosition: worldData.playerPosition,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
        console.log('[Storage] World saved successfully');
        return true;
    } catch (error) {
        console.error('[Storage] Failed to save world:', error);
        return false;
    }
}

/**
 * Load the game world state from localStorage
 */
export function loadWorld() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            console.log('[Storage] No saved world found');
            return null;
        }
        
        const parsed = JSON.parse(savedData);
        console.log('[Storage] World loaded successfully');
        return {
            grid: parsed.grid,
            playerPosition: parsed.playerPosition
        };
    } catch (error) {
        console.error('[Storage] Failed to load world:', error);
        return null;
    }
}

/**
 * Clear saved world data
 */
export function clearWorld() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[Storage] World data cleared');
        return true;
    } catch (error) {
        console.error('[Storage] Failed to clear world:', error);
        return false;
    }
}
