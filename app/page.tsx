'use client';

import { useState, useEffect, useRef } from 'react';

type CellState = 'empty' | 'seeded' | 'watered' | 'growing' | 'ready';

type GridState = CellState[][];

type Tool = 'shovel' | 'seeds';

// Flower options for random selection
const FLOWERS = ['🌻', '🌺', '🌸', '🌼'];
const HARVEST_EMOJIS = ['🧺', '🌾', '✨', '🌟'];

export default function GardenGame() {
  const [grid, setGrid] = useState<GridState>(
    Array(6).fill(null).map(() => Array(6).fill('empty'))
  );
  const [score, setScore] = useState(0);
  const [selectedTool, setSelectedTool] = useState<Tool>('seeds');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [flowerGrid, setFlowerGrid] = useState<string[][]>([]);
  
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const popAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize flower grid with random flower selection
  useEffect(() => {
    const flowers = Array(6).fill(null).map(() => 
      Array(6).fill(null).map(() => 
        FLOWERS[Math.floor(Math.random() * FLOWERS.length)]
      )
    );
    setFlowerGrid(flowers);
  }, []);

  // Play pop sound
  const playPopSound = () => {
    if (!soundEnabled || !audioEnabled) return;
    if (popAudioRef.current) {
      popAudioRef.current.currentTime = 0;
      popAudioRef.current.play();
    }
  };

  // Background ambient sound
  useEffect(() => {
    if (!soundEnabled || !audioEnabled) {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      return;
    }

    // Create a simple relaxing tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.02, audioContext.currentTime); // Very quiet

    // Create a gentle ambient tone (like a soft wind chime)
    const createTone = () => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 2);
      
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
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

  const handleClick = (row: number, col: number) => {
    // Enable audio on first interaction
    if (!audioEnabled) {
      enableAudio();
    }

    const cell = grid[row][col];
    const newGrid = [...grid.map(r => [...r])];

    if (selectedTool === 'shovel') {
      // Shovel clears any tile back to empty (harvests flower or clears tile)
      if (cell === 'ready') {
        setScore(s => s + 1); // Harvest flower
      }
      newGrid[row][col] = 'empty';
    } else {
      // Seeds tool - normal growth cycle
      if (cell === 'ready') {
        // Flower is final state, nothing happens
        return;
      }

      switch (cell) {
        case 'empty':
          newGrid[row][col] = 'seeded';
          break;
        case 'seeded':
          newGrid[row][col] = 'watered';
          break;
        case 'watered':
          newGrid[row][col] = 'growing';
          break;
        case 'growing':
          newGrid[row][col] = 'ready';
          break;
      }
    }

    setGrid(newGrid);
    playPopSound();
  };

  const getCellEmoji = (cell: CellState): string => {
    switch (cell) {
      case 'empty': return '🟫';
      case 'seeded': return '🌱';
      case 'watered': return '💧';
      case 'growing': return '🌿';
      case 'ready': return flowerGrid[row]?.[col] || '🌸';
      default: return '🟫';
    }
  };

  const getStageName = (cell: CellState): string => {
    switch (cell) {
      case 'empty': return 'Plant seed';
      case 'seeded': return 'Water';
      case 'watered': return 'Growing';
      case 'growing': return 'Almost ready';
      case 'ready': return `Harvest ${flowerGrid[row]?.[col] || '🌸'}!`;
      default: return 'Plant seed';
    }
  };

  // Create hidden audio elements
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
          <button
            onClick={() => setSelectedTool('seeds')}
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${
              selectedTool === 'seeds'
                ? 'bg-green-500 text-white shadow-lg scale-110'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Seeds - Plant and grow"
          >
            🌱
          </button>
          <button
            onClick={() => setSelectedTool('shovel')}
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl transition-all ${
              selectedTool === 'shovel'
                ? 'bg-amber-500 text-white shadow-lg scale-110'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="Shovel - Clear or harvest"
          >
            {HARVEST_EMOJIS[Math.floor(Math.random() * HARVEST_EMOJIS.length)]}
          </button>
          <div className="text-xs text-center text-gray-500">
            Seeds: 99
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-14 h-10 rounded-lg flex items-center justify-center text-sm transition-all ${
              soundEnabled
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
            title="Toggle sound"
          >
            {soundEnabled && audioEnabled ? '🔊' : '🔇'}
          </button>
          {!audioEnabled && (
            <div className="text-xs text-center text-red-500">
              Tap to enable
            </div>
          )}
        </div>

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
                    onClick={() => handleClick(rowIndex, colIndex)}
                    className={`w-full aspect-square rounded flex items-center justify-center text-3xl transition-all duration-150 select-none touch-manipulation ${
                      selectedTool === 'shovel'
                        ? 'bg-red-900 hover:bg-red-800 active:bg-red-700'
                        : 'bg-amber-800 hover:bg-amber-700 active:bg-amber-600'
                    } ${
                      cell === 'ready' ? 'animate-pulse' : ''
                    }`}
                    title={getStageName(cell)}
                  >
                    {getCellEmoji(cell)}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              {selectedTool === 'seeds' ? 'Tap to plant → water → grow → harvest!' : 'Use shovel to clear or harvest flowers!'}
            </p>
            <div className="flex justify-center gap-2 mt-2 text-2xl">
              <span>🌱</span>
              <span>💧</span>
              <span>🌿</span>
              <span>🌻</span>
              <span>🌺</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
