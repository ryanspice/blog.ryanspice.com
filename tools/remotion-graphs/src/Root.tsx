import React from 'react';
import { AbsoluteFill, Composition, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { agentCurvePoints, colors, routingLanes } from './graphData';

type Point = { x: number; y: number; label: string };

const fontFamily = 'Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const monoFamily = '"Cascadia Code", Consolas, monospace';

function lerp(min: number, max: number, value: number) {
  return min + (max - min) * value;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mapAgentPoint(point: Point, width: number, height: number) {
  const left = 140;
  const right = width - 120;
  const top = 120;
  const bottom = height - 90;
  const x = lerp(left, right, (point.x - 1) / 9);
  const y = lerp(bottom, top, point.y);
  return { x, y };
}

function cubicPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;

  rest.forEach((point, index) => {
    const previous = points[index];
    const next = points[index + 2] ?? point;
    const control1 = {
      x: previous.x + (point.x - (points[index - 1]?.x ?? previous.x)) * 0.18,
      y: previous.y + (point.y - (points[index - 1]?.y ?? previous.y)) * 0.18
    };
    const control2 = {
      x: point.x - (next.x - previous.x) * 0.12,
      y: point.y - (next.y - previous.y) * 0.12
    };
    d += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${point.x} ${point.y}`;
  });

  return d;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 1600,
        height: 900,
        background: `radial-gradient(circle at 10% 0%, rgba(56,189,248,0.18), transparent 36%), linear-gradient(135deg, ${colors.bg}, #0f172a)`,
        color: colors.text,
        fontFamily,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 54,
          borderRadius: 34,
          background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(8,14,24,0.96))',
          border: '1px solid rgba(148, 163, 184, 0.24)',
          boxShadow: '0 34px 120px rgba(0,0,0,0.34)'
        }}
      />
      {children}
    </div>
  );
}

