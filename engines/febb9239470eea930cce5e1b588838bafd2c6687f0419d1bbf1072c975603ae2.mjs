import { parentPort as e } from "node:worker_threads";
import { createHash as t } from "node:crypto";
//#region src/workshop/figures.ts
var n = [
	{
		id: "blade-dancer",
		name: "Blade Dancer",
		tags: ["Fast"]
	},
	{
		id: "ram-bastion",
		name: "Ram Bastion",
		tags: ["Strong"]
	},
	{
		id: "crossbow-warden",
		name: "Crossbow Warden",
		tags: ["Ranged"]
	},
	{
		id: "lantern-witch",
		name: "Lantern Witch",
		tags: ["Magic"]
	},
	{
		id: "banner-keeper",
		name: "Banner Keeper",
		tags: ["Support"]
	},
	{
		id: "javelin-runner",
		name: "Javelin Runner",
		tags: ["Fast", "Ranged"]
	},
	{
		id: "wind-courier",
		name: "Wind Courier",
		tags: ["Fast"]
	},
	{
		id: "iron-warden",
		name: "Iron Warden",
		tags: ["Strong"]
	},
	{
		id: "stone-slinger",
		name: "Stone Slinger",
		tags: ["Ranged"]
	},
	{
		id: "mirror-seer",
		name: "Mirror Seer",
		tags: ["Magic"]
	},
	{
		id: "field-mender",
		name: "Field Mender",
		tags: ["Support"]
	},
	{
		id: "antler-guardian",
		name: "Antler Guardian",
		tags: ["Strong"]
	},
	{
		id: "bell-sage",
		name: "Bell Sage",
		tags: ["Magic", "Support"]
	},
	{
		id: "drum-marshal",
		name: "Drum Marshal",
		tags: ["Support"]
	},
	{
		id: "rooftop-vaulter",
		name: "Rooftop Vaulter",
		tags: ["Fast"]
	},
	{
		id: "shell-bastion",
		name: "Shell Bastion",
		tags: ["Strong"]
	},
	{
		id: "reed-hunter",
		name: "Reed Hunter",
		tags: ["Ranged"]
	},
	{
		id: "hourglass-keeper",
		name: "Hourglass Keeper",
		tags: ["Magic"]
	},
	{
		id: "forge-bearer",
		name: "Forge Bearer",
		tags: ["Strong", "Support"]
	},
	{
		id: "owl-archivist",
		name: "Owl Archivist",
		tags: ["Support"]
	},
	{
		id: "hare-scout",
		name: "Hare Scout",
		tags: ["Fast"]
	},
	{
		id: "hornet-swarm",
		name: "Hornet Swarm",
		tags: ["Fast", "Ranged"]
	},
	{
		id: "mechanical-spiders",
		name: "Mechanical Spiders",
		tags: ["Fast", "Strong"]
	},
	{
		id: "dart-sentinel",
		name: "Dart Sentinel",
		tags: ["Ranged"]
	},
	{
		id: "fox-pathfinder",
		name: "Fox Pathfinder",
		tags: ["Fast"]
	},
	{
		id: "eagle-keeper",
		name: "Eagle Keeper",
		tags: ["Ranged"]
	},
	{
		id: "tide-caller",
		name: "Tide Caller",
		tags: ["Support"]
	},
	{
		id: "wooden-catapult",
		name: "Wooden Catapult",
		tags: ["Ranged"]
	},
	{
		id: "battering-ram",
		name: "Battering Ram",
		tags: ["Strong"]
	},
	{
		id: "drill-crawler",
		name: "Drill Crawler",
		tags: ["Strong"]
	},
	{
		id: "water-deity",
		name: "Water Deity",
		tags: ["Magic"]
	},
	{
		id: "fire-spirit",
		name: "Fire Spirit",
		tags: ["Magic"]
	},
	{
		id: "clay-golem",
		name: "Clay Golem",
		tags: ["Strong"]
	},
	{
		id: "storm-spirit",
		name: "Storm Spirit",
		tags: ["Magic", "Fast"]
	}
], r = (e) => n.find((t) => t.id === e), i = (e, t) => e.does[t], a = (e, t) => e.find(([e]) => e === t)?.[1] ?? t, o = (e, t) => ({
	pill: e.pill.key,
	text: a(e.pill.choices, i(t, e.pill.key))
}), s = { on: "always" }, c = (e) => e.lines.length > 0 || e.squares.some((e) => e.mark !== "move") || e.rules.some((e) => e.does.a === "movesLike"), l = (e) => e.lines.length > 0 || e.squares.some((e) => e.mark === "both" || e.mark === "take") || e.rules.some((e) => e.does.a === "movesLike"), u = [
	["king", "a king"],
	["knight", "a knight"],
	["bishop", "a bishop"],
	["rook", "a rook"],
	["queen", "a queen"]
], d = [
	["choice", "a piece you choose: queen, rook, bishop or knight"],
	["Q", "a queen"],
	["R", "a rook"],
	["B", "a bishop"],
	["N", "a knight"],
	["A", "an archer"]
], f = [
	["king", "a king"],
	["pawns", "pawns"],
	["any", "anything"]
], p = "It takes nothing already.", m = [
	{
		a: "step2",
		group: "Moving",
		title: "Steps 2 straight ahead",
		label: "Steps 2",
		example: "From its start rank, as a pawn does.",
		event: !1,
		rule: {
			when: {
				on: "zone",
				zone: "startRank"
			},
			does: { a: "step2" }
		},
		whens: (e) => e.on === "always" || e.on === "zone" && [
			"startRank",
			"ownHalf",
			"enemyHalf"
		].includes(e.zone),
		matrix: "4a Movement — special first move",
		say: () => ["it may also step 2 squares straight ahead, over an empty square, to an empty square"],
		short: () => "steps 2 straight ahead"
	},
	{
		a: "movesLike",
		group: "Moving",
		title: "Also moves like another piece",
		label: "Moves like…",
		example: "On a center square, it also moves like a queen.",
		event: !1,
		rule: {
			when: {
				on: "zone",
				zone: "capital"
			},
			does: {
				a: "movesLike",
				as: "queen"
			}
		},
		pill: {
			key: "as",
			choices: u
		},
		whens: (e) => ![
			"always",
			"takes",
			"firstTake",
			"reaches"
		].includes(e.on),
		matrix: "C3 moves differently while there",
		say: function(e) {
			return ["it also moves and takes like ", o(this, e)];
		},
		short: (e) => `also moves like ${a(u, i(e, "as"))}`
	},
	{
		a: "linesPass",
		group: "Moving",
		title: "Its lines pass over pieces",
		label: "Lines pass",
		example: "It slides past its own pieces, as the Paladin does.",
		event: !1,
		rule: {
			when: s,
			does: {
				a: "linesPass",
				over: "own"
			}
		},
		pill: {
			key: "over",
			choices: [["own", "its own pieces"], ["any", "any piece"]]
		},
		whens: (e) => [
			"always",
			"zone",
			"near"
		].includes(e.on),
		needs: (e) => e.lines.length ? null : "Paint a line first.",
		matrix: "4d Hop — over friends only",
		say: function(e) {
			return ["its lines pass over ", o(this, e)];
		},
		short: (e) => `its lines pass over ${i(e, "over") === "own" ? "its own pieces" : "any piece"}`
	},
	{
		a: "chain",
		group: "Taking",
		title: "Takes again",
		label: "Takes again",
		example: "After a take by moving, it may take again from there.",
		event: !0,
		rule: {
			when: { on: "takes" },
			does: { a: "chain" }
		},
		whens: (e) => e.on === "takes",
		needs: (e) => l(e) ? null : "It needs a square it takes on by moving.",
		matrix: "6a Trigger on capture",
		head: () => ["When it takes by moving"],
		say: () => ["it may take again from the new square (not a king)"],
		short: () => "takes again"
	},
	{
		a: "cannotBeTaken",
		group: "Safe",
		title: "Some pieces cannot take it",
		label: "Can't be taken",
		example: "For example, pawns cannot take it.",
		event: !1,
		rule: {
			when: s,
			does: {
				a: "cannotBeTaken",
				by: "pawns"
			}
		},
		pill: {
			key: "by",
			choices: [["pawns", "by pawns"], ["allButKing", "by anything but a king"]]
		},
		whens: (e) => [
			"always",
			"zone",
			"near",
			"beforeMove"
		].includes(e.on),
		matrix: "2 Shield — cannot be taken by X",
		say: function(e) {
			return ["it cannot be taken ", o(this, e)];
		},
		short: (e) => i(e, "by") === "pawns" ? "pawns cannot take it" : "only a king can take it"
	},
	{
		a: "push",
		group: "Moving others",
		title: "Pushes a piece next to it",
		label: "Pushes",
		example: "1 square straight away, and it follows.",
		event: !1,
		rule: {
			when: s,
			does: {
				a: "push",
				then: "follow"
			}
		},
		pill: {
			key: "then",
			choices: [["follow", "and follow it"], ["stay", "and stay"]]
		},
		whens: (e) => [
			"always",
			"zone",
			"near"
		].includes(e.on),
		matrix: "5a Control — move any adjacent piece",
		say: function(e) {
			return [
				"it may push a piece next to it 1 square straight away, onto an empty square, ",
				o(this, e),
				". Never a king"
			];
		},
		short: () => "pushes a piece next to it"
	},
	{
		a: "swap",
		group: "Moving others",
		title: "Swaps with a piece next to it",
		label: "Swaps",
		example: "It trades squares with a friend.",
		event: !1,
		rule: {
			when: s,
			does: {
				a: "swap",
				with: "friend"
			}
		},
		pill: {
			key: "with",
			choices: [["friend", "a friend"], ["enemy", "an enemy"]]
		},
		whens: (e) => ["always", "zone"].includes(e.on),
		matrix: "5b Control — friends only",
		say: function(e) {
			return [
				"it may swap places with ",
				o(this, e),
				" next to it (not a king)"
			];
		},
		short: (e) => `swaps with ${i(e, "with") === "friend" ? "a friend" : "an enemy"}`
	},
	{
		a: "becomes",
		group: "Changing",
		title: "Becomes another piece",
		label: "Becomes",
		example: "On the last rank, as a pawn does.",
		event: !0,
		rule: {
			when: {
				on: "reaches",
				zone: "lastRank"
			},
			does: {
				a: "becomes",
				into: "choice"
			}
		},
		pill: {
			key: "into",
			choices: d
		},
		whens: (e) => e.on === "firstTake" || e.on === "reaches" && e.zone === "lastRank",
		matrix: "Last rank",
		head: (e) => ["When it ", {
			pill: "when",
			text: e.when.on === "firstTake" ? "takes for the first time" : "reaches the last rank"
		}],
		say: function(e) {
			return ["it becomes ", o(this, e)];
		},
		short: (e) => `becomes ${a(d, i(e, "into")).replace(/:.*/, "")}`
	},
	{
		a: "cannotTake",
		group: "Holding back",
		title: "Cannot take …",
		label: "Can't take…",
		example: "It cannot take a king.",
		event: !1,
		rule: {
			when: s,
			does: {
				a: "cannotTake",
				what: "king"
			}
		},
		pill: {
			key: "what",
			choices: f
		},
		whens: (e) => [
			"always",
			"zone",
			"near",
			"beforeMove"
		].includes(e.on),
		needs: (e) => c(e) ? null : p,
		matrix: "3 Handicap — cannot take X",
		say: function(e) {
			return ["it cannot take ", o(this, e)];
		},
		short: (e) => `cannot take ${a(f, i(e, "what"))}`
	},
	{
		a: "removedAfter",
		group: "Holding back",
		title: "Is removed after it takes",
		label: "Removed too",
		example: "It takes a piece and leaves the board too.",
		event: !0,
		rule: {
			when: { on: "takes" },
			does: {
				a: "removedAfter",
				what: "piece"
			}
		},
		pill: {
			key: "what",
			choices: [["piece", "a piece, not a pawn"], ["any", "anything"]]
		},
		whens: (e) => e.on === "takes",
		needs: (e) => c(e) ? null : p,
		matrix: "6a Trigger on capture",
		head: function(e) {
			return ["When it takes ", o(this, e)];
		},
		say: () => ["it is removed too"],
		short: () => "is removed after it takes"
	}
], h = (e) => m.find((t) => t.a === e), g = {
	startRank: "on its start rank",
	ownHalf: "in your half",
	enemyHalf: "in the enemy half",
	lastRank: "on the last rank",
	capital: "on a center square"
}, ee = {
	P: {
		name: "pawn",
		article: "a",
		type: 1
	},
	N: {
		name: "knight",
		article: "a",
		type: 2
	},
	B: {
		name: "bishop",
		article: "a",
		type: 3
	},
	R: {
		name: "rook",
		article: "a",
		type: 4
	},
	Q: {
		name: "queen",
		article: "a",
		type: 5
	},
	A: {
		name: "archer",
		article: "an",
		type: 7
	},
	L: {
		name: "paladin",
		article: "a",
		type: 8
	},
	G: {
		name: "guard",
		article: "a",
		type: 9
	},
	M: {
		name: "maester",
		article: "a",
		type: 10
	},
	S: {
		name: "beast",
		article: "a",
		type: 11
	},
	O: {
		name: "ogre",
		article: "an",
		type: 12
	}
};
function te(e) {
	switch (e.on) {
		case "always": return "always";
		case "zone": return g[e.zone];
		case "near": return e.who === "king" ? "next to your king" : e.who === "friend" ? "next to one of your pieces" : e.who === "enemy" ? "next to an enemy piece" : `next to your ${ee[e.who].name}`;
		case "fromMove": return `from move ${e.n}`;
		case "beforeMove": return `before move ${e.n}`;
		case "afterFirstCapture": return "after its first capture";
		case "afterCard": return "on your turn after your opponent plays any card";
		case "takes": return "when it takes";
		case "firstTake": return "when it takes for the first time";
		case "reaches": return "when it reaches the last rank";
	}
}
var _ = Object.keys(ee), ne = (e) => !!e && typeof e == "object" && !Array.isArray(e), v = (e, t) => ne(e) && Object.keys(e).sort().join() === [...t].sort().join();
function re(e) {
	if (!ne(e)) return !1;
	switch (e.on) {
		case "always":
		case "afterFirstCapture":
		case "takes":
		case "firstTake": return v(e, ["on"]);
		case "zone": return v(e, ["on", "zone"]) && Object.hasOwn(g, e.zone);
		case "reaches": return v(e, ["on", "zone"]) && e.zone === "lastRank";
		case "near": return v(e, ["on", "who"]) && [
			"king",
			"friend",
			"enemy",
			..._
		].includes(e.who);
		case "fromMove":
		case "beforeMove": return v(e, ["on", "n"]) && [
			5,
			10,
			15,
			20
		].includes(e.n);
		case "afterCard": return v(e, ["on", "card"]) && e.card === "any";
		default: return !1;
	}
}
function ie(e) {
	let t = ne(e) ? m.find((t) => t.a === e.a) : void 0;
	return !t || !ne(e) ? !1 : t.pill ? v(e, ["a", t.pill.key]) && t.pill.choices.some(([n]) => n === e[t.pill.key]) : v(e, ["a"]);
}
var y = (e) => v(e, ["when", "does"]) && re(e.when) && ie(e.does) && h(e.does.a).whens(e.when);
[
	..._.map((e) => ({
		on: "near",
		who: e
	})),
	...[
		5,
		15,
		20
	].map((e) => ({
		on: "fromMove",
		n: e
	})),
	...[
		5,
		10,
		15,
		20
	].map((e) => ({
		on: "beforeMove",
		n: e
	}))
];
var b = " PNBRQKALGMSOCVT", ae = [
	"",
	"pawn",
	"knight",
	"bishop",
	"rook",
	"queen",
	"king",
	"archer",
	"paladin",
	"guard",
	"maester",
	"beast",
	"ogre",
	"catapult",
	"reaver",
	"templar"
], x = (e) => e === 15 && Un()?.name || ae[e], S = (e, t = "the") => {
	let n = e === 15 && Un()?.name;
	return n ? t[0] === t[0].toUpperCase() ? n[0].toUpperCase() + n.slice(1) : n : `${t} ${ae[e]}`;
}, C = (e) => S(e, /^[aeiou]/.test(ae[e]) ? "an" : "a"), oe = [
	5,
	4,
	3,
	2,
	7,
	8,
	9,
	10,
	11
], se = {
	anyNonKing: oe,
	standard: [
		5,
		4,
		3,
		2
	],
	anyNonKingNoFairy: [
		5,
		4,
		3,
		2
	],
	anyNonKingNoGuard: oe.filter((e) => e !== 9)
}, w = (e, t) => e | t << 4, T = (e) => e & 15, E = (e) => e >> 4 & 1, D = (e) => e & 7, O = (e) => e >> 3, k = (e, t) => t << 3 | e, A = (e) => "abcdefgh"[D(e)] + (O(e) + 1), ce = (e) => k(e.charCodeAt(0) - 97, e.charCodeAt(1) - 49), j = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[1, 1],
	[1, -1],
	[-1, 1],
	[-1, -1]
], M = [
	27,
	28,
	35,
	36
], le = j.slice(0, 4), ue = j.slice(4), de = [
	[1, 2],
	[2, 1],
	[-1, 2],
	[-2, 1],
	[1, -2],
	[2, -1],
	[-1, -2],
	[-2, -1]
], fe = [
	[1, 1],
	[1, -1],
	[-1, 1],
	[-1, -1],
	[2, 0],
	[-2, 0],
	[0, 2],
	[0, -2]
], pe = [
	-2,
	-1,
	0,
	1,
	2
].flatMap((e) => [
	-2,
	-1,
	0,
	1,
	2
].filter((t) => Math.max(Math.abs(e), Math.abs(t)) === 2).map((t) => [e, t])), N = {
	classic: fe,
	plusDiag2: [
		...fe,
		[2, 2],
		[2, -2],
		[-2, 2],
		[-2, -2]
	],
	ring2: [...ue, ...pe],
	forward3: [
		[1, 1],
		[-1, 1],
		[0, 2]
	],
	plusDiagFwd2: [
		...fe,
		[2, 2],
		[-2, 2]
	],
	plusDiagFwd2Clear: [
		...fe,
		[2, 2],
		[-2, 2]
	],
	fwd2NoBack: [
		...fe.filter(([e, t]) => e !== 0 || t !== -2),
		[2, 2],
		[-2, 2]
	],
	fwd2NoSide: [
		...fe.filter(([e, t]) => t !== 0 || Math.abs(e) !== 2),
		[2, 2],
		[-2, 2]
	],
	far2: [
		[2, 0],
		[-2, 0],
		[0, 2],
		[0, -2],
		[2, 2],
		[-2, 2]
	],
	over2: [
		[2, 0],
		[-2, 0],
		[0, 2],
		[0, -2],
		[2, 2],
		[-2, 2]
	],
	nearOver2: [
		[1, 1],
		[1, -1],
		[-1, 1],
		[-1, -1],
		[2, 0],
		[-2, 0],
		[0, 2],
		[0, -2],
		[2, 2],
		[-2, 2]
	],
	fwdNearOver2: [
		[1, 1],
		[-1, 1],
		[2, 0],
		[-2, 0],
		[0, 2],
		[0, -2],
		[2, 2],
		[-2, 2]
	]
}, me = {
	forward3: N.forward3,
	plusDiagFwd2: N.plusDiagFwd2,
	plusDiagFwd2Clear: N.plusDiagFwd2Clear,
	fwd2NoBack: N.fwd2NoBack,
	fwd2NoSide: N.fwd2NoSide,
	far2: N.far2,
	over2: N.over2,
	nearOver2: N.nearOver2,
	fwdNearOver2: N.fwdNearOver2
}, he = () => J.archerShots === "over2" || J.archerShots === "nearOver2" || J.archerShots === "fwdNearOver2", ge = () => J.archerShots === "plusDiagFwd2Clear" ? 1 : he() ? 2 : 0, _e = (e, t, n, r) => e === 1 ? t * n !== 0 && Math.abs(n) === 2 && r !== 0 : e === 2 && Math.max(Math.abs(t), Math.abs(n)) === 2 && r === 0, ve = (e) => e.map(([e, t]) => [e, -t]), ye = Object.fromEntries(Object.entries(me).map(([e, t]) => [e, ve(t)])), be = (e) => {
	let t = me[J.archerShots];
	return t ? e === 1 ? ye[J.archerShots] : t : N[J.archerShots];
}, xe = [[0, 1], [0, -1]], Se = [[[1, 1], [-1, 1]], [[1, -1], [-1, -1]]];
function P(e, t, n) {
	let r = D(e) + t, i = O(e) + n;
	return r < 0 || r > 7 || i < 0 || i > 7 ? -1 : k(r, i);
}
var F = (e) => e === 0 ? 1 : -1, I = (e, t) => T(e) === 9 ? J.guardNoSecondRank && O(t) === (E(e) === 0 ? 1 : 6) ? !1 : !J.guardNoCapital || !M.includes(t) : !0, Ce = (e, t) => Math.max(Math.abs(D(e) - D(t)), Math.abs(O(e) - O(t))), L = (e) => J.kings[e]?.power ?? "", we = (e) => e.move ?? (e.ply >> 1) + 1, Te = (e, t) => !(t < (J.fromMove[e] ?? 0));
function Ee(e) {
	let t = L(e), n = t ? Nn[t] : void 0;
	return n ? J[n] : -1;
}
var R = (e) => J.hands[e], De = (e, t = 0) => J.hands[e].length + t, Oe = (e, t) => t < J.hands[e].length ? J.hands[e][t] : J.piles[e][t - J.hands[e].length], ke = (e, t) => J.hands[e].includes(t) || J.piles[e].includes(t), Ae = (e) => ke(0, e) || ke(1, e), je = {
	freeze: "Freeze",
	ward: "IceWall",
	strike: "Strike",
	haste: "Haste",
	flight: "Flight",
	sacrifice: "Sacrifice",
	march: "March",
	leap: "Leap",
	mimic: "Mimic",
	vault: "Vault",
	curse: "Curse",
	skylift: "SkyLift",
	salvation: "Salvation",
	rage: "Rage",
	rageb: "RageB",
	firewall: "Firewall",
	firewallb: "FirewallB",
	quake: "EarthQuake",
	quakeb: "EarthQuakeB",
	burn: "Burn",
	firestarter: "FireStarter",
	control: "Control",
	rescue: "Rescue",
	growth: "Growth",
	growthb: "GrowthB",
	rally: "Rally",
	morph: "Morph",
	morphb: "MorphB",
	spawn: "Spawn",
	spawnk: "SpawnK",
	spawn2: "Spawn2",
	spawnk2: "SpawnK2",
	morphp: "MorphP",
	morphs: "MorphS"
}, Me = (e) => e === "spawn" || e === "spawnk" || e === "spawn2" || e === "spawnk2", Ne = (e, t, n, r = 0) => {
	for (let i = 0, a = De(e, r); i < a; i++) if (Oe(e, i) === n && !(t >> i & 1)) return !0;
	return !1;
};
function Pe(e, t, n, r = 0, i) {
	if (!R(e).length) return t + 1;
	let a = i === "mirror" ? "Mirror" : i === "mirrorb" ? "MirrorB" : je[n];
	for (let n = 0, i = De(e, r); n < i; n++) if (Oe(e, n) === a && !(t >> n & 1)) return t | 1 << n;
	return t;
}
function Fe(e, t, n = 0) {
	if (R(e).length) return !!(~t & (1 << De(e, n)) - 1);
	let r = Ee(e);
	return r < 0 ? !1 : r === 0 ? L(e) !== "March" && L(e) !== "Leap" : t < r;
}
var Ie = (e) => L(e) === "March" && J.marchUses === 0, Le = (e) => L(e) === "Leap" && J.leapUses === 0;
function Re(e, t, n = !1) {
	if (t === void 0 || t === e) return "";
	if (R(t).length) return n ? "warded" : "frozen";
	let r = L(t);
	return r === "Freeze" ? "frozen" : r === "IceWall" ? "warded" : "";
}
var ze = (e) => L(e) === "Sacrifice" || ke(e, "Sacrifice") || ke(e, "Salvation") || ke(e, "Mirror") && (Ae("Sacrifice") || Ae("Salvation")), Be = () => Ae("Mirror"), Ve = () => J.markTurns === 1 && Ae("Rescue"), He = (e) => e === "freeze" || e === "ward" || e === "firewall" || e === "rescue", Ue = (e) => e.pass === !0 || He(e.power) || e.power === "growth" || e.power === "growthb", We = (e) => e.power === "haste" || e.power === "rage" || e.power === "rageb" || e.power === "rally" || e.power === "growthb" || J.markFree && He(e.power), Ge = () => ze(0) || ze(1), Ke = (e) => e !== 1 && e !== 6 && e !== 9, qe = (e, t, n) => t.drop ? w(t.drop, n) : e[t.from];
function z(e, t) {
	let n = T(e);
	if (n === 12 && J.ogreNoCapture) return !1;
	if (J.design && (n === 15 || t === 15)) {
		for (let { when: e, does: r } of J.design.rules) if (e.on === "always" && (n === 15 && r.a === "cannotTake" && (r.what === "any" || r.what === "king" && t === 6 || r.what === "pawns" && t === 1) || t === 15 && r.a === "cannotBeTaken" && (r.by === "pawns" ? n === 1 : n !== 6))) return !1;
	}
	return n === 9 && (J.guardCaptures === "none" || J.guardCaptures === "pawns" && t !== 1) || n === 9 && J.guardCaptureLimit && e & 32 ? !1 : t === 9 && J.guardImmune ? n === 6 : n === 6 && t !== 9 && L(E(e)) === "Mercy" && !J.mercyCaptures && !(t === 1 && J.mercyTakesPawns) || n === 1 && t === 6 && L(E(e) ^ 1) === "HolyLight" || n === 2 && t === 6 && J.holyLightKnights && L(E(e) ^ 1) === "HolyLight" || n === 6 && t === 1 && L(E(e)) === "HolyLight" && !J.holyLightTakesPawns || n === 1 && t === 1 && J.darknessPawnArmor && L(E(e) ^ 1) === "Darkness" ? !1 : t !== 6 || (n !== 8 || J.paladinChecks) && (J.archerChecks || n !== 7);
}
function B(e, t) {
	return e.indexOf(w(6, t));
}
function Je(e, t, n) {
	if (!J.holyLightAura || L(n) !== "HolyLight") return !1;
	let r = w(6, n);
	for (let n = 0; n < 8; n++) {
		let i = U[t * 8 + n];
		if (i >= 0 && e[i] === r) return !0;
	}
	return !1;
}
var Ye = () => J.mercyAura || J.holyLightShelter || J.darknessShelter || J.darknessAuraPawns || !!J.design?.rules.some((e) => e.does.a === "cannotBeTaken" && e.when.on !== "always");
function Xe(e, t) {
	let n = e[t];
	if (!n || T(n) === 6) return 0;
	let r = J.design && T(n) === 15 ? en(J.design, e, t) : 0, i = L(E(n)), a = 0, o, s;
	if (i === "Mercy" && J.mercyAura) o = J.mercyAuraOrtho ? 4 : 8, s = J.mercyAuraPawns ? 1 : J.mercyAuraPawnsTake ? 3 : 2;
	else if (i === "HolyLight" && J.holyLightShelter) o = J.holyLightShelterOrtho ? 4 : 8, s = 2;
	else if (i === "Darkness" && J.darknessShelter) a = 4, o = 8, s = J.darknessShelterPawnsTake ? 3 : 2;
	else if (i === "Darkness" && J.darknessAuraPawns) o = 8, s = 1;
	else return r;
	let c = w(6, E(n));
	for (let n = a; n < o; n++) {
		let i = U[t * 8 + n];
		if (i >= 0 && e[i] === c) return !r || r === s ? s : s === 1 ? 4 : 2;
	}
	return r;
}
function Ze(e, t, n) {
	for (let r = t.length - 1; r >= n; r--) {
		let n = t[r].captures, i = T(e[t[r].from]), a = i === 1;
		for (let o = 0; o < n.length; o++) {
			let s = Xe(e, n[o]);
			if (s === 2 || s === 1 && a || s === 3 && !a || s === 4 && i !== 6) {
				t.splice(r, 1);
				break;
			}
		}
	}
}
function V(e, t, n, r, i) {
	if (O(n) === i) for (let i of se[J.promotionSet]) e.push({
		from: t,
		to: n,
		captures: r,
		promo: i
	});
	else e.push({
		from: t,
		to: n,
		captures: r
	});
}
function Qe(e, t, n, r, i, a, o, s, c, l) {
	for (let [u, d] of o) {
		if (J.beastCapture === "adjacent" && u === 0 && d === s && !J.beastCaptureForward) continue;
		let f = P(r, u, d);
		if (f < 0) continue;
		let p = (t ?? e)[f];
		if (!p || E(p) === a) continue;
		let m = T(p);
		if (!z(11, m) || i.length > 0 && m === 6) continue;
		let h = [...i, f];
		if (l.push({
			from: n,
			to: f,
			captures: h
		}), c === "attacks" || m === 6 || !J.beastChains) continue;
		let g = t ?? new Uint8Array(e);
		g[f] = 0, Qe(e, g, n, f, h, a, o, s, c, l), g[f] = p;
	}
}
function $e(e, t, n, r, i, a, o) {
	for (let [s, c] of i) {
		let i = P(t, s, c);
		if (i < 0) continue;
		let l = e[i];
		l ? E(l) !== n && z(r, T(l)) && o.push({
			from: t,
			to: i,
			captures: [i]
		}) : a === "all" && o.push({
			from: t,
			to: i,
			captures: []
		});
	}
}
function et(e, t, n, r, i, a, o) {
	let s = Le(n);
	for (let [c, l] of i) for (let i = P(t, c, l); i >= 0; i = P(i, c, l)) {
		let c = e[i];
		if (!c) {
			a === "all" && o.push({
				from: t,
				to: i,
				captures: []
			});
			continue;
		}
		if (!(s && E(c) === n && T(c) === 1)) {
			E(c) !== n && z(r, T(c)) && o.push({
				from: t,
				to: i,
				captures: [i]
			});
			break;
		}
	}
}
function tt(e, t, n, r, i = e[t]) {
	let a = E(i);
	switch (T(i)) {
		case 1: {
			let o = F(a), s = a === 0 ? 1 : 6, c = a === 0 ? 7 : 0, l = L(a) === "Darkness";
			if (l && (J.darknessTakeAhead || J.darknessStepDiag)) {
				if (J.darknessStepDiag) {
					if (n === "all") for (let n of [-1, 1]) {
						let i = P(t, n, o);
						i >= 0 && !e[i] && V(r, t, i, [], c);
					}
				} else {
					let n = P(t, 0, o);
					n >= 0 && e[n] && E(e[n]) !== a && z(i, T(e[n])) && !Je(e, n, a ^ 1) && V(r, t, n, [n], c);
				}
			} else if (l) {
				if (n === "all") for (let n of [-1, 1]) {
					let i = P(t, n, o);
					i >= 0 && !e[i] && V(r, t, i, [], c);
				}
				let l = P(t, 0, o);
				if (l >= 0 && e[l] && E(e[l]) !== a && z(i, T(e[l])) && !Je(e, l, a ^ 1) && V(r, t, l, [l], c), J.darknessMoves && !J.darknessKeep && n === "all") {
					let n = P(t, 0, o);
					if (n >= 0 && !e[n]) {
						V(r, t, n, [], c);
						let i = P(t, 0, 2 * o);
						(Ie(a) || O(t) === s) && i >= 0 && !e[i] && V(r, t, i, [], c);
					}
				}
				if (!J.darknessKeep) return;
			}
			if (n === "all") {
				let n = P(t, 0, o);
				if (n >= 0 && !e[n]) {
					V(r, t, n, [], c);
					let i = P(t, 0, 2 * o);
					(Ie(a) || O(t) === s) && i >= 0 && !e[i] && V(r, t, i, [], c);
				}
			}
			if (J.pawnCapitalCapture && n !== "attacks" && !l && M.includes(t)) {
				let n = P(t, 0, o);
				n >= 0 && e[n] && E(e[n]) !== a && z(i, T(e[n])) && !Je(e, n, a ^ 1) && V(r, t, n, [n], c);
			}
			for (let n of [-1, 1]) {
				let s = P(t, n, o);
				s >= 0 && e[s] && E(e[s]) !== a && z(i, T(e[s])) && !Je(e, s, a ^ 1) && V(r, t, s, [s], c);
			}
			return;
		}
		case 2: return $e(e, t, a, i, de, n, r);
		case 6: {
			let o = L(a) === "Mercy";
			if (o || J.darknessKingStep2 && L(a) === "Darkness") {
				let s = !o && J.darknessKingStepTakes, c = !o && !s && J.darknessKingStepSafe;
				for (let [l, u] of j) {
					let d = P(t, l, u);
					if (d < 0) continue;
					let f = e[d];
					if (f) {
						if (E(f) !== a) {
							z(i, T(f)) && r.push({
								from: t,
								to: d,
								captures: [d]
							});
							continue;
						}
						if (!o || J.mercyNoJump) continue;
					} else n === "all" && r.push({
						from: t,
						to: d,
						captures: []
					});
					let p = P(d, l, u);
					if (p < 0) continue;
					let m = e[p];
					m ? s && E(m) !== a && z(i, T(m)) && r.push({
						from: t,
						to: p,
						captures: [p]
					}) : n === "all" && !(c && dt(e, d, a ^ 1)) && r.push({
						from: t,
						to: p,
						captures: []
					});
				}
				return;
			}
			if (L(a) === "DeathTouch") {
				for (let o = 0; o < 8; o++) {
					let [s, c] = j[o], l = P(t, s, c);
					if (l < 0) continue;
					let u = e[l];
					if (u ? E(u) !== a && z(i, T(u)) && (r.push({
						from: t,
						to: t,
						captures: [l]
					}), J.deathTouchMoves && r.push({
						from: t,
						to: l,
						captures: [l]
					})) : n === "all" && r.push({
						from: t,
						to: l,
						captures: []
					}), J.deathTouchReach && !u && st(s, c, a)) {
						let n = P(l, s, c), o = n >= 0 ? e[n] : 0;
						o && E(o) !== a && z(i, T(o)) && !(J.deathTouchReachPieces && T(o) === 1) && r.push({
							from: t,
							to: t,
							captures: [n]
						});
					}
				}
				return;
			}
			return $e(e, t, a, i, j, n, r);
		}
		case 9: {
			let o = r.length;
			$e(e, t, a, i, j, n, r);
			let s = J.guardDoubleFirst !== "off" && O(t) === (a === 0 ? 0 : 7), c = J.guardCapitalStep && M.includes(t);
			if ((J.guardStep === 2 || s || c) && n === "all") for (let [n, i] of j) {
				let a = P(t, n, i);
				if (a < 0 || e[a] && !(s && J.guardDoubleFirst === "leap")) continue;
				let o = P(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			if (J.guardNoSecondRank || J.guardNoCapital) for (let e = r.length - 1; e >= o; e--) I(i, r[e].to) || r.splice(e, 1);
			return;
		}
		case 3: return et(e, t, a, i, ue, n, r);
		case 4: return et(e, t, a, i, le, n, r);
		case 5: return et(e, t, a, i, j, n, r);
		case 7: {
			let i = J.archerMove === "any" ? j : J.archerMove === "fwdBack" ? xe : le;
			if (n === "all") for (let [n, a] of i) {
				let i = P(t, n, a);
				i >= 0 && !e[i] && r.push({
					from: t,
					to: i,
					captures: []
				});
			}
			let o = ge();
			for (let [n, i] of be(a)) {
				let s = P(t, n, i);
				s >= 0 && e[s] && E(e[s]) !== a && z(7, T(e[s])) && !(o && _e(o, n, i, e[P(t, n >> 1, i >> 1)])) && r.push({
					from: t,
					to: t,
					captures: [s]
				});
			}
			return;
		}
		case 8:
			for (let [i, o] of j) for (let s = P(t, i, o); s >= 0; s = P(s, i, o)) {
				let i = e[s];
				if (!i) {
					n === "all" && r.push({
						from: t,
						to: s,
						captures: []
					});
					continue;
				}
				if (E(i) === a) {
					if (J.paladinJumpsFriends) continue;
					break;
				}
				if (z(8, T(i))) {
					if (J.paladinReturn) r.push({
						from: t,
						to: t,
						captures: [s]
					});
					else {
						let e = {
							from: t,
							to: s,
							captures: [s]
						};
						(J.paladinKamikaze === "always" || J.paladinKamikaze === "nonPawn" && T(i) !== 1) && (e.selfRemove = !0), r.push(e);
					}
				}
				if (J.paladinBlockedByEnemies) break;
			}
			return;
		case 10: {
			for (let [i, o] of j) {
				let s = P(t, i, o);
				if (s < 0) continue;
				let c = e[s];
				c ? E(c) === a ? n === "all" && I(c, t) && r.push({
					from: t,
					to: s,
					captures: [],
					swap: !0
				}) : (z(10, T(c)) && r.push({
					from: t,
					to: s,
					captures: [s]
				}), n === "all" && J.maesterSwapEnemy && T(c) !== 6 && r.push({
					from: t,
					to: s,
					captures: [],
					swap: !0
				})) : n === "all" && r.push({
					from: t,
					to: s,
					captures: []
				});
			}
			if (J.maesterStep === 2 && n === "all") for (let [n, i] of j) {
				let a = P(t, n, i);
				if (a < 0 || e[a]) continue;
				let o = P(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			if (n === "all" && J.maesterSwapAny) for (let n = 0; n < 64; n++) {
				let i = e[n];
				i && E(i) === a && T(i) !== 6 && Ce(t, n) > 1 && I(i, t) && r.push({
					from: t,
					to: n,
					captures: [],
					swap: !0
				});
			}
			let i = a === 0 ? 0 : 7, o = (e) => J.maesterKingSwapAnywhere || O(e) === i;
			if (n === "all" && J.maesterLongSwap && o(t)) {
				let n = B(e, a);
				n >= 0 && o(n) && Ce(n, t) > 1 && r.push({
					from: t,
					to: n,
					captures: [],
					swap: !0
				});
			}
			return;
		}
		case 11: {
			let i = F(a), o = J.beastMove === "any" ? j : J.beastMove === "diagFwdBack" ? ue : [[0, i]];
			if (n === "all") for (let [n, i] of o) {
				let a = P(t, n, i);
				a >= 0 && !e[a] && r.push({
					from: t,
					to: a,
					captures: []
				});
			}
			Qe(e, null, t, t, [], a, J.beastCapture === "diagForward" ? Se[a] : J.beastCapture === "diagonal" ? ue : j, i, n, r);
			return;
		}
		case 14:
			if ($e(e, t, a, i, de, n, r), n === "all") {
				let n = J.reaverStep === "ortho" ? le : j;
				for (let [o, s] of de) {
					let c = P(t, o, s);
					if (c < 0) continue;
					let l = e[c];
					if (l && E(l) !== a && z(i, T(l))) for (let [i, a] of n) {
						let n = P(c, i, a);
						n >= 0 && !e[n] && r.push({
							from: t,
							to: n,
							captures: [c]
						});
					}
				}
			}
			return;
		case 15: return J.design ? tn(e, t, n, r, J.design) : M.includes(t) ? et(e, t, a, i, j, n, r) : $e(e, t, a, i, j, n, r);
		case 12:
			if ($e(e, t, a, i, j, n, r), J.ogreStep2 && n === "all") for (let [n, i] of j) {
				let a = P(t, n, i);
				if (a < 0 || e[a]) continue;
				let o = P(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			if (n !== "all") return;
			if (J.ogreHop) for (let [n, i] of j) {
				let a = P(t, n, i);
				if (a < 0 || !e[a]) continue;
				let o = P(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			for (let [n, i] of j) {
				let a = P(t, n, i);
				if (a < 0) continue;
				let o = e[a];
				if (!o || T(o) === 6) continue;
				let s = P(a, n, i);
				s < 0 || e[s] || r.push({
					from: t,
					to: J.ogreMode === "push" ? a : t,
					captures: [],
					shove: {
						from: a,
						to: s
					}
				});
			}
			return;
		case 13:
			if (n === "all") for (let [n, i] of le) for (let a = P(t, n, i); a >= 0 && !e[a]; a = P(a, n, i)) r.push({
				from: t,
				to: a,
				captures: []
			});
			for (let [n, o] of le) {
				let s = P(t, n, o);
				for (; s >= 0 && !e[s];) s = P(s, n, o);
				if (s < 0 || E(e[s]) === a) continue;
				let c = P(s, n, o);
				for (; c >= 0 && !e[c];) c = P(c, n, o);
				if (c < 0) continue;
				let l = e[c];
				E(l) !== a && z(i, T(l)) && r.push({
					from: t,
					to: J.catapultCapture === "land" ? c : t,
					captures: [c]
				});
			}
			return;
	}
}
function nt(e, t, n, r) {
	let i = r.length;
	if (tt(e, t, n, r), Ye() && Ze(e, r, i), n !== "attacks") {
		if (J.capitalSanctuary) for (let e = r.length - 1; e >= i; e--) {
			let t = r[e].captures;
			for (let n = 0; n < t.length; n++) if (M.includes(t[n])) {
				r.splice(e, 1);
				break;
			}
		}
		if (J.capitalNoCapture && M.includes(t)) for (let e = r.length - 1; e >= i; e--) r[e].captures.length > 0 && r.splice(e, 1);
		if (J.ogreShoveFriends !== "both" && T(e[t]) === 12) {
			let n = E(e[t]);
			for (let t = r.length - 1; t >= i; t--) {
				let i = r[t].shove;
				i && E(e[i.from]) === n != (J.ogreShoveFriends === "friends") && r.splice(t, 1);
			}
		}
	}
}
function rt(e, t) {
	return t.promo ? w(t.promo, E(e)) : J.guardCaptureLimit && t.captures.length > 0 && T(e) === 9 || J.design && t.captures.length > 0 && T(e) === 15 && J.design.rules.some((e) => e.when.on === "afterFirstCapture" || e.when.on === "firstTake") ? e | 32 : e;
}
function it(e, t, n, r) {
	let i = e ? [...e] : Array(32).fill(0);
	for (let e of n.captures) {
		let n = t[e];
		i[E(n) * 16 + T(n)]++;
	}
	return n.selfRemove && i[E(r) * 16 + T(r)]++, n.power === "sacrifice" && n.promo && i[E(r) * 16 + n.promo]--, n.power === "salvation" && n.drop && i[E(r) * 16 + n.drop]--, i;
}
function at(e, t) {
	let n = e.turn, r = new Uint8Array(e.board), i = Ue(t), a = qe(r, t, n), o = r[t.to], s = e.lost;
	if (!i) {
		Ge() && (s = it(s, r, t, a));
		for (let e of t.captures) r[e] = 0;
		if (t.shove && (r[t.shove.to] = r[t.shove.from], r[t.shove.from] = 0), t.pushes) for (let e of t.pushes) r[e.to] = r[e.from], r[e.from] = 0;
		else r[t.from] = t.swap ? o : 0, r[t.to] = t.selfRemove ? 0 : rt(a, t), t.drop2 !== void 0 && (r[t.drop2] = a), t.castle && (r[t.castle.to] = r[t.castle.from], r[t.castle.from] = 0);
	}
	let c = !i && (t.captures.length > 0 || (t.pushes ? t.pushes.some((t) => T(e.board[t.from]) === 1) : !t.drop && T(a) === 1)), l = He(t.power), u = J.secondPlayerDoubleFirstTurn && e.ply === 1 || We(t), d = {
		board: r,
		turn: u ? n : n ^ 1,
		halfmove: c ? 0 : e.halfmove + 1,
		ply: e.ply + 1,
		move: we(e) + +(!u && n === 1)
	}, f = e.used, p = e.drawn?.[n] ?? 0;
	if (t.power) {
		let e = [f?.[0] ?? 0, f?.[1] ?? 0];
		e[n] = Pe(n, e[n], t.power, p, t.via), f = e;
	}
	f && (f[0] || f[1]) && (d.used = f);
	let m = [e.marks?.[0], e.marks?.[1]], h = n ^ 1, g = m[h], ee = m[n];
	if (g && !u) {
		let e = (g.left ?? 1) - 1, { left: t, ...n } = g;
		m[h] = e > 1 ? {
			...n,
			left: e
		} : e === 1 ? n : e === 0 && Ve() ? {
			...n,
			left: 0
		} : void 0;
	}
	if (ee?.left === 0 && !u && (m[n] = void 0), l) {
		if (t.power === "rescue") {
			let { left: e = 1, ...t } = ee, r = e === 0 ? 1 : e + 1;
			m[n] = r > 1 ? {
				...t,
				left: r
			} : t;
		} else {
			let e = (t.power === "ward" || t.power === "firewall") && R(n).length > 0;
			m[n] = {
				sq: t.to,
				...J.markTurns > 1 ? { left: J.markTurns } : {},
				...e ? { ward: !0 } : {},
				...t.power === "firewall" ? { all: !0 } : {}
			};
		}
		J.markFree && (d.free = !0);
	}
	if (t.power === "growthb" && (d.free = !0), (m[0] || m[1]) && (d.marks = m), (t.power === "haste" || t.power === "rage" || t.power === "rageb" || t.power === "rally") && (d.haste = t.to), (t.power === "rage" || t.power === "rageb" || t.power === "rally") && (d.rage = t.power === "rage" ? 1 : t.power === "rageb" ? 2 : 3), t.power === "growth" || t.power === "growthb") {
		let t = [e.drawn?.[0] ?? 0, e.drawn?.[1] ?? 0];
		t[n]++, d.drawn = t;
	} else e.drawn && (d.drawn = e.drawn);
	let te = e.last;
	if (t.power && R(n).length && Be()) {
		let e = [te?.[0], te?.[1]];
		e[n] = je[t.power], te = e;
	}
	te && (d.last = te), s && (d.lost = s);
	let _ = e.waiting;
	if (t.drop && !t.power && _) {
		let e = [_[0], _[1]];
		e[n]--, _ = e;
	}
	if (_ && (_[0] || _[1]) && (d.waiting = _), e.castle) {
		let n = It(e.castle, t);
		n && (d.castle = n);
	}
	if (J.classicChess && !i) {
		let e = Lt(r, t, n);
		e >= 0 && (d.ep = e);
	}
	return d;
}
function ot(e, t, n) {
	return J.beastCapture === "diagForward" ? e !== 0 && t === -F(n) : J.beastCapture === "diagonal" ? e !== 0 && t !== 0 : J.beastCaptureForward || e !== 0 || t !== -F(n);
}
function st(e, t, n) {
	return J.deathTouchReachOrtho && e !== 0 && t !== 0 || J.deathTouchReachNoBack && t === -F(n) ? !1 : !J.deathTouchReachForwardBack || e === 0;
}
function H(e, t, n, r, i) {
	let a = e[t];
	return a !== 0 && E(a) === r && T(a) === n && (i === 0 || z(a, i));
}
var ct = Array.from({ length: 64 }, (e, t) => Int8Array.from(de.map(([e, n]) => P(t, e, n)).filter((e) => e >= 0))), U = Int8Array.from({ length: 512 }, (e, t) => P(t >> 3, j[t & 7][0], j[t & 7][1])), lt = Array.from({ length: 512 }, (e, t) => {
	let [n, r] = j[t & 7], i = [];
	for (let e = P(t >> 3, n, r); e >= 0; e = P(e, n, r)) i.push(e);
	return Int8Array.from(i);
});
function ut(e, t, n, r) {
	let i = -F(n), a = L(n) === "Darkness";
	if (a && !J.darknessStepDiag) {
		let a = P(t, 0, i);
		if (a >= 0 && H(e, a, 1, n, r)) return !0;
	}
	if (!a || J.darknessKeep || J.darknessTakeAhead || J.darknessStepDiag) {
		let a = P(t, -1, i), o = P(t, 1, i);
		if (a >= 0 && H(e, a, 1, n, r) || o >= 0 && H(e, o, 1, n, r)) return !0;
	}
	return !1;
}
function dt(e, t, n) {
	let r = Ye() ? Xe(e, t) : 0;
	if (r === 2) return !1;
	let i = e[t] ? T(e[t]) : 0;
	if (r === 4) {
		let r = B(e, n), i = [];
		return r >= 0 && tt(e, r, "attacks", i), i.some((e) => e.captures[0] === t);
	}
	if (r === 3) return ut(e, t, n, i);
	let a = -1, o = ct[t];
	for (let t = 0; t < o.length; t++) if (H(e, o[t], 2, n, i) || H(e, o[t], 14, n, i)) return !0;
	for (let r = 0; r < 8; r++) {
		let a = U[t * 8 + r];
		if (a < 0) continue;
		let o = e[a];
		if (o && E(o) === n && (H(e, a, 6, n, i) || H(e, a, 10, n, i) || !J.ogreNoCapture && H(e, a, 12, n, i) || !J.design && H(e, a, 15, n, i) || J.guardCaptures !== "none" && H(e, a, 9, n, i) && I(o, t) || H(e, a, 11, n, i) && ot(j[r][0], j[r][1], n))) return !0;
	}
	let s = J.deathTouchReach && L(n) === "DeathTouch" && !(J.deathTouchReachPieces && i === 1), c = J.darknessKingStepTakes && J.darknessKingStep2 && L(n) === "Darkness";
	if (s || c) for (let r = 0; r < (s && J.deathTouchReachOrtho ? 4 : 8); r++) {
		let a = U[t * 8 + r];
		if (a < 0 || e[a]) continue;
		let o = U[a * 8 + r];
		if (o >= 0 && H(e, o, 6, n, i) && (c || st(-j[r][0], -j[r][1], n))) return !0;
	}
	if (r === 0 && !Je(e, t, n ^ 1) && ut(e, t, n, i)) return !0;
	let l = be(n), u = ge();
	for (let r = 0; r < l.length; r++) {
		let a = l[r][0], o = l[r][1], s = P(t, -a, -o);
		if (s >= 0 && H(e, s, 7, n, i) && !(u && _e(u, a, o, e[P(t, -a >> 1, -o >> 1)]))) return !0;
	}
	for (let r = 0; r < 8; r++) {
		let o = lt[t * 8 + r], s = r < 4 ? 4 : 3, c = !1, l = !1, u = !0;
		for (let t = 0; t < o.length; t++) {
			let d = o[t], f = e[d];
			if (!f) continue;
			let p = u;
			if (u = !1, E(f) !== n) {
				if (r < 4 && p && (a < 0 ? a = +!!e.includes(w(13, n)) : a)) {
					for (let r = t + 1; r < o.length; r++) if (e[o[r]]) {
						if (H(e, o[r], 13, n, i)) return !0;
						break;
					}
				}
				if (J.paladinBlockedByEnemies) break;
				c = !0;
				continue;
			}
			let m = T(f);
			if (!c && (m === s || m === 5 || m === 15 && !J.design && M.includes(d)) && (i === 0 || z(f, i)) || !l && m === 8 && (i === 0 || z(f, i))) return !0;
			m === 1 && Le(n) || (c = !0), J.paladinJumpsFriends || (l = !0);
		}
	}
	return J.design !== null && ft(e, t, n);
}
function ft(e, t, n) {
	let r = e[t], i = [];
	r || (e[t] = w(6, n ^ 1));
	for (let t = 0; t < 64; t++) (e[t] & 31) === w(15, n) && tn(e, t, "attacks", i, J.design);
	return e[t] = r, i.some((e) => e.captures[0] === t);
}
function pt(e, t = e.turn) {
	let n = B(e.board, t);
	return n >= 0 && dt(e.board, n, t ^ 1);
}
var mt = (e, t) => ({
	drawn: e.drawn?.[t] ?? 0,
	last: e.last?.[t ^ 1],
	rescue: e.marks?.[t]?.sq ?? -1,
	move: we(e)
}), ht = {
	drawn: 0,
	last: void 0,
	rescue: -1,
	move: Infinity
};
function gt(e, t, n, r, i, a, o, s = ht) {
	if (!Fe(t, n, s.drawn)) return;
	let c = i.length;
	if (R(t).length) {
		let c = De(t, s.drawn);
		for (let l = 0; l < c; l++) {
			let u = Oe(t, l);
			if (!(n >> l & 1 || !yt(t, n, l) || !Te(u, s.move))) {
				if (u === "Mirror") s.last && bt(s.last, "mirror", e, t, r, i, a, o, s);
				else if (u === "MirrorB") for (let l = 0; l < c; l++) {
					let c = Oe(t, l);
					!(n >> l & 1) && c !== "Mirror" && c !== "MirrorB" && yt(t, n, l) && bt(c, "mirrorb", e, t, r, i, a, o, s);
				}
				else wt(u, e, t, r, i, a, o, s);
			}
		}
	} else {
		let n = L(t);
		n && Te(n, s.move) && wt(n, e, t, r, i, a, o, s);
	}
	if (Ye() && Ze(e, i, c), J.capitalSanctuary || J.capitalNoCapture) {
		let e = c;
		for (let t = c; t < i.length; t++) {
			let n = i[t];
			n.captures.length > 0 && (J.capitalSanctuary && n.captures.some((e) => M.includes(e)) || J.capitalNoCapture && M.includes(n.from)) || (i[e++] = n);
		}
		i.length = e;
	}
}
var _t = [], W = /* @__PURE__ */ new Uint8Array(64);
function vt(e, t, n, r) {
	W.fill(0);
	for (let i = t; i < n; i++) {
		let t = e[i];
		t.from === r && t.to !== r && !t.swap && !t.shove && !t.selfRemove && (!t.captures.length || t.captures.length === 1 && t.captures[0] === t.to) && (W[t.to] = 1);
	}
}
function yt(e, t, n) {
	let r = Oe(e, n);
	for (let i = 0; i < n; i++) if (Oe(e, i) === r && !(t >> i & 1)) return !1;
	return !0;
}
function bt(e, t, n, r, i, a, o, s, c) {
	if (!Te(e, c.move)) return;
	let l = a.length;
	wt(e, n, r, i, a, o, s, c);
	for (let e = l; e < a.length; e++) a[e].via = t;
}
function xt(e, t, n) {
	for (let r = 0; r < 8; r++) {
		let i = U[t * 8 + r];
		if (i >= 0 && e[i] && E(e[i]) === n) return !0;
	}
	return !1;
}
var St = [
	5,
	12,
	8,
	4,
	3,
	2,
	7,
	9,
	10,
	11
], Ct = (e) => e === 0 ? [
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63
] : [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
];
function wt(e, t, n, r, i, a, o, s = ht) {
	switch (e) {
		case "Freeze":
		case "IceWall": {
			let r = e === "Freeze" ? "freeze" : "ward", a = e === "Freeze";
			for (let e = 0; e < 64; e++) {
				let o = t[e];
				o && T(o) !== 6 && E(o) !== n === a && i.push({
					from: e,
					to: e,
					captures: [],
					power: r
				});
			}
			return;
		}
		case "Strike": {
			let e = J.strikeMode === "capture";
			for (let r = 0; r < 64; r++) {
				let a = t[r];
				if (a && E(a) === n && T(a) !== 6 && (T(a) !== 1 || J.strikePawns)) for (let [o, s] of j) for (let c = P(r, o, s); c >= 0; c = P(c, o, s)) {
					let o = t[c];
					if (!o) {
						e || i.push({
							from: r,
							to: c,
							captures: [],
							power: "strike"
						});
						continue;
					}
					J.strikeCaptures && E(o) !== n && T(o) !== 6 && z(a, T(o)) && !(T(a) === 1 && Je(t, c, n ^ 1)) && i.push(e ? {
						from: r,
						to: r,
						captures: [c],
						power: "strike"
					} : {
						from: r,
						to: c,
						captures: [c],
						power: "strike"
					});
					break;
				}
			}
			return;
		}
		case "Haste":
			for (let e = a; e < o; e++) {
				let r = i[e];
				!r.selfRemove && (J.hasteCaptures || !r.captures.length) && !(J.hasteNoCheck && At(kt(t, r, n), n)) && i.push({
					...r,
					power: "haste"
				});
			}
			return;
		case "Flight": {
			let e = n === 0 ? 0 : 32, r = n === 0 ? 0 : 7;
			for (let a = 0; a < 64; a++) {
				let o = t[a];
				if (!o || E(o) !== n || T(o) === 6) continue;
				let s = T(o) === 1;
				for (let n = e; n < e + 32; n++) t[n] || s && O(n) === r || !I(o, n) || i.push({
					from: a,
					to: n,
					captures: [],
					power: "flight"
				});
			}
			return;
		}
		case "Sacrifice": {
			if (!r) return;
			if (J.sacrificeBehind) {
				let e = 0, r = 0;
				for (let i = 0; i < 64; i++) {
					let a = t[i];
					a && T(a) !== 1 && T(a) !== 6 && (E(a) === n ? e++ : r++);
				}
				if (e >= r) return;
			}
			let e = [];
			for (let t = 1; t < 16; t++) Ke(t) && r[n * 16 + t] > 0 && e.push(t);
			if (!e.length) return;
			let a = w(1, n);
			for (let n = 0; n < 64; n++) if (t[n] === a) for (let t of e) i.push({
				from: n,
				to: n,
				captures: [],
				promo: t,
				power: "sacrifice"
			});
			return;
		}
		case "Salvation": {
			if (!r) return;
			let e = n === 0 ? 0 : 56;
			for (let a = 1; a < 16; a++) if (Ke(a) && r[n * 16 + a] > 0) for (let n = e; n < e + 8; n++) t[n] || i.push({
				from: n,
				to: n,
				captures: [],
				drop: a,
				power: "salvation"
			});
			return;
		}
		case "March": {
			let e = F(n), r = n === 0 ? 1 : 6, a = n === 0 ? 7 : 0, o = w(1, n);
			for (let n = 0; n < 64; n++) {
				if (t[n] !== o || O(n) === r) continue;
				let s = P(n, 0, e), c = s < 0 ? -1 : P(s, 0, e);
				if (!(c < 0 || t[s] || t[c])) {
					if (O(c) === a) for (let e of se[J.promotionSet]) i.push({
						from: n,
						to: c,
						captures: [],
						promo: e,
						power: "march"
					});
					else i.push({
						from: n,
						to: c,
						captures: [],
						power: "march"
					});
				}
			}
			return;
		}
		case "Leap":
		case "Vault": {
			let r = e === "Vault", s = r ? "vault" : "leap";
			for (let e = 0; e < 64; e++) {
				let c = t[e];
				if (!c || E(c) !== n) continue;
				let l = T(c), u = l === 4 ? le : l === 3 ? ue : l === 5 ? j : null;
				if (u) {
					r && vt(i, a, o, e);
					for (let [a, o] of u) {
						let l = !1;
						for (let u = P(e, a, o); u >= 0; u = P(u, a, o)) {
							let a = t[u];
							if (!a) {
								l && !(r && W[u]) && i.push({
									from: e,
									to: u,
									captures: [],
									power: s
								});
								continue;
							}
							if (r ? !l : E(a) === n && T(a) === 1) {
								l = !0;
								continue;
							}
							l && E(a) !== n && T(a) !== 6 && z(c, T(a)) && !(r && W[u]) && i.push({
								from: e,
								to: u,
								captures: [u],
								power: s
							});
							break;
						}
					}
				}
			}
			return;
		}
		case "Mimic": {
			let e = 0;
			for (let r = 0; r < 64; r++) {
				let i = t[r];
				i && E(i) === n && (e |= 1 << T(i));
			}
			e &= -67;
			for (let r = 0; r < 64; r++) {
				let s = t[r];
				if (!s || E(s) !== n || T(s) === 6 || T(s) === 1) continue;
				let c = e & ~(1 << T(s));
				if (c) {
					vt(i, a, o, r);
					for (let e = 1; e < 16; e++) if (c >> e & 1) {
						_t.length = 0, tt(t, r, "all", _t, w(e, n));
						for (let e of _t) e.captures.length || e.swap || e.shove || e.selfRemove || W[e.to] || !I(s, e.to) || (W[e.to] = 1, i.push({
							from: r,
							to: e.to,
							captures: [],
							power: "mimic"
						}));
					}
				}
			}
			return;
		}
		case "Curse":
			for (let e = 0; e < 64; e++) {
				let r = t[e];
				if (!r || E(r) === n || T(r) === 6) continue;
				let a = T(r) === 1;
				for (let n = 0; n < 8; n++) {
					let o = U[e * 8 + n];
					o < 0 || t[o] || a && (O(o) === 0 || O(o) === 7) || !I(r, o) || i.push({
						from: e,
						to: o,
						captures: [],
						power: "curse"
					});
				}
			}
			return;
		case "Rage":
		case "RageB": {
			let t = e === "Rage" ? "rage" : "rageb";
			for (let e = a; e < o; e++) i[e].selfRemove || i.push({
				...i[e],
				power: t
			});
			return;
		}
		case "Rally":
			for (let e = a; e < o; e++) i[e].captures.length || i.push({
				...i[e],
				power: "rally"
			});
			return;
		case "Firewall":
		case "Growth":
		case "GrowthB": {
			if (e !== "Firewall" && (s.drawn >= J.piles[n].length || De(n, s.drawn) >= 8)) return;
			let r = B(t, n);
			r >= 0 && i.push({
				from: r,
				to: r,
				captures: [],
				power: e === "Firewall" ? "firewall" : e === "Growth" ? "growth" : "growthb"
			});
			return;
		}
		case "Rescue":
			s.rescue >= 0 && i.push({
				from: s.rescue,
				to: s.rescue,
				captures: [],
				power: "rescue"
			});
			return;
		case "FirewallB":
			for (let e = 0; e < 64; e++) {
				let r = t[e];
				if (r && E(r) === n && T(r) !== 6) for (let a = 0; a < 8; a++) {
					let o = U[e * 8 + a], s = o < 0 ? 0 : t[o];
					s && E(s) !== n && T(s) !== 6 && (T(r) !== 1 || O(o) !== 0 && O(o) !== 7) && (T(s) !== 1 || O(e) !== 0 && O(e) !== 7) && I(r, o) && I(s, e) && i.push({
						from: e,
						to: o,
						captures: [],
						swap: !0,
						power: "firewallb"
					});
				}
			}
			return;
		case "EarthQuake":
		case "EarthQuakeB": {
			let r = e === "EarthQuake" ? "quake" : "quakeb";
			for (let a = 0; a < 64; a++) {
				if (e === "EarthQuakeB" && !xt(t, a, n)) continue;
				let o = null;
				for (let e = 0; e < 8; e++) {
					let n = U[a * 8 + e], r = n < 0 ? 0 : t[n];
					if (!r || T(r) === 6) continue;
					let i = U[n * 8 + e];
					i < 0 || t[i] || T(r) === 1 && (O(i) === 0 || O(i) === 7) || !I(r, i) || (o ??= []).push({
						from: n,
						to: i
					});
				}
				o && i.push({
					from: a,
					to: a,
					captures: [],
					pushes: o,
					power: r
				});
			}
			return;
		}
		case "Burn":
		case "FireStarter": {
			let r = e === "Burn" ? M : Ct(n), s = e === "Burn" ? "burn" : "firestarter";
			for (let e = 0; e < 64; e++) {
				let c = t[e];
				if (!c || E(c) !== n || T(c) === 6 || T(c) === 1) continue;
				let l = !1;
				for (let [u, d] of j) for (let f = P(e, u, d); f >= 0; f = P(f, u, d)) {
					let u = t[f];
					if (u) {
						E(u) !== n && T(u) !== 6 && r.includes(f) && z(c, T(u)) && (l ||= (vt(i, a, o, e), !0), W[f] || i.push({
							from: e,
							to: f,
							captures: [f],
							power: s
						}));
						break;
					}
				}
			}
			return;
		}
		case "Control":
			for (let e = 0; e < 64; e++) {
				let r = t[e];
				if (!r || E(r) !== n || T(r) === 6 || T(r) === 1) continue;
				let s = 0;
				for (let r = 0; r < 8; r++) {
					let i = U[e * 8 + r], a = i < 0 ? 0 : t[i];
					a && E(a) === n && (s |= 1 << T(a));
				}
				if (s &= ~(66 | 1 << T(r)), !s) continue;
				vt(i, a, o, e);
				let c = /* @__PURE__ */ new Set();
				for (let a = 1; a < 16; a++) if (s >> a & 1) {
					_t.length = 0, tt(t, e, "all", _t, w(a, n));
					for (let n of _t) {
						if (n.swap || n.shove || n.to !== e && !I(r, n.to) || n.captures.some((e) => T(t[e]) === 6 || !z(r, T(t[e]))) || n.to !== e && (!n.captures.length || n.captures.length === 1 && n.captures[0] === n.to) && W[n.to]) continue;
						let a = `${n.to}:${n.captures.join(",")}`;
						if (c.has(a)) continue;
						c.add(a);
						let { selfRemove: o, ...s } = n;
						i.push({
							...s,
							from: e,
							power: "control"
						});
					}
				}
			}
			return;
		case "Morph":
		case "MorphB": {
			let r = e === "Morph" ? "morph" : "morphb", a = t.includes(w(11, n)), o = !1;
			for (let e = 0; e < 64; e++) t[e] && E(t[e]) === n && T(t[e]) === 9 && (o = !0);
			for (let s = 0; s < 64; s++) {
				let c = t[s];
				if (c && E(c) === n && T(c) !== 6 && T(c) !== 1) for (let t of St) t === T(c) || t === 11 && a || t === 9 && o || t === 5 && e === "MorphB" || !I(w(t, n), s) || i.push({
					from: s,
					to: s,
					captures: [],
					promo: t,
					power: r
				});
			}
			return;
		}
		case "Spawn":
		case "SpawnK":
		case "Spawn2":
		case "SpawnK2": {
			let r = e === "SpawnK" || e === "SpawnK2", a = e === "Spawn2" || e === "SpawnK2", o = r ? a ? "spawnk2" : "spawnk" : a ? "spawn2" : "spawn", s = [];
			if (r) {
				let e = B(t, n);
				if (e < 0) return;
				for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r++) {
					let i = r || n ? P(e, r, n) : -1;
					i >= 0 && !t[i] && O(i) !== 0 && O(i) !== 7 && s.push(i);
				}
			} else {
				let e = n === 0 ? 8 : 48;
				for (let n = e; n < e + 8; n++) t[n] || s.push(n);
			}
			if (a) for (let e = 0; e < s.length; e++) for (let t = e + 1; t < s.length; t++) i.push({
				from: s[e],
				to: s[e],
				captures: [],
				drop: 1,
				drop2: s[t],
				power: o
			});
			else for (let e of s) i.push({
				from: e,
				to: e,
				captures: [],
				drop: 1,
				power: o
			});
			return;
		}
		case "MorphP":
			for (let e = 0; e < 64; e++) {
				let r = t[e];
				r && E(r) === n && T(r) === 1 && i.push({
					from: e,
					to: e,
					captures: [],
					promo: 2,
					power: "morphp"
				}, {
					from: e,
					to: e,
					captures: [],
					promo: 3,
					power: "morphp"
				});
			}
			return;
		case "SkyLift":
		case "MorphS": {
			let r = e === "MorphS" ? "morphs" : "skylift";
			for (let e = 0; e < 64; e++) {
				let a = t[e];
				if (a && E(a) === n && T(a) !== 6 && T(a) !== 1) for (let o = e + 1; o < 64; o++) {
					let s = t[o];
					s && E(s) === n && T(s) !== 6 && T(s) !== 1 && T(s) !== T(a) && I(a, o) && I(s, e) && i.push({
						from: e,
						to: o,
						captures: [],
						swap: !0,
						power: r
					});
				}
			}
			return;
		}
	}
}
function Tt(e, t) {
	if (!e.pushes?.some((e) => e.from === t)) return e;
	let n = e.pushes.filter((e) => e.from !== t);
	return n.length ? {
		...e,
		pushes: n
	} : null;
}
function Et(e, t, n, r, i = 0, a = !1, o = !1, s) {
	if (t === void 0 || t < 0) return;
	let c = Re(e, n, a);
	if (!c) return;
	let l = !s || s[t] !== 0 && E(s[t]) === e, u = i;
	for (let e = i; e < r.length; e++) {
		let n = r[e], i;
		c === "frozen" ? (i = n.from === t && n.power !== "ward" && n.power !== "freeze" && n.power !== "curse" && !Ue(n) && !n.drop && !n.pushes || n.swap === !0 && n.to === t && n.power !== "firewallb" || n.shove?.from === t || n.castle?.from === t, !i && l && n.pushes && (n = Tt(n, t), i = !n)) : i = o ? n.captures.length > 0 || n.power === "curse" || n.power === "firewallb" : n.captures.includes(t) || n.power === "curse" && n.from === t || n.power === "firewallb" && n.to === t, i || (r[u++] = n);
	}
	r.length = u;
}
function Dt(e, t, n, r, i) {
	if (t === void 0 || t < 0 || !R(e).length || Re(e ^ 1, e, n) !== "frozen") return;
	let a = !i || i[t] !== 0 && E(i[t]) !== e, o = 0;
	for (let e = 0; e < r.length; e++) {
		let n = r[e];
		n.power === "curse" && n.from === t || n.power === "firewallb" && n.to === t || a && n.pushes && !(n = Tt(n, t)) || (r[o++] = n);
	}
	r.length = o;
}
function Ot(e, t, n, r, i = 0) {
	let a = r.length;
	if (i === 3) {
		let i = E(e[t]);
		for (let a = 0; a < 64; a++) a !== t && e[a] && E(e[a]) === i && nt(e, a, n, r);
		let o = a;
		for (let e = a; e < r.length; e++) {
			let n = r[e];
			!n.captures.length && !(n.swap && n.to === t) && n.shove?.from !== t && (r[o++] = n);
		}
		r.length = o, n === "all" && r.push({
			from: t,
			to: t,
			captures: [],
			pass: !0
		});
		return;
	}
	nt(e, t, n, r);
	let o = !i && (J.hasteSecond === "quiet" || !J.hasteCaptures), s = !i && (J.hasteApart || J.hasteNoThreat || J.hasteNoForward || J.hasteNoCheck), c = E(e[t]), l = a;
	for (let t = a; t < r.length; t++) {
		let n = r[t];
		(i !== 2 || n.captures.length) && (o ? n.captures.length === 0 : !n.captures.some((t) => T(e[t]) === 6)) && (!s || jt(e, n, c)) && (r[l++] = n);
	}
	r.length = l, n === "all" && r.push({
		from: t,
		to: t,
		captures: [],
		pass: !0
	});
}
var kt = (e, t, n) => at({
	board: e,
	turn: n,
	halfmove: 0,
	ply: 0
}, t).board;
function At(e, t) {
	let n = B(e, t ^ 1);
	return n >= 0 && dt(e, n, t);
}
function jt(e, t, n) {
	if (J.hasteNoForward && (O(t.to) - O(t.from)) * F(n) > 0) return !1;
	let r = kt(e, t, n);
	if (J.hasteApart) for (let e = 0; e < 8; e++) {
		let i = U[t.to * 8 + e];
		if (i >= 0 && r[i] && E(r[i]) !== n) return !1;
	}
	if (J.hasteNoThreat) {
		let e = [];
		if (nt(r, t.to, "captures", e), e.length) return !1;
	}
	return !J.hasteNoCheck || !At(r, n);
}
function Mt(e, t, n) {
	if (!t || !J.freezeQuiet || L(e) !== "Freeze") return;
	let r = 0;
	for (let e = 0; e < n.length; e++) n[e].captures.length || (n[r++] = n[e]);
	n.length = r;
}
function Nt(e, t, n) {
	if (J.guardReserve === "off") return;
	let r = w(9, t);
	if (J.guardReserve === "any") {
		for (let t = 0; t < 64; t++) !e[t] && I(r, t) && n.push({
			from: t,
			to: t,
			captures: [],
			drop: 9
		});
		return;
	}
	let i = J.guardReserve === "rank12" ? 2 : 1;
	for (let a = 0; a < i; a++) {
		let i = (t === 0 ? a : 7 - a) * 8;
		for (let t = i; t < i + 8; t++) !e[t] && I(r, t) && n.push({
			from: t,
			to: t,
			captures: [],
			drop: 9
		});
	}
}
var Pt = [
	{
		king: 4,
		to: 6,
		rook: 7,
		rookTo: 5,
		empty: [5, 6]
	},
	{
		king: 4,
		to: 2,
		rook: 0,
		rookTo: 3,
		empty: [
			1,
			2,
			3
		]
	},
	{
		king: 60,
		to: 62,
		rook: 63,
		rookTo: 61,
		empty: [61, 62]
	},
	{
		king: 60,
		to: 58,
		rook: 56,
		rookTo: 59,
		empty: [
			57,
			58,
			59
		]
	}
], G = (() => {
	let e = /* @__PURE__ */ new Uint8Array(64);
	return Pt.forEach((t, n) => {
		e[t.king] |= 1 << n, e[t.rook] |= 1 << n;
	}), e;
})();
function Ft(e) {
	let t = 0;
	return Pt.forEach((n, r) => {
		let i = r >> 1;
		e[n.king] === w(6, i) && e[n.rook] === w(4, i) && (t |= 1 << r);
	}), t;
}
function It(e, t) {
	if (!e || Ue(t)) return e;
	let n = t.pushes || t.to === t.from && !t.swap && t.promo === void 0 ? 0 : G[t.from] | G[t.to];
	for (let e = 0; e < t.captures.length; e++) n |= G[t.captures[e]];
	if (t.shove && (n |= G[t.shove.from] | G[t.shove.to]), t.pushes) for (let e of t.pushes) n |= G[e.from] | G[e.to];
	return t.drop2 !== void 0 && (n |= G[t.drop2]), e & ~n;
}
function Lt(e, t, n) {
	if (t.power || t.drop || Math.abs(t.to - t.from) !== 16 || e[t.to] !== w(1, n) || O(t.from) !== (n === 0 ? 1 : 6) || L(n) === "Darkness" || L(n ^ 1) === "Darkness") return -1;
	let r = w(1, n ^ 1), i = D(t.to);
	return i > 0 && e[t.to - 1] === r || i < 7 && e[t.to + 1] === r ? t.from + t.to >> 1 : -1;
}
function Rt(e, t, n, r, i, a) {
	if (i === "attacks") return;
	let o = a.length;
	if (r >= 0 && L(t) !== "Darkness") {
		let n = r - 8 * F(t), i = w(1, t), s = D(n);
		!e[r] && e[n] === w(1, t ^ 1) && !Je(e, n, t ^ 1) && (s > 0 && e[n - 1] === i && z(i, 1) && a.push({
			from: n - 1,
			to: r,
			captures: [n]
		}), s < 7 && e[n + 1] === i && z(i, 1) && a.push({
			from: n + 1,
			to: r,
			captures: [n]
		})), Ye() && Ze(e, a, o);
	}
	if (i !== "all" || !(n & (t === 0 ? 3 : 12))) return;
	let s = t ^ 1;
	for (let r = t * 2; r < t * 2 + 2; r++) {
		let i = Pt[r];
		n & 1 << r && e[i.king] === w(6, t) && e[i.rook] === w(4, t) && !i.empty.some((t) => e[t]) && (dt(e, i.king, s) || dt(e, i.rookTo, s) || a.push({
			from: i.king,
			to: i.to,
			captures: [],
			castle: {
				from: i.rook,
				to: i.rookTo
			}
		}));
	}
}
function zt(e, t) {
	let n = B(e, t);
	return {
		from: n,
		to: n,
		captures: [],
		pass: !0
	};
}
function Bt(e, t = "all") {
	let n = [], r = e.turn;
	if (e.haste !== void 0) Ot(e.board, e.haste, t, n, e.rage);
	else {
		for (let i = 0; i < 64; i++) e.board[i] && E(e.board[i]) === r && nt(e.board, i, t, n);
		J.classicChess && Rt(e.board, r, e.castle ?? 0, e.ep ?? -1, t, n), t === "all" && e.waiting?.[r] && Nt(e.board, r, n), e.free ? (Mt(r, !0, n), t === "all" && n.push(zt(e.board, r))) : t === "all" && gt(e.board, r, e.used?.[r] ?? 0, e.lost, n, 0, n.length, mt(e, r));
	}
	let i = e.marks?.[r ^ 1], a = e.marks?.[r];
	return i && i.left !== 0 && Et(r, i.sq, r ^ 1, n, 0, i.ward, i.all, e.board), a && a.left !== 0 && Dt(r, a.sq, a.ward, n, e.board), n;
}
function Vt(e, t = "all") {
	let n = J.secondPlayerDoubleFirstTurn && e.ply === 1;
	return Bt(e, t).filter((t) => {
		let r = at(e, t);
		return !pt(r, e.turn) && (!n || !pt(r, e.turn ^ 1));
	});
}
function Ht(e) {
	let t = [0, 0];
	for (let n = 0; n < 64; n++) {
		let r = e[n];
		if (!r) continue;
		let i = T(r);
		if (i === 1 || i === 4 || i === 5 || i === 7 || i === 10 || i === 11 || i === 13 || i === 15 || i === 12 && !J.ogreNoCapture || i === 9 && J.guardCaptures === "any" || i === 8 && J.paladinChecks) return !1;
		(i === 2 || i === 3 || i === 14) && t[E(r)]++;
	}
	return t[0] <= 1 && t[1] <= 1;
}
function Ut(e, t, n, r, i, a) {
	return !J.insufficientMaterial || !Ht(e) || J.guardCaptures === "any" && r && (r[0] > 0 || r[1] > 0) ? !1 : !Wt(e, 0, t?.[0] ?? 0, i?.[0] ?? 0, n, a?.[1]) && !Wt(e, 1, t?.[1] ?? 0, i?.[1] ?? 0, n, a?.[0]);
}
function Wt(e, t, n, r, i, a) {
	if (!R(t).length) return L(t) === "Strike" && Fe(t, n);
	if (Kt(t, n, r, a, "Strike")) return !0;
	if (i && Kt(t, n, r, a, "Salvation")) {
		for (let e = 1; e < 16; e++) if (Ke(e) && i[t * 16 + e] > 0) return !0;
	}
	if (Kt(t, n, r, a, "Morph") || Kt(t, n, r, a, "MorphB")) {
		for (let n = 0; n < 64; n++) if (e[n] && E(e[n]) === t && T(e[n]) !== 6) return !0;
	}
	for (let e of Gt) if (Kt(t, n, r, a, e)) return !0;
	return !1;
}
var Gt = [
	"Spawn",
	"SpawnK",
	"Spawn2",
	"SpawnK2"
];
function Kt(e, t, n, r, i) {
	return Ne(e, t, i, n) || r === i && Ne(e, t, "Mirror", n) || (Ne(e, t, "Growth", n) || Ne(e, t, "GrowthB", n)) && J.piles[e].indexOf(i, n) >= 0;
}
function qt(e) {
	return B(e.board, e.turn) < 0 ? "checkmate" : Vt(e).length === 0 ? pt(e) ? "checkmate" : "stalemate" : J.fiftyMove && e.halfmove >= 100 ? "draw50" : Ut(e.board, e.used, e.lost, e.waiting, e.drawn, e.last) ? "drawMaterial" : "playing";
}
//#endregion
//#region src/rules/design.ts
var Jt = {
	n: [0, 1],
	ne: [1, 1],
	e: [1, 0],
	se: [1, -1],
	s: [0, -1],
	sw: [-1, -1],
	w: [-1, 0],
	nw: [-1, 1]
}, Yt = (e, t) => ({
	move: 1,
	captured: !!(e[t] & 32),
	card: !1
}), K = (e, t, n) => {
	let r = D(e) + t, i = O(e) + n;
	return r < 0 || r > 7 || i < 0 || i > 7 ? -1 : k(r, i);
}, Xt = [
	[0, 1],
	[1, 1],
	[1, 0],
	[1, -1],
	[0, -1],
	[-1, -1],
	[-1, 0],
	[-1, 1]
];
function Zt(e, t, n, r = Yt(t, n)) {
	let i = E(t[n]), a = i === 1 ? 7 - O(n) : O(n);
	switch (e.on) {
		case "zone": return e.zone === "startRank" ? a === 1 : e.zone === "ownHalf" ? a <= 3 : e.zone === "enemyHalf" ? a >= 4 : e.zone === "lastRank" ? a === 7 : M.includes(n);
		case "near": return Xt.some(([r, a]) => {
			let o = K(n, r, a), s = o >= 0 ? t[o] : 0;
			return s ? e.who === "enemy" ? E(s) !== i : E(s) === i && (e.who === "friend" || T(s) === (e.who === "king" ? 6 : " PNBRQKALGMSOCVT".indexOf(e.who))) : !1;
		});
		case "fromMove": return r.move >= e.n;
		case "beforeMove": return r.move < e.n;
		case "afterFirstCapture": return r.captured;
		case "afterCard": return r.card;
		default: return !0;
	}
}
var Qt = {
	both: {
		m: !0,
		t: !0,
		s: !1
	},
	move: {
		m: !0,
		t: !1,
		s: !1
	},
	take: {
		m: !1,
		t: !0,
		s: !1
	},
	shoot: {
		m: !1,
		t: !1,
		s: !0
	},
	moveShoot: {
		m: !0,
		t: !1,
		s: !0
	}
};
function $t(e, t, n, r) {
	let i = e.like && e.rules.some((e) => e.does.a === "movesLike" && Zt(e.when, t, n, r)), a = /* @__PURE__ */ new Map(), o = new Set(e.lines);
	for (let t of i ? [e, e.like] : [e]) {
		for (let e of t.squares) {
			let t = `${e.x},${e.y}`, n = a.get(t) ?? {
				x: e.x,
				y: e.y,
				m: !1,
				t: !1,
				s: !1
			}, r = Qt[e.mark];
			a.set(t, {
				...n,
				m: n.m || r.m,
				t: n.t || r.t,
				s: n.s || r.s
			});
		}
		for (let e of t.lines) o.add(e);
	}
	return {
		can: a,
		lines: o
	};
}
function en(e, t, n) {
	let r = e.rules.find((e) => e.does.a === "cannotBeTaken");
	return r?.does.a === "cannotBeTaken" && r.when.on !== "always" && Zt(r.when, t, n) ? r.does.by === "pawns" ? 1 : 4 : 0;
}
function tn(e, t, n, r, i, a, o = Yt(e, t)) {
	let s = E(e[t]), c = s === 1 ? -1 : 1, l = e[t] & -16 | 15, u = n === "all", d = (n) => i.rules.find((r) => r.does.a === n && Zt(r.when, e, t, o))?.does, f = d("linesPass"), p = d("cannotTake"), m = n !== "attacks" && d("chain"), h = d("removedAfter"), g = i.rules.find((e) => e.does.a === "becomes"), { can: ee, lines: te } = $t(i, e, t, o), _ = (e) => p?.a === "cannotTake" && (p.what === "any" || p.what === "king" && e === 6 || p.what === "pawns" && e === 1) ? "cannotTake" : z(l, e) ? null : "guardImmune", ne = (e, t, n = []) => {
		if (t < 0 || !e[t] || E(e[t]) === s) return !1;
		let r = _(T(e[t]));
		return r && a?.push({
			sq: t,
			why: r,
			caps: n
		}), !r;
	}, v = r.length, re = (t) => h?.a === "removedAfter" && t.some((t) => h.what === "any" || T(e[t]) !== 1), ie = (e, t, n, r) => {
		for (let i of ee.values()) if (i.t) {
			let a = K(t, i.x, i.y * c);
			ne(e, a, n) && r(a);
		}
		for (let i of te) {
			let [a, o] = Jt[i];
			for (let i = K(t, a, o * c); i >= 0; i = K(i, a, o * c)) {
				let t = e[i];
				if (t) {
					if (E(t) === s) {
						if (f) continue;
						break;
					}
					if (ne(e, i, n) && r(i), f?.a !== "linesPass" || f.over !== "any") break;
				}
			}
		}
	}, y = (e) => {
		e.captures.length && re(e.captures) && (e.selfRemove = !0), r.push(e);
	}, ae = (e, n) => {
		let r = n[n.length - 1];
		if (!m || T(e[r]) === 6 || re(n)) return;
		let i = new Uint8Array(e);
		i[r] = 0, i[t] = 0;
		let o = /* @__PURE__ */ new Set();
		ie(i, r, n, (e) => {
			if (T(i[e]) === 6) {
				a?.push({
					sq: e,
					why: "chain",
					caps: n
				});
				return;
			}
			if (o.has(e)) return;
			o.add(e);
			let r = [...n, e];
			y({
				from: t,
				to: e,
				captures: r
			}), ae(i, r);
		});
	};
	for (let n of ee.values()) {
		let r = K(t, n.x, n.y * c);
		r < 0 || (e[r] ? n.s && ne(e, r) && y({
			from: t,
			to: t,
			captures: [r]
		}) : n.m && u && y({
			from: t,
			to: r,
			captures: []
		}));
	}
	if (u) for (let n of te) {
		let [r, i] = Jt[n];
		for (let n = K(t, r, i * c); n >= 0; n = K(n, r, i * c)) if (!e[n]) y({
			from: t,
			to: n,
			captures: []
		});
		else {
			if (E(e[n]) === s) {
				if (f) continue;
				break;
			}
			if (f?.a === "linesPass" && f.over === "any") continue;
			break;
		}
	}
	let x = /* @__PURE__ */ new Set();
	if (ie(e, t, [], (n) => {
		x.has(n) || (x.add(n), y({
			from: t,
			to: n,
			captures: [n]
		}), ae(e, [n]));
	}), u && d("step2")) {
		let n = K(t, 0, c), i = K(t, 0, 2 * c);
		n >= 0 && i >= 0 && !e[n] && !e[i] && !r.some((e, t) => t >= v && e.to === i && !e.captures.length) && y({
			from: t,
			to: i,
			captures: []
		});
	}
	let S = d("swap"), C = d("push");
	if (u) for (let [n, i] of Xt) {
		let o = K(t, n, i * c), l = o >= 0 ? e[o] : 0;
		if (!l) continue;
		let u = T(l) === 6, d = K(o, n, i * c);
		S?.a === "swap" && E(l) === s == (S.with === "friend") && (u ? a?.push({
			sq: o,
			why: "swap",
			caps: []
		}) : I(l, t) && r.push({
			from: t,
			to: o,
			captures: [],
			swap: !0
		})), C?.a === "push" && d >= 0 && !e[d] && (u ? a?.push({
			sq: o,
			why: "push",
			caps: []
		}) : r.push({
			from: t,
			to: C.then === "follow" ? o : t,
			captures: [],
			shove: {
				from: o,
				to: d
			}
		}));
	}
	if (g?.does.a !== "becomes") return;
	let oe = (g.does.into === "choice" ? [
		"Q",
		"R",
		"B",
		"N"
	] : [g.does.into]).map((e) => b.indexOf(e)), se = s === 1 ? 0 : 7, w = r.splice(v);
	for (let e of w) if (!e.selfRemove && !e.swap && (g.when.on === "firstTake" ? e.captures.length > 0 && !o.captured : O(e.to) === se && e.to !== t)) for (let t of oe) r.push({
		...e,
		promo: t
	});
	else r.push(e);
}
//#endregion
//#region src/workshop/model.ts
var nn = Object.keys(ee), rn = [
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w",
	"nw"
], an = [
	"n",
	"e",
	"s",
	"w"
], on = [
	"ne",
	"se",
	"sw",
	"nw"
], sn = "3 of 3 rules. Remove one to add another.";
function cn(e, t, n) {
	let r = n === "one" ? [[e, t]] : n === "lr" ? [[e, t], [-e, t]] : [
		[e, t],
		[-e, t],
		[e, -t],
		[-e, -t],
		[t, e],
		[-t, e],
		[t, -e],
		[-t, -e]
	];
	return [...new Map(r.map((e) => [e.join(), e])).values()];
}
var ln = (e, t, n = "all") => e.flatMap(([e, t]) => cn(e, t, n)).map(([e, n]) => ({
	x: e,
	y: n,
	mark: t
})), un = (e) => ln([[0, 1], [1, 1]], e), dn = () => ln([[1, 2]], "both"), q = (e, t) => ({
	when: e,
	does: t
}), fn = { on: "always" }, pn = [
	{
		key: "pawn",
		name: "Pawn",
		body: "P",
		paintOn: "lr",
		squares: [{
			x: 0,
			y: 1,
			mark: "move"
		}, ...ln([[1, 1]], "take", "lr")],
		lines: [],
		rules: [q({
			on: "zone",
			zone: "startRank"
		}, { a: "step2" }), q({
			on: "reaches",
			zone: "lastRank"
		}, {
			a: "becomes",
			into: "choice"
		})]
	},
	{
		key: "knight",
		name: "Knight",
		body: "N",
		paintOn: "all",
		squares: dn(),
		lines: [],
		rules: []
	},
	{
		key: "bishop",
		name: "Bishop",
		body: "B",
		paintOn: "all",
		squares: [],
		lines: [...on],
		rules: []
	},
	{
		key: "rook",
		name: "Rook",
		body: "R",
		paintOn: "all",
		squares: [],
		lines: [...an],
		rules: []
	},
	{
		key: "queen",
		name: "Queen",
		body: "Q",
		paintOn: "all",
		squares: [],
		lines: [...rn],
		rules: []
	},
	{
		key: "archer",
		name: "Archer",
		body: "A",
		paintOn: "lr",
		lines: [],
		rules: [],
		squares: [
			...ln([[0, 1]], "move"),
			...ln([[1, 1]], "move"),
			...ln([
				[0, 2],
				[2, 0],
				[0, -2],
				[2, 2]
			], "shoot", "lr")
		]
	},
	{
		key: "paladin",
		name: "Paladin",
		body: "L",
		paintOn: "all",
		squares: [],
		lines: [...rn],
		rules: [
			q(fn, {
				a: "linesPass",
				over: "own"
			}),
			q({ on: "takes" }, {
				a: "removedAfter",
				what: "piece"
			}),
			q(fn, {
				a: "cannotTake",
				what: "king"
			})
		]
	},
	{
		key: "guard",
		name: "Guard",
		body: "G",
		paintOn: "all",
		squares: un("move"),
		lines: [],
		rules: [q(fn, {
			a: "cannotBeTaken",
			by: "allButKing"
		})]
	},
	{
		key: "maester",
		name: "Maester",
		body: "M",
		paintOn: "all",
		squares: un("both"),
		lines: [],
		rules: [q(fn, {
			a: "swap",
			with: "friend"
		})],
		note: "Not in the Workshop: the long swap with the king."
	},
	{
		key: "beast",
		name: "Beast",
		body: "S",
		paintOn: "all",
		squares: un("both"),
		lines: [],
		rules: [q({ on: "takes" }, { a: "chain" })]
	},
	{
		key: "ogre",
		name: "Ogre",
		body: "O",
		paintOn: "all",
		squares: un("both"),
		lines: [],
		rules: [q(fn, {
			a: "push",
			then: "follow"
		})]
	}
], mn = {
	key: "blank",
	name: "Blank",
	body: "token",
	paintOn: "all",
	squares: [],
	lines: [],
	rules: []
}, hn = (e) => pn.find((t) => t.key === e) ?? mn, gn = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36), _n = (e) => Array.isArray(e) ? e.map(_n) : e && typeof e == "object" ? Object.fromEntries(Object.keys(e).sort().map((t) => [t, _n(e[t])])) : e, vn = m.map((e) => e.a);
function yn(e) {
	return {
		kind: "piece",
		squares: [...e.squares].sort((e, t) => e.y - t.y || e.x - t.x).map(({ x: e, y: t, mark: n }) => ({
			x: e,
			y: t,
			mark: n
		})),
		lines: rn.filter((t) => e.lines.includes(t)),
		rules: [...e.rules].sort((e, t) => vn.indexOf(e.does.a) - vn.indexOf(t.does.a)).map((e) => _n(e))
	};
}
var bn = (e) => JSON.stringify(_n(yn(e))), xn = (e) => JSON.stringify(_n(e));
function Sn(e) {
	if (e.rules.length > 3) return sn;
	if (new Set(e.rules.map((e) => e.does.a)).size < e.rules.length) return "Already in this piece.";
	for (let t of e.rules) if (!y(t)) return "That choice does not fit this rule.";
	return e.rules.some((e) => e.does.a === "cannotBeTaken" && e.does.by === "allButKing") && c(e) ? "Only a king can take this piece, so it cannot take. Remove that rule first." : null;
}
var Cn = (e) => !e.squares.length && !e.lines.length && !e.rules.some((e) => e.does.a === "movesLike" || e.does.a === "step2"), wn = (e) => new TextDecoder().decode(Uint8Array.from(atob(e.replace(/-/g, "+").replace(/_/g, "/")), (e) => e.charCodeAt(0))), Tn = /^[\p{L}\p{N} '()-]{1,18}$/u, En = [
	"Frost",
	"Flame",
	"Stratus",
	"Mud",
	"Spirit",
	"Shadow"
], Dn = (e) => Number.isInteger(e) && Math.abs(e) <= 3, On = (e) => Tn.test(e) && e.trim() === e;
function kn(e) {
	let { squares: t, lines: n, rules: i, look: a, letter: o } = e;
	if (typeof o != "string" || o.length !== 1 || !"DFHIJUWXYZ".includes(o) || !(v(a, [
		"body",
		"auto",
		"glow",
		"army"
	]) || v(a, [
		"body",
		"auto",
		"glow",
		"army",
		"figure"
	])) || !nn.concat("token").includes(a.body) || a.figure !== void 0 && (typeof a.figure != "string" || !r(a.figure)) || typeof a.auto != "boolean" || !(a.glow === null || En.includes(a.glow)) || a.army !== 0 && a.army !== 1 || !Array.isArray(t) || t.length > 48 || !Array.isArray(n) || !Array.isArray(i) || i.length > 3) return !1;
	let s = [
		"both",
		"move",
		"take",
		"shoot",
		"moveShoot"
	];
	return !t.every((e) => v(e, [
		"x",
		"y",
		"mark"
	]) && Dn(e.x) && Dn(e.y) && (e.x || e.y) && s.includes(e.mark)) || new Set(t.map((e) => `${e.x},${e.y}`)).size !== t.length || !n.every((e) => rn.includes(e)) || new Set(n).size !== n.length ? !1 : i.every((e) => y(e));
}
function An(e) {
	if (e.length > 4e3 || !/^[\w-]+$/.test(e)) return null;
	let t;
	try {
		t = JSON.parse(wn(e));
	} catch {
		return null;
	}
	if (!v(t, [
		"kind",
		"squares",
		"lines",
		"rules",
		"name",
		"look",
		"letter"
	]) || t.kind !== "piece" || typeof t.name != "string" || !On(t.name) || !kn(t)) return null;
	let n = {
		v: 1,
		kind: "piece",
		id: gn(),
		name: t.name,
		named: !0,
		look: t.look,
		letter: t.letter,
		ownLetter: !0,
		squares: t.squares,
		lines: t.lines,
		rules: t.rules,
		from: [],
		updated: Date.now()
	};
	return Sn(n) || Cn(n) ? null : n;
}
//#endregion
//#region src/rules/rules.ts
var jn = /* @__PURE__ */ "Mimic.Vault.Curse.SkyLift.Salvation.Rage.RageB.Mirror.MirrorB.Firewall.FirewallB.EarthQuake.EarthQuakeB.Burn.FireStarter.Control.Rescue.Growth.GrowthB.Rally.Morph.MorphB.Spawn.SpawnK.Spawn2.SpawnK2.MorphP.MorphS".split("."), Mn = Object.freeze({
	Frost: ["Freeze", "IceWall"],
	Flame: ["Strike", "Haste"],
	Stratus: ["Flight", "Sacrifice"],
	Mud: ["March", "Leap"],
	Spirit: ["HolyLight", "Mercy"],
	Shadow: ["DeathTouch", "Darkness"]
}), Nn = Object.freeze({
	Freeze: "freezeUses",
	IceWall: "iceWallUses",
	Strike: "strikeUses",
	Haste: "hasteUses",
	Flight: "flightUses",
	Sacrifice: "sacrificeUses",
	March: "marchUses",
	Leap: "leapUses"
}), Pn = [...Object.keys(Nn), ...jn];
function Fn(e) {
	let t = e.trim();
	if (!t || t === "none" || t === "-") return null;
	let [n = "", r = ""] = t.split(":"), i = Object.keys(Mn).find((e) => e.toLowerCase() === n.toLowerCase());
	if (!i) throw Error(`unknown king "${n}" (${Object.keys(Mn).join(" | ")} | none)`);
	let a = Mn[i].find((e) => e.toLowerCase() === r.toLowerCase());
	if (!a) throw Error(`king ${i} has no power "${r}" (${Mn[i].join(" | ")})`);
	return {
		king: i,
		power: a
	};
}
function In(e) {
	let t = e.split(","), n = Fn(t[0] ?? "");
	return [n, t.length > 1 ? Fn(t[1]) : n];
}
var Ln = Object.freeze({
	archerChecks: !0,
	beastChains: !0,
	guardImmune: !0,
	guardCaptures: "none",
	guardStep: 1,
	guardDoubleFirst: "off",
	guardNoSecondRank: !1,
	guardNoCapital: !1,
	guardReserve: "off",
	capitalSanctuary: !1,
	capitalNoCapture: !1,
	guardCapitalStep: !1,
	guardNextToKing: !0,
	pawnCapitalCapture: !1,
	guardCaptureLimit: 0,
	archerMove: "any",
	archerShots: "far2",
	beastMove: "any",
	beastCapture: "adjacent",
	beastCaptureForward: !0,
	maesterLongSwap: !0,
	maesterKingSwapAnywhere: !1,
	maesterSwapAny: !1,
	maesterSwapEnemy: !1,
	maesterStep: 1,
	paladinKamikaze: "nonPawn",
	paladinChecks: !1,
	deathTouchMoves: !1,
	paladinReturn: !1,
	paladinJumpsFriends: !0,
	paladinBlockedByEnemies: !0,
	secondPlayerDoubleFirstTurn: !1,
	ogreHop: !1,
	ogreStep2: !1,
	ogreMode: "push",
	ogreNoCapture: !1,
	ogreShoveFriends: "both",
	strikeMode: "move",
	strikeCaptures: !0,
	freezeUses: 2,
	iceWallUses: 2,
	hasteSecond: "any",
	hasteCaptures: !0,
	hasteApart: !1,
	hasteNoThreat: !1,
	hasteNoForward: !1,
	hasteNoCheck: !1,
	markFree: !1,
	freezeQuiet: !1,
	markTurns: 1,
	mercyCaptures: !1,
	mercyAura: !1,
	strikePawns: !0,
	sacrificeBehind: !1,
	holyLightTakesPawns: !1,
	holyLightAura: !1,
	darknessKeep: !1,
	holyLightKnights: !1,
	holyLightShelter: !1,
	holyLightShelterOrtho: !1,
	mercyAuraOrtho: !1,
	mercyAuraPawns: !1,
	mercyAuraPawnsTake: !1,
	mercyTakesPawns: !1,
	mercyNoJump: !1,
	darknessMoves: !1,
	darknessTakeAhead: !1,
	darknessStepDiag: !1,
	darknessShelter: !1,
	darknessShelterPawnsTake: !1,
	darknessPawnArmor: !1,
	darknessAuraPawns: !1,
	darknessKingStep2: !1,
	darknessKingStepSafe: !1,
	darknessKingStepTakes: !1,
	deathTouchReach: !1,
	deathTouchReachOrtho: !1,
	deathTouchReachNoBack: !1,
	deathTouchReachForwardBack: !1,
	deathTouchReachPieces: !1,
	strikeUses: 1,
	hasteUses: 1,
	flightUses: 1,
	sacrificeUses: 1,
	marchUses: 3,
	leapUses: 3,
	reaverStep: "ortho",
	catapultCapture: "stay",
	kings: [null, null],
	hands: [[], []],
	piles: [[], []],
	fromMove: {},
	bishopsOppositeColours: !0,
	classicChess: !1,
	promotionSet: "standard",
	fiftyMove: !0,
	threefold: !0,
	insufficientMaterial: !0,
	design: null
}), J = { ...Ln }, Rn = Object.freeze({
	...Ln,
	archerMove: "ortho",
	archerShots: "classic",
	beastCaptureForward: !1,
	beastMove: "forward",
	paladinKamikaze: "always",
	guardNextToKing: !1,
	promotionSet: "anyNonKing"
}), zn = Object.freeze({
	...Rn,
	archerMove: "fwdBack",
	archerShots: "forward3",
	beastMove: "diagFwdBack",
	beastCapture: "diagForward"
}), Bn = Object.freeze({
	markFree: !0,
	freezeUses: 1,
	hasteCaptures: !1,
	strikePawns: !1,
	strikeCaptures: !1,
	mercyAura: !0,
	mercyAuraPawnsTake: !0,
	mercyTakesPawns: !0,
	marchUses: 0,
	holyLightTakesPawns: !0,
	holyLightShelter: !0,
	holyLightShelterOrtho: !0,
	darknessMoves: !0,
	darknessKingStep2: !0,
	deathTouchReach: !0,
	deathTouchReachOrtho: !0,
	deathTouchReachForwardBack: !0
}), Vn = [
	"fromMove",
	"beforeMove",
	"afterCard"
], Hn = ["", null];
function Un() {
	let e = J.design?.code ?? "";
	return Hn[0] !== e && (Hn = [e, e ? An(e) : null]), Hn[1];
}
function Wn(e) {
	Object.assign(J, Ln, e);
	for (let e of [0, 1]) {
		let t = J.kings[e]?.power, n = t && Nn[t], r = !!n && (t !== "March" && t !== "Leap" || J[n] !== 0);
		if (J.hands[e].length && r) throw Error(`side ${e} has a hand and the king power ${t}: card mode plays kings without spendable powers`);
		if (t && t in J.fromMove && !r) throw Error(`fromMove: ${t} is always on for side ${e}; only a spendable power or a card can wait for a move`);
	}
	for (let e of Object.keys(J.fromMove)) if (!Pn.includes(e)) throw Error(`fromMove: ${e} is always on; only a spendable power or a card can wait for a move`);
	let t = J.design && Sn(J.design), n = J.design?.rules.find((e) => Vn.includes(e.when.on));
	if (t) throw Error(`design: ${t}`);
	if (n) throw Error(`design: the When "${n.when.on}" needs the game's history, which version 1 does not keep`);
	return J;
}
//#endregion
//#region src/rules/setup.ts
var Gn = "QOLRRBBNNAAGMMS";
function Kn(e, t) {
	for (let n = e.length - 1; n > 0; n--) {
		let r = Math.floor(t() * (n + 1));
		[e[n], e[r]] = [e[r], e[n]];
	}
	return e;
}
function qn(e = Math.random, t = Gn, n = J) {
	for (;;) {
		let r = Kn([...Kn(t.split(""), e).slice(0, 7), "K"], e), i = r.indexOf("K"), a = r.indexOf("G");
		if (n.guardNextToKing && a >= 0 && Math.abs(a - i) !== 1) {
			let t = [i - 1, i + 1].filter((e) => e >= 0 && e < 8), n = t[t.length > 1 ? Math.floor(e() * 2) : 0];
			[r[a], r[n]] = [r[n], r[a]];
		}
		let o = r.flatMap((e, t) => e === "B" ? [t] : []);
		if (!(n.bishopsOppositeColours && o.length === 2 && (o[0] + o[1]) % 2 == 0)) return r.join("");
	}
}
function Jn(e) {
	if (J.guardReserve === "off") return e;
	let t = new Uint8Array(e.board), n = [e.waiting?.[0] ?? 0, e.waiting?.[1] ?? 0];
	for (let e = 0; e < 8; e++) for (let r of [0, 1]) {
		let i = k(e, r === 0 ? 0 : 7);
		t[i] && T(t[i]) === 9 && E(t[i]) === r && (t[i] = 0, n[r]++);
	}
	return n[0] || n[1] ? {
		...e,
		board: t,
		waiting: n
	} : e;
}
function Yn(e = qn()) {
	if (!/^[A-Z]{8}$/.test(e) || e.split("K").length !== 2) throw Error(`bad back rank ${e}`);
	let t = /* @__PURE__ */ new Uint8Array(64);
	for (let n = 0; n < 8; n++) {
		let r = b.indexOf(e[n]);
		if (r <= 0) throw Error(`bad piece letter ${e[n]}`);
		t[k(n, 0)] = w(r, 0), t[k(n, 7)] = w(r, 1), t[k(n, 1)] = w(1, 0), t[k(n, 6)] = w(1, 1);
	}
	let n = {
		board: t,
		turn: 0,
		halfmove: 0,
		ply: 0,
		move: 1
	};
	return J.classicChess && Ft(t) && (n.castle = Ft(t)), Jn(n);
}
function Xn(e) {
	let t = [];
	for (let n = 7; n >= 0; n--) {
		let r = "", i = 0;
		for (let t = 0; t < 8; t++) {
			let a = e.board[k(t, n)];
			if (!a) {
				i++;
				continue;
			}
			i &&= (r += i, 0);
			let o = a & 32 ? T(a) === 15 ? "U" : "H" : b[T(a)];
			r += E(a) === 0 ? o : o.toLowerCase();
		}
		i && (r += i), t.push(r);
	}
	let n = Zn(e), r = "KQkq".split("").filter((t, n) => (e.castle ?? 0) & 1 << n).join("") || "-";
	return `${t.join("/")} ${e.turn === 0 ? "w" : "b"} ${r} ${e.ep === void 0 ? "-" : A(e.ep)} ${e.halfmove} ${we(e)}${n ? " " + n : ""}`;
}
function Zn(e) {
	let t = [];
	if (e.used && (e.used[0] || e.used[1]) && t.push(`u${e.used[0]}.${e.used[1]}`), e.marks?.forEach((e, n) => {
		e && t.push(`m${A(e.sq)}${n === 1 ? "b" : "w"}${e.all ? "a" : e.ward ? "i" : ""}${(e.left ?? 1) === 1 ? "" : e.left}`);
	}), e.free && t.push("f"), e.haste !== void 0 && t.push(`h${A(e.haste)}${e.rage ? " rto"[e.rage] : ""}`), e.lost) {
		let n = "";
		for (let t = 0; t < 2; t++) for (let r = 1; r < 16; r++) {
			let i = t === 0 ? b[r] : b[r].toLowerCase();
			n += i.repeat(Math.max(0, e.lost[t * 16 + r] ?? 0));
		}
		t.push(`l${n}`);
	}
	return e.waiting && (e.waiting[0] || e.waiting[1]) && t.push(`g${e.waiting[0]}.${e.waiting[1]}`), e.last && (e.last[0] || e.last[1]) && t.push(`y${e.last[0] ?? ""}.${e.last[1] ?? ""}`), e.drawn && (e.drawn[0] || e.drawn[1]) && t.push(`d${e.drawn[0]}.${e.drawn[1]}`), t.join("/");
}
function Qn(e, t) {
	if (e) {
		if (/^(w|b|wb)$/.test(e)) {
			t.used = [+!!e.includes("w"), +!!e.includes("b")];
			return;
		}
		for (let n of e.split("/")) {
			let r = n[0], i = n.slice(1);
			if (r === "u") {
				let [e = "0", n = "0"] = i.split(".");
				t.used = [+e, +n];
			} else if (r === "m") {
				let e = +(i[2] === "b"), n = i[3] === "a", r = n || i[3] === "i", a = i.slice(r ? 4 : 3), o = [t.marks?.[0], t.marks?.[1]];
				o[e] = {
					sq: ce(i.slice(0, 2)),
					...a ? { left: +a } : {},
					...r ? { ward: !0 } : {},
					...n ? { all: !0 } : {}
				}, t.marks = o;
			} else if (r === "f") t.free = !0;
			else if (r === "h") {
				t.haste = ce(i);
				let e = "rto".indexOf(i[2]);
				i[2] && e >= 0 && (t.rage = e + 1);
			} else if (r === "y") {
				let n = (t) => {
					if (t) {
						if (!Pn.includes(t)) throw Error(`bad card ${t} in ${e}`);
						return t;
					}
				}, [r = "", a = ""] = i.split(".");
				t.last = [n(r), n(a)];
			} else if (r === "d") {
				let [e = "0", n = "0"] = i.split(".");
				t.drawn = [+e, +n];
			} else if (r === "l") {
				let n = Array(32).fill(0);
				for (let t of i) {
					let r = t.toUpperCase(), i = b.indexOf(r);
					if (i <= 0) throw Error(`bad reserve letter ${t} in ${e}`);
					n[(t === r ? 0 : 1) * 16 + i]++;
				}
				t.lost = n;
			} else if (r === "g") {
				let [e = "0", n = "0"] = i.split(".");
				t.waiting = [+e, +n];
			} else throw Error(`bad power field ${e}`);
		}
	}
}
function $n(e, t, n) {
	if (!/^(-|K?Q?k?q?)$/.test(e)) throw Error(`bad castling field ${e}`);
	let r = 0;
	for (let t of e) t !== "-" && (r |= 1 << "KQkq".indexOf(t));
	if (r &= Ft(n.board), r && (n.castle = r), t === "-") return;
	if (!/^[a-h][36]$/.test(t)) throw Error(`bad en-passant field ${t}`);
	let i = ce(t), a = n.turn ^ 1, o = a === 0 ? 8 : -8;
	Lt(n.board, {
		from: i - o,
		to: i + o,
		captures: []
	}, a) >= 0 && !n.board[i] && !n.board[i - o] && (n.ep = i);
}
function er(e) {
	let [t, n = "w", r = "-", i = "-", a = "0", o = "1", s = ""] = e.trim().split(/\s+/), c = /* @__PURE__ */ new Uint8Array(64), l = t.split("/");
	if (l.length !== 8) throw Error(`bad FEN ${e}`);
	l.forEach((t, n) => {
		let r = 0;
		for (let i of t) {
			if (/\d/.test(i)) {
				r += +i;
				continue;
			}
			let t = i.toUpperCase(), a = t === "H" || t === "U" ? 32 : 0, o = t === "H" ? 9 : t === "U" ? 15 : b.indexOf(t);
			if (o <= 0 || r > 7) throw Error(`bad FEN ${e}`);
			c[k(r++, 7 - n)] = w(o, i === t ? 0 : 1) | a;
		}
	});
	let u = n === "w" ? 0 : 1, d = {
		board: c,
		turn: u,
		halfmove: +a,
		ply: (o - 1) * 2 + u,
		move: +o
	};
	return Qn(s, d), J.classicChess && $n(r, i, d), d;
}
function tr(e, t) {
	let n = rr(e, t);
	return t.via === "mirror" ? n + "!Y" : t.via === "mirrorb" ? n + "!Z" : n;
}
var nr = {
	salvation: "!R",
	spawn: "!S",
	spawnk: "!SK",
	spawn2: "!S2",
	spawnk2: "!SK2"
};
function rr(e, t) {
	let n = T(e.board[t.from]), r = n === 1 ? "" : b[n];
	if (t.pass) return "--";
	if (t.castle) return t.castle.from > t.from ? "O-O" : "O-O-O";
	if (t.drop) return `${b[t.drop]}@${A(t.to)}${t.drop2 === void 0 ? "" : "," + A(t.drop2)}${nr[t.power ?? ""] ?? ""}`;
	if (t.power === "freeze") return `!F:${A(t.to)}`;
	if (t.power === "ward") return `!W:${A(t.to)}`;
	if (t.power === "sacrifice") return `!S:${A(t.from)}=${b[t.promo ?? 0]}`;
	if (t.power === "morph" || t.power === "morphb") return `!I${t.power === "morphb" ? "+" : ""}:${A(t.from)}=${b[t.promo ?? 0]}`;
	if (t.power === "morphp") return `!IP:${A(t.from)}=${b[t.promo ?? 0]}`;
	if (t.power === "morphs") return `!IS:${A(t.from)}<>${A(t.to)}`;
	if (t.power === "flight") return `${r}${A(t.from)}~${A(t.to)}`;
	if (t.power === "curse") return `!C:${A(t.from)}-${A(t.to)}`;
	if (t.power === "skylift") return `!K:${A(t.from)}<>${A(t.to)}`;
	if (t.power === "firewall") return "!P";
	if (t.power === "firewallb") return `!E:${A(t.from)}<>${A(t.to)}`;
	if (t.power === "quake" || t.power === "quakeb") return `${t.power === "quake" ? "!Q" : "!U"}:${A(t.from)}`;
	if (t.power === "rescue") return `!D:${A(t.from)}`;
	if (t.power === "growth") return "!G";
	if (t.power === "growthb") return "!G+";
	let i;
	return i = t.shove ? `${r}${A(t.from)}>${A(t.shove.from)}-${A(t.shove.to)}` : t.swap ? `${r}${A(t.from)}<>${A(t.to)}` : (n === 14 || t.power === "control") && t.captures.length === 1 && t.to !== t.captures[0] && (n === 14 || t.to !== t.from) ? `${r}${A(t.from)}x${A(t.captures[0])}-${A(t.to)}` : t.to === t.from ? `${r}${A(t.from)}*${A(t.captures[0])}` : t.captures.length > 1 ? `${r}${A(t.from)}${t.captures.map((e) => "x" + A(e)).join("")}` : `${r}${A(t.from)}${t.captures.length ? "x" : "-"}${A(t.to)}`, t.promo && (i += "=" + b[t.promo]), t.power === "strike" ? i += "!" : t.power === "haste" ? i += "!H" : t.power === "march" ? i += "!M" : t.power === "leap" ? i += "!L" : t.power === "mimic" ? i += "!X" : t.power === "vault" ? i += "!V" : t.power === "rage" ? i += "!A" : t.power === "rageb" ? i += "!B" : t.power === "rally" ? i += "!J" : t.power === "burn" ? i += "!N" : t.power === "firestarter" ? i += "!T" : t.power === "control" && (i += "!O"), i;
}
//#endregion
//#region src/powers-ui.ts
var ir = {
	Freeze: "Freeze",
	IceWall: "Ice Wall",
	Strike: "Strike",
	Haste: "Haste",
	Flight: "Flight",
	Sacrifice: "Sacrifice",
	March: "March",
	Leap: "Leap",
	HolyLight: "Holy Light",
	Mercy: "Mercy",
	DeathTouch: "Death Touch",
	Darkness: "Darkness"
}, ar = /* @__PURE__ */ new Set([
	"freeze",
	"ward",
	"strike",
	"haste",
	"flight",
	"sacrifice"
]), or = (e) => e.pass === !0 || e.power !== void 0 && ar.has(e.power), sr = (e, t) => t ? e.power === t : !or(e), cr = (e, t) => e.flatMap(([e, n]) => e ? [{
	x: e,
	y: n,
	mark: t
}, {
	x: -e,
	y: n,
	mark: t
}] : [{
	x: e,
	y: n,
	mark: t
}]), lr = (e) => ({
	squares: [
		...cr([
			[0, 1],
			[0, -1],
			[1, 0]
		], "move"),
		...cr([[1, 1], [1, -1]], "moveShoot"),
		...cr(e, "shoot")
	],
	lines: [],
	rules: []
}), ur = {
	when: { on: "takes" },
	does: { a: "chain" }
}, Y = (e) => hn(e), dr = "docs/research/piece-runs-2026-10-04-pv2-d3.md", fr = [
	[
		"Pawn",
		Y("pawn"),
		1,
		0,
		"the unit"
	],
	[
		"Knight",
		Y("knight"),
		3.16,
		0,
		"src/ai/eval.ts:60 (the Texel price)"
	],
	[
		"Bishop",
		Y("bishop"),
		3.17,
		.27,
		`${dr}:32`
	],
	[
		"Rook",
		Y("rook"),
		3.84,
		.27,
		`${dr}:31`
	],
	[
		"Queen",
		Y("queen"),
		9.33,
		0,
		"src/ai/eval.ts:60"
	],
	[
		"Ogre",
		Y("ogre"),
		2.6,
		.28,
		`${dr}:30`
	],
	[
		"Beast",
		Y("beast"),
		4.27,
		.29,
		`${dr}:35`
	],
	[
		"Guard",
		Y("guard"),
		1.66,
		0,
		`${dr}:33`,
		!0
	],
	[
		"Archer",
		Y("archer"),
		4.29,
		.35,
		"docs/research/piece-runs-2026-10-04-pv2-A-vsR-d3.md:24; claude/archer-reach"
	],
	[
		"Archer far2",
		{
			squares: [...un("move"), ...cr([
				[0, 2],
				[2, 0],
				[0, -2],
				[2, 2]
			], "shoot")],
			lines: [],
			rules: []
		},
		2.83,
		.28,
		"pv-A-af2"
	],
	[
		"Archer fwd2NoSide",
		lr([
			[0, 2],
			[0, -2],
			[2, 2]
		]),
		3.99,
		.28,
		"claude/archer-reach"
	],
	[
		"Archer fwd2NoBack",
		lr([
			[0, 2],
			[2, 0],
			[2, 2]
		]),
		4.34,
		.28,
		"claude/archer-reach"
	],
	[
		"Archer classic",
		lr([
			[0, 2],
			[2, 0],
			[0, -2]
		]),
		3.73,
		.42,
		"era B"
	],
	[
		"Paladin",
		Y("paladin"),
		4.08,
		.45,
		"era B"
	],
	[
		"Templar",
		{
			squares: un("both"),
			lines: [],
			rules: [{
				when: {
					on: "zone",
					zone: "capital"
				},
				does: {
					a: "movesLike",
					as: "queen"
				}
			}]
		},
		2.15,
		.53,
		"era B"
	],
	[
		"Beast, 7 neighbours",
		{
			squares: un("both").map((e) => e.x === 0 && e.y === 1 ? {
				...e,
				mark: "move"
			} : e),
			lines: [],
			rules: [ur]
		},
		3.77,
		.43,
		"era B"
	],
	[
		"Beast, diagonals",
		{
			squares: [...cr([
				[0, 1],
				[0, -1],
				[1, 0]
			], "move"), ...cr([[1, 1], [1, -1]], "both")],
			lines: [],
			rules: [ur]
		},
		1.81,
		.42,
		"era B"
	]
];
new Map(fr.map(([e, t, n, r, i, a]) => [bn(t), {
	name: e,
	value: n,
	pm: r,
	source: i,
	under: a
}])), fr.map(([e, t]) => ({
	name: e,
	design: t
})), new Set(pn.flatMap((e) => e.rules).concat([{
	when: {
		on: "zone",
		zone: "capital"
	},
	does: {
		a: "movesLike",
		as: "queen"
	}
}]).filter((e) => e.does.a !== "linesPass" && e.does.a !== "becomes").map(xn)), bn(hn("pawn")), bn(hn("queen"));
//#endregion
//#region src/workshop/text.ts
var pr = (e) => e.charAt(0).toUpperCase() + e.slice(1), mr = (e, t) => [Math.max(Math.abs(e), Math.abs(t)), Math.min(Math.abs(e), Math.abs(t))], hr = ([e, t]) => t === 0 || e === t ? 4 : 8;
function gr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = mr(n.x, n.y), r = e.join();
		t.has(r) || t.set(r, {
			orbit: e,
			pts: []
		}), t.get(r).pts.push(n);
	}
	return [...t.values()].sort((e, t) => e.orbit[0] - t.orbit[0] || e.orbit[1] - t.orbit[1]);
}
var _r = (e) => `${e} square${e > 1 ? "s" : ""}`, vr = (e) => e.length > 1 ? "" : e[0].x > 0 ? " right" : " left";
function yr(e, t) {
	let [n, r] = e, i = t.length === hr(e), a = (e, n) => t.some((t) => t.x === e && t.y === n);
	if (r === 0) {
		if (i) return `${_r(n)} straight`;
		let e = a(0, n) && a(0, -n) ? "straight ahead and back" : a(0, n) ? "straight ahead" : a(0, -n) ? "straight back" : "", t = a(n, 0) && a(-n, 0) ? "sideways" : a(n, 0) ? "to the right" : a(-n, 0) ? "to the left" : "";
		return `${_r(n)} ${[e, t].filter(Boolean).join(" and ")}`;
	}
	if (n === r) {
		if (i) return `${_r(n)} diagonally`;
		let e = t.filter((e) => e.y > 0), r = t.filter((e) => e.y < 0);
		return `${_r(n)} diagonally ${[e.length ? `forward${vr(e)}` : "", r.length ? `back${vr(r)}` : ""].filter(Boolean).join(" and ")}`;
	}
	let o = n === 2 ? "L" : `long L (${n} and ${r})`;
	return i ? `in ${n === 2 ? "an" : "a"} ${o}` : t.every((e) => e.y > 0) ? `in a forward ${o}` : t.every((e) => e.y < 0) ? `in a back ${o}` : `in ${n === 2 ? "an" : "a"} ${o}, not every way`;
}
function br(e) {
	if (e.length === 8) return "slides any way";
	let t = an.filter((t) => e.includes(t)), n = on.filter((t) => e.includes(t)), r = (t) => e.includes(t), i = t.length === 4 ? "straight" : [r("n") && r("s") ? "straight ahead and back" : r("n") ? "straight ahead" : r("s") ? "straight back" : "", r("e") && r("w") ? "sideways" : r("e") ? "to the right" : r("w") ? "to the left" : ""].filter(Boolean).join(" and "), a = ["ne", "nw"].filter(r), o = ["se", "sw"].filter(r), s = (e) => e.length > 1 ? "" : e[0].endsWith("e") ? " right" : " left";
	return `slides ${[i, n.length === 4 ? "diagonally" : n.length ? `diagonally ${[a.length ? `forward${s(a)}` : "", o.length ? `back${s(o)}` : ""].filter(Boolean).join(" and ")}` : ""].filter(Boolean).join(" and ")}`;
}
function xr(e, t = []) {
	let n = gr(e).map((e) => yr(e.orbit, e.pts)), r = n.length > 3 ? [`to ${e.length} squares`, ...t] : [...n, ...t];
	return r.length < 2 ? r.join("") : `${r.slice(0, -1).join(", ")} or ${r[r.length - 1]}`;
}
var Sr = (e, t) => e.length === t.length && t.every(([t, n]) => e.some((e) => e.x === t && e.y === n)), Cr = [
	[0, 1],
	[1, 1],
	[1, 0],
	[1, -1],
	[0, -1],
	[-1, -1],
	[-1, 0],
	[-1, 1]
], wr = [
	[1, 2],
	[2, 1],
	[2, -1],
	[1, -2],
	[-1, -2],
	[-2, -1],
	[-2, 1],
	[-1, 2]
], Tr = (e, t) => e.length === t.length && t.every((t) => e.includes(t)), Er = (e) => Math.max(Math.abs(e.x), Math.abs(e.y)) > 1;
function Dr(e, t = !1) {
	let n = h(e.does.a), r = n.say(e), i = n.head ? n.head(e) : e.when.on === "always" ? t ? [{
		pill: "when",
		text: "Always"
	}] : [] : [{
		pill: "when",
		text: pr(te(e.when))
	}];
	return i.length ? [
		...i,
		", ",
		...r,
		"."
	] : [
		pr(r[0]),
		...r.slice(1),
		"."
	];
}
var Or = (e) => e.map((e) => typeof e == "string" ? e : e.text).join(""), kr = (e) => Or(Dr(e));
function Ar(e) {
	let t = e.squares.filter((e) => e.mark === "both" || e.mark === "move" || e.mark === "moveShoot"), n = e.squares.filter((e) => e.mark === "both" || e.mark === "take"), r = e.squares.filter((e) => e.mark === "shoot" || e.mark === "moveShoot"), i = rn.filter((t) => e.lines.includes(t)), a;
	a = !t.length && !i.length ? e.rules.some((e) => e.does.a === "movesLike" || e.does.a === "step2") ? "only as its rules say." : "nowhere." : !i.length && Sr(t, Cr) ? "1 square any way, like a king." : !i.length && Sr(t, wr) ? "in an L, like a knight." : !t.length && Tr(i, on) ? "like a bishop." : !t.length && Tr(i, an) ? "like a rook." : !t.length && i.length === 8 ? "like a queen." : !i.length && Sr(t, [[0, 1]]) && Sr(n, [[1, 1], [-1, 1]]) && !r.length ? "like a pawn." : `${xr(t, i.length ? [br(i)] : [])}.${t.some(Er) ? " It lands on a painted square, even past other pieces." : ""}`;
	let o;
	o = (e.squares.length || i.length) && e.squares.every((e) => e.mark === "both") ? "the same squares." : !n.length && !r.length && !i.length ? e.rules.some((e) => e.does.a === "movesLike") ? "only as its rules say." : "nothing." : [n.length || i.length ? `${xr(n, i.length ? [br(i)] : [])}.` : "", r.length ? `Shoots without moving: ${xr(r)}.` : ""].filter(Boolean).join(" "), e.rules.some((e) => e.does.a === "cannotBeTaken" && e.does.by === "allButKing") && (o += " Only a king can take it.");
	let s = e.rules.map(kr);
	return {
		moves: a,
		takes: o,
		special: s,
		summary: [
			`Moves ${a}`,
			o.startsWith("Shoots") ? o : `Takes ${o}`,
			...s
		].join(" ")
	};
}
//#endregion
//#region src/read.ts
function jr(e) {
	let t = x(T(e));
	return `${E(e) ? "Black" : "White"} ${t[0].toUpperCase() + t.slice(1)}.`;
}
function Mr(e, t) {
	let n = {
		step: /* @__PURE__ */ new Set(),
		take: /* @__PURE__ */ new Set(),
		shot: /* @__PURE__ */ new Set(),
		swap: /* @__PURE__ */ new Set(),
		push: []
	}, r = e.board[t];
	if (!r) return n;
	let i = {
		...e,
		turn: E(r),
		haste: void 0,
		rage: void 0,
		free: void 0
	};
	for (let e of Vt(i).filter((e) => e.from === t && !or(e) && !e.drop)) e.to === e.from && e.captures.length ? n.shot.add(e.captures[0]) : e.shove ? n.push.some((t) => t.from === e.shove.from) || n.push.push(e.shove) : e.swap ? n.swap.add(e.to) : e.captures.length ? n.take.add(e.captures[0]) : n.step.add(e.to);
	return n;
}
var Nr = {
	classic: "Shoots without moving: an enemy diagonally adjacent, or exactly 2 squares away orthogonally, through blockers.",
	plusDiag2: "Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus any enemy exactly 2 squares away diagonally, through blockers.",
	ring2: "Shoots without moving: any enemy on a diagonally adjacent square or anywhere on the ring 2 squares away, through blockers.",
	forward3: "Shoots without moving: an enemy on either forward diagonal, or the square exactly 2 ahead, through blockers.",
	plusDiagFwd2: "Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2) plus either forward diagonal at distance 2, through blockers.",
	plusDiagFwd2Clear: "Shoots without moving: classic shots (diagonal-adjacent or orthogonal-2, through blockers) plus either forward diagonal at distance 2, over an empty square.",
	fwd2NoBack: "Shoots without moving: an enemy diagonally adjacent, exactly 2 squares ahead or to the side, or either forward diagonal at distance 2, through blockers.",
	fwd2NoSide: "Shoots without moving: an enemy diagonally adjacent, exactly 2 squares ahead or behind, or either forward diagonal at distance 2, through blockers.",
	far2: "Shoots without moving. It takes an enemy 2 squares away in a straight line, or 2 squares away on a forward diagonal. The shot goes over pieces.",
	over2: "Shoots without moving: an enemy exactly 2 squares away orthogonally, or on either forward diagonal at distance 2, only over a piece on the square between.",
	nearOver2: "Shoots without moving: an enemy diagonally adjacent, or exactly 2 squares away orthogonally or on either forward diagonal, only over a piece on the square between.",
	fwdNearOver2: "Shoots without moving: an enemy on either forward diagonal next to it, or exactly 2 squares away orthogonally or on either forward diagonal, only over a piece on the square between."
}, Pr = {
	classic: "Shoots near diagonals or 2 squares straight.",
	plusDiag2: "Shoots near diagonals, 2 straight or 2 diagonally.",
	ring2: "Shoots near diagonals or anywhere 2 squares away.",
	forward3: "Shoots diagonally forward nearby, or 2 squares ahead.",
	plusDiagFwd2: "Shoots near diagonals, 2 straight or diagonally ahead.",
	plusDiagFwd2Clear: "Shoots near diagonals or 2 straight. Far forward diagonals need an empty middle.",
	fwd2NoBack: "Shoots near diagonals; 2 ahead, sideways, diagonally forward.",
	fwd2NoSide: "Shoots near diagonals; 2 ahead, behind, diagonally forward.",
	far2: "Shoots 2 squares straight or diagonally forward.",
	over2: "Shoots 2 straight or diagonally forward, only over a piece.",
	nearOver2: "Shoots near diagonals; 2 straight or diagonally forward, only over a piece.",
	fwdNearOver2: "Shoots nearby diagonally forward; 2 straight or diagonally forward, only over a piece."
}, Fr = () => J.paladinKamikaze === "always" ? "Leaves the board after each take." : J.paladinKamikaze === "never" ? "Stays on the board after each take." : "Leaves the board after a take, except a pawn.";
function Ir(e) {
	let t = J;
	switch (e) {
		case 1: return {
			moves: "Moves 1 square forward. Moves 2 from its start rank.",
			captures: "Takes 1 square diagonally forward.",
			special: "Promotes on the last rank."
		};
		case 2: return {
			moves: "Moves in an L, over any piece. Moves 2 squares, then 1 across.",
			captures: "Takes by moving onto the enemy.",
			special: ""
		};
		case 3: return {
			moves: "Moves any distance diagonally.",
			captures: "Takes by moving onto the enemy.",
			special: ""
		};
		case 4: return {
			moves: "Moves any distance orthogonally.",
			captures: "Takes by moving onto the enemy.",
			special: ""
		};
		case 5: return {
			moves: "Moves any distance in a straight line.",
			captures: "Takes by moving onto the enemy.",
			special: ""
		};
		case 6: return {
			moves: "Moves 1 square in any direction.",
			captures: "Takes by moving onto the enemy.",
			special: "Only a king can take a guard."
		};
		case 7: return {
			moves: t.archerMove === "ortho" ? "Moves 1 square orthogonally." : t.archerMove === "fwdBack" ? "Moves 1 square ahead or back." : "Moves 1 square in any direction.",
			captures: Nr[t.archerShots],
			special: "Never takes by moving onto a piece. " + (t.archerChecks ? "Gives check the same way it shoots." : "Cannot take a king or give check.")
		};
		case 8: {
			let e = Fr(), n = t.paladinChecks ? "Can take a king (gives check)." : "Cannot take a king (never gives check).", r = t.promotionSet === "anyNonKing" || t.promotionSet === "anyNonKingNoGuard";
			return {
				moves: "Moves like a queen. Jumps over its own pieces.",
				captures: "Takes by moving onto the enemy.",
				special: `${n} ${e} ${"QOLRRBBNNAAGMMS".includes("L") ? "It is in the random draw." : r ? "Not in the random draw. Custom setup, FEN, and promotion can still use it." : "Not in the random draw. Custom setup and FEN can still place it. A pawn does not promote to it."}`
			};
		}
		case 9: return {
			moves: "Steps to empty squares beside it.",
			captures: "Cannot take.",
			special: "Only a king can take it."
		};
		case 10: return {
			moves: "Moves 1 square in any direction.",
			captures: "Takes an adjacent enemy.",
			special: `Move onto your own piece to swap places.${t.maesterLongSwap ? " It can swap with your king at any distance when both are on their first rank." : ""}${t.maesterSwapAny ? " Swaps with any friendly piece anywhere." : ""}`
		};
		case 11: {
			let e = t.beastMove === "forward" ? "Moves 1 square straight ahead, empty only." : t.beastMove === "diagFwdBack" ? "Steps on four diagonals, empty squares only." : "Steps to empty squares beside it.", n;
			return n = t.beastCapture === "diagForward" ? "Takes on either forward diagonal." : t.beastCapture === "diagonal" ? "Takes on any of the four diagonals." : t.beastCaptureForward ? "Takes on any adjacent square." : "Takes on any adjacent square but straight ahead.", {
				moves: e,
				captures: n,
				special: t.beastChains ? "After a bite, it can bite again from its new square. A chain cannot continue onto a king. Select each piece to bite. Select \"Stop here\" to end the chain." : "One bite per turn."
			};
		}
		case 12: return {
			moves: "Moves 1 square in any direction.",
			captures: "Takes an enemy beside it, except a Guard.",
			special: `It can shove a neighbour 1 square away. ${t.ogreMode === "push" ? "The Ogre steps into its place." : "The Ogre stays in place."} It can shove a Guard, but not a king. A shove takes no piece.`
		};
		case 13: return {
			moves: "Moves like a rook. Never takes by moving.",
			captures: "Lobs along a rank or file over one enemy screen and takes the first piece beyond it.",
			special: ""
		};
		case 14: return {
			moves: "Moves like a knight. After a take it can step one square onto an empty square as part of the same move.",
			captures: "Takes like a knight; the step after never takes.",
			special: "Select the enemy piece, then the landing square."
		};
		case 15: {
			let e = Un(), t = e && Ar(e);
			return t ? {
				moves: `Moves ${t.moves}`,
				captures: t.takes.startsWith("Shoots") ? t.takes : `Takes ${t.takes}`,
				special: t.special.join(" ")
			} : {
				moves: "Moves 1 square in any direction. On a capital square (d4 e4 d5 e5) it moves and takes like a queen.",
				captures: "Takes by moving onto the enemy.",
				special: ""
			};
		}
		default: return {
			moves: "",
			captures: "",
			special: ""
		};
	}
}
function Lr(e, t) {
	let n = e.board[t];
	if (!n) return "";
	let r = T(n), i = J, a = {
		7: Pr[i.archerShots],
		8: i.paladinJumpsFriends ? "Jumps over its own pieces." : "Moves like a queen.",
		9: i.guardImmune ? "Only a king can take it." : Ir(9).captures,
		10: "Swaps places with a friendly piece.",
		11: i.beastChains ? "Can bite again after a bite." : "One bite per turn.",
		12: "Can shove a neighbour.",
		13: "Takes beyond an enemy piece.",
		14: "Can step after a take.",
		...!Un() && { 15: "Moves like a queen on capital squares." },
		1: Ir(1).moves
	}[r] ?? Ir(r).moves.split(/(?<=[.!?])\s/)[0], o = zr(e, t);
	return `${x(r)} · ${a}` + (o.length ? `\n${o.join(" · ")}` : "");
}
function Rr(e, t) {
	let n = T(e.board[t.from]), r = J, i = (e) => e[0].toLowerCase() + e.slice(1);
	if (n === 7 && t.to === t.from && t.captures.length) return ["shot", `Their archer took without moving; it ${i(Pr[r.archerShots])}`];
	if (n === 12 && t.shove) return ["shove", `Their ogre shoved a piece 1 square and ${r.ogreMode === "push" ? "stepped into its place" : "stayed in place"}.`];
	if (n === 11 && t.captures.length > 1) return ["chain", `Their beast took ${t.captures.length} pieces; it can bite again after a bite.`];
	if (n === 8 && t.selfRemove) return ["leave", `Their paladin is gone; it ${i(Fr())}`];
	if (n === 10 && t.swap) return ["swap", "Their maester swapped places with one of their pieces."];
}
function zr(e, t) {
	let n = e.board[t], r = [];
	if (!n) return r;
	for (let i of [0, 1]) {
		let a = e.marks?.[i];
		if (!a || a.left === 0) continue;
		let o = Re(i ^ 1, i, a.ward);
		o === "frozen" && a.sq === t && E(n) !== i && r.push("Frozen"), o === "warded" && E(n) === i && (a.all || a.sq === t) && r.push("Ice Wall");
	}
	return r;
}
function Br(e, t, n, r = null, i = []) {
	let a = e.board[t], o = e.board[n];
	if (i.length && T(a) === 11 && o && T(o) === 6) return "A bite chain cannot take a king.";
	if (zr(e, t).includes("Frozen")) return "Frozen: it cannot move this turn.";
	if (zr(e, n).includes("Ice Wall")) return "Ice Wall: nothing can take it now.";
	if (o && E(o) !== E(a)) {
		if (r === "strike" && !J.strikeCaptures) return "Strike cannot take this turn.";
		let t = !J.hasteCaptures || J.hasteSecond === "quiet";
		if (r === "haste" && !J.hasteCaptures || e.haste !== void 0 && e.rage === void 0 && t) return "Haste cannot take this turn.";
	}
	if (o && E(o) !== E(a) && T(o) !== 6) {
		let t = E(o), r = J.kings[t]?.power, i = B(e.board, t), s = Math.abs(D(n) - D(i)), c = Math.abs(O(n) - O(i)), l = i >= 0 && Math.max(s, c) === 1;
		if (r === "HolyLight" && l && J.holyLightShelter && (!J.holyLightShelterOrtho || s === 0 || c === 0)) return "Holy Light: this piece cannot be taken.";
		if (r === "Mercy" && l && J.mercyAura && (!J.mercyAuraOrtho || s === 0 || c === 0)) {
			let e = T(a) === 1;
			if (J.mercyAuraPawns && e) return "Mercy: pawns cannot take beside this king.";
			if (!J.mercyAuraPawns && J.mercyAuraPawnsTake && !e) return "Only a pawn can take beside Mercy.";
			if (!J.mercyAuraPawns && !J.mercyAuraPawnsTake) return "Mercy: nothing can take beside this king.";
		}
	}
	return Bt(e).some((e) => e.from === t && sr(e, r) && (e.shove?.from ?? e.captures[0] ?? e.to) === n) ? "That leaves your king in check." : J.guardImmune && o && T(o) === 9 && E(o) !== e.turn && T(a) !== 6 ? "Only a king can take a guard." : `${S(T(a), "The")} cannot ${o ? `take ${S(T(o))} on` : "reach"} ${A(n)}.`;
}
function Vr(e, t, n, r, i) {
	let a = e.board[t];
	return i && !a ? {
		selected: null,
		inspected: null
	} : i && a && E(a) === e.turn ? {
		selected: n === t ? null : t,
		inspected: null
	} : {
		selected: n,
		inspected: a && r !== t ? t : null
	};
}
function Hr(e, t, n, r, i, a = null) {
	if (i.length) return {
		selected: n,
		inspected: r,
		pending: i,
		notice: "Select a marked piece, or stop here."
	};
	let o = Vr(e, t, n, r, !0), s = e.board[t] && E(e.board[t]) !== e.turn, c = n != null && (!e.board[t] || s) ? Br(e, n, t, a) : "";
	return o.selected != null && o.selected !== n && !Vt(e).some((e) => e.from === o.selected && sr(e, a)) && (c = zr(e, t).includes("Frozen") ? "Frozen: it cannot move this turn." : `${S(T(e.board[t]), "This")} has no legal move.`), {
		...o,
		pending: [],
		notice: c
	};
}
function Ur(e) {
	let t = /* @__PURE__ */ new Set([
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11,
		12
	]);
	for (let e of Gn) {
		let n = b.indexOf(e);
		n > 0 && t.add(n);
	}
	for (let n of e.board) n && t.add(T(n));
	return [...t].sort((e, t) => e - t);
}
//#endregion
//#region src/move-text.ts
var Wr = ["White", "Black"];
function Gr(e, t, n, r = e.turn) {
	let i = Kr(e), a = i.map((t) => x(T(e.board[t.sq])));
	if (!i.length) return "";
	let o = n === "device" ? `${Wr[e.turn ^ 1]}'s` : r === e.turn ? "Their" : "Your", s = n === "device" ? `the ${Wr[e.turn].toLowerCase()} king` : r === e.turn ? "your king" : "their king";
	if (i.length === 2) return `${o} ${a.join(" and ")} attack ${s}.`;
	if (i.length > 2) return `Check: ${a.slice(0, 5).join(", ")}${a.length > 5 ? `; ${a.length - 5} more.` : "."}`;
	let c = i[0], l = a[0], u = D(c.king) - D(c.sq), d = O(c.king) - O(c.sq), f = l === "archer" && Math.max(Math.abs(u), Math.abs(d)) === 2 && u % 2 == 0 && d % 2 == 0 ? (c.sq + c.king) / 2 : -1, p = f >= 0 && e.board[f] ? A(f) : "";
	if (n) {
		let e = `${t?.power === "strike" && t.from !== t.to && t.to === c.sq ? "Strike: " : ""}${o} ${l} ${l === "archer" ? "shoots" : "attacks"} ${s}`;
		return `${e}${p && e.split(/\s+/).length <= 6 ? ` over ${p}` : ""}.`;
	}
	return t?.power === "strike" && t.from !== t.to && t.to === c.sq ? p ? `Strike lets their ${l} shoot over ${p}.` : `Strike lets their ${l} attack your king.` : p ? `Their archer can shoot over ${p}.` : l === "archer" ? "Their archer can shoot your king." : `Their ${l} attacks your king.`;
}
function Kr(e) {
	let t = B(e.board, e.turn);
	if (t < 0) return [];
	let n = [];
	for (let r = 0; r < 64; r++) {
		let i = e.board[r];
		if (!i || E(i) === e.turn) continue;
		let a = [];
		nt(e.board, r, "attacks", a), a.some((e) => e.captures.includes(t)) && n.push({
			sq: r,
			king: t,
			path: qr(e.board, r, t)
		});
	}
	return n;
}
function qr(e, t, n) {
	let r = T(e[t]), i = D(n) - D(t), a = O(n) - O(t);
	if (r === 2 || r === 13 || r === 7 && Math.max(Math.abs(i), Math.abs(a)) > 1 || i && a && Math.abs(i) !== Math.abs(a)) return "arc";
	let o = Math.sign(i) + 8 * Math.sign(a);
	for (let r = t + o; r !== n; r += o) if (e[r]) return "arc";
	return "straight";
}
function Jr(e, t, n = !1, r = !1) {
	let i = Wr[e.turn], a = e.board[t.from], o = x(T(a)), s = (t) => `${x(T(e.board[t]))} on ${A(t)}`, c = (t) => `${S(T(e.board[t]))} on ${A(t)}`, l = (t) => E(e.board[t]) ? "black" : "white";
	if (n && t.pass && e.free) return `${i} ends the turn after the ${e.marks?.[e.turn] ? "mark" : "draw"}.`;
	if (t.pass) return `${i} ends the turn without the ${e.rage === 3 ? "Rally" : "Haste"} second move.`;
	if (t.power === "freeze") return `${i} freezes the ${l(t.to)} ${s(t.to)}.`;
	if (t.power === "firewall") return `${i} uses Firewall to protect all its pieces until its next turn.`;
	if (t.power === "ward") return `${i} puts an Ice Wall on the ${l(t.to)} ${s(t.to)}.`;
	if (t.power === "sacrifice") return `${i} sacrifices the pawn on ${A(t.from)} and brings back ${C(t.promo)} there.`;
	if (t.power === "morph" || t.power === "morphb" || t.power === "morphp") return `${i} turns ${c(t.from)} into ${C(t.promo)}.`;
	if (Me(t.power)) return t.drop2 === void 0 ? `${i} adds a pawn on ${A(t.to)}.` : `${i} adds pawns on ${A(t.to)} and ${A(t.drop2)}.`;
	if (t.castle) return `${i} castles ${D(t.to) === 6 ? "short" : "long"}.`;
	let u = t.power === "flight" ? `${i} ${o} flies from ${A(t.from)} to ${A(t.to)}` : t.shove ? `${i} ${o} on ${A(t.from)} shoves ${c(t.shove.from)} to ${A(t.shove.to)}${t.to === t.from ? "" : `, stepping to ${A(t.to)}`}` : t.swap ? `${i} ${o} on ${A(t.from)} swaps places with ${c(t.to)}` : t.to === t.from && t.captures.length ? `${i} ${o} on ${A(t.from)} takes ${t.captures.map(c).join(" and ")} without moving` : `${i} ${o} ${A(t.from)} to ${A(t.to)}${t.captures.length ? `, taking ${t.captures.map(c).join(", then ")}${T(a) === 1 && t.captures[0] !== t.to ? " en passant" : ""}` : ""}`;
	return t.promo && (u += `, and becomes ${C(t.promo)}`), t.selfRemove && (u += `; ${S(T(a))} leaves the board`), t.power === "strike" && (u += " with Strike"), !r && t.power === "haste" && (u += `, with Haste: ${S(T(a))} may move again`), !r && t.power === "rally" && (u += ", with Rally: a different piece may move next"), `${u}.`;
}
function Yr(e) {
	let t = Kr(e).map((e) => ({
		from: e.sq,
		to: e.king
	}));
	for (let n of Bt({
		...e,
		turn: e.turn ^ 1,
		haste: void 0,
		free: void 0
	}, "captures")) for (let r of n.captures) e.board[r] && E(e.board[r]) === e.turn && !t.some((e) => e.from === n.from && e.to === r) && t.push({
		from: n.from,
		to: r
	});
	return t;
}
//#endregion
//#region src/marks-model.ts
var Xr = [
	"n",
	"e",
	"s",
	"w"
], Zr = [
	"ne",
	"se",
	"sw",
	"nw"
];
function Qr(e, t) {
	let n = T(e[t]);
	return n === 15 && J.design ? [...$t(J.design, e, t).lines] : n === 3 ? Zr : n === 4 || n === 13 ? Xr : n === 5 || n === 8 || n === 15 && M.includes(t) ? [...Xr, ...Zr] : [];
}
function $r(e, t, n, r) {
	let i = E(e[t]) === 1 ? -1 : 1, a = [];
	for (let o of Qr(e, t)) {
		let [s, c] = Jt[o], l = [];
		for (let e = K(t, s, c * i); e >= 0; e = K(e, s, c * i)) l.push(e);
		let u = -1;
		for (let r = 0; r < l.length; r++) if (n.includes(l[r])) u = r;
		else if (!e[l[r]] || T(e[t]) === 13 || !n.includes(l[r + 1])) break;
		if (u < 0) continue;
		let d = l[u + 1];
		a.push(r.includes(l[u]) ? {
			to: l[u],
			end: "x"
		} : d === void 0 ? {
			to: l[u],
			end: "arrow"
		} : e[d] ? {
			to: d,
			end: "stop"
		} : {
			to: l[u],
			end: "x"
		});
	}
	return a;
}
//#endregion
//#region src/cursor-text.ts
function ei(e, t, n, r) {
	let i = e.board[t], a = i ? `${E(i) ? "black" : "white"} ${x(T(i))}` : "empty";
	return `${A(t)}, ${a}${t === n ? ", selected" : r ? ", can go here" : ""}`;
}
//#endregion
//#region src/previously.ts
var ti = (e) => {
	let t = je[e];
	return ir[t] ?? t.replace(/(?:B|K2?|[PS]|2)$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
};
function ni(e, t) {
	let n = e.at(-1);
	if (!n || n.pos.turn === t) return null;
	let r = e.length - 1;
	for (; r > 0 && e[r - 1].pos.turn !== t;) r--;
	let i = r;
	for (; i > 0 && e[i - 1].pos.turn === t;) i--;
	let a = e.slice(r).reverse(), o = a.find((e) => !e.move.pass) ?? a[0], { pos: s, move: c } = a.find((e) => e.move.captures.length) ?? o, l = x(c.drop ?? T(s.board[c.from])), u = a.reduce((e, t) => e + t.move.captures.length, 0), d = (e) => x(T(s.board[e])), f = c.pass ? `their ${l} stayed; the turn ended.` : c.captures.length ? `their ${l} ${T(s.board[c.from]) === 7 && c.from === c.to ? "shot" : "took"} ${u > 1 ? `${u} pieces` : `your ${d(c.captures[0])}`}.` : c.power === "sacrifice" ? `they traded a pawn for ${C(c.promo)}.` : c.drop ? `their ${l} ${c.power === "salvation" ? "returned" : "entered"} on ${A(c.to)}.` : c.shove ? `their ${l} shoved your ${d(c.shove.from)}.` : c.swap ? `their ${l} swapped places.` : c.power === "freeze" ? `they froze your ${d(c.to)}.` : c.power === "ward" ? `they shielded their ${d(c.to)}.` : c.promo && c.from === c.to ? `their ${l} became ${C(c.promo)}.` : c.power === "rescue" ? l ? `they marked ${S(c.drop ?? T(s.board[c.from]))} again.` : "they used Rescue." : c.pushes ? `they pushed ${C(T(s.board[c.pushes[0].from]))} with ${ti(c.power)}.` : c.power === "growth" || c.power === "growthb" ? "they drew a card with Growth." : c.from === c.to ? `their ${l} ${c.power ? `used ${ti(c.power)}` : `stayed on ${A(c.to)}`}.` : `their ${l} moved to ${A(c.to)}.`, p = (t, n) => e.slice(t, n).map((e, t, n) => {
		let r = ri(e.pos, e.move, t > 0 && n[t - 1].move.to === e.move.from);
		return t === 0 ? r[0].toUpperCase() + r.slice(1) : r[0].toLowerCase() + r.slice(1);
	}).join(", then ") + ".";
	return {
		from: r,
		to: e.length,
		line: f,
		detail: p(r, e.length),
		before: i < r ? p(i, r) : null
	};
}
function ri(e, t, n) {
	let r = x(t.drop ?? T(e.board[t.from])), i = n ? "" : `${r} ${A(t.from)} `, a = t.pass ? "end turn" : t.power === "freeze" ? `Freeze on ${A(t.to)}` : t.power === "ward" ? `Ice Wall on ${A(t.to)}` : t.power === "sacrifice" ? `Sacrifice on ${A(t.from)} for ${x(t.promo)}` : t.drop ? `${r} ${t.power === "salvation" ? "returns" : "enters"} on ${A(t.to)}${t.drop2 === void 0 ? "" : ` and ${A(t.drop2)}`}` : t.promo && t.from === t.to ? `${i}becomes ${x(t.promo)}` : t.power === "rescue" ? `Rescue puts the mark on ${r ? `${S(t.drop ?? T(e.board[t.from]))} on ` : ""}${A(t.to)} again` : t.pushes ? `pushes ${t.pushes.map((t) => `${x(T(e.board[t.from]))} ${A(t.from)} to ${A(t.to)}`).join(" and ")}` : t.from === t.to && !t.captures.length ? `${i}${t.power ? `uses ${ti(t.power)}` : "stays"}` : t.swap ? `${i}swaps with ${A(t.to)}` : t.shove ? `${i}shoves ${A(t.shove.from)} to ${A(t.shove.to)}` : t.from === t.to && t.captures.length ? `${i}shoots ${t.captures.map(A).join(" and ")}` : `${i}${t.captures.length ? `takes ${t.captures.map(A).join(" and ")}${t.to === t.captures.at(-1) ? "" : `, to ${A(t.to)}`}` : `to ${A(t.to)}`}${t.promo ? `, becomes ${x(t.promo)}` : ""}`;
	return t.power && (t.from !== t.to || t.captures.length || t.drop || t.promo || t.pushes) && ![
		"freeze",
		"ward",
		"sacrifice"
	].includes(t.power) && (a += ` with ${ti(t.power)}`), a;
}
//#endregion
//#region src/render/legend.ts
var ii = {
	green: "#7cb342",
	hi: "#9ccc65",
	lo: "#6a9a36",
	navy: "#1c2e5c",
	red: "#d63428",
	white: "#fbf7ee",
	halo: "rgba(251,247,238,.92)",
	ink: "#2b2621",
	power: "#2f5ea8",
	powerMid: "#7fb2ff",
	gold: "#e9c071"
};
`${ii.hi}${ii.green}${ii.lo}${ii.gold}${ii.gold}${ii.gold}`;
//#endregion
//#region src/render/frost.ts
function ai(e) {
	return (e?.marks ?? []).flatMap((t, n) => {
		let r = t && e.board[t.sq], i = t?.left ?? 1;
		return t && !t.all && r && i > 0 && E(r) !== n && Re(E(r), n, t.ward) === "frozen" ? [{
			sq: t.sq,
			turns: i
		}] : [];
	});
}
//#endregion
//#region src/rules/position-key.ts
var oi = 2654435769, si = () => (oi ^= oi << 13, oi ^= oi >>> 17, oi ^= oi << 5, oi >>> 0), ci = 1779033703, li = () => {
	si();
	let e = ci = ci + 1831565813 | 0;
	return e = Math.imul(e ^ e >>> 15, 1 | e), e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, (e ^ e >>> 14) >>> 0 & 1048575;
}, ui = 16, di = /* @__PURE__ */ new Int32Array(4096), fi = /* @__PURE__ */ new Int32Array(4096), pi = (e, t, n) => {
	let r = (e * 2 + t) * ui + n << 6;
	for (let e = r; e < r + 64; e++) di[e] = si() | 0, fi[e] = li();
};
for (let e = 0; e < 2; e++) for (let t = 0; t < 12; t++) pi(0, e, t);
var mi = si() | 0, hi = li();
for (let e = 0; e < 2; e++) for (let t = 0; t < 12; t++) pi(1, e, t);
for (let e = 0; e < 2; e++) for (let t = 0; t < 2; t++) for (let n = 12; n < ui; n++) pi(e, t, n);
var gi = (e, t) => ((e & 32 ? 2 : 0) + E(e)) * ui + T(e) << 6 | t, _i = (e, t) => t * 4294967296 + (e >>> 0);
function vi(e, t, n) {
	let r = 0, i = 0;
	for (let t = 0; t < 64; t++) {
		let n = e[t];
		if (!n) continue;
		let a = gi(n, t);
		r ^= di[a], i ^= fi[a];
	}
	t && (r ^= mi, i ^= hi), n[0] = r, n[1] = i;
}
var X = (e) => {
	let t = new Int32Array(e), n = new Int32Array(e);
	for (let r = 0; r < e; r++) t[r] = si() | 0, n[r] = li();
	return [t, n];
}, [yi, bi] = X(128), [xi, Si] = X(64), [Ci, wi] = X(16), [Ti, Ei] = X(128), [Di, Oi] = X(4), [ki, Ai] = X(1), [ji, Mi] = X(2), [Ni, Pi] = X(4), [Fi, Ii] = X(8), Li = (e, t) => e * 4 + Math.min(t, 3), Ri = (e, t) => e * 8 + Math.min(t, 7), zi = (e, t) => e * 4 + Math.min(t, 3), [Bi, Vi] = X(2), [Hi, Ui] = X(2), [Wi, Gi] = X(64), [Ki, qi] = X(16), Ji = (e, t) => e * 8 + Math.min(t, 7), [Yi, Xi] = X(1), Zi = Int32Array.of(...Hi, ...Yi), Qi = Int32Array.of(...Ui, ...Xi), [$i, ea] = X(64), ta = Int32Array.of(...Wi, ...$i), na = Int32Array.of(...Gi, ...ea), ra = (e, t) => t < 32 ? e * 32 + t : 64 + e * 32 + (t - 32), [ia, aa] = X(4), [oa, sa] = X(8), ca = /* @__PURE__ */ new Int32Array(2);
function la(e, t = ca) {
	vi(e.board, e.turn, t);
	let n = t[0], r = t[1];
	for (let t = 0; t < 2; t++) {
		let i = e.used?.[t] ?? 0;
		if (R(t).length) for (let e = 0; e < 8; e++) i >> e & 1 && (n ^= Ci[t * 8 + e], r ^= wi[t * 8 + e]);
		else if (i > 0 && Ee(t) > 0) {
			let e = Ri(t, i);
			n ^= Ci[e], r ^= wi[e];
		}
		if (e.lost && ze(t)) for (let i = 1; i < 16; i++) {
			let a = e.lost[t * 16 + i];
			if (a > 0) {
				let e = zi(t * 16 + i, a);
				n ^= Ti[e], r ^= Ei[e];
			}
		}
		let a = e.waiting?.[t] ?? 0;
		if (a > 0) {
			let e = Li(t, a);
			n ^= Fi[e], r ^= Ii[e];
		}
		let o = e.last?.[t];
		if (o && Be()) {
			let e = ra(t, Pn.indexOf(o));
			n ^= ta[e], r ^= na[e];
		}
		let s = e.drawn?.[t] ?? 0;
		if (s > 0) {
			let e = Ji(t, s);
			n ^= Ki[e], r ^= qi[e];
		}
	}
	for (let t = 0; t < 2; t++) {
		let i = e.marks?.[t];
		if (!i) continue;
		let a = t * 64 + i.sq, o = i.left ?? 1;
		n ^= yi[a], r ^= bi[a], o !== 1 && (n ^= t ? Ni[o] : Di[o], r ^= t ? Pi[o] : Oi[o]), i.ward && (n ^= ji[t], r ^= Mi[t]), i.all && (n ^= Bi[t], r ^= Vi[t]);
	}
	e.free && (n ^= ki[0], r ^= Ai[0]), e.haste !== void 0 && (n ^= xi[e.haste], r ^= Si[e.haste]), e.rage && (n ^= Zi[e.rage - 1], r ^= Qi[e.rage - 1]);
	for (let t = 0; t < 4; t++) (e.castle ?? 0) & 1 << t && (n ^= ia[t], r ^= aa[t]);
	return e.ep !== void 0 && (n ^= oa[e.ep & 7], r ^= sa[e.ep & 7]), t[0] = n, t[1] = r, _i(n, r);
}
//#endregion
//#region src/game-rules.ts
function ua(e) {
	if (e && typeof e == "object") {
		for (let t of Object.values(e)) ua(t);
		Object.freeze(e);
	}
	return e;
}
var da = class {
	rules;
	constructor(e = Ln) {
		let t = { ...J };
		try {
			this.rules = ua(structuredClone(Wn(structuredClone(e))));
		} finally {
			Object.assign(J, t);
		}
		Object.freeze(this);
	}
	#e(e) {
		let t = { ...J };
		try {
			return Object.assign(J, this.rules), e();
		} finally {
			Object.assign(J, t);
		}
	}
	startPosition(e) {
		let t = e ?? this.randomBackRank();
		return this.#e(() => Yn(t));
	}
	fromFen(e) {
		return this.#e(() => er(e));
	}
	randomBackRank(e, t) {
		return qn(e, t, this.rules);
	}
	positionKey(e) {
		return this.#e(() => la(e));
	}
	legalMoves(e) {
		return this.#e(() => Vt(e));
	}
	pseudoMoves(e) {
		return this.#e(() => Bt(e));
	}
	inCheck(e) {
		return this.#e(() => pt(e));
	}
	status(e) {
		return this.#e(() => qt(e));
	}
	makeMove(e, t) {
		return this.#e(() => at(e, t));
	}
	toLan(e, t) {
		return tr(e, t);
	}
	genPiece(e, t, n, r) {
		return this.#e(() => nt(e, t, n, r));
	}
	designedMoves(e, t, n, r, i) {
		return this.#e(() => {
			let a = [];
			return tn(e, t, "all", a, n, i, r), a;
		});
	}
	nameOf(...e) {
		return this.#e(() => x(...e));
	}
	theName(...e) {
		return this.#e(() => S(...e));
	}
	aName(...e) {
		return this.#e(() => C(...e));
	}
	playedDesign() {
		return this.#e(() => {
			let e = Un();
			return e ? ua(structuredClone(e)) : null;
		});
	}
	markKind(...e) {
		return this.#e(() => Re(...e));
	}
	pieceTitle(...e) {
		return this.#e(() => jr(...e));
	}
	reachOf(...e) {
		return this.#e(() => Mr(...e));
	}
	pieceGuide(...e) {
		return this.#e(() => Ir(...e));
	}
	readText(...e) {
		return this.#e(() => Lr(...e));
	}
	teachNote(...e) {
		return this.#e(() => Rr(...e));
	}
	pieceStates(...e) {
		return this.#e(() => zr(...e));
	}
	whyNot(...e) {
		return this.#e(() => Br(...e));
	}
	readTap(...e) {
		return this.#e(() => Vr(...e));
	}
	unmarkedTap(...e) {
		return this.#e(() => Hr(...e));
	}
	guideTypes(...e) {
		return this.#e(() => Ur(...e));
	}
	checkCause(...e) {
		return this.#e(() => Gr(...e));
	}
	checkersOf(...e) {
		return this.#e(() => Kr(...e));
	}
	describeMove(...e) {
		return this.#e(() => Jr(...e));
	}
	threatsIn(...e) {
		return this.#e(() => Yr(...e));
	}
	railsOf(...e) {
		return this.#e(() => $r(...e));
	}
	cursorText(...e) {
		return this.#e(() => ei(...e));
	}
	previouslyTurn(...e) {
		return this.#e(() => ni(...e));
	}
	frozenPieces(...e) {
		return this.#e(() => ai(...e));
	}
}, fa = class {
	owned;
	lifetime = {};
	get context() {
		return this.owned;
	}
	get rules() {
		return this.owned.rules;
	}
	get identity() {
		return this.lifetime;
	}
	pos;
	backRank = "";
	history = [];
	status = "playing";
	cache = null;
	seen = /* @__PURE__ */ new Map();
	constructor(e, t = Ln) {
		this.owned = new da(t), this.newGame(e);
	}
	newGame(e, t) {
		let n = t ? new da(t) : this.owned, r = e ?? n.randomBackRank(), i = n.startPosition(r);
		this.owned = n, this.lifetime = {}, this.backRank = r, this.pos = i, this.history = [], this.seen.clear(), this.cache = null, this.update();
	}
	load(e) {
		this.lifetime = {}, this.backRank = "", this.pos = e, this.history = [], this.seen.clear(), this.cache = null, this.update();
	}
	key() {
		return this.context.positionKey(this.pos);
	}
	update() {
		this.seen.set(this.key(), (this.seen.get(this.key()) ?? 0) + 1), this.setStatus();
	}
	setStatus() {
		let e = this.context.status(this.pos);
		this.status = e === "playing" && this.rules.threefold && (this.seen.get(this.key()) ?? 1) >= 3 ? "drawRepetition" : e;
	}
	positionAfter(e) {
		return e === this.history.length ? this.pos : this.history[e].pos;
	}
	get legal() {
		return this.cache ??= this.context.legalMoves(this.pos);
	}
	get inCheck() {
		return this.context.inCheck(this.pos);
	}
	play(e) {
		this.history.push({
			pos: this.pos,
			move: e,
			lan: this.context.toLan(this.pos, e)
		}), this.pos = this.context.makeMove(this.pos, e), this.cache = null, this.update();
	}
	undo() {
		let e = this.history.pop();
		if (!e) return !1;
		let t = (this.seen.get(this.key()) ?? 1) - 1;
		return t > 0 ? this.seen.set(this.key(), t) : this.seen.delete(this.key()), this.pos = e.pos, this.cache = null, this.setStatus(), !0;
	}
	playLan(e) {
		let t = 0;
		for (let n of e) {
			let e = this.legal.find((e) => this.context.toLan(this.pos, e) === n);
			if (!e) break;
			this.play(e), t++;
		}
		return t;
	}
};
//#endregion
//#region src/match/worker.ts
t("sha256");
var pa = "sha256:febb9239470eea930cce5e1b588838bafd2c6687f0419d1bbf1072c975603ae2", ma = 1e3, ha = 8e6, ga = [
	"beginner",
	"casual",
	"club",
	"strong"
], Z, Q, _a = !1, va = !1;
function ya(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e) || Object.keys(e).some((e) => !t.includes(e))) throw Error("Malformed input");
	return e;
}
function $(e) {
	return Number.isSafeInteger(e) && e >= 0;
}
function ba(e) {
	if (typeof e != "string" || e.length > 4096) throw Error("Malformed FEN");
	let t = e.split(" "), n = t[0].split("/");
	if (t.length < 6 || t.length > 7 || !["w", "b"].includes(t[1]) || !(J.classicChess ? /^(-|K?Q?k?q?)$/.test(t[2]) && /^(-|[a-h][36])$/.test(t[3]) : t[2] === "-" && t[3] === "-") || !/^\d+$/.test(t[4]) || !/^[1-9]\d*$/.test(t[5]) || n.length !== 8 || n.some((e) => !/^[1-8PNBRQKALGMSOCVTHpnbrqkalgmsocvth]+$/.test(e) || [...e].reduce((e, t) => e + (/\d/.test(t) ? +t : 1), 0) !== 8) || (t[0].match(/K/g) ?? []).length !== 1 || (t[0].match(/k/g) ?? []).length !== 1) throw Error("Malformed FEN");
	if (t[6] && t[6].split("/").some((e) => !/^([ugd]\d+\.\d+|m[a-h][1-8][wb][ia]?\d*|f|h[a-h][1-8][rto]?|l[PNBRQKALGMSOCVTpnbrqkalgmsocvt]*|y[A-Za-z]*\.[A-Za-z]*)$/.test(e))) throw Error("Unsupported or malformed power state");
	let r = er(e);
	if ([
		...r.used ?? [],
		...r.waiting ?? [],
		...r.lost ?? [],
		...r.drawn ?? []
	].some((e) => !$(e) || e > 1e4) || r.marks?.some((e) => e && (!$(e.sq) || e.sq > 63 || e.left !== void 0 && (!$(e.left) || e.left > 2))) || r.haste !== void 0 && (!$(r.haste) || r.haste > 63)) throw Error("Malformed power state");
	if (!$(r.halfmove) || !$(r.ply) || !$(we(r)) || Xn(r) !== e) throw Error("Noncanonical FEN");
	return r;
}
function xa(e) {
	let t = ya(e, [
		"backRank",
		"fen",
		"preset",
		"kings",
		"classic",
		"hand"
	]);
	if (t.backRank !== void 0 && (typeof t.backRank != "string" || !/^[PNBRQKALGMSOCVT]{8}$/.test(t.backRank)) || t.fen !== void 0 && t.backRank !== void 0 || t.preset !== void 0 && ![
		"current",
		"2017",
		"2021"
	].includes(t.preset) || t.classic !== void 0 && typeof t.classic != "boolean") throw Error("Malformed setup");
	if (t.hand !== void 0 && (!Array.isArray(t.hand) || t.hand.length > 8 || new Set(t.hand).size !== t.hand.length || [...t.hand].some((e) => !Pn.includes(e)))) throw Error("Malformed hand");
	if (t.kings !== void 0 && (typeof t.kings != "string" || t.kings.length > 100 || t.kings.split(",").length !== 2 || t.kings.split(",").some((e) => e !== "none" && !In(`${e},none`)[0]))) throw Error("Malformed kings");
	let n = t.kings === void 0 ? void 0 : In(t.kings), r = t.preset === "2017" ? Rn : t.preset === "2021" ? zn : void 0, i = [t.hand ?? [], t.hand ?? []];
	try {
		Wn(structuredClone({
			...n?.some(Boolean) ? Bn : {},
			...r,
			...n ? { kings: n } : {},
			...t.classic ? { classicChess: !0 } : {},
			hands: i
		}));
	} catch (e) {
		throw Error(`Malformed setup: ${e.message}`);
	}
	if (J.piles.some((e) => e.length)) throw Error("Private card data unsupported");
	Z = new fa(t.backRank ?? "RNBQKBNR", J), t.fen !== void 0 && Z.load(ba(t.fen)), Q = {
		schema: "kingdown-local-match/1",
		engine: pa,
		setup: structuredClone(t),
		initialFen: Xn(Z.pos),
		rules: structuredClone(J),
		revision: 0,
		commands: []
	};
}
function Sa() {
	if (!Z || !va) throw Error("Match not initialized");
	let { piles: e, ...t } = J, n = Z.status === "playing" ? Z.legal.map((e) => ({
		lan: tr(Z.pos, e),
		move: e
	})) : [];
	return {
		rules: structuredClone(t),
		moves: structuredClone(n),
		revision: Q.revision,
		fen: Xn(Z.pos),
		ply: Z.pos.ply,
		turn: Z.pos.turn,
		moveNumber: we(Z.pos),
		status: Z.status,
		inCheck: Z.inCheck,
		legal: n.map((e) => e.lan),
		history: Z.history.map((e) => e.lan)
	};
}
function Ca(e) {
	if (!Z || !va) throw Error("Match not initialized");
	if (Z.status !== "playing") throw Error("Match terminal");
	let t = ya(e, [
		"level",
		"maxTimeMs",
		"maxDepth"
	]), n = t.level;
	if (n !== void 0 && !ga.includes(n)) throw Error("Malformed level");
	let r = t.maxTimeMs === void 0 ? 250 : t.maxTimeMs, i = t.maxDepth === void 0 ? n ? void 0 : 4 : t.maxDepth;
	if (!$(r) || r < 1 || r > 5e3 || i !== void 0 && (!$(i) || i < 1 || i > 8)) throw Error("Malformed search bounds");
	return {
		kind: "runtime-search",
		engine: pa,
		revision: Q.revision,
		rules: structuredClone(J),
		pos: structuredClone(Z.pos),
		history: Z.history.map((e) => la(e.pos)),
		ply: Z.history.length,
		legal: Z.legal.map((e) => tr(Z.pos, e)),
		options: structuredClone(t)
	};
}
function wa(e) {
	let t = ya(e, [
		"id",
		"expectedRevision",
		"lan"
	]);
	if (typeof t.id != "string" || !t.id.length || t.id.length > 200 || typeof t.lan != "string" || !t.lan.length || t.lan.length > 1024 || !$(t.expectedRevision)) throw Error("Malformed command");
	return t;
}
function Ta(e) {
	if (!Z || !va) throw Error("Match not initialized");
	let t = wa(e), n = Q.commands.find((e) => e.id === t.id);
	if (n) {
		if (n.lan !== t.lan || n.expectedRevision !== t.expectedRevision) throw Error("Command ID conflict");
		return Sa();
	}
	if (t.expectedRevision !== Q.revision) throw Error("Stale revision");
	if (Z.status !== "playing") throw Error("Match terminal");
	if (Q.commands.length >= ma) throw Error("Match history limit reached");
	let r = Z.legal.filter((e) => tr(Z.pos, e) === t.lan);
	if (r.length !== 1) throw Error("Illegal or ambiguous move");
	return Z.play(r[0]), Q.revision++, Q.commands.push({
		...t,
		fen: Xn(Z.pos),
		ply: Z.pos.ply,
		status: Z.status
	}), Sa();
}
function Ea(e) {
	if (typeof e != "string" || e.length > ha) throw Error("Malformed save");
	let t = ya(JSON.parse(e), [
		"schema",
		"engine",
		"setup",
		"initialFen",
		"rules",
		"revision",
		"commands"
	]);
	if (t.schema !== "kingdown-local-match/1" || t.engine !== pa) throw Object.assign(/* @__PURE__ */ Error("Incompatible save"), { code: "MATCH_INCOMPATIBLE" });
	if (!$(t.revision) || !Array.isArray(t.commands) || t.commands.length > ma || t.commands.length !== t.revision) throw Error("Malformed history");
	if (xa(t.setup), t.initialFen !== Q.initialFen || JSON.stringify(t.rules) !== JSON.stringify(Q.rules)) throw Error("Incompatible setup or rules");
	va = !0;
	for (let e of t.commands) {
		let t = ya(e, [
			"id",
			"expectedRevision",
			"lan",
			"fen",
			"ply",
			"status"
		]);
		if (t.expectedRevision !== Q.revision) throw Error("Invalid replay revision");
		let n = Q.revision, r = Ta({
			id: t.id,
			expectedRevision: t.expectedRevision,
			lan: t.lan
		});
		if (Q.revision !== n + 1 || r.fen !== t.fen || r.ply !== t.ply || r.status !== t.status) throw Error("Invalid replay");
	}
}
e.on("message", ({ id: t, op: n, input: r }) => {
	let i = va;
	try {
		if (_a) throw Error("Match initialization failed");
		if ((n === "create" || n === "load") && Z) throw Error("Already initialized");
		let i;
		switch (n) {
			case "create":
				xa(r);
				break;
			case "load":
				Ea(r);
				break;
			case "snapshot":
				i = Sa();
				break;
			case "chooseMove":
				i = Ca(r);
				break;
			case "apply":
				i = Ta(r);
				break;
			case "save":
				Sa(), i = JSON.stringify(Q);
				break;
			default: throw Error("Unknown operation");
		}
		(n === "create" || n === "load") && (va = !0), e.postMessage({
			id: t,
			value: i
		});
	} catch (r) {
		(n === "create" || n === "load") && !i && (_a = !0, va = !1, Z = void 0), e.postMessage({
			id: t,
			error: r.message,
			code: r.code
		});
	}
});
//#endregion
export {};
