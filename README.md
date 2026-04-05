# Bonnie's Blocks - Builder Game Prototype

A simple 2D top-down builder game made with Phaser 3.

## Features

- **Move** your character with Arrow Keys or WASD
- **Place blocks** by clicking on the grid
- **5 colored blocks**: Grass, Pink, Blue, Yellow, Purple
- **Bunny placement**: Add cute bunnies to your world
- **Erase mode**: Remove blocks you don't want
- **Save/Load**: Your world is saved to localStorage
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
- **Save** - Save your world to browser storage
- **Load** - Load your previously saved world
- **Clear** - Clear the entire world (confirms before clearing)

## Project Structure

```
Bonnies Blocks/
├── index.html              # Main HTML file
├── src/
│   ├── main.js            # Game initialization
│   ├── scenes/
│   │   └── GameScene.js   # Main game scene (grid, player, rendering)
│   ├── ui/
│   │   └── Toolbar.js     # Toolbar UI component
│   ├── utils/
│   │   └── storage.js     # Save/load utilities
│   └── data/
│       └── constants.js   # Game configuration constants
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

- The world state is saved automatically when you click "Save"
- The game will auto-load your saved world when you refresh the page
- You cannot place blocks on your character's current position
- All assets are generated with code (no image files needed)

Enjoy building! 🎮🐰✨