export function AgentDiminishingReturns() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 24, stiffness: 90 } });
  const draw = clamp01(interpolate(frame, [18, 108], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const plot = { x: 185, y: 210, width: 1165, height: 475 };
  const points = agentCurvePoints.map((point) => mapAgentPoint(point, plot.width, plot.height));
  const path = cubicPath(points);
  const pathLength = 1800;

  return (
    <AbsoluteFill>
      <Card>
        <div style={{ position: 'absolute', left: 112, top: 92, transform: `translateY(${(1 - intro) * 18}px)`, opacity: intro }}>
          <div style={{ fontSize: 50, lineHeight: 1, fontWeight: 900, letterSpacing: '-0.04em' }}>The diminishing-returns line</div>
          <div style={{ marginTop: 16, color: colors.muted, fontSize: 22 }}>Agent count helps only while each delegate owns independent work.</div>
        </div>

        <svg viewBox="0 0 1600 900" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="curveGradient" x1="0" x2="1">
              <stop offset="0%" stopColor={colors.cyan} />
              <stop offset="50%" stopColor={colors.blue} />
              <stop offset="100%" stopColor={colors.pink} />
            </linearGradient>
            <filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#38bdf8" floodOpacity="0.35" /></filter>
          </defs>

          <g transform={`translate(${plot.x} ${plot.y})`} opacity={intro}>
            <rect x="0" y="0" width={plot.width} height={plot.height} rx="28" fill="rgba(15, 23, 42, 0.76)" stroke="rgba(59, 130, 246, 0.76)" strokeWidth="2" />
            <rect x="90" y="42" width="305" height="344" fill="rgba(20, 184, 166, 0.12)" />
            <rect x="395" y="42" width="380" height="344" fill="rgba(37, 99, 235, 0.13)" />
            <rect x="775" y="42" width="300" height="344" fill="rgba(190, 18, 60, 0.16)" />

            {[0, 1, 2, 3, 4].map((index) => <line key={`h-${index}`} x1="90" x2="1075" y1={42 + index * 86} y2={42 + index * 86} stroke={colors.line} />)}
            {[0, 1, 2, 3, 4, 5].map((index) => <line key={`v-${index}`} x1={90 + index * 197} x2={90 + index * 197} y1="42" y2="386" stroke={colors.line} />)}

            <line x1="90" y1="386" x2="1075" y2="386" stroke="#dbeafe" strokeWidth="3" />
            <line x1="90" y1="386" x2="90" y2="42" stroke="#dbeafe" strokeWidth="3" />

            <text x="250" y="82" textAnchor="middle" fill={colors.green} fontSize="21" fontWeight="900">useful by default</text>
            <text x="590" y="82" textAnchor="middle" fill="#dbeafe" fontSize="21" fontWeight="900">useful if sliced well</text>
            <text x="922" y="82" textAnchor="middle" fill="#fecdd3" fontSize="21" fontWeight="900">noise risk</text>

            <path d={path} transform="translate(0 0)" fill="none" stroke="url(#curveGradient)" strokeWidth="13" strokeLinecap="round" filter="url(#glow)" strokeDasharray={pathLength} strokeDashoffset={pathLength * (1 - draw)} />

            {points.map((point, index) => {
              const opacity = clamp01(interpolate(frame, [42 + index * 13, 60 + index * 13], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
              return <circle key={agentCurvePoints[index].label} cx={point.x} cy={point.y} r="13" fill="#f8fafc" stroke="#0f172a" strokeWidth="5" opacity={opacity} />;
            })}

            {agentCurvePoints.map((point, index) => {
              const mapped = points[index];
              return <text key={point.label} x={mapped.x} y="420" textAnchor="middle" fill="#e5e7eb" fontSize="18">{point.label}</text>;
            })}

            <text x="585" y="444" textAnchor="middle" fill="#e5e7eb" fontSize="19">number of agents</text>
            <text x="42" y="222" textAnchor="middle" fill="#e5e7eb" fontSize="18" transform="rotate(-90 42 222)">net value after merge cost</text>

            <text x="410" y="144" fill="#ffffff" fontSize="24" fontWeight="900">sweet spot</text>
            <text x="410" y="174" fill="#bfdbfe" fontSize="17">lead + reviewer + risk scout</text>
            <text x="805" y="260" fill="#ffffff" fontSize="24" fontWeight="900">diminishing returns</text>
            <text x="805" y="292" fill="#fecdd3" fontSize="17">duplicate findings and contradictions rise</text>
          </g>
        </svg>

        <div style={{ position: 'absolute', left: 118, right: 118, bottom: 96, color: colors.muted, fontSize: 21, lineHeight: 1.55 }}>
          <div>Stop adding delegates when the next one cannot inspect a different source, hypothesis, risk, or file surface.</div>
          <div>A bigger agent room is not a strategy. A cleaner context contract is.</div>
        </div>
      </Card>
    </AbsoluteFill>
  );
}

export function AgentRoutingMap() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 25, stiffness: 95 } });
  const connector = clamp01(interpolate(frame, [36, 96], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <AbsoluteFill>
      <Card>
        <div style={{ position: 'absolute', left: 112, top: 88, transform: `translateY(${(1 - intro) * 18}px)`, opacity: intro }}>
          <div style={{ fontSize: 50, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.045em' }}>Conversation composition</div>
          <div style={{ marginTop: 16, color: colors.muted, fontSize: 22 }}>Lead with judgment. Delegate bounded lanes. Panel only sanitized opinions.</div>
        </div>

        <svg viewBox="0 0 1600 900" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill={colors.cyan} />
            </marker>
          </defs>
          <path d="M420 445 C520 445 570 445 650 445" stroke={colors.cyan} strokeWidth="5" fill="none" markerEnd="url(#arrow)" opacity={connector} />
          <path d="M950 445 C1040 445 1100 445 1190 445" stroke={colors.cyan} strokeWidth="5" fill="none" markerEnd="url(#arrow)" opacity={connector} />
        </svg>

        <div style={{ position: 'absolute', left: 116, top: 365, width: 300, height: 160, borderRadius: 28, border: `1px solid rgba(56,189,248,0.52)`, background: 'rgba(15,23,42,0.9)', padding: 26 }}>
          <div style={{ color: colors.cyan, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em' }}>input</div>
          <div style={{ marginTop: 18, fontSize: 30, lineHeight: 1.1, fontWeight: 900 }}>Task arrives</div>
          <div style={{ marginTop: 12, color: colors.muted, fontSize: 18 }}>feature · bug · audit · article · deploy</div>
        </div>

        <div style={{ position: 'absolute', left: 650, top: 300, width: 360, height: 290, borderRadius: 36, background: 'linear-gradient(135deg, rgba(56,189,248,0.92), rgba(124,58,237,0.92))', padding: 34, boxShadow: '0 28px 90px rgba(37,99,235,0.28)' }}>
          <div style={{ color: '#ffffff', fontSize: 38, lineHeight: 1.02, fontWeight: 950 }}>Lead</div>
          <div style={{ marginTop: 12, color: '#eef2ff', fontSize: 22, fontWeight: 800 }}>5.5 or DeepSeek V4 Pro</div>
          <div style={{ marginTop: 28, color: '#ffffff', fontSize: 21, lineHeight: 1.45 }}>owns final plan, tradeoffs, merge decisions, and scope cuts</div>
        </div>

        <div style={{ position: 'absolute', right: 114, top: 365, width: 300, height: 160, borderRadius: 28, border: `1px solid rgba(167,139,250,0.52)`, background: 'rgba(15,23,42,0.9)', padding: 26 }}>
          <div style={{ color: colors.purple, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em' }}>output</div>
          <div style={{ marginTop: 18, fontSize: 30, lineHeight: 1.1, fontWeight: 900 }}>Decision</div>
          <div style={{ marginTop: 12, color: colors.muted, fontSize: 18 }}>patch · plan · prompt · release note</div>
        </div>

        <div style={{ position: 'absolute', left: 128, right: 128, bottom: 96, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {routingLanes.map((lane, index) => {
            const opacity = clamp01(interpolate(frame, [50 + index * 10, 72 + index * 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
            return (
              <div key={lane.label} style={{ opacity, transform: `translateY(${(1 - opacity) * 18}px)`, borderRadius: 18, border: `1px solid ${lane.color}66`, background: 'rgba(15,23,42,0.88)', padding: 18, minHeight: 142 }}>
                <div style={{ color: lane.color, fontSize: 13, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{lane.label}</div>
                <div style={{ marginTop: 12, color: colors.text, fontSize: 20, fontWeight: 850, lineHeight: 1.12 }}>{lane.title}</div>
                <div style={{ marginTop: 10, color: colors.muted, fontSize: 16, lineHeight: 1.3 }}>{lane.body}</div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', left: 650, top: 628, fontFamily: monoFamily, fontSize: 23, lineHeight: 1.55, color: '#e0f2fe', background: 'rgba(0,0,0,0.42)', border: '1px solid rgba(148,163,184,0.22)', borderRadius: 18, padding: '22px 26px' }}>
          C = Lead + Flash*n + ZenM3 + G4 + Panel + Rotator
        </div>
      </Card>
    </AbsoluteFill>
  );
}

export function RemotionRoot() {
  return (
    <>
      <Composition id="AgentDiminishingReturns" component={AgentDiminishingReturns} durationInFrames={180} fps={30} width={1600} height={900} />
      <Composition id="AgentRoutingMap" component={AgentRoutingMap} durationInFrames={180} fps={30} width={1600} height={900} />
    </>
  );
}
