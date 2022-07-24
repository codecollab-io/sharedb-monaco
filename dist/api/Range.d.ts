import { Position } from './Position';
/**
 * A range in the editor. (startLineNumber,startColumn) is <= (endLineNumber,endColumn)
 */
export declare class Range {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
    /**
     * Test if this range is empty.
     */
    isEmpty(): boolean;
    /**
     * Test if `range` is empty.
     */
    static isEmpty(range: Range): boolean;
    /**
     * Test if position is in this range. If the position is at the edges, will return true.
     */
    containsPosition(position: Position): boolean;
    /**
     * Test if `position` is in `range`. If the position is at the edges, will return true.
     */
    static containsPosition(range: Range, position: Position): boolean;
    /**
     * Test if range is in this range. If the range is equal to this range, will return true.
     */
    containsRange(range: Range): boolean;
    /**
     * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
     */
    static containsRange(range: Range, otherRange: Range): boolean;
    /**
     * Test if `range` is strictly in this range. `range` must start after and end before this range for the result to be true.
     */
    strictContainsRange(range: Range): boolean;
    /**
     * Test if `otherRange` is strinctly in `range` (must start after, and end before). If the ranges are equal, will return false.
     */
    static strictContainsRange(range: Range, otherRange: Range): boolean;
    /**
     * A reunion of the two ranges.
     * The smallest position will be used as the start point, and the largest one as the end point.
     */
    plusRange(range: Range): Range;
    /**
     * A reunion of the two ranges.
     * The smallest position will be used as the start point, and the largest one as the end point.
     */
    static plusRange(a: Range, b: Range): Range;
    /**
     * A intersection of the two ranges.
     */
    intersectRanges(range: Range): Range | null;
    /**
     * A intersection of the two ranges.
     */
    static intersectRanges(a: Range, b: Range): Range | null;
    /**
     * Test if this range equals other.
     */
    equalsRange(other: Range): boolean;
    /**
     * Test if range `a` equals `b`.
     */
    static equalsRange(a: Range, b: Range): boolean;
    /**
     * Return the end position (which will be after or equal to the start position)
     */
    getEndPosition(): Position;
    /**
     * Return the end position (which will be after or equal to the start position)
     */
    static getEndPosition(range: Range): Position;
    /**
     * Return the start position (which will be before or equal to the end position)
     */
    getStartPosition(): Position;
    /**
     * Return the start position (which will be before or equal to the end position)
     */
    static getStartPosition(range: Range): Position;
    /**
     * Transform to a user presentable string representation.
     */
    toString(): string;
    /**
     * Create a new range using this range's start position, and using endLineNumber and endColumn as the end position.
     */
    setEndPosition(endLineNumber: number, endColumn: number): Range;
    /**
     * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
     */
    setStartPosition(startLineNumber: number, startColumn: number): Range;
    /**
     * Create a new empty range using this range's start position.
     */
    collapseToStart(): Range;
    /**
     * Create a new empty range using this range's start position.
     */
    static collapseToStart(range: Range): Range;
    static fromPositions(start: Position, end?: Position): Range;
    static lift(range: Range): Range | null;
    /**
     * Test if `obj` is an `IRange`.
     */
    static isIRange(obj: any): any;
    /**
     * Test if the two ranges are touching in any way.
     */
    static areIntersectingOrTouching(a: Range, b: Range): boolean;
    /**
     * Test if the two ranges are intersecting. If the ranges are touching it returns true.
     */
    static areIntersecting(a: Range, b: Range): boolean;
    /**
     * A function that compares ranges, useful for sorting ranges
     * It will first compare ranges on the startPosition and then on the endPosition
     */
    static compareRangesUsingStarts(a: Range, b: Range): number;
    /**
     * A function that compares ranges, useful for sorting ranges
     * It will first compare ranges on the endPosition and then on the startPosition
     */
    static compareRangesUsingEnds(a: Range, b: Range): number;
    /**
     * Test if the range spans multiple lines.
     */
    static spansMultipleLines(range: Range): boolean;
}
