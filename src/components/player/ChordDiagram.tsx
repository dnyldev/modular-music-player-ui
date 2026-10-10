import { lookupChord, transposeChord } from "@/data/song";

const STRINGS = 6;
const FRETS = 5;
const W = 86;
const H = 108;
const PAD_X = 16;
const PAD_TOP = 22;
const PAD_BOTTOM = 14;

export function ChordDiagram({ symbol, semitones = 0 }: { symbol: string; semitones?: number }) {
  const raw = lookupChord(symbol);
  const label = transposeChord(raw?.name ?? symbol, semitones);
  const shape = raw?.shape ?? [-1, -1, -1, -1, -1, -1];
  const barre = raw?.barre;
  const played = shape.filter((f) => f > 0);
  const minFret = played.length ? Math.min(...played) : 1;
  const maxFret = played.length ? Math.max(...played) : 4;
  const baseFret = maxFret > FRETS ? Math.max(1, minFret) : 1;
  const nut = baseFret === 1 && played.every((f) => f <= FRETS);
  const stringGap = (W - PAD_X * 2) / (STRINGS - 1);
  const fretGap = (H - PAD_TOP - PAD_BOTTOM) / FRETS;

  const xAt = (i: number) => PAD_X + stringGap * i;
  const yAtFret = (fret: number) => PAD_TOP + fretGap * (fret - 0.5);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        {!nut ? (
          <text
            x={4}
            y={PAD_TOP + fretGap * 0.7}
            fill="currentColor"
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            opacity={0.55}
          >
            {baseFret}
          </text>
        ) : null}

        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={PAD_TOP}
          y2={PAD_TOP}
          stroke="currentColor"
          strokeWidth={nut ? 4.5 : 1.2}
          strokeLinecap="round"
        />

        {Array.from({ length: FRETS }).map((_, i) => (
          <line
            key={i}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + fretGap * (i + 1)}
            y2={PAD_TOP + fretGap * (i + 1)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.28}
          />
        ))}

        {Array.from({ length: STRINGS }).map((_, i) => (
          <line
            key={i}
            x1={xAt(i)}
            x2={xAt(i)}
            y1={PAD_TOP}
            y2={H - PAD_BOTTOM}
            stroke="currentColor"
            strokeWidth={i === 0 ? 1.6 : 1}
            opacity={0.55}
          />
        ))}

        {barre ? (
          <rect
            x={xAt(barre[1]) - 6}
            y={yAtFret(barre[0] - baseFret + 1) - 6}
            width={xAt(barre[2]) - xAt(barre[1]) + 12}
            height={12}
            rx={6}
            fill="currentColor"
          />
        ) : null}

        {shape.map((f, i) => {
          const x = xAt(i);
          if (f === -1) {
            return (
              <text
                key={i}
                x={x}
                y={13}
                textAnchor="middle"
                fill="currentColor"
                fontSize="10"
                fontFamily="Inter, sans-serif"
                opacity={0.55}
              >
                ×
              </text>
            );
          }
          if (f === 0) {
            return (
              <circle
                key={i}
                cx={x}
                cy={11}
                r={4}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
              />
            );
          }
          const display = f - baseFret + 1;
          if (display < 1 || display > FRETS) return null;
          const y = yAtFret(display);
          const covered = barre && i >= barre[1] && i <= barre[2] && f === barre[0];
          if (covered) return null;
          return <circle key={i} cx={x} cy={y} r={6} fill="currentColor" />;
        })}
      </svg>
      <p className="text-[12px] font-medium tracking-[-0.02em]">{label}</p>
    </div>
  );
}
