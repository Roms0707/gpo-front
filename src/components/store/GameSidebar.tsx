import React from 'react';

interface GameIcon {
  id: string;
  name: string;
  color: string;
  letter: string;
  active?: boolean;
}

const gameIcons: GameIcon[] = [
  { id: 'apex', name: 'Apex Legends', color: 'bg-red-600', letter: 'A' },
  { id: 'other', name: 'Game', color: 'bg-orange-500', letter: 'G' },
  { id: 'genshin', name: 'Genshin Impact', color: 'bg-blue-500', letter: 'G', active: true },
  { id: 'fortnite', name: 'Fortnite', color: 'bg-blue-600', letter: 'F' },
  { id: 'lol', name: 'League of Legends', color: 'bg-yellow-600', letter: 'L' },
  { id: 'overwatch', name: 'Overwatch', color: 'bg-orange-600', letter: 'O' },
  { id: 'rocket', name: 'Rocket League', color: 'bg-blue-400', letter: 'R' },
  { id: 'valorant', name: 'Valorant', color: 'bg-red-500', letter: 'V' },
  { id: 'warzone', name: 'Call of Duty', color: 'bg-green-700', letter: 'W' },
];

const GameSidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-16 bg-dark-200 border-r border-gray-800/50 min-h-screen pt-24 pb-8 px-2 gap-2 sticky top-0">
      {gameIcons.map((game) => (
        <button
          key={game.id}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
            game.active
              ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-200'
              : 'hover:bg-dark-100'
          } ${game.color}`}
          title={game.name}
        >
          <span className="text-white font-bold text-lg">{game.letter}</span>
        </button>
      ))}
    </aside>
  );
};

export default GameSidebar;
