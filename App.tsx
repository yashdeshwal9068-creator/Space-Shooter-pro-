import { useRef, useState, useEffect, useCallback } from 'react';
import { useGame, GameSnapshot } from './hooks/useGame';

const CANVAS_W = 480;
const CANVAS_H = 700;

function MenuScreen({ onStart, highScore }: { onStart: () => void; highScore: number }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none select-none">
      {/* Title */}
      <div className="text-center mb-8">
        <div
          className="text-6xl font-black tracking-widest mb-1"
          style={{
            fontFamily: '"Courier New", monospace',
            color: '#00e5ff',
            textShadow: `0 0 20px #00e5ff, 0 0 40px #0099ff, 0 0 ${10 + Math.sin(frame * 0.1) * 5}px #00e5ff`,
            transform: `scale(${1 + Math.sin(frame * 0.05) * 0.02})`
          }}
        >
          SPACE
        </div>
        <div
          className="text-6xl font-black tracking-widest"
          style={{
            fontFamily: '"Courier New", monospace',
            color: '#ff4081',
            textShadow: `0 0 20px #ff4081, 0 0 40px #ff0055, 0 0 ${10 + Math.sin(frame * 0.1 + 1) * 5}px #ff4081`,
          }}
        >
          SHOOTER
        </div>
      </div>

      {/* Ship preview */}
      <div className="text-6xl mb-8" style={{ filter: 'drop-shadow(0 0 16px #00e5ff)' }}>🚀</div>

      {/* Instructions */}
      <div
        className="rounded-xl border border-cyan-500/30 bg-black/60 px-8 py-5 mb-8 text-center"
        style={{ backdropFilter: 'blur(8px)', boxShadow: '0 0 30px rgba(0,200,255,0.1)' }}
      >
        <div className="text-cyan-300 font-mono text-sm space-y-1.5">
          <div>🕹 <span className="text-white">MOVE:</span> Arrow Keys / WASD</div>
          <div>🔫 <span className="text-white">SHOOT:</span> Space / Z</div>
          <div>⏸ <span className="text-white">PAUSE:</span> P or Escape</div>
        </div>
        <div className="mt-4 pt-4 border-t border-cyan-900/50 grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="text-yellow-300">🛡 SHIELD</div>
          <div className="text-yellow-300">⚡ RAPID FIRE</div>
          <div className="text-pink-300">✦ TRIPLE SHOT</div>
          <div className="text-orange-300">💣 BOMB</div>
        </div>
      </div>

      {highScore > 0 && (
        <div
          className="font-mono text-yellow-400 text-sm mb-4"
          style={{ textShadow: '0 0 10px #ffeb3b' }}
        >
          🏆 BEST: {highScore.toLocaleString()}
        </div>
      )}

      {/* Start button */}
      <button
        className="pointer-events-auto px-10 py-4 rounded-full font-black text-xl tracking-widest uppercase transition-all duration-150 active:scale-95 cursor-pointer"
        style={{
          fontFamily: '"Courier New", monospace',
          background: 'linear-gradient(135deg, #00e5ff, #2979ff)',
          color: '#000',
          boxShadow: `0 0 ${20 + Math.sin(frame * 0.1) * 10}px #00e5ff, 0 4px 20px rgba(0,0,0,0.5)`,
          transform: `translateY(${Math.sin(frame * 0.08) * 3}px)`
        }}
        onClick={onStart}
      >
        START GAME
      </button>

      <div className="mt-6 text-cyan-600 font-mono text-xs animate-pulse">
        DEFEAT ALL ENEMIES TO ADVANCE LEVELS
      </div>
    </div>
  );
}

