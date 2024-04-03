declare module '*.md' {
	const value: string
	export default value;
}

declare interface MaterialRegressionEntry
{
    /** The quadratic term */
    a: number;
    /** The linear term */
    b: number;
    /** R^2 value */
    rSq: number;
    /** Material description*/
    description: string;
}
