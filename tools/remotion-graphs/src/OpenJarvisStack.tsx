import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const chips = ['Intelligence', 'Engine', 'Agents', 'Tools + Memory', 'Learning loop'] as const;

export const OpenJarvisStack: React.FC = () => {
	const frame = useCurrentFrame();
	const pulse = interpolate(frame, [0, 45, 90], [0.2, 0.46, 0.2], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp'
	});

	return (
		<AbsoluteFill style={styles.stage}>
			<svg viewBox="0 0 1600 900" style={styles.svg} role="img" aria-label="OpenJarvis local-first personal AI stack">
				<defs>
					<linearGradient id="openjarvisBg" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#071321" />
						<stop offset="0.6" stopColor="#0b1f33" />
						<stop offset="1" stopColor="#10283f" />
					</linearGradient>
					<linearGradient id="goldCore" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#ffe88b" />
						<stop offset="1" stopColor="#bd8e2c" />
					</linearGradient>
					<filter id="coreGlow" x="-45%" y="-45%" width="190%" height="190%">
						<feGaussianBlur stdDeviation="11" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				<rect width="1600" height="900" rx="0" fill="url(#openjarvisBg)" />
				<g opacity="0.16" stroke="#79b9d9" strokeWidth="1">
					{[180, 360, 540, 720].map((y) => (
						<path key={`h-${y}`} d={`M0 ${y}H1600`} />
					))}
					{[200, 400, 600, 800, 1000, 1200, 1400].map((x) => (
						<path key={`v-${x}`} d={`M${x} 0V900`} />
					))}
				</g>
				<circle cx="1160" cy="260" r="320" fill="#70cfff" opacity={pulse * 0.12} />

				<text x="90" y="100" style={styles.title}>
					OpenJarvis: local AI becomes a full stack
				</text>
				<text x="92" y="146" style={styles.subtitle}>
					Personal device first. Cloud fallback second. Tools, memory, agents, and learning in the middle.
				</text>

				<g transform="translate(116 218)">
					<rect width="520" height="392" rx="34" fill="#0d2238" stroke="#34799c" strokeWidth="3" />
					<rect x="56" y="70" width="408" height="230" rx="25" fill="#071827" stroke="#78d4ff" strokeWidth="5" />
					<circle cx="260" cy="184" r="76" fill="none" stroke="url(#goldCore)" strokeWidth="10" filter="url(#coreGlow)" />
					<g stroke="#ffdf72" strokeWidth="6" strokeLinecap="round">
						<path d="M208 184H312" />
						<path d="M260 132V236" />
						<path d="M223 147L297 221" />
						<path d="M297 147L223 221" />
					</g>
					<rect x="206" y="326" width="108" height="22" rx="11" fill="#406276" />
					<rect x="154" y="356" width="212" height="28" rx="14" fill="#123050" stroke="#62c4f2" strokeWidth="3" />
					<text x="56" y="44" style={styles.panelLabel}>
						Local workstation
					</text>
					<text x="56" y="436" style={styles.caption}>
						Ollama / llama.cpp / tools / private traces
					</text>
				</g>

				<g transform="translate(716 198)">
					{chips.map((chip, index) => {
						const y = index * 91;
						return (
							<g key={chip} transform={`translate(0 ${y})`}>
								<rect width="446" height="72" rx="18" fill="#122f4c" stroke="#78d4ff" strokeWidth="4" />
								<text x="32" y="46" style={styles.chipText}>
									{index + 1}. {chip}
								</text>
							</g>
						);
					})}
				</g>

				<g stroke="#61b9df" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="11 16" opacity="0.76">
					<path d="M636 414C682 348 685 244 716 234" />
					<path d="M636 414C684 400 688 416 716 416" />
					<path d="M636 414C688 504 692 594 716 598" />
				</g>

				<path d="M1162 510C1194 536 1212 548 1238 574" stroke="#e2bd61" strokeWidth="6" fill="none" strokeDasharray="13 13" opacity="0.78" />

				<g transform="translate(1190 474)">
					<path
						d="M70 128c-42 0-76-29-76-65 0-35 29-63 68-66 20-39 62-66 113-66 64 0 116 40 127 94 44 7 78 39 78 77 0 44-43 80-98 80H70z"
						fill="#122d47"
						stroke="#78d4ff"
						strokeWidth="5"
					/>
					<rect x="70" y="58" width="246" height="100" rx="24" fill="rgba(4, 18, 31, 0.74)" stroke="rgba(120, 212, 255, 0.34)" strokeWidth="2" />
					<text x="98" y="99" style={styles.cloudTitle}>
						Cloud fallback
					</text>
					<text x="100" y="134" style={styles.cloudSub}>
						Optional escalation
					</text>
				</g>

				<g transform="translate(88 746)">
					<rect width="1424" height="82" rx="28" fill="#071725" stroke="#35566b" strokeWidth="2" />
					<text x="36" y="52" style={styles.callout}>
						The important shift: local AI moves from model runners to measurable personal-agent operating stacks.
					</text>
				</g>
			</svg>
		</AbsoluteFill>
	);
};

const fontFamily = 'Segoe UI, Arial, sans-serif';

const styles: Record<string, React.CSSProperties> = {
	stage: {
		background: '#050505'
	},
	svg: {
		width: '100%',
		height: '100%',
		display: 'block',
		fontFamily
	},
	title: {
		fontFamily,
		fontSize: 52,
		fontWeight: 800,
		letterSpacing: 0,
		fill: '#eaf6ff'
	},
	subtitle: {
		fontFamily,
		fontSize: 26,
		fontWeight: 500,
		letterSpacing: 0,
		fill: '#a9c0d4'
	},
	panelLabel: {
		fontFamily,
		fontSize: 25,
		fontWeight: 700,
		letterSpacing: 0,
		fill: '#abc2d5'
	},
	caption: {
		fontFamily,
		fontSize: 18,
		fontWeight: 600,
		letterSpacing: 0,
		fill: '#91adc3'
	},
	chipText: {
		fontFamily,
		fontSize: 26,
		fontWeight: 700,
		letterSpacing: 0,
		fill: '#afc4d7'
	},
	cloudTitle: {
		fontFamily,
		fontSize: 30,
		fontWeight: 800,
		letterSpacing: 0,
		fill: '#d9f2ff'
	},
	cloudSub: {
		fontFamily,
		fontSize: 22,
		fontWeight: 600,
		letterSpacing: 0,
		fill: '#95b4ca'
	},
	callout: {
		fontFamily,
		fontSize: 28,
		fontWeight: 650,
		letterSpacing: 0,
		fill: '#b6ccdd'
	}
};
