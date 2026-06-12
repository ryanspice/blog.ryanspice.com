import { devices, defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	projects: [
		{
			name: 'catalog-desktop',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1600, height: 2200 },
				screen: { width: 1600, height: 2200 }
			}
		},
		{
			name: 'mobile',
			use: {
				...devices['iPhone 14']
			}
		}
	],
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'pnpm run dev --host 127.0.0.1 --port 4173',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: true,
		timeout: 120000
	},
	reporter: [['list']]
});