function GameOverScreen({ score, highScore, onRestart }: { score: number; highScore: number; onRestart: () => void }) {
  const [frame, setFrame] = useState(0);
  const isNew = score >= highScore && score > 0;
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 pointer-events-none">
      <div
        className="text-5xl font-black tracking-widest mb-2"
        style={{
          fontFamily: '"Courier New", monospace',
          color: '#ff4081',
          textShadow: '0 0 30px #ff4081, 0 0 60px #ff0055',
        }}
      >
        GAME OVER
      </div>

      {isNew && (
        <div
          className="text-xl font-bold text-yellow-300 mb-2 animate-bounce"
          style={{ textShadow: '0 0 20px #ffeb3b', fontFamily: '"Courier New", monospace' }}
        >
          🏆 NEW HIGH SCORE! 🏆
        </div>
      )}

      <div
        className="rounded-xl border border-red-500/30 bg-black/80 px-10 py-6 mb-8 text-center mt-4"
        style={{ backdropFilter: 'blur(8px)', boxShadow: '0 0 30px rgba(255,0,80,0.15)' }}
      >
        <div className="font-mono text-4xl font-black text-white mb-2">
          {score.toLocaleString()}
        </div>
        <div className="font-mono text-sm text-gray-400 mb-4">FINAL SCORE</div>
        <div className="border-t border-gray-700 pt-4 font-mono text-yellow-400 text-sm">
          🏆 BEST: {highScore.toLocaleString()}
        </div>
      </div>

      <button
        className="pointer-events-auto px-10 py-4 rounded-full font-black text-xl tracking-widest uppercase transition-all duration-150 active:scale-95 cursor-pointer"
        style={{
          fontFamily: '"Courier New", monospace',
          background: 'linear-gradient(135deg, #ff4081, #ff1744)',
          color: '#fff',
          boxShadow: `0 0 ${20 + Math.sin(frame * 0.1) * 10}px #ff4081, 0 4px 20px rgba(0,0,0,0.5)`,
        }}
        onClick={onRestart}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}

function PauseScreen({ onResume }: { onResume: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/70 pointer-events-none">
      <div
        className="text-5xl font-black tracking-widest mb-6"
        style={{
          fontFamily: '"Courier New", monospace',
          color: '#ffeb3b',
          textShadow: '0 0 30px #ffeb3b',
        }}
      >
        PAUSED
      </div>
      <button
        className="pointer-events-auto px-10 py-4 rounded-full font-black text-xl tracking-widest uppercase transition-all active:scale-95 cursor-pointer"
        style={{
          fontFamily: '"Courier New", monospace',
          background: 'linear-gradient(135deg, #ffeb3b, #ff9800)',
          color: '#000',
          boxShadow: '0 0 20px #ffeb3b',
        }}
        onClick={onResume}
      >
        RESUME
      </button>
      <div className="mt-4 text-gray-400 font-mono text-sm pointer-events-none">
        Press P or ESC to resume
      </div>
    </div>
  );
}

