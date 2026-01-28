'use client';

import { useState, useEffect, useRef } from 'react';

type CellState = 'empty' | 'seed' | 'plantSmall' | 'plantBig' | 'flower';
type ActiveAction = null | 'plant' | 'shovel' | 'water' | 'harvest';

type GridState = CellState[][];

// Flower options for random selection
const FLOWERS = ['🌻', '🌺', '🌸', '🌼'];
const HARVEST_EMOJIS = ['🧺', '🌾', '✨', '🌟'];

export default function GardenGame() {
  const [grid, setGrid] = useState<GridState>(
    Array(6).fill(null).map(() => Array(6).fill('empty'))
  );
  const [score, setScore] = useState(0);
  const [harvested, setHarvested] = useState(0);
  const [seeds, setSeeds] = useState(3);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);

  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setSelectedCell(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Background music setup
  useEffect(() => {
    if (!soundEnabled || !audioEnabled) {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      return;
    }

    // Create audio element for background music
    if (!backgroundAudioRef.current) {
      backgroundAudioRef.current = new Audio('/garden-ambient.mp3');
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.005; // Very quiet ambient
    }

    // Play background music
    backgroundAudioRef.current.play().catch(console.error);

    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    };
  }, [soundEnabled, audioEnabled]);

  // 8-bit pop sound
  const playPopSound = () => {
    if (!soundEnabled || !audioEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // 8-bit style - square wave with envelope
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

    // ADSR envelope for 8-bit feel
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  };

  // 8-bit harvest sound
  const playHarvestSound = () => {
    if (!soundEnabled || !audioEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Create two oscillators for 8-bit harmony
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'square';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  };

  // 8-bit water sound
  const playWaterSound = () => {
    if (!soundEnabled || !audioEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  };

  const enableAudio = () => {
    setAudioEnabled(true);
  };

  const toggleAction = (action: ActiveAction) => {
    if (activeAction === action) {
      setActiveAction(null); // Deactivate if already active
    } else {
      setActiveAction(action); // Activate new action
    }
  };

  const toggleAudio = () => {
    if (!audioEnabled) {
      enableAudio();
    }
    setSoundEnabled(!soundEnabled);
  };

  const handleTileClick = (row: number, col: number, event?: React.MouseEvent) => {
    // Enable audio on first interaction
    if (!audioEnabled) {
      enableAudio();
    }

    const cell = grid[row][col];
    const newGrid = [...grid.map(r => [...r])];

    // If no action selected, show context menu
    if (!activeAction) {
      setSelectedCell({ row, col });
      setShowMenu(true);
      if (event) {
        setMenuPosition({ x: event.clientX, y: event.clientY });
      }
      return;
    }

    // Action-based logic
    if (activeAction === 'plant') {
      if (cell === 'empty') {
        // Plant seed - if we have seeds
        if (seeds > 0) {
          setSeeds(s => s - 1);
          newGrid[row][col] = 'seed';
          playPopSound();
        }
      }
    } else if (activeAction === 'shovel') {
      if (cell === 'flower') {
        // Shovel harvest - get random seeds (1-3) + play harvest sound
        const seedsGained = Math.floor(Math.random() * 3) + 1;
        setSeeds(s => s + seedsGained);
        setScore(s => s + 1);
        setHarvested(h => h + 1);
        newGrid[row][col] = 'empty';
        playHarvestSound();
      } else if (cell === 'seed' || cell === 'plantSmall' || cell === 'plantBig') {
        // Clear plant - recover seed
        setSeeds(s => s + 1);
        newGrid[row][col] = 'empty';
        playPopSound();
      }
    } else if (activeAction === 'water') {
      if (cell === 'seed') {
        // Water seed -> becomes small plant
        newGrid[row][col] = 'plantSmall';
        playWaterSound();
      } else if (cell === 'plantSmall') {
        // Water small plant -> becomes big plant
        newGrid[row][col] = 'flower';
        playWaterSound();
      }
    } else if (activeAction === 'harvest') {
      if (cell === 'flower') {
        // Basket harvest - get random seeds (1-3) + play harvest sound
        const seedsGained = Math.floor(Math.random() * 3) + 1;
        setSeeds(s => s + seedsGained);
        setScore(s => s + 1);
        setHarvested(h => h + 1);
        newGrid[row][col] = 'empty';
        playHarvestSound();
      }
    }

    setGrid(newGrid);
  };

  const getCellEmoji = (cell: CellState): string => {
    switch (cell) {
      case 'empty': return '🟫';
      case 'seed': return '🌱';
      case 'plantSmall': return '🌿';
      case 'plantBig': return '🌱';
      case 'flower': return FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
      default: return '🟫';
    }
  };

  const getCellStateDescription = (cell: CellState): string => {
    switch (cell) {
      case 'empty': return 'Empty soil';
      case 'seed': return 'Planted seed';
      case 'plantSmall': return 'Small plant';
      case 'plantBig': return 'Growing plant';
      case 'flower': return `Ready to harvest!`;
      default: return 'Empty soil';
    }
  };

  const isActionActive = (action: ActiveAction) => {
    return activeAction === action;
  };

  const canBeAffectedByTool = (cell: CellState, tool: ActiveAction): boolean => {
    switch (tool) {
      case 'plant':
        return cell === 'empty';
      case 'water':
        return cell === 'seed' || cell === 'plantSmall';
      case 'shovel':
        return cell === 'seed' || cell === 'plantSmall' || cell === 'plantBig' || cell === 'flower';
      case 'harvest':
        return cell === 'flower';
      default:
        return false;
    }
  };

  const getToolColor = (tool: ActiveAction): string => {
    switch (tool) {
      case 'plant':
        return 'bg-green-900';
      case 'water':
        return 'bg-blue-900';
      case 'shovel':
        return 'bg-red-900';
      case 'harvest':
        return 'bg-pink-900';
      default:
        return 'bg-amber-800';
    }
  };

  const handleContextAction = (action: ActiveAction) => {
    if (!selectedCell) return;

    const cell = grid[selectedCell.row][selectedCell.col];
    const newGrid = [...grid.map(r => [...r])];

    // Action-based logic (same as handleTileClick but without state dependency)
    if (action === 'plant') {
      if (cell === 'empty' && seeds > 0) {
        setSeeds(s => s - 1);
        newGrid[selectedCell.row][selectedCell.col] = 'seed';
        playPopSound();
      }
    } else if (action === 'shovel') {
      if (cell === 'flower') {
        const seedsGained = Math.floor(Math.random() * 3) + 1;
        setSeeds(s => s + seedsGained);
        setScore(s => s + 1);
        setHarvested(h => h + 1);
        newGrid[selectedCell.row][selectedCell.col] = 'empty';
        playHarvestSound();
      } else if (cell === 'seed' || cell === 'plantSmall' || cell === 'plantBig') {
        setSeeds(s => s + 1);
        newGrid[selectedCell.row][selectedCell.col] = 'empty';
        playPopSound();
      }
    } else if (action === 'water') {
      if (cell === 'seed') {
        newGrid[selectedCell.row][selectedCell.col] = 'plantSmall';
        playWaterSound();
      } else if (cell === 'plantSmall') {
        newGrid[selectedCell.row][selectedCell.col] = 'flower';
        playWaterSound();
      }
    } else if (action === 'harvest') {
      if (cell === 'flower') {
        const seedsGained = Math.floor(Math.random() * 3) + 1;
        setSeeds(s => s + seedsGained);
        setScore(s => s + 1);
        setHarvested(h => h + 1);
        newGrid[selectedCell.row][selectedCell.col] = 'empty';
        playHarvestSound();
      }
    }

    setGrid(newGrid);
    setShowMenu(false);
    setSelectedCell(null);
  };

  return (
    <>
      <audio ref={backgroundAudioRef} src="/garden-ambient.mp3" loop />

      <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 flex flex-col items-center justify-center p-4 font-mono relative">
        {/* Floating right toolbar */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-3 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2">
            {/* Plant button */}
            <button
              onClick={() => {
                toggleAction('plant');
                if (!audioEnabled) enableAudio();
              }}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${isActionActive('plant')
                ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isActionActive('plant') ? 'Plant active (tap to deactivate)' : 'Plant (tap to activate)'}
            >
              🌱
            </button>
            <div className="text-xs text-center text-gray-600">
              Seeds: {seeds}
            </div>
          </div>

          <div className="h-px bg-gray-300"></div>

          <div className="flex flex-col items-center gap-2">
            {/* Shovel button */}
            <button
              onClick={() => {
                toggleAction('shovel');
                if (!audioEnabled) enableAudio();
              }}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${isActionActive('shovel')
                ? 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isActionActive('shovel') ? 'Shovel active (tap to deactivate)' : 'Shovel (tap to activate)'}
            >
              ⛏️
            </button>
            <div className="text-xs text-center text-gray-600">
              {isActionActive('shovel') ? 'Active' : 'Shovel'}
            </div>
          </div>

          <div className="h-px bg-gray-300"></div>

          <div className="flex flex-col items-center gap-2">
            {/* Water button */}
            <button
              onClick={() => {
                toggleAction('water');
                if (!audioEnabled) enableAudio();
              }}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${isActionActive('water')
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isActionActive('water') ? 'Water active (tap to deactivate)' : 'Water (tap to activate)'}
            >
              💧
            </button>
            <div className="text-xs text-center text-gray-600">
              {isActionActive('water') ? 'Active' : 'Water'}
            </div>
          </div>

          <div className="h-px bg-gray-300"></div>

          <div className="flex flex-col items-center gap-2">
            {/* Harvest/Basket button */}
            <button
              onClick={() => {
                toggleAction('harvest');
                if (!audioEnabled) enableAudio();
              }}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${isActionActive('harvest')
                ? 'bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              title={isActionActive('harvest') ? 'Harvest active (tap to deactivate)' : 'Harvest (tap to activate)'}
            >
              🧺
            </button>
            <div className="text-xs text-center text-gray-600">
              {isActionActive('harvest') ? 'Active' : 'Harvest'}
            </div>
          </div>

          <div className="h-px bg-gray-300"></div>

          <div className="flex flex-col items-center gap-2">
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl transition-all ${soundEnabled && audioEnabled
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              title="Toggle sound"
            >
              {soundEnabled && audioEnabled ? '🔊' : '🔇'}
            </button>
            <div className="text-xs text-center text-gray-600">
              {soundEnabled && audioEnabled ? 'Sound on' : 'Sound off'}
            </div>
          </div>

          {!audioEnabled && (
            <div className="text-xs text-center text-blue-600 mt-2">
              Tap to enable
            </div>
          )}
        </div>

        {/* Context menu */}
        {showMenu && selectedCell && menuPosition && (
          <div
            ref={menuRef}
            className="fixed bg-white rounded-lg shadow-xl p-2 z-50 flex flex-col gap-2"
            style={{
              top: `${menuPosition.y}px`,
              left: `${menuPosition.x}px`
            }}
          >
            <div className="text-sm font-semibold text-gray-700 mb-1">
              {getCellStateDescription(grid[selectedCell.row][selectedCell.col])}
            </div>
            <div className="flex flex-col gap-1">
              {grid[selectedCell.row][selectedCell.col] === 'empty' && (
                <button
                  onClick={() => handleContextAction('plant')}
                  className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-2 ${seeds === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={seeds === 0}
                >
                  🌱 <span>Plant seed {seeds === 0 ? '(empty)' : ''}</span>
                </button>
              )}
              {grid[selectedCell.row][selectedCell.col] !== 'empty' && (
                <button
                  onClick={() => handleContextAction('shovel')}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm flex items-center gap-2"
                >
                  ⛏️ <span>Clear/Shovel</span>
                </button>
              )}
              {(grid[selectedCell.row][selectedCell.col] === 'seed' || grid[selectedCell.row][selectedCell.col] === 'plantSmall') && (
                <button
                  onClick={() => handleContextAction('water')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-2"
                >
                  💧 <span>Water</span>
                </button>
              )}
              {grid[selectedCell.row][selectedCell.col] === 'flower' && (
                <button
                  onClick={() => handleContextAction('harvest')}
                  className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm flex items-center gap-2"
                >
                  🧺 <span>Harvest/Basket</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-4 text-green-800">🌻 Little Garden</h1>
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-around">
            <div className="text-center">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-2xl font-bold text-green-700">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Harvested</p>
              <p className="text-2xl font-bold text-green-700">{harvested}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Seeds</p>
              <p className="text-2xl font-bold text-green-700">{seeds}</p>
            </div>
          </div>
          <div className="bg-amber-900 rounded-lg shadow-xl p-3 mb-4">
            <div className="grid grid-cols-6 gap-1">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={(e) => handleTileClick(rowIndex, colIndex, e)}
                    className={`w-full aspect-square rounded flex items-center justify-center text-3xl transition-all duration-150 select-none touch-manipulation ${activeAction && canBeAffectedByTool(cell, activeAction)
                      ? getToolColor(activeAction) + ' hover:bg-opacity-80 active:bg-opacity-60'
                      : cell === 'flower'
                        ? 'bg-pink-700 hover:bg-pink-600 active:bg-pink-500 animate-pulse'
                        : 'bg-amber-800 hover:bg-amber-700 active:bg-amber-600'
                      }`}
                    title={getCellStateDescription(cell)}
                  >
                    {getCellEmoji(cell)}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              {activeAction
                ? `${activeAction === 'plant' ? 'Plant' : activeAction === 'shovel' ? 'Shovel' : activeAction === 'water' ? 'Water' : 'Harvest'} active - tap to deactivate or use tool!`
                : 'No tool selected - tap soil/plant to see actions!'
              }
            </p>
            <div className="flex justify-center gap-2 mt-2 text-2xl">
              <span>🌱</span>
              <span>💧</span>
              <span>🌿</span>
              <span>🌻</span>
              <span>⛏️</span>
              <span>🧺</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
