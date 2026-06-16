# Bonnie's Blocks

A fun world-building game made with Phaser 3. Create colourful worlds, place animals and people, explore in 2D or Isometric mode, and bring your world to life with animations and sounds.

## Features

- **Move** your character with Arrow Keys or WASD
- **Build worlds** using multiple colours and terrain types
- **Place animals and objects** including bunnies, unicorns, dragons, trees and more
- **Erase mode**: Remove blocks and objects you don't want
- **Multiple Saved Worlds**: Save and manage multiple named worlds
- **Friendly Dialogs**: Child-friendly modal system for save/load/clear
- **2D and Isometric Modes**
- **Interactive Animals**:
  - Bunnies bounce
  - Unicorns create rainbow effects
  - Dragons breathe fire
  - Dolphins jump from the water
  - Turtles appear in the ocean
- **Animated Effects**: Clouds, fire, sparkles and other visual effects
- **Sound Effects**
- **Mobile Friendly**: Designed for phones, tablets and desktop devices

## How to Run

1. Simply open `index.html` in a modern web browser
2. No build process or server needed!

## Controls

### Movement

- **Arrow Keys** or **WASD** - Move your character around

### Building

- **Mouse Click / Tap** - Place the selected block, animal or object
- **Toolbar Buttons** - Select what to place
- **Erase Button** - Switch to erase mode

### Actions

- **Save** - Opens a dialog to name and save your world
- **Load** - Shows a list of saved worlds
- **Clear** - Clear the entire world
- **View Mode** - Switch between 2D and Isometric views

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

- **Framework**: Phaser 3.70.0
- **Storage**: Browser localStorage
- **Views**: 2D and Isometric
- **Platforms**: Desktop, Tablet and Mobile
- **No build tool required**: Pure ES6 modules

## Future Enhancements

Potential improvements:

- More animals and creatures
- Additional world objects
- Weather effects
- More sounds and animations
- Additional character types
- New world themes

## Notes

- **Multiple Saves**: You can save multiple worlds with different names
- **Auto-naming**: Default names are suggested when saving
- **Load List**: The Load dialog shows saved worlds with timestamps
- **Child-Friendly UI**: Soft colours and friendly dialogs throughout
- **Mobile Friendly**: Touch-friendly controls and layouts
- You cannot place blocks on your character's current position
- Blocks merge together seamlessly when placed side-by-side
- Icon-based toolbar is designed for non-readers

Enjoy building! 🎮🐰🦄🐉✨