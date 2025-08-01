export declare class Serializer {
    private FLOAT_32_N_FACTOR;
    private FLOAT_64_N_FACTOR;
    private curBitPos;
    private _byteArray;
    private floatArr;
    private decodeFloat;
    private getBitAtPos;
    get byteArray(): Uint8Array;
    set byteArray(value: Uint8Array);
    constructor(arr?: Uint8Array | undefined);
    /**
     * Adds a boolean (1 bit).
     *
     * @param status The value of the bit
     * @returns this
     */
    addBit(status: boolean): Serializer;
    /**
     * Adds a number represented as a uInt (X bits).
     *
     * @param val The number to be added
     * @param bits The size of the uInt
     * @returns this
     */
    addUint(val: number, bits: number): Serializer;
    /**
     * Adds a number represented as an integer (X bits)
     *
     * @param val The number to be added
     * @param bits The size of the Int
     * @returns this
     */
    addInt(val: number, bits: number): Serializer;
    /**
     * Adds a number represented as a float (32 bits).
     *
     * @param val The number to be added
     * @returns this
     */
    addFloat(val: number): Serializer;
    /**
     * Adds a number represented as a double (64 bits).
     *
     * @param val The number to be added
     * @returns this
     */
    addDouble(val: number): Serializer;
    /**
     * Adds a string using null termination. All instances of "\x00" in the original
     * string will be removed! If this is undesired, simply do something like this:
     *
     * ```
     * arr.addUint(str.length, 32);
     *
     * for (let char in str) {
     *     arr.addUint(char, 8);
     * }
     * ```
     *
     * @param val The string to add
     * @returns this
     */
    addString(val: string): Serializer;
    /**
     * @returns the next bit
     */
    readBit(): boolean;
    /**
     * @param bits The size of the uInt
     * @returns The next uInt of size `bits`
     */
    readUint(bits: number): number;
    /**
     * @param bits The size of the Int
     * @returns The next Int of size `bits`
     */
    readInt(bits: number): number;
    /**
     * @returns The next float (32 bits)
     */
    readFloat(): number;
    /**
     * @returns The next double (64 bits)
     */
    readDouble(): number;
    /**
     * @returns The next string (doesn't include "\x00")
     */
    readString(): string;
    /**
     * Clears the BitSerializer
     */
    clear(): void;
}
