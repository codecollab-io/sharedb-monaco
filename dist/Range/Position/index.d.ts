/**
 * A position in the editor.
 */
export declare class Position {
    lineNumber: number;
    column: number;
    constructor(lineNumber: number, column: number);
    /**
     * Create a new position from this position.
     *
     * @param newLineNumber new line number
     * @param newColumn new column
     */
    with(newLineNumber?: number, newColumn?: number): Position;
    /**
     * Derive a new position from this position.
     *
     * @param deltaLineNumber line number delta
     * @param deltaColumn column delta
     */
    delta(deltaLineNumber?: number, deltaColumn?: number): Position;
    /**
     * Test if this position equals other position
     */
    equals(other: Position): boolean;
    /**
     * Test if position `a` equals position `b`
     */
    static equals(a: Position, b: Position): boolean;
    /**
     * Test if this position is before other position.
     * If the two positions are equal, the result will be false.
     */
    isBefore(other: Position): boolean;
    /**
     * Test if position `a` is before position `b`.
     * If the two positions are equal, the result will be false.
     */
    static isBefore(a: Position, b: Position): boolean;
    /**
     * Test if this position is before other position.
     * If the two positions are equal, the result will be true.
     */
    isBeforeOrEqual(other: Position): boolean;
    /**
     * Test if position `a` is before position `b`.
     * If the two positions are equal, the result will be true.
     */
    static isBeforeOrEqual(a: Position, b: Position): boolean;
    /**
     * A function that compares positions, useful for sorting
     */
    static compare(a: Position, b: Position): number;
    /**
     * Clone this position.
     */
    clone(): Position;
    /**
     * Convert to a human-readable representation.
     */
    toString(): string;
    /**
     * Create a `Position` from an `IPosition`.
     */
    static lift(pos: any): Position;
    /**
     * Test if `obj` is an `IPosition`.
     */
    static isIPosition(obj: any): any;
}
