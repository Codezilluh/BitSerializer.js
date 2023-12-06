/**
 * Calculates the largest amount a number can be right-shifted by before reaching 0.
 * Equivalent to `Math.floor(Math.log2(X))`
 */
const binaryLogInt = (value: number) => {
	let result = 0;

	while (value >> 1) {
		value >>= 1;
		result++;
	}

	return result;
};

export class Serializer {
	private FLOAT_32_N_FACTOR = 8388608;
	private FLOAT_64_N_FACTOR = 4503599627370496;
	private curBitPos = 0;
	private _byteArray: number[] = [];

	private decodeFloat(val: number): [number, number] {
		val = Math.abs(val);

		const exponent = binaryLogInt(val);
		const mantissa = val / Math.pow(2, exponent);

		return [exponent, mantissa];
	}

	private getBitAtPos(value: number, pos: number): boolean {
		// Limitations of JavaScript require this
		if (pos >= 32) {
			return !!((BigInt(Math.floor(value)) >> BigInt(pos)) & BigInt(1));
		} else {
			return !!((value >> pos) & 1);
		}
	}

	get byteArray(): Uint8Array {
		return new Uint8Array(this._byteArray);
	}

	set byteArray(value: Uint8Array) {
		this._byteArray = [...value];
	}

	constructor(arr: Uint8Array | undefined = undefined) {
		if (arr == undefined) return;

		this.byteArray = arr;
	}

	/**
	 * Adds a boolean (1 bit).
	 *
	 * @param status The value of the bit
	 * @returns this
	 */
	addBit(status: boolean): Serializer {
		// Find the byte that would contain bit number X in the byteArray
		const bytePos = this.curBitPos >> 3;

		if (bytePos >= this._byteArray.length) this._byteArray.push(0);

		if (status) {
			// enable bit at a specified position
			this._byteArray[bytePos] |= 1 << this.curBitPos % 8;
		} else {
			// disable bit at a specified position
			this._byteArray[bytePos] &= ~(1 << this.curBitPos % 8);
		}

		this.curBitPos++;

		return this;
	}

	/**
	 * Adds a number represented as a uInt (X bits).
	 *
	 * @param val The number to be added
	 * @param bits The size of the uInt
	 * @returns this
	 */
	addUint(val: number, bits: number): Serializer {
		for (let i = 0; i < bits; ++i) {
			this.addBit(this.getBitAtPos(val, i));
		}

		return this;
	}

	/**
	 * Adds a number represented as an integer (X bits)
	 *
	 * @param val The number to be added
	 * @param bits The size of the Int
	 * @returns this
	 */
	addInt(val: number, bits: number): Serializer {
		// Remember: an int is just a shifted uint.

		if (val >= 0) {
			this.addBit(false);
			this.addUint(val, bits - 1);
		} else {
			this.addBit(true);
			this.addUint(-val - 1, bits - 1); // no need for both -0 and +0
		}

		return this;
	}

	/**
	 * Adds a number represented as a float (32 bits).
	 *
	 * @param val The number to be added
	 * @returns this
	 */
	addFloat(val: number): Serializer {
		const [exponent, mantissa] = this.decodeFloat(val);

		this.addBit(val < 0);

		if (val == 0) {
			this.addInt(0, 8);
			this.addUint(0, 23);

			return this;
		}

		this.addInt(exponent, 8);
		this.addUint((mantissa - 1) * this.FLOAT_32_N_FACTOR, 23);

		return this;
	}

	/**
	 * Adds a number represented as a double (64 bits).
	 *
	 * @param val The number to be added
	 * @returns this
	 */
	addDouble(val: number): Serializer {
		const [exponent, mantissa] = this.decodeFloat(val);

		this.addBit(val < 0);

		if (val == 0) {
			this.addInt(0, 11);
			this.addUint(0, 52);

			return this;
		}

		this.addInt(exponent, 11);
		this.addUint((mantissa - 1) * this.FLOAT_64_N_FACTOR, 52);

		return this;
	}

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
	addString(val: string): Serializer {
		val = val.replace(/\x00/g, "");

		for (let i = 0; i < val.length; i++) {
			this.addUint(val.charCodeAt(i), 8);
		}

		this.addUint(0, 8); // null termination

		return this;
	}

	/**
	 * @returns the next bit
	 */
	readBit(): boolean {
		const byte = this._byteArray[this.curBitPos >> 3];

		return this.getBitAtPos(byte, this.curBitPos++ % 8);
	}

	/**
	 * @param bits The size of the uInt
	 * @returns The next uInt of size `bits`
	 */
	readUint(bits: number): number {
		let out = 0;

		for (let i = 0; i < bits; i++) {
			// The faster (1<<n) method for 2^n will not work for n >= 31
			if (i >= 31) {
				out += Number(this.readBit()) * Math.pow(2, i);
				continue;
			}

			out += Number(this.readBit()) * (1 << i);
		}

		return out;
	}

	/**
	 * @param bits The size of the Int
	 * @returns The next Int of size `bits`
	 */
	readInt(bits: number): number {
		const isNegative = this.readBit();
		const out = this.readUint(bits - 1);

		return isNegative ? -out - 1 : out;
	}

	/**
	 * @returns The next float (32 bits)
	 */
	readFloat(): number {
		const sign = this.readBit() ? -1 : 1;
		const exponent = this.readInt(8);
		const normalized = this.readUint(23);

		if (exponent == 0 && normalized == 0) return 0;

		const mantissa = normalized / this.FLOAT_32_N_FACTOR + 1;

		return sign * Math.pow(2, exponent) * mantissa;
	}

	/**
	 *
	 * @returns The next double (64 bits)
	 */
	readDouble(): number {
		const sign = this.readBit() ? -1 : 1;
		const exponent = this.readInt(11);
		const normalized = this.readUint(52);

		if (exponent == 0 && normalized == 0) return 0;

		const mantissa = normalized / this.FLOAT_64_N_FACTOR + 1;

		return sign * Math.pow(2, exponent) * mantissa;
	}

	/**
	 * @returns The next string (doesn't include "\x00")
	 */
	readString(): string {
		let char = "";
		let str = "";

		for (let i = this.curBitPos >> 3; i < this._byteArray.length; i++) {
			char = String.fromCharCode(this.readUint(8));

			if (char == "\x00") break;

			str += char;
		}

		return str;
	}
}
