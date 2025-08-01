/**
 * very simple testing, not all inclusive
 */

import { Serializer } from "../out/bitserializer.js";

function compare(potential, correct) {
	let inputText = `Input: ${correct}`;
	let outputText = `Output: ${potential}`;
	console.log(
		correct == potential ? "\t\t" : "MISMATCH!\t",
		inputText,
		inputText.length >= 14 ? "\t" : "\t\t",
		outputText
	);
}

function getRandInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandFloat(fixedAmnt) {
	let sign = Math.random() < 0.5 ? 1 : -1;

	return (
		sign * (Math.random() * 1000 * fixedAmnt + 300).toFixed(fixedAmnt) * 1
	);
}

let encoder = new Serializer();
let randUint = getRandInt(0, 127);
let randInt = getRandInt(-128, 127);
let randFloat = getRandFloat(4);
let randDouble = getRandFloat(8);

encoder.addBit(0);
encoder.addBit(1);
encoder.addUint(randUint, 7);
encoder.addInt(randInt, 8);
encoder.addDouble(randDouble);
encoder.addFloat(randFloat);
encoder.addString("test string");

let decoder = new Serializer(encoder.byteArray);

compare(decoder.readBit(), false);
compare(decoder.readBit(), true);
compare(decoder.readUint(7), randUint);
compare(decoder.readInt(8), randInt);
compare(decoder.readDouble(), randDouble);
compare(decoder.readFloat(), randFloat); // expect this to mismatch because it is a float32
compare(decoder.readString(), "test string");

console.log();
console.log("Generated Hex String:");
console.log(
	Array.from(encoder.byteArray)
		.map((byte) => {
			let hex = byte.toString(16);
			return hex.padStart(2, "0");
		})
		.join("")
);
