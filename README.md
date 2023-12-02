# BitSerializer.js

JavaScript implementation of [C++ BitSerializer](https://github.com/Codezilluh/BitSerializer).

## Install

Install with `npm i github:Codezilluh/BitSerializer.js`

## Example

This is the example from the C++ version, but in TypeScript.

```ts
import { Serializer } from "bitserializer.js"

...

function serializePlayer(arr: Serializer, player: Player): void {
	arr.addBit(player.dead);
	arr.addFloat(player.pos.x); // or addDouble(double)
	arr.addFloat(player.pos.y);
	arr.addString(player.name);

	// Dead players don't have health or weapons, do they?
	if (!player.dead) {
		arr.addUint(player.health, 7); // Max health is 100, which can fit in 7 bits (2^7 = 128)
		arr.addUint(player.curWeapId, 5); // Only 30 weapons in the game, which can fit in 5 bits.
		arr.addBit(player.isDeveloper); // Special developer-only skin?
		arr.addInt(player.someInt, 12); // Couldn't think of an int property a player would have :)
	}
}

function serializePlayers(players: Player[]): Uint8Array {
	let arr = new Serializer();

	arr.addUint(game.version, 8); // make sure client and server are compatible
	arr.addUint(players.length, 6); // max players is 50, which fits in 6 bits

	for (let i = 0; i < players.length; i++) {
		serializePlayer(arr, players[i]);
	}

	return arr.byteArray;
}

function deserializePlayer(barr: Serializer): Player {
	let player = new Player();

	// basically the serialization code, but "read" instead of "add"

	player.dead = arr.readBit();
	player.pos.x = arr.readFloat();
	player.pos.y = arr.readFloat();
	player.name = arr.readString();

	if (!player.dead) {
		player.health = arr.readUint(7);
		player.curWeapId = arr.readUint(5);
		player.isDeveloper = arr.readBit();
		player.someInt = arr.readInt(12);
	}

	return player;
}

function deserializePlayers(barr: Uint8Array): Player[] {
	let arr = new Serializer(barr);
	let players: Player[] = [];

	let version = arr.readUint(8);
	let length = arr.readUint(6);

	for (let i = 0; i < length; i++) {
		players.push(deserializePlayer(arr));
	}

	return players;
}
```
