import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

const stages = [
	{
		label: 'Remotion source',
		body: 'React compositions and diagram logic',
		accent: '#9f72ff'
	},
	{
		label: 'Local render',
		body: 'Node/Bun tooling, no public endpoint',
		accent: '#53b8ff'
	},
	{
		label: 'Static media',
		body: 'PNG, WebM, or MP4 in /static',
		accent: '#87dac4'
	},
	{
		label: 'Markdown article',
		body: 'SvelteKit/PHP serves ordinary assets',
		accent: '#f2d27c'
	}
] as const;

export const RemotionBlogPipeline: React.FC = () => {
	const frame = useCurrentFrame();
	const glow = interpolate(frame, [0, 45, 90], [0.2, 0.48, 0.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<div style={styles.stage}>
			<div style={{ ...styles.gridGlow, opacity: glow }} />
			<div style={styles.header}>
				<div>
					<p style={styles.kicker}>blog.ryanspice.com</p>
					<h1 style={styles.title}>Remotion Static Asset Lane</h1>
				</div>
				<div style={styles.badge}>No live renderer</div>
			</div>

			<div style={styles.pipeline}>
				{stages.map((stage, index) => (
					<React.Fragment key={stage.label}>
						<div style={{ ...styles.card, borderColor: `${stage.accent}66`, boxShadow: `0 0 46px ${stage.accent}22` }}>
							<div style={{ ...styles.icon, color: stage.accent }}>{index + 1}</div>
							<h2 style={styles.cardTitle}>{stage.label}</h2>
							<p style={styles.cardBody}>{stage.body}</p>
						</div>
						{index < stages.length - 1 ? (
							<div style={styles.arrow}>
								<span
									style={{
										display: 'block',
										width: '100%',
										height: 4,
										borderRadius: 999,
										background: `linear-gradient(90deg, ${stage.accent}, ${stages[index + 1].accent})`
									}}
								/>
							</div>
						) : null}
					</React.Fragment>
				))}
			</div>

			<div style={styles.footer}>
				<div>
					<strong>Runtime boundary:</strong> Remotion stays in tools. The blog ships static media only.
				</div>
				<div>Player preview later, render infrastructure later, production endpoint never by accident.</div>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	stage: {
		width: '100%',
		height: '100%',
		position: 'relative',
		overflow: 'hidden',
		background:
			'linear-gradient(135deg, rgba(124, 92, 255, 0.18), transparent 36%), linear-gradient(225deg, rgba(30, 155, 255, 0.18), transparent 36%), #02050a',
		color: 'white',
		fontFamily: 'Segoe UI, Arial, sans-serif',
		padding: 86
	},
	gridGlow: {
		position: 'absolute',
		inset: 0,
		backgroundImage:
			'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
		backgroundSize: '64px 64px',
		maskImage: 'linear-gradient(180deg, black, transparent 82%)'
	},
	header: {
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 32
	},
	kicker: {
		margin: 0,
		color: '#9f72ff',
		fontSize: 26,
		fontWeight: 800,
		textTransform: 'uppercase',
		letterSpacing: 2
	},
	title: {
		margin: '16px 0 0',
		fontSize: 76,
		lineHeight: 1.02,
		fontWeight: 800,
		letterSpacing: 0
	},
	badge: {
		border: '1px solid rgba(255,255,255,0.22)',
		borderRadius: 16,
		padding: '18px 22px',
		color: '#87dac4',
		background: 'rgba(255,255,255,0.06)',
		fontSize: 28,
		fontWeight: 800
	},
	pipeline: {
		position: 'relative',
		zIndex: 1,
		display: 'grid',
		gridTemplateColumns: '1fr 72px 1fr 72px 1fr 72px 1fr',
		gap: 0,
		alignItems: 'center',
		marginTop: 100
	},
	card: {
		minHeight: 272,
		border: '2px solid rgba(255,255,255,0.18)',
		borderRadius: 24,
		padding: 30,
		background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.035))'
	},
	icon: {
		width: 56,
		height: 56,
		display: 'grid',
		placeItems: 'center',
		borderRadius: 16,
		border: '2px solid currentColor',
		fontSize: 26,
		fontWeight: 900,
		marginBottom: 28
	},
	cardTitle: {
		margin: 0,
		fontSize: 34,
		lineHeight: 1.1,
		letterSpacing: 0
	},
	cardBody: {
		margin: '18px 0 0',
		color: 'rgba(226,232,240,0.76)',
		fontSize: 24,
		lineHeight: 1.32
	},
	arrow: {
		height: 4,
		display: 'grid',
		alignItems: 'center'
	},
	footer: {
		position: 'relative',
		zIndex: 1,
		display: 'grid',
		gridTemplateColumns: '1.2fr 0.8fr',
		gap: 24,
		marginTop: 96,
		padding: 28,
		border: '1px solid rgba(255,255,255,0.16)',
		borderRadius: 18,
		background: 'rgba(255,255,255,0.055)',
		color: 'rgba(226,232,240,0.82)',
		fontSize: 26,
		lineHeight: 1.35
	}
};
