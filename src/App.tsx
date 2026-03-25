import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from 'lucide-react';

const TRACKS = [
  { id: 1, title: "Neon Synthwave (AI Generated)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Cybernetic Pulse (AI Generated)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Digital Horizon (AI Generated)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

// --- Snake Game Component ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = 'UP';

type Point = { x: number, y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function SnakeGame({ onScoreChange }: { onScoreChange: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  
  const directionRef = useRef(direction);
  
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const generateFood = useCallback((): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    onScoreChange(0);
    setGameOver(false);
    setFood(generateFood());
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        setIsPaused(p => !p);
        return;
      }

      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Game Loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        // Check collisions
        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE ||
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            onScoreChange(newScore);
            return newScore;
          });
          setFood(generateFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, 150 - Math.floor(score / 50) * 10);
    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [direction, food, gameOver, isPaused, score, generateFood, onScoreChange]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / GRID_SIZE;
    const cellH = height / GRID_SIZE;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(width, i * cellH);
      ctx.stroke();
    }

    // Draw food
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(food.x * cellW + cellW / 2, food.y * cellH + cellH / 2, cellW / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ffcc' : '#00ccaa';
      if (index === 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.fillRect(segment.x * cellW + 1, segment.y * cellH + 1, cellW - 2, cellH - 2);
    });
    ctx.shadowBlur = 0;

  }, [snake, food]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 rounded-xl border border-cyan-500/30 bg-black/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,204,0.1)]">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-cyan-500/5 to-purple-500/5 pointer-events-none" />
      
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-black"
      />

      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-xl z-10">
          <h2 className="text-7xl font-digital text-[#ff00ff] mb-4 glitch-text drop-shadow-[0_0_20px_rgba(255,0,255,0.8)]" data-text="SYSTEM FAILURE">SYSTEM FAILURE</h2>
          <p className="text-3xl font-digital text-[#00ffff] mb-8 glitch-text" data-text={`SCORE: ${score}`}>SCORE: {score}</p>
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-transparent border-2 border-[#00ffff] text-[#00ffff] font-digital text-2xl hover:bg-[#ff00ff] hover:text-black hover:border-[#ff00ff] transition-all duration-300 uppercase shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,0,255,0.8)]"
          >
            REBOOT SEQUENCE
          </button>
        </div>
      )}

      {isPaused && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-xl z-10">
          <h2 className="text-7xl font-digital text-[#00ffff] tracking-widest glitch-text drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]" data-text="SIGNAL LOST">SIGNAL LOST</h2>
        </div>
      )}
      
      <div className="mt-6 text-2xl font-digital text-[#00ffff] flex gap-6 opacity-80 uppercase tracking-widest">
        <span><kbd className="bg-[#ff00ff]/20 px-3 py-1 border border-[#ff00ff] text-[#ff00ff] shadow-[0_0_10px_rgba(255,0,255,0.5)]">WASD</kbd> / <kbd className="bg-[#ff00ff]/20 px-3 py-1 border border-[#ff00ff] text-[#ff00ff] shadow-[0_0_10px_rgba(255,0,255,0.5)]">ARROWS</kbd> TO MOVE</span>
        <span><kbd className="bg-[#ff00ff]/20 px-3 py-1 border border-[#ff00ff] text-[#ff00ff] shadow-[0_0_10px_rgba(255,0,255,0.5)]">SPACE</kbd> TO PAUSE</span>
      </div>
    </div>
  );
}

// --- Music Player Component ---
function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="w-full max-w-md p-6 rounded-2xl border border-purple-500/30 bg-black/60 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.15)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleTrackEnd}
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          <Music className="text-white w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#00ffff] font-digital truncate text-3xl drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] glitch-text" data-text={currentTrack.title}>
            {currentTrack.title}
          </h3>
          <p className="text-[#ff00ff] font-digital text-xl truncate tracking-widest">TRACK {currentTrackIndex + 1} OF {TRACKS.length}</p>
        </div>
      </div>

      <div className="h-1.5 w-full bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={prevTrack}
            className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          
          <button 
            onClick={nextTrack}
            className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-20 accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative flex flex-col items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      <header className="mb-12 text-center z-10">
        <h1 
          className="text-8xl md:text-[12rem] font-digital tracking-widest mb-4 uppercase glitch-text text-white leading-none drop-shadow-[0_0_30px_rgba(0,255,255,0.8)]" 
          data-text="NEON SNAKE"
        >
          NEON SNAKE
        </h1>
        <div className="flex items-center justify-center gap-6 text-3xl font-digital">
          <span className="text-[#ff00ff] glitch-text" data-text="SCORE">SCORE</span>
          <span 
            className="text-6xl text-[#00ffff] glitch-text" 
            data-text={score.toString().padStart(4, '0')}
          >
            {score.toString().padStart(4, '0')}
          </span>
        </div>
      </header>

      <main className="z-10 flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-6xl">
        <div className="flex-1 flex justify-end">
          <SnakeGame onScoreChange={setScore} />
        </div>
        
        <div className="flex-1 flex justify-start w-full lg:w-auto">
          <MusicPlayer />
        </div>
      </main>
      
      <footer className="absolute bottom-4 text-[#ff00ff] font-digital text-2xl z-10 opacity-50 tracking-widest uppercase glitch-text" data-text="SYSTEM.ONLINE // AWAITING.INPUT">
        SYSTEM.ONLINE // AWAITING.INPUT
      </footer>
    </div>
  );
}
