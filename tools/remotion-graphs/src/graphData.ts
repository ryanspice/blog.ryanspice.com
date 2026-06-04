export const colors = {
  bg: '#07111f',
  panel: '#0d1a2a',
  panel2: '#0b1423',
  line: 'rgba(165, 214, 255, 0.18)',
  text: '#f8fafc',
  muted: '#cbd5e1',
  dim: '#94a3b8',
  cyan: '#38bdf8',
  blue: '#7aa2ff',
  purple: '#a78bfa',
  pink: '#fb7185',
  green: '#99f6e4',
  amber: '#fde68a'
};

export const agentCurvePoints = [
  { x: 1, y: 0.2, label: '1' },
  { x: 3, y: 0.78, label: '3' },
  { x: 5, y: 0.9, label: '5' },
  { x: 8, y: 0.62, label: '8' },
  { x: 10, y: 0.26, label: '10+' }
];

export const routingLanes = [
  {
    label: 'Lead',
    title: 'GPT-5.5 / DeepSeek V4 Pro',
    body: 'final plan · synthesis · merge decisions',
    color: colors.blue
  },
  {
    label: 'Fast delegates',
    title: 'DeepSeek V4 Flash × n',
    body: 'implementation · bug hunts · tests',
    color: colors.cyan
  },
  {
    label: 'Peer challenger',
    title: 'OpenCode Zen / M3',
    body: 'edge cases · architecture challenge',
    color: colors.purple
  },
  {
    label: 'Local junior',
    title: 'Gemma4 local',
    body: 'readability · pseudocode · scope risk',
    color: colors.amber
  },
  {
    label: 'Sanitized panel',
    title: 'Puter models',
    body: 'style · a11y · smell checks only',
    color: colors.pink
  }
];
