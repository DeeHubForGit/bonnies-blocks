# Bonnie's Blocks - Builder Game Prototype

A simple 2D top-down builder game made with Phaser 3.

## Features

- **Move** your character with Arrow Keys or WASD
- **Place blocks** by clicking on the grid
- **5 colored blocks**: Grass, Pink, Blue, Yellow, Purple
- **Bunny placement**: Add cute bunnies to your world
- **Erase mode**: Remove blocks you don't want
- **Multiple Saved Worlds**: Save and manage multiple named worlds
- **Friendly Dialogs**: Child-friendly modal system for save/load/clear
- **Clear**: Start fresh with a new world

## How to Run

1. Simply open `index.html` in a modern web browser
2. No build process or server needed!

## Controls

### Movement
- **Arrow Keys** or **WASD** - Move your character around

### Building
- **Mouse Click** - Place the selected block/item on the grid
- **Toolbar Buttons** - Select which block type to place
- **Erase Button** - Switch to erase mode to remove blocks

### Actions
- **Save** - Opens a dialog to name and save your world
- **Load** - Shows a list of saved worlds to choose from
- **Clear** - Clear the entire world (shows friendly confirmation dialog)

## Project Structure

```
Bonnies Blocks/
├── index.html              # Main HTML file
├── src/
│   ├── main.js            # Game initialization
│   ├── scenes/
│   │   └── GameScene.js   # Main game scene (grid, player, rendering)
│   ├── ui/
│   │   ├── Toolbar.js     # Toolbar UI component
│   │   └── Modal.js       # Reusable modal/dialog system
│   ├── utils/
│   │   └── storage.js     # Multi-world save/load utilities
│   ├── data/
│   │   └── constants.js   # Game configuration constants
│   └── assets/
│       └── icons/         # Icon image assets (bunny, save, load, etc.)
└── README.md              # This file
```

## Technical Details

- **Framework**: Phaser 3.70.0 (loaded from CDN)
- **Grid**: 20x15 cells, 40 pixels per cell
- **Rendering**: Simple 2D top-down (not isometric)
- **Storage**: Browser localStorage
- **No build tool required**: Pure ES6 modules

## Future Enhancements

This is V1 - a proof of concept. Potential improvements:

- Isometric rendering
- More animals and objects
- Block collision
- Simple animations
- More block types
- Multiple maps
- Undo/redo functionality

## Notes

- **Multiple Saves**: You can save multiple worlds with different names (e.g., "Bonnie 1", "My Castle", etc.)
- **Auto-naming**: Default names are suggested when saving (Bonnie 1, Bonnie 2, etc.)
- **Load List**: The Load dialog shows all your saved worlds with timestamps
- **Child-Friendly UI**: All dialogs use soft colors and rounded corners instead of harsh browser popups
- **Migration**: Old single-save format is automatically migrated to the new multi-save system
- You cannot place blocks on your character's current position
- Blocks merge together seamlessly when placed side-by-side
- Icon-based toolbar is designed for non-readers

Enjoy building! 🎮🐰✨
