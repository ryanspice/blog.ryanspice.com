import type { PageLoad } from './$types';

// Keep the home route's universal data slot populated when an explicit owner
// route opts back into CSR elsewhere in the app.
export const load: PageLoad = ({ data }) => data;
