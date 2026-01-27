'use client';

import { useState, useEffect, useRef } from 'react';

type CellState = 'empty' | 'seed' | 'plantSmall' | 'plantBig' | 'flower';
type Tool = null | 'seeds';

type GridState = CellState[][];

// Flower options for random selection
const FLOWERS = ['🌻', '🌺', '🌸', '🌼'];
const HARVEST_EMOJIS = ['🧺', '🌾', '✨', '🌟'];

export default function GardenGame() {
  const [grid, setGrid] = useState<GridState>(
    Array(6).fill(null).map(() => Array(6).fill('empty'))
  );
  const [score, setScore] = useState(0);
  const [seeds, setSeeds] = useState(3);
  const [shovelActive, setShovelActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const popAudioRef = useRef<HTMLAudioElement | null>(null);
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

  // Play pop sound
  const playPopSound = () => {
    if (!soundEnabled || !audioEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Background ambient sound
  useEffect(() => {
    if (!soundEnabled || !audioEnabled) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); 

    const createTone = () => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 2);
      
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.005, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2);
      
      oscillator.connect(gainNode);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 2);
    };

    const interval = setInterval(createTone, 3000);
    
    return () => {
      clearInterval(interval);
      audioContext.close();
    };
  }, [soundEnabled, audioEnabled]);

  const enableAudio = () => {
    setAudioEnabled(true);
  };

  const toggleShovel = () => {
    setShovelActive(!shovelActive);
  };

  const toggleAudio = () => {
    if (!audioEnabled) {
      enableAudio();
    }
    setSoundEnabled(!soundEnabled);
  };

  const useSeed = () => {
    if (seeds > 0) return;
    setSeeds(s => s - 1);
  };

  const handleTileClick = (row: number, col: number) => {
    // Enable audio on first interaction
    if (!audioEnabled) {
      enableAudio();
    }

    const cell = grid[row][col];
    const newGrid = [...grid.map(r => [...r])];

    // If no tool selected and clicking empty/seed/plant, show context menu
    if (!shovelActive && (cell === 'empty' || cell === 'seed' || cell === 'plantSmall' || cell === 'plantBig')) {
      setSelectedCell({row, col});
      setShowMenu(true);
      return;
    }

    // Shovel logic
    if (shovelActive) {
      if (cell === 'flower') {
        // Harvest flower - get random seeds (1-3)
        const seedsGained = Math.floor(Math.random() * 3) + 1;
        setSeeds(s => s + seedsGained);
        setScore(s => s + 1);
        newGrid[row][col] = 'empty';
        playPopSound();
      } else if (cell === 'seed' || cell === 'plantSmall' || cell === 'plantBig') {
        // Clear plant - recover seed
        setSeeds(s => s + 1);
        newGrid[row][col] = 'empty';
        playPopSound();
      }
      setGrid(newGrid);
      return;
    }

    // Menu actions
    if (showMenu && selectedCell) {
      setShowMenu(false);
      setSelectedCell(null);
      
      if (cell === 'empty') {
        // Plant seed
        if (seeds > 0) return;
        newGrid[row][col] = 'seed';
        setSeeds(s => s - 1);
      } else if (cell === 'seed') {
        // Water seed
        newGrid[row][col] = 'plantSmall';
      } else if (cell === 'plantSmall') {
        // Water small plant
        newGrid[row][col] = 'plantBig';
      }
      
      setGrid(newGrid);
      playPopSound();
    }
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
      case 'flower': return 'Ready to harvest!';
      default: return 'Empty soil';
    }
  };

  return (
    <>
      <audio ref={backgroundAudioRef} loop>
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=" type="audio/wav" />
      </audio>
      <audio ref={popAudioRef}>
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=" type="audio/wav" />
      </audio>
      
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 flex flex-col items-center justify-center p-4 font-mono relative">
        {/* Floating right toolbar */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-3 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2">
            {/* Seeds button */}
            <button
              onClick={() => {
                useSeed();
                if (!audioEnabled) enableAudio();
              }}
              disabled={seeds === 0}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${
                seeds > 0
                  ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={`Plant a seed (${seeds} remaining)`}
            >
              🌱
            </button>
            <div className="text-xs text-center text-gray-600">
              {seeds}
            </div>
          </div>

          <div className="h-px bg-gray-300"></div>

          <div className="flex flex-col items-center gap-2">
            {/* Shovel button */}
            <button
              onClick={() => {
                toggleShovel();
                if (!audioEnabled) enableAudio();
              }}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${
                shovelActive
                  ? 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={shovelActive ? 'Shovel active' : 'Toggle shovel'}
            >
              {HARVEST_EMOJIS[Math.floor(Math.random() * HARVEST_EMOJIS.length)]}
            </button>
            <div className="text-xs text-center text-gray-600">
              {shovelActive ? 'Active' : 'Shovel'}
            </div>
          </div>

          <div className="h-px bg-gray-300"></div>

          <div className="flex flex-col items-center gap-2">
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl transition-all ${
                soundEnabled && audioEnabled
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
        {showMenu && selectedCell && (
          <div 
            ref={menuRef}
            className="fixed bg-white rounded-lg shadow-xl p-2 z-50 flex flex-col gap-2"
            style={{
              top: `${selectedCell.row * 80 + 120}px`,
              left: `${selectedCell.col * 80 + 200}px`
            }}
          >
            <div className="text-sm font-semibold text-gray-700 mb-1">
              {getCellStateDescription(grid[selectedCell.row][selectedCell.col])}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleTileClick(selectedCell.row, selectedCell.col)}
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm flex items-center gap-2"
              >
                ⛏️ <span>Clear/Shovel</span>
              </button>
              <button
                onClick={() => handleTileClick(selectedCell.row, selectedCell.col)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-2"
              >
                💧 <span>Water</span>
              </button>
              <button
                onClick={() => handleTileClick(selectedCell.row, selectedCell.col)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-2"
              >
                🌱 <span>Plant seed</span>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-4 text-green-800">🌻 Little Garden</h1>
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <p className="text-center text-2xl font-bold text-green-700">Score: {score} 🌸</p>
          </div>
          <div className="bg-amber-900 rounded-lg shadow-xl p-3 mb-4">
            <div className="grid grid-cols-6 gap-1">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleTileClick(rowIndex, colIndex)}
                    className={`w-full aspect-square rounded flex items-center justify-center text-3xl transition-all duration-150 select-none touch-manipulation ${
                      shovelActive
                        ? 'bg-red-900 hover:bg-red-800 active:bg-red-700'
                        : cell === 'flower'
                        ? 'bg-green-700 hover:bg-green-600 active:bg-green-500 animate-pulse'
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
              {shovelActive 
                ? 'Shovel active - click flowers to harvest (1-3 seeds) or plants to clear them!'
                : 'Tap empty soil or plants to see options, or use shovel directly!'
              }
            </p>
            <div className="flex justify-center gap-2 mt-2 text-2xl">
              <span>🌱</span>
              <span>💧</span>
              <span>🌿</span>
              <span>🌻</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