function MobileControls({
  onLeft, onRight, onUp, onDown, onShoot,
  onLeftEnd, onRightEnd, onUpEnd, onDownEnd
}: {
  onLeft: () => void; onRight: () => void; onUp: () => void; onDown: () => void; onShoot: () => void;
  onLeftEnd: () => void; onRightEnd: () => void; onUpEnd: () => void; onDownEnd: () => void;
}) {
  const btnClass = "select-none active:scale-90 transition-transform duration-75 flex items-center justify-center rounded-full font-bold text-2xl cursor-pointer";
  const btnStyle = {
    width: 52, height: 52,
    background: 'rgba(0,200,255,0.18)',
    border: '2px solid rgba(0,200,255,0.5)',
    color: '#00e5ff',
    boxShadow: '0 0 12px rgba(0,200,255,0.3)',
    userSelect: 'none' as const,
    WebkitUserSelect: 'none' as const,
    touchAction: 'none' as const,
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 flex items-end justify-between px-4 z-20 pointer-events-none">
      {/* D-pad */}
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1" style={{ width: 168, height: 168 }}>
        <div />
        <div
          className={btnClass} style={btnStyle}
          onTouchStart={onUp} onTouchEnd={onUpEnd} onPointerDown={onUp} onPointerUp={onUpEnd}
        >▲</div>
        <div />
        <div
          className={btnClass} style={btnStyle}
          onTouchStart={onLeft} onTouchEnd={onLeftEnd} onPointerDown={onLeft} onPointerUp={onLeftEnd}
        >◀</div>
        <div className="rounded-full" style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <div
          className={btnClass} style={btnStyle}
          onTouchStart={onRight} onTouchEnd={onRightEnd} onPointerDown={onRight} onPointerUp={onRightEnd}
        >▶</div>
        <div />
        <div
          className={btnClass} style={btnStyle}
          onTouchStart={onDown} onTouchEnd={onDownEnd} onPointerDown={onDown} onPointerUp={onDownEnd}
        >▼</div>
        <div />
      </div>

      {/* Shoot button */}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <div
          className={btnClass}
          style={{
            ...btnStyle,
            width: 72, height: 72,
            background: 'rgba(0,229,255,0.25)',
            border: '3px solid rgba(0,229,255,0.7)',
            fontSize: 28,
            boxShadow: '0 0 20px rgba(0,200,255,0.5)',
          }}
          onTouchStart={onShoot}
        >🔫</div>
        <span className="text-cyan-400 font-mono text-xs opacity-60">FIRE</span>
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startGame, pauseGame, setOnSnapshot, keysRef } = useGame(canvasRef);
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    score: 0, highScore: 0, lives: 3, level: 1,
    gameState: 'menu',
    powerUps: { shield: false, rapid: false, triple: false },
    bossHp: 0, bossMaxHp: 0
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setOnSnapshot(setSnapshot);
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, [setOnSnapshot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && snapshot.gameState !== 'menu') {
        pauseGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pauseGame, snapshot.gameState]);

  // Mobile controls
  const pressKey = useCallback((key: string) => {
    keysRef.current.add(key);
  }, [keysRef]);
  const releaseKey = useCallback((key: string) => {
    keysRef.current.delete(key);
  }, [keysRef]);

  const shootIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleShootStart = useCallback(() => {
    keysRef.current.add(' ');
    shootIntervalRef.current = setInterval(() => {
      keysRef.current.add(' ');
    }, 80);
  }, [keysRef]);


  const { gameState, score, highScore, bossHp, bossMaxHp } = snapshot;
  const isPlaying = gameState === 'playing' || gameState === 'levelup';

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#000010' }}
    >
      {/* Game container */}
      <div
        className="relative"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          boxShadow: '0 0 60px rgba(0,150,255,0.3), 0 0 120px rgba(0,50,150,0.2)',
          border: '1px solid rgba(0,200,255,0.2)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block' }}
        />

        {/* Overlay screens */}
        {gameState === 'menu' && (
          <MenuScreen onStart={startGame} highScore={highScore} />
        )}
        {gameState === 'gameover' && (
          <GameOverScreen score={score} highScore={highScore} onRestart={startGame} />
        )}
        {gameState === 'paused' && (
          <PauseScreen onResume={pauseGame} />
        )}

        {/* Boss HP bar */}
        {isPlaying && bossMaxHp > 0 && (
          <div className="absolute top-12 left-4 right-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-pink-300 font-bold">👾 BOSS</span>
              <div className="flex-1 h-3 rounded-full bg-gray-800 border border-pink-500/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${(bossHp / bossMaxHp) * 100}%`,
                    background: `linear-gradient(90deg, #ff00ff, #ff4081)`,
                    boxShadow: '0 0 10px #ff00ff',
                  }}
                />
              </div>
              <span className="font-mono text-xs text-pink-300">{bossHp}/{bossMaxHp}</span>
            </div>
          </div>
        )}

        {/* Pause button (in-game) */}
        {isPlaying && (
          <button
            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all active:scale-90 cursor-pointer"
            style={{
              background: 'rgba(255,235,59,0.15)',
              border: '1px solid rgba(255,235,59,0.4)',
              color: '#ffeb3b',
            }}
            onClick={pauseGame}
            title="Pause (P)"
          >
            ⏸
          </button>
        )}

        {/* Mobile controls */}
        {isPlaying && isMobile && (
          <MobileControls
            onLeft={() => pressKey('ArrowLeft')}
            onRight={() => pressKey('ArrowRight')}
            onUp={() => pressKey('ArrowUp')}
            onDown={() => pressKey('ArrowDown')}
            onShoot={handleShootStart}
            onLeftEnd={() => releaseKey('ArrowLeft')}
            onRightEnd={() => releaseKey('ArrowRight')}
            onUpEnd={() => releaseKey('ArrowUp')}
            onDownEnd={() => releaseKey('ArrowDown')}

          />
        )}
      </div>

      {/* Side panel (desktop only) */}
      <div
        className="ml-6 hidden lg:flex flex-col gap-4"
        style={{ width: 200 }}
      >
        {/* How to play */}
        <div
          className="rounded-xl p-4 border"
          style={{
            background: 'rgba(0,10,30,0.9)',
            borderColor: 'rgba(0,200,255,0.2)',
            boxShadow: '0 0 20px rgba(0,100,255,0.1)'
          }}
        >
          <div className="font-mono text-cyan-400 text-xs font-bold mb-3 tracking-widest">HOW TO PLAY</div>
          <div className="space-y-1.5 text-xs font-mono text-gray-400">
            <div><span className="text-white">← →</span> Move</div>
            <div><span className="text-white">↑ ↓</span> Move vertically</div>
            <div><span className="text-white">Space</span> Shoot</div>
            <div><span className="text-white">P / Esc</span> Pause</div>
          </div>
        </div>

        {/* Enemies guide */}
        <div
          className="rounded-xl p-4 border"
          style={{
            background: 'rgba(0,10,30,0.9)',
            borderColor: 'rgba(0,200,255,0.2)',
            boxShadow: '0 0 20px rgba(0,100,255,0.1)'
          }}
        >
          <div className="font-mono text-cyan-400 text-xs font-bold mb-3 tracking-widest">ENEMIES</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#00e5ff' }} />
              <span className="text-gray-300">Basic (100 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff9800' }} />
              <span className="text-gray-300">Fast (150 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#76ff03' }} />
              <span className="text-gray-300">Tough (250 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff00ff' }} />
              <span className="text-gray-300">Boss (500+ pts)</span>
            </div>
          </div>
        </div>

        {/* Power-ups guide */}
        <div
          className="rounded-xl p-4 border"
          style={{
            background: 'rgba(0,10,30,0.9)',
            borderColor: 'rgba(0,200,255,0.2)',
            boxShadow: '0 0 20px rgba(0,100,255,0.1)'
          }}
        >
          <div className="font-mono text-cyan-400 text-xs font-bold mb-3 tracking-widest">POWER-UPS</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span>🛡</span>
              <span className="text-cyan-300">Shield (10s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span className="text-yellow-300">Rapid Fire (8s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✦</span>
              <span className="text-pink-300">Triple Shot (8s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💣</span>
              <span className="text-orange-300">Bomb (instant)</span>
            </div>
          </div>
        </div>

        {/* Score */}
        {snapshot.score > 0 && (
          <div
            className="rounded-xl p-4 border text-center"
            style={{
              background: 'rgba(0,10,30,0.9)',
              borderColor: 'rgba(255,235,59,0.3)',
              boxShadow: '0 0 20px rgba(255,200,0,0.1)'
            }}
          >
            <div className="font-mono text-yellow-400 text-xs font-bold mb-1 tracking-widest">SCORE</div>
            <div className="font-mono text-white text-2xl font-black">{snapshot.score.toLocaleString()}</div>
            {snapshot.highScore > 0 && (
              <>
                <div className="font-mono text-yellow-600 text-xs mt-2">BEST</div>
                <div className="font-mono text-yellow-400 text-lg">{snapshot.highScore.toLocaleString()}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
