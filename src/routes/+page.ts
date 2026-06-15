import type { PageLoad } from './$types';

// The Ryan build keeps CSR enabled for the PHP-static adapter (prerendered markup
// + client hydration). The Canopy build disables CSR in the root layout because
// it is a public static skin and must not rewrite stamped theme state after load.
// The passthrough load ensures the universal data slot is populated when CSR is
// enabled, so server data isn't shadowed by undefined during hydration handoff.
export const load: PageLoad = ({ data }) => data;
