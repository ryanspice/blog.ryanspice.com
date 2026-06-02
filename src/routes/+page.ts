import type { PageLoad } from './$types';

// Keep CSR enabled for the PHP-static adapter (prerendered markup + client hydration).
// The passthrough load ensures the universal data slot is populated so the server
// data isn't shadowed by undefined during the client hydration handoff.
export const load: PageLoad = ({ data }) => data;
