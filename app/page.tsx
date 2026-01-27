'use client';

import { useState, useEffect } from 'react';

type CellState = 'empty' | 'seeded' | 'watered' | 'growing' | 'ready';

type GridState = CellState[][];

type Tool = 'shovel' | 'seeds';

export default function GardenGame() {
  const [grid, setGrid] = useState<GridState>(
    Array(6).fill(null).map(() => Array(6).fill('empty'))
  );
  const [score, setScore] = useState(0);
  const [selectedTool, setSelectedTool] = useState<Tool>('seeds');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play pop sound
  const playPopSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Background ambient sound
  useEffect(() => {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); // Very quiet

    const createNoise = () => {
      const bufferSize = 2 * audioContext.sampleRate;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioContext.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.connect(gainNode);
      whiteNoise.loop = true;
      whiteNoise.start();
    };

    createNoise();

    return () => {
      audioContext.close();
    };
  }, [soundEnabled]);

  const handleClick = (row: number, col: number) => {
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
      case 'ready': return '🌸';
      default: return '🟫';
    }
  };

  const getStageName = (cell: CellState): string => {
    switch (cell) {
      case 'empty': return 'Plant seed';
      case 'seeded': return 'Water';
      case 'watered': return 'Growing';
      case 'growing': return 'Almost ready';
      case 'ready': return 'Harvest!';
      default: return 'Plant seed';
    }
  };

  return (
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
          ⛏️
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
          {soundEnabled ? '🔊' : '🔇'}
        </button>
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
            <span>🌸</span>
          </div>
        </div>
      </div>
    </div>
  );
}
