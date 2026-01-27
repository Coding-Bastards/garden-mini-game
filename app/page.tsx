'use client';

import { useState } from 'react';

type CellState = 'empty' | 'seeded' | 'watered' | 'growing' | 'ready';

type GridState = CellState[][];

export default function GardenGame() {
  const [grid, setGrid] = useState<GridState>(
    Array(6).fill(null).map(() => Array(6).fill('empty'))
  );
  const [score, setScore] = useState(0);

  const handleClick = (row: number, col: number) => {
    const cell = grid[row][col];
    const newGrid = [...grid.map(r => [...r])];

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
      case 'ready':
        newGrid[row][col] = 'empty';
        setScore(s => s + 1);
        break;
    }

    setGrid(newGrid);
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
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 flex flex-col items-center justify-center p-4 font-mono">
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
                  className="w-full aspect-square bg-amber-800 hover:bg-amber-700 active:bg-amber-600 rounded flex items-center justify-center text-3xl transition-all duration-150 select-none touch-manipulation"
                  title={getStageName(cell)}
                >
                  {getCellEmoji(cell)}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-600">Tap to plant → water → grow → harvest!</p>
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
