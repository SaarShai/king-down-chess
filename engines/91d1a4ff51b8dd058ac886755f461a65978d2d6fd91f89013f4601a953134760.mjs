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
}, _ = Object.keys(ee), v = (e) => !!e && typeof e == "object" && !Array.isArray(e), y = (e, t) => v(e) && Object.keys(e).sort().join() === [...t].sort().join();
function te(e) {
	if (!v(e)) return !1;
	switch (e.on) {
		case "always":
		case "afterFirstCapture":
		case "takes":
		case "firstTake": return y(e, ["on"]);
		case "zone": return y(e, ["on", "zone"]) && Object.hasOwn(g, e.zone);
		case "reaches": return y(e, ["on", "zone"]) && e.zone === "lastRank";
		case "near": return y(e, ["on", "who"]) && [
			"king",
			"friend",
			"enemy",
			..._
		].includes(e.who);
		case "fromMove":
		case "beforeMove": return y(e, ["on", "n"]) && [
			5,
			10,
			15,
			20
		].includes(e.n);
		case "afterCard": return y(e, ["on", "card"]) && e.card === "any";
		default: return !1;
	}
}
function ne(e) {
	let t = v(e) ? m.find((t) => t.a === e.a) : void 0;
	return !t || !v(e) ? !1 : t.pill ? y(e, ["a", t.pill.key]) && t.pill.choices.some(([n]) => n === e[t.pill.key]) : y(e, ["a"]);
}
var re = (e) => y(e, ["when", "does"]) && te(e.when) && ne(e.does) && h(e.does.a).whens(e.when);
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
var b = " PNBRQKALGMSOCVT", x = [
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
], ie = (e) => e === 15 && Nn()?.name || x[e], ae = (e, t = "the") => {
	let n = e === 15 && Nn()?.name;
	return n ? t[0] === t[0].toUpperCase() ? n[0].toUpperCase() + n.slice(1) : n : `${t} ${x[e]}`;
}, oe = (e) => ae(e, /^[aeiou]/.test(x[e]) ? "an" : "a"), se = [
	5,
	4,
	3,
	2,
	7,
	8,
	9,
	10,
	11
], ce = {
	anyNonKing: se,
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
	anyNonKingNoGuard: se.filter((e) => e !== 9)
}, S = (e, t) => e | t << 4, C = (e) => e & 15, w = (e) => e >> 4 & 1, T = (e) => e & 7, E = (e) => e >> 3, D = (e, t) => t << 3 | e, O = (e) => "abcdefgh"[T(e)] + (E(e) + 1), le = (e) => D(e.charCodeAt(0) - 97, e.charCodeAt(1) - 49), k = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
	[1, 1],
	[1, -1],
	[-1, 1],
	[-1, -1]
], A = [
	27,
	28,
	35,
	36
], ue = k.slice(0, 4), de = k.slice(4), fe = [
	[1, 2],
	[2, 1],
	[-1, 2],
	[-2, 1],
	[1, -2],
	[2, -1],
	[-1, -2],
	[-2, -1]
], pe = [
	[1, 1],
	[1, -1],
	[-1, 1],
	[-1, -1],
	[2, 0],
	[-2, 0],
	[0, 2],
	[0, -2]
], me = [
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
].filter((t) => Math.max(Math.abs(e), Math.abs(t)) === 2).map((t) => [e, t])), j = {
	classic: pe,
	plusDiag2: [
		...pe,
		[2, 2],
		[2, -2],
		[-2, 2],
		[-2, -2]
	],
	ring2: [...de, ...me],
	forward3: [
		[1, 1],
		[-1, 1],
		[0, 2]
	],
	plusDiagFwd2: [
		...pe,
		[2, 2],
		[-2, 2]
	],
	plusDiagFwd2Clear: [
		...pe,
		[2, 2],
		[-2, 2]
	],
	fwd2NoBack: [
		...pe.filter(([e, t]) => e !== 0 || t !== -2),
		[2, 2],
		[-2, 2]
	],
	fwd2NoSide: [
		...pe.filter(([e, t]) => t !== 0 || Math.abs(e) !== 2),
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
}, he = {
	forward3: j.forward3,
	plusDiagFwd2: j.plusDiagFwd2,
	plusDiagFwd2Clear: j.plusDiagFwd2Clear,
	fwd2NoBack: j.fwd2NoBack,
	fwd2NoSide: j.fwd2NoSide,
	far2: j.far2,
	over2: j.over2,
	nearOver2: j.nearOver2,
	fwdNearOver2: j.fwdNearOver2
}, ge = () => q.archerShots === "over2" || q.archerShots === "nearOver2" || q.archerShots === "fwdNearOver2", _e = () => q.archerShots === "plusDiagFwd2Clear" ? 1 : ge() ? 2 : 0, ve = (e, t, n, r) => e === 1 ? t * n !== 0 && Math.abs(n) === 2 && r !== 0 : e === 2 && Math.max(Math.abs(t), Math.abs(n)) === 2 && r === 0, ye = (e) => e.map(([e, t]) => [e, -t]), be = Object.fromEntries(Object.entries(he).map(([e, t]) => [e, ye(t)])), xe = (e) => {
	let t = he[q.archerShots];
	return t ? e === 1 ? be[q.archerShots] : t : j[q.archerShots];
}, Se = [[0, 1], [0, -1]], Ce = [[[1, 1], [-1, 1]], [[1, -1], [-1, -1]]];
function M(e, t, n) {
	let r = T(e) + t, i = E(e) + n;
	return r < 0 || r > 7 || i < 0 || i > 7 ? -1 : D(r, i);
}
var N = (e) => e === 0 ? 1 : -1, P = (e, t) => C(e) === 9 ? q.guardNoSecondRank && E(t) === (w(e) === 0 ? 1 : 6) ? !1 : !q.guardNoCapital || !A.includes(t) : !0, we = (e, t) => Math.max(Math.abs(T(e) - T(t)), Math.abs(E(e) - E(t))), F = (e) => q.kings[e]?.power ?? "", Te = (e) => e.move ?? (e.ply >> 1) + 1, Ee = (e, t) => !(t < (q.fromMove[e] ?? 0));
function De(e) {
	let t = F(e), n = t ? Cn[t] : void 0;
	return n ? q[n] : -1;
}
var I = (e) => q.hands[e], Oe = (e, t = 0) => q.hands[e].length + t, L = (e, t) => t < q.hands[e].length ? q.hands[e][t] : q.piles[e][t - q.hands[e].length], ke = (e, t) => q.hands[e].includes(t) || q.piles[e].includes(t), Ae = (e) => ke(0, e) || ke(1, e), je = {
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
}, Me = (e, t, n, r = 0) => {
	for (let i = 0, a = Oe(e, r); i < a; i++) if (L(e, i) === n && !(t >> i & 1)) return !0;
	return !1;
};
function Ne(e, t, n, r = 0, i) {
	if (!I(e).length) return t + 1;
	let a = i === "mirror" ? "Mirror" : i === "mirrorb" ? "MirrorB" : je[n];
	for (let n = 0, i = Oe(e, r); n < i; n++) if (L(e, n) === a && !(t >> n & 1)) return t | 1 << n;
	return t;
}
function Pe(e, t, n = 0) {
	if (I(e).length) return !!(~t & (1 << Oe(e, n)) - 1);
	let r = De(e);
	return r < 0 ? !1 : r === 0 ? F(e) !== "March" && F(e) !== "Leap" : t < r;
}
var Fe = (e) => F(e) === "March" && q.marchUses === 0, Ie = (e) => F(e) === "Leap" && q.leapUses === 0;
function Le(e, t, n = !1) {
	if (t === void 0 || t === e) return "";
	if (I(t).length) return n ? "warded" : "frozen";
	let r = F(t);
	return r === "Freeze" ? "frozen" : r === "IceWall" ? "warded" : "";
}
var Re = (e) => F(e) === "Sacrifice" || ke(e, "Sacrifice") || ke(e, "Salvation") || ke(e, "Mirror") && (Ae("Sacrifice") || Ae("Salvation")), ze = () => Ae("Mirror"), Be = () => q.markTurns === 1 && Ae("Rescue"), Ve = (e) => e === "freeze" || e === "ward" || e === "firewall" || e === "rescue", He = (e) => e.pass === !0 || Ve(e.power) || e.power === "growth" || e.power === "growthb", Ue = (e) => e.power === "haste" || e.power === "rage" || e.power === "rageb" || e.power === "rally" || e.power === "growthb" || q.markFree && Ve(e.power), We = () => Re(0) || Re(1), Ge = (e) => e !== 1 && e !== 6 && e !== 9, Ke = (e, t, n) => t.drop ? S(t.drop, n) : e[t.from];
function R(e, t) {
	let n = C(e);
	if (n === 12 && q.ogreNoCapture) return !1;
	if (q.design && (n === 15 || t === 15)) {
		for (let { when: e, does: r } of q.design.rules) if (e.on === "always" && (n === 15 && r.a === "cannotTake" && (r.what === "any" || r.what === "king" && t === 6 || r.what === "pawns" && t === 1) || t === 15 && r.a === "cannotBeTaken" && (r.by === "pawns" ? n === 1 : n !== 6))) return !1;
	}
	return n === 9 && (q.guardCaptures === "none" || q.guardCaptures === "pawns" && t !== 1) || n === 9 && q.guardCaptureLimit && e & 32 ? !1 : t === 9 && q.guardImmune ? n === 6 : n === 6 && t !== 9 && F(w(e)) === "Mercy" && !q.mercyCaptures && !(t === 1 && q.mercyTakesPawns) || n === 1 && t === 6 && F(w(e) ^ 1) === "HolyLight" || n === 2 && t === 6 && q.holyLightKnights && F(w(e) ^ 1) === "HolyLight" || n === 6 && t === 1 && F(w(e)) === "HolyLight" && !q.holyLightTakesPawns || n === 1 && t === 1 && q.darknessPawnArmor && F(w(e) ^ 1) === "Darkness" ? !1 : t !== 6 || (n !== 8 || q.paladinChecks) && (q.archerChecks || n !== 7);
}
function z(e, t) {
	return e.indexOf(S(6, t));
}
function B(e, t, n) {
	if (!q.holyLightAura || F(n) !== "HolyLight") return !1;
	let r = S(6, n);
	for (let n = 0; n < 8; n++) {
		let i = U[t * 8 + n];
		if (i >= 0 && e[i] === r) return !0;
	}
	return !1;
}
var qe = () => q.mercyAura || q.holyLightShelter || q.darknessShelter || q.darknessAuraPawns || !!q.design?.rules.some((e) => e.does.a === "cannotBeTaken" && e.when.on !== "always");
function Je(e, t) {
	let n = e[t];
	if (!n || C(n) === 6) return 0;
	let r = q.design && C(n) === 15 ? $t(q.design, e, t) : 0, i = F(w(n)), a = 0, o, s;
	if (i === "Mercy" && q.mercyAura) o = q.mercyAuraOrtho ? 4 : 8, s = q.mercyAuraPawns ? 1 : q.mercyAuraPawnsTake ? 3 : 2;
	else if (i === "HolyLight" && q.holyLightShelter) o = q.holyLightShelterOrtho ? 4 : 8, s = 2;
	else if (i === "Darkness" && q.darknessShelter) a = 4, o = 8, s = q.darknessShelterPawnsTake ? 3 : 2;
	else if (i === "Darkness" && q.darknessAuraPawns) o = 8, s = 1;
	else return r;
	let c = S(6, w(n));
	for (let n = a; n < o; n++) {
		let i = U[t * 8 + n];
		if (i >= 0 && e[i] === c) return !r || r === s ? s : s === 1 ? 4 : 2;
	}
	return r;
}
function Ye(e, t, n) {
	for (let r = t.length - 1; r >= n; r--) {
		let n = t[r].captures, i = C(e[t[r].from]), a = i === 1;
		for (let o = 0; o < n.length; o++) {
			let s = Je(e, n[o]);
			if (s === 2 || s === 1 && a || s === 3 && !a || s === 4 && i !== 6) {
				t.splice(r, 1);
				break;
			}
		}
	}
}
function V(e, t, n, r, i) {
	if (E(n) === i) for (let i of ce[q.promotionSet]) e.push({
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
function Xe(e, t, n, r, i, a, o, s, c, l) {
	for (let [u, d] of o) {
		if (q.beastCapture === "adjacent" && u === 0 && d === s && !q.beastCaptureForward) continue;
		let f = M(r, u, d);
		if (f < 0) continue;
		let p = (t ?? e)[f];
		if (!p || w(p) === a) continue;
		let m = C(p);
		if (!R(11, m) || i.length > 0 && m === 6) continue;
		let h = [...i, f];
		if (l.push({
			from: n,
			to: f,
			captures: h
		}), c === "attacks" || m === 6 || !q.beastChains) continue;
		let g = t ?? new Uint8Array(e);
		g[f] = 0, Xe(e, g, n, f, h, a, o, s, c, l), g[f] = p;
	}
}
function Ze(e, t, n, r, i, a, o) {
	for (let [s, c] of i) {
		let i = M(t, s, c);
		if (i < 0) continue;
		let l = e[i];
		l ? w(l) !== n && R(r, C(l)) && o.push({
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
function Qe(e, t, n, r, i, a, o) {
	let s = Ie(n);
	for (let [c, l] of i) for (let i = M(t, c, l); i >= 0; i = M(i, c, l)) {
		let c = e[i];
		if (!c) {
			a === "all" && o.push({
				from: t,
				to: i,
				captures: []
			});
			continue;
		}
		if (!(s && w(c) === n && C(c) === 1)) {
			w(c) !== n && R(r, C(c)) && o.push({
				from: t,
				to: i,
				captures: [i]
			});
			break;
		}
	}
}
function $e(e, t, n, r, i = e[t]) {
	let a = w(i);
	switch (C(i)) {
		case 1: {
			let o = N(a), s = a === 0 ? 1 : 6, c = a === 0 ? 7 : 0, l = F(a) === "Darkness";
			if (l && (q.darknessTakeAhead || q.darknessStepDiag)) {
				if (q.darknessStepDiag) {
					if (n === "all") for (let n of [-1, 1]) {
						let i = M(t, n, o);
						i >= 0 && !e[i] && V(r, t, i, [], c);
					}
				} else {
					let n = M(t, 0, o);
					n >= 0 && e[n] && w(e[n]) !== a && R(i, C(e[n])) && !B(e, n, a ^ 1) && V(r, t, n, [n], c);
				}
			} else if (l) {
				if (n === "all") for (let n of [-1, 1]) {
					let i = M(t, n, o);
					i >= 0 && !e[i] && V(r, t, i, [], c);
				}
				let l = M(t, 0, o);
				if (l >= 0 && e[l] && w(e[l]) !== a && R(i, C(e[l])) && !B(e, l, a ^ 1) && V(r, t, l, [l], c), q.darknessMoves && !q.darknessKeep && n === "all") {
					let n = M(t, 0, o);
					if (n >= 0 && !e[n]) {
						V(r, t, n, [], c);
						let i = M(t, 0, 2 * o);
						(Fe(a) || E(t) === s) && i >= 0 && !e[i] && V(r, t, i, [], c);
					}
				}
				if (!q.darknessKeep) return;
			}
			if (n === "all") {
				let n = M(t, 0, o);
				if (n >= 0 && !e[n]) {
					V(r, t, n, [], c);
					let i = M(t, 0, 2 * o);
					(Fe(a) || E(t) === s) && i >= 0 && !e[i] && V(r, t, i, [], c);
				}
			}
			if (q.pawnCapitalCapture && n !== "attacks" && !l && A.includes(t)) {
				let n = M(t, 0, o);
				n >= 0 && e[n] && w(e[n]) !== a && R(i, C(e[n])) && !B(e, n, a ^ 1) && V(r, t, n, [n], c);
			}
			for (let n of [-1, 1]) {
				let s = M(t, n, o);
				s >= 0 && e[s] && w(e[s]) !== a && R(i, C(e[s])) && !B(e, s, a ^ 1) && V(r, t, s, [s], c);
			}
			return;
		}
		case 2: return Ze(e, t, a, i, fe, n, r);
		case 6: {
			let o = F(a) === "Mercy";
			if (o || q.darknessKingStep2 && F(a) === "Darkness") {
				let s = !o && q.darknessKingStepTakes, c = !o && !s && q.darknessKingStepSafe;
				for (let [l, u] of k) {
					let d = M(t, l, u);
					if (d < 0) continue;
					let f = e[d];
					if (f) {
						if (w(f) !== a) {
							R(i, C(f)) && r.push({
								from: t,
								to: d,
								captures: [d]
							});
							continue;
						}
						if (!o || q.mercyNoJump) continue;
					} else n === "all" && r.push({
						from: t,
						to: d,
						captures: []
					});
					let p = M(d, l, u);
					if (p < 0) continue;
					let m = e[p];
					m ? s && w(m) !== a && R(i, C(m)) && r.push({
						from: t,
						to: p,
						captures: [p]
					}) : n === "all" && !(c && ut(e, d, a ^ 1)) && r.push({
						from: t,
						to: p,
						captures: []
					});
				}
				return;
			}
			if (F(a) === "DeathTouch") {
				for (let o = 0; o < 8; o++) {
					let [s, c] = k[o], l = M(t, s, c);
					if (l < 0) continue;
					let u = e[l];
					if (u ? w(u) !== a && R(i, C(u)) && (r.push({
						from: t,
						to: t,
						captures: [l]
					}), q.deathTouchMoves && r.push({
						from: t,
						to: l,
						captures: [l]
					})) : n === "all" && r.push({
						from: t,
						to: l,
						captures: []
					}), q.deathTouchReach && !u && ot(s, c, a)) {
						let n = M(l, s, c), o = n >= 0 ? e[n] : 0;
						o && w(o) !== a && R(i, C(o)) && !(q.deathTouchReachPieces && C(o) === 1) && r.push({
							from: t,
							to: t,
							captures: [n]
						});
					}
				}
				return;
			}
			return Ze(e, t, a, i, k, n, r);
		}
		case 9: {
			let o = r.length;
			Ze(e, t, a, i, k, n, r);
			let s = q.guardDoubleFirst !== "off" && E(t) === (a === 0 ? 0 : 7), c = q.guardCapitalStep && A.includes(t);
			if ((q.guardStep === 2 || s || c) && n === "all") for (let [n, i] of k) {
				let a = M(t, n, i);
				if (a < 0 || e[a] && !(s && q.guardDoubleFirst === "leap")) continue;
				let o = M(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			if (q.guardNoSecondRank || q.guardNoCapital) for (let e = r.length - 1; e >= o; e--) P(i, r[e].to) || r.splice(e, 1);
			return;
		}
		case 3: return Qe(e, t, a, i, de, n, r);
		case 4: return Qe(e, t, a, i, ue, n, r);
		case 5: return Qe(e, t, a, i, k, n, r);
		case 7: {
			let i = q.archerMove === "any" ? k : q.archerMove === "fwdBack" ? Se : ue;
			if (n === "all") for (let [n, a] of i) {
				let i = M(t, n, a);
				i >= 0 && !e[i] && r.push({
					from: t,
					to: i,
					captures: []
				});
			}
			let o = _e();
			for (let [n, i] of xe(a)) {
				let s = M(t, n, i);
				s >= 0 && e[s] && w(e[s]) !== a && R(7, C(e[s])) && !(o && ve(o, n, i, e[M(t, n >> 1, i >> 1)])) && r.push({
					from: t,
					to: t,
					captures: [s]
				});
			}
			return;
		}
		case 8:
			for (let [i, o] of k) for (let s = M(t, i, o); s >= 0; s = M(s, i, o)) {
				let i = e[s];
				if (!i) {
					n === "all" && r.push({
						from: t,
						to: s,
						captures: []
					});
					continue;
				}
				if (w(i) === a) {
					if (q.paladinJumpsFriends) continue;
					break;
				}
				if (R(8, C(i))) {
					if (q.paladinReturn) r.push({
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
						(q.paladinKamikaze === "always" || q.paladinKamikaze === "nonPawn" && C(i) !== 1) && (e.selfRemove = !0), r.push(e);
					}
				}
				if (q.paladinBlockedByEnemies) break;
			}
			return;
		case 10: {
			for (let [i, o] of k) {
				let s = M(t, i, o);
				if (s < 0) continue;
				let c = e[s];
				c ? w(c) === a ? n === "all" && P(c, t) && r.push({
					from: t,
					to: s,
					captures: [],
					swap: !0
				}) : (R(10, C(c)) && r.push({
					from: t,
					to: s,
					captures: [s]
				}), n === "all" && q.maesterSwapEnemy && C(c) !== 6 && r.push({
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
			if (q.maesterStep === 2 && n === "all") for (let [n, i] of k) {
				let a = M(t, n, i);
				if (a < 0 || e[a]) continue;
				let o = M(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			if (n === "all" && q.maesterSwapAny) for (let n = 0; n < 64; n++) {
				let i = e[n];
				i && w(i) === a && C(i) !== 6 && we(t, n) > 1 && P(i, t) && r.push({
					from: t,
					to: n,
					captures: [],
					swap: !0
				});
			}
			let i = a === 0 ? 0 : 7, o = (e) => q.maesterKingSwapAnywhere || E(e) === i;
			if (n === "all" && q.maesterLongSwap && o(t)) {
				let n = z(e, a);
				n >= 0 && o(n) && we(n, t) > 1 && r.push({
					from: t,
					to: n,
					captures: [],
					swap: !0
				});
			}
			return;
		}
		case 11: {
			let i = N(a), o = q.beastMove === "any" ? k : q.beastMove === "diagFwdBack" ? de : [[0, i]];
			if (n === "all") for (let [n, i] of o) {
				let a = M(t, n, i);
				a >= 0 && !e[a] && r.push({
					from: t,
					to: a,
					captures: []
				});
			}
			Xe(e, null, t, t, [], a, q.beastCapture === "diagForward" ? Ce[a] : q.beastCapture === "diagonal" ? de : k, i, n, r);
			return;
		}
		case 14:
			if (Ze(e, t, a, i, fe, n, r), n === "all") {
				let n = q.reaverStep === "ortho" ? ue : k;
				for (let [o, s] of fe) {
					let c = M(t, o, s);
					if (c < 0) continue;
					let l = e[c];
					if (l && w(l) !== a && R(i, C(l))) for (let [i, a] of n) {
						let n = M(c, i, a);
						n >= 0 && !e[n] && r.push({
							from: t,
							to: n,
							captures: [c]
						});
					}
				}
			}
			return;
		case 15: return q.design ? en(e, t, n, r, q.design) : A.includes(t) ? Qe(e, t, a, i, k, n, r) : Ze(e, t, a, i, k, n, r);
		case 12:
			if (Ze(e, t, a, i, k, n, r), q.ogreStep2 && n === "all") for (let [n, i] of k) {
				let a = M(t, n, i);
				if (a < 0 || e[a]) continue;
				let o = M(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			if (n !== "all") return;
			if (q.ogreHop) for (let [n, i] of k) {
				let a = M(t, n, i);
				if (a < 0 || !e[a]) continue;
				let o = M(a, n, i);
				o >= 0 && !e[o] && r.push({
					from: t,
					to: o,
					captures: []
				});
			}
			for (let [n, i] of k) {
				let a = M(t, n, i);
				if (a < 0) continue;
				let o = e[a];
				if (!o || C(o) === 6) continue;
				let s = M(a, n, i);
				s < 0 || e[s] || r.push({
					from: t,
					to: q.ogreMode === "push" ? a : t,
					captures: [],
					shove: {
						from: a,
						to: s
					}
				});
			}
			return;
		case 13:
			if (n === "all") for (let [n, i] of ue) for (let a = M(t, n, i); a >= 0 && !e[a]; a = M(a, n, i)) r.push({
				from: t,
				to: a,
				captures: []
			});
			for (let [n, o] of ue) {
				let s = M(t, n, o);
				for (; s >= 0 && !e[s];) s = M(s, n, o);
				if (s < 0 || w(e[s]) === a) continue;
				let c = M(s, n, o);
				for (; c >= 0 && !e[c];) c = M(c, n, o);
				if (c < 0) continue;
				let l = e[c];
				w(l) !== a && R(i, C(l)) && r.push({
					from: t,
					to: q.catapultCapture === "land" ? c : t,
					captures: [c]
				});
			}
			return;
	}
}
function et(e, t, n, r) {
	let i = r.length;
	if ($e(e, t, n, r), qe() && Ye(e, r, i), n !== "attacks") {
		if (q.capitalSanctuary) for (let e = r.length - 1; e >= i; e--) {
			let t = r[e].captures;
			for (let n = 0; n < t.length; n++) if (A.includes(t[n])) {
				r.splice(e, 1);
				break;
			}
		}
		if (q.capitalNoCapture && A.includes(t)) for (let e = r.length - 1; e >= i; e--) r[e].captures.length > 0 && r.splice(e, 1);
		if (q.ogreShoveFriends !== "both" && C(e[t]) === 12) {
			let n = w(e[t]);
			for (let t = r.length - 1; t >= i; t--) {
				let i = r[t].shove;
				i && w(e[i.from]) === n != (q.ogreShoveFriends === "friends") && r.splice(t, 1);
			}
		}
	}
}
function tt(e, t) {
	return t.promo ? S(t.promo, w(e)) : q.guardCaptureLimit && t.captures.length > 0 && C(e) === 9 || q.design && t.captures.length > 0 && C(e) === 15 && q.design.rules.some((e) => e.when.on === "afterFirstCapture" || e.when.on === "firstTake") ? e | 32 : e;
}
function nt(e, t, n, r) {
	let i = e ? [...e] : Array(32).fill(0);
	for (let e of n.captures) {
		let n = t[e];
		i[w(n) * 16 + C(n)]++;
	}
	return n.selfRemove && i[w(r) * 16 + C(r)]++, n.power === "sacrifice" && n.promo && i[w(r) * 16 + n.promo]--, n.power === "salvation" && n.drop && i[w(r) * 16 + n.drop]--, i;
}
function rt(e, t) {
	return e.captures.includes(t) ? -1 : e.shove?.from === t ? e.shove.to : e.pushes ? e.pushes.find((e) => e.from === t)?.to ?? t : e.castle?.from === t ? e.castle.to : t === e.from ? e.selfRemove ? -1 : e.to : e.swap && t === e.to ? e.from : t;
}
function it(e, t) {
	let n = e.turn, r = new Uint8Array(e.board), i = He(t), a = Ke(r, t, n), o = r[t.to], s = e.lost;
	if (!i) {
		We() && (s = nt(s, r, t, a));
		for (let e of t.captures) r[e] = 0;
		if (t.shove && (r[t.shove.to] = r[t.shove.from], r[t.shove.from] = 0), t.pushes) for (let e of t.pushes) r[e.to] = r[e.from], r[e.from] = 0;
		else r[t.from] = t.swap ? o : 0, r[t.to] = t.selfRemove ? 0 : tt(a, t), t.drop2 !== void 0 && (r[t.drop2] = a), t.castle && (r[t.castle.to] = r[t.castle.from], r[t.castle.from] = 0);
	}
	let c = !i && (t.captures.length > 0 || (t.pushes ? t.pushes.some((t) => C(e.board[t.from]) === 1) : !t.drop && C(a) === 1)), l = Ve(t.power), u = q.secondPlayerDoubleFirstTurn && e.ply === 1 || Ue(t), d = {
		board: r,
		turn: u ? n : n ^ 1,
		halfmove: c ? 0 : e.halfmove + 1,
		ply: e.ply + 1,
		move: Te(e) + +(!u && n === 1)
	}, f = e.used, p = e.drawn?.[n] ?? 0;
	if (t.power) {
		let e = [f?.[0] ?? 0, f?.[1] ?? 0];
		e[n] = Ne(n, e[n], t.power, p, t.via), f = e;
	}
	f && (f[0] || f[1]) && (d.used = f);
	let m = [e.marks?.[0], e.marks?.[1]];
	if (!i) for (let e = 0; e < 2; e++) {
		let n = m[e];
		if (!n) continue;
		let r = rt(t, n.sq);
		r !== n.sq && (m[e] = r < 0 ? void 0 : {
			...n,
			sq: r
		});
	}
	let h = n ^ 1, g = m[h], ee = m[n];
	if (g && !u) {
		let e = (g.left ?? 1) - 1, { left: t, ...n } = g;
		m[h] = e > 1 ? {
			...n,
			left: e
		} : e === 1 ? n : e === 0 && Be() ? {
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
			let e = (t.power === "ward" || t.power === "firewall") && I(n).length > 0;
			m[n] = {
				sq: t.to,
				...q.markTurns > 1 ? { left: q.markTurns } : {},
				...e ? { ward: !0 } : {},
				...t.power === "firewall" ? { all: !0 } : {}
			};
		}
		q.markFree && (d.free = !0);
	}
	if (t.power === "growthb" && (d.free = !0), (m[0] || m[1]) && (d.marks = m), (t.power === "haste" || t.power === "rage" || t.power === "rageb" || t.power === "rally") && (d.haste = t.to), (t.power === "rage" || t.power === "rageb" || t.power === "rally") && (d.rage = t.power === "rage" ? 1 : t.power === "rageb" ? 2 : 3), t.power === "growth" || t.power === "growthb") {
		let t = [e.drawn?.[0] ?? 0, e.drawn?.[1] ?? 0];
		t[n]++, d.drawn = t;
	} else e.drawn && (d.drawn = e.drawn);
	let _ = e.last;
	if (t.power && I(n).length && ze()) {
		let e = [_?.[0], _?.[1]];
		e[n] = je[t.power], _ = e;
	}
	_ && (d.last = _), s && (d.lost = s);
	let v = e.waiting;
	if (t.drop && !t.power && v) {
		let e = [v[0], v[1]];
		e[n]--, v = e;
	}
	if (v && (v[0] || v[1]) && (d.waiting = v), e.castle) {
		let n = Ft(e.castle, t);
		n && (d.castle = n);
	}
	if (q.classicChess) {
		let a = i ? Ue(t) ? e.ep ?? -1 : -1 : It(r, t, n);
		a >= 0 && (d.ep = a);
	}
	return d;
}
function at(e, t, n) {
	return q.beastCapture === "diagForward" ? e !== 0 && t === -N(n) : q.beastCapture === "diagonal" ? e !== 0 && t !== 0 : q.beastCaptureForward || e !== 0 || t !== -N(n);
}
function ot(e, t, n) {
	return q.deathTouchReachOrtho && e !== 0 && t !== 0 || q.deathTouchReachNoBack && t === -N(n) ? !1 : !q.deathTouchReachForwardBack || e === 0;
}
function H(e, t, n, r, i) {
	let a = e[t];
	return a !== 0 && w(a) === r && C(a) === n && (i === 0 || R(a, i));
}
var st = Array.from({ length: 64 }, (e, t) => Int8Array.from(fe.map(([e, n]) => M(t, e, n)).filter((e) => e >= 0))), U = Int8Array.from({ length: 512 }, (e, t) => M(t >> 3, k[t & 7][0], k[t & 7][1])), ct = Array.from({ length: 512 }, (e, t) => {
	let [n, r] = k[t & 7], i = [];
	for (let e = M(t >> 3, n, r); e >= 0; e = M(e, n, r)) i.push(e);
	return Int8Array.from(i);
});
function lt(e, t, n, r) {
	let i = -N(n), a = F(n) === "Darkness";
	if (a && !q.darknessStepDiag) {
		let a = M(t, 0, i);
		if (a >= 0 && H(e, a, 1, n, r)) return !0;
	}
	if (!a || q.darknessKeep || q.darknessTakeAhead || q.darknessStepDiag) {
		let a = M(t, -1, i), o = M(t, 1, i);
		if (a >= 0 && H(e, a, 1, n, r) || o >= 0 && H(e, o, 1, n, r)) return !0;
	}
	return !1;
}
function ut(e, t, n) {
	let r = qe() ? Je(e, t) : 0;
	if (r === 2) return !1;
	let i = e[t] ? C(e[t]) : 0;
	if (r === 4) {
		let r = z(e, n), i = [];
		return r >= 0 && $e(e, r, "attacks", i), i.some((e) => e.captures[0] === t);
	}
	if (r === 3) return lt(e, t, n, i);
	let a = -1, o = st[t];
	for (let t = 0; t < o.length; t++) if (H(e, o[t], 2, n, i) || H(e, o[t], 14, n, i)) return !0;
	for (let r = 0; r < 8; r++) {
		let a = U[t * 8 + r];
		if (a < 0) continue;
		let o = e[a];
		if (o && w(o) === n && (H(e, a, 6, n, i) || H(e, a, 10, n, i) || !q.ogreNoCapture && H(e, a, 12, n, i) || !q.design && H(e, a, 15, n, i) || q.guardCaptures !== "none" && H(e, a, 9, n, i) && P(o, t) || H(e, a, 11, n, i) && at(k[r][0], k[r][1], n))) return !0;
	}
	let s = q.deathTouchReach && F(n) === "DeathTouch" && !(q.deathTouchReachPieces && i === 1), c = q.darknessKingStepTakes && q.darknessKingStep2 && F(n) === "Darkness";
	if (s || c) for (let r = 0; r < (s && q.deathTouchReachOrtho ? 4 : 8); r++) {
		let a = U[t * 8 + r];
		if (a < 0 || e[a]) continue;
		let o = U[a * 8 + r];
		if (o >= 0 && H(e, o, 6, n, i) && (c || ot(-k[r][0], -k[r][1], n))) return !0;
	}
	if (r === 0 && !B(e, t, n ^ 1) && lt(e, t, n, i)) return !0;
	let l = xe(n), u = _e();
	for (let r = 0; r < l.length; r++) {
		let a = l[r][0], o = l[r][1], s = M(t, -a, -o);
		if (s >= 0 && H(e, s, 7, n, i) && !(u && ve(u, a, o, e[M(t, -a >> 1, -o >> 1)]))) return !0;
	}
	for (let r = 0; r < 8; r++) {
		let o = ct[t * 8 + r], s = r < 4 ? 4 : 3, c = !1, l = !1, u = !0;
		for (let t = 0; t < o.length; t++) {
			let d = o[t], f = e[d];
			if (!f) continue;
			let p = u;
			if (u = !1, w(f) !== n) {
				if (r < 4 && p && (a < 0 ? a = +!!e.includes(S(13, n)) : a)) {
					for (let r = t + 1; r < o.length; r++) if (e[o[r]]) {
						if (H(e, o[r], 13, n, i)) return !0;
						break;
					}
				}
				if (q.paladinBlockedByEnemies) break;
				c = !0;
				continue;
			}
			let m = C(f);
			if (!c && (m === s || m === 5 || m === 15 && !q.design && A.includes(d)) && (i === 0 || R(f, i)) || !l && m === 8 && (i === 0 || R(f, i))) return !0;
			m === 1 && Ie(n) || (c = !0), q.paladinJumpsFriends || (l = !0);
		}
	}
	return q.design !== null && dt(e, t, n);
}
function dt(e, t, n) {
	let r = e[t], i = [];
	r || (e[t] = S(6, n ^ 1));
	for (let t = 0; t < 64; t++) (e[t] & 31) === S(15, n) && en(e, t, "attacks", i, q.design);
	return e[t] = r, i.some((e) => e.captures[0] === t);
}
function ft(e, t = e.turn) {
	let n = z(e.board, t);
	return n >= 0 && ut(e.board, n, t ^ 1);
}
var pt = (e, t) => ({
	drawn: e.drawn?.[t] ?? 0,
	last: e.last?.[t ^ 1],
	rescue: e.marks?.[t]?.sq ?? -1,
	move: Te(e)
}), mt = {
	drawn: 0,
	last: void 0,
	rescue: -1,
	move: Infinity
};
function ht(e, t, n, r, i, a, o, s = mt) {
	if (!Pe(t, n, s.drawn)) return;
	let c = i.length;
	if (I(t).length) {
		let c = Oe(t, s.drawn);
		for (let l = 0; l < c; l++) {
			let u = L(t, l);
			if (!(n >> l & 1 || !vt(t, n, l) || !Ee(u, s.move))) {
				if (u === "Mirror") s.last && yt(s.last, "mirror", e, t, r, i, a, o, s);
				else if (u === "MirrorB") for (let l = 0; l < c; l++) {
					let c = L(t, l);
					!(n >> l & 1) && c !== "Mirror" && c !== "MirrorB" && vt(t, n, l) && yt(c, "mirrorb", e, t, r, i, a, o, s);
				}
				else Ct(u, e, t, r, i, a, o, s);
			}
		}
	} else {
		let n = F(t);
		n && Ee(n, s.move) && Ct(n, e, t, r, i, a, o, s);
	}
	if (qe() && Ye(e, i, c), q.capitalSanctuary || q.capitalNoCapture) {
		let e = c;
		for (let t = c; t < i.length; t++) {
			let n = i[t];
			n.captures.length > 0 && (q.capitalSanctuary && n.captures.some((e) => A.includes(e)) || q.capitalNoCapture && A.includes(n.from)) || (i[e++] = n);
		}
		i.length = e;
	}
}
var gt = [], W = /* @__PURE__ */ new Uint8Array(64);
function _t(e, t, n, r) {
	W.fill(0);
	for (let i = t; i < n; i++) {
		let t = e[i];
		t.from === r && t.to !== r && !t.swap && !t.shove && !t.selfRemove && (!t.captures.length || t.captures.length === 1 && t.captures[0] === t.to) && (W[t.to] = 1);
	}
}
function vt(e, t, n) {
	let r = L(e, n);
	for (let i = 0; i < n; i++) if (L(e, i) === r && !(t >> i & 1)) return !1;
	return !0;
}
function yt(e, t, n, r, i, a, o, s, c) {
	if (!Ee(e, c.move)) return;
	let l = a.length;
	Ct(e, n, r, i, a, o, s, c);
	for (let e = l; e < a.length; e++) a[e].via = t;
}
function bt(e, t, n) {
	for (let r = 0; r < 8; r++) {
		let i = U[t * 8 + r];
		if (i >= 0 && e[i] && w(e[i]) === n) return !0;
	}
	return !1;
}
var xt = [
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
], St = (e) => e === 0 ? [
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
function Ct(e, t, n, r, i, a, o, s = mt) {
	switch (e) {
		case "Freeze":
		case "IceWall": {
			let r = e === "Freeze" ? "freeze" : "ward", a = e === "Freeze";
			for (let e = 0; e < 64; e++) {
				let o = t[e];
				o && C(o) !== 6 && w(o) !== n === a && i.push({
					from: e,
					to: e,
					captures: [],
					power: r
				});
			}
			return;
		}
		case "Strike": {
			let e = q.strikeMode === "capture";
			for (let r = 0; r < 64; r++) {
				let a = t[r];
				if (a && w(a) === n && C(a) !== 6 && (C(a) !== 1 || q.strikePawns)) for (let [o, s] of k) for (let c = M(r, o, s); c >= 0; c = M(c, o, s)) {
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
					q.strikeCaptures && w(o) !== n && C(o) !== 6 && R(a, C(o)) && !(C(a) === 1 && B(t, c, n ^ 1)) && i.push(e ? {
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
				!r.selfRemove && (q.hasteCaptures || !r.captures.length) && !(q.hasteNoCheck && kt(Ot(t, r, n), n)) && i.push({
					...r,
					power: "haste"
				});
			}
			return;
		case "Flight": {
			let e = n === 0 ? 0 : 32, r = n === 0 ? 0 : 7;
			for (let a = 0; a < 64; a++) {
				let o = t[a];
				if (!o || w(o) !== n || C(o) === 6) continue;
				let s = C(o) === 1;
				for (let n = e; n < e + 32; n++) t[n] || s && E(n) === r || !P(o, n) || i.push({
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
			if (q.sacrificeBehind) {
				let e = 0, r = 0;
				for (let i = 0; i < 64; i++) {
					let a = t[i];
					a && C(a) !== 1 && C(a) !== 6 && (w(a) === n ? e++ : r++);
				}
				if (e >= r) return;
			}
			let e = [];
			for (let t = 1; t < 16; t++) Ge(t) && r[n * 16 + t] > 0 && e.push(t);
			if (!e.length) return;
			let a = S(1, n);
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
			for (let a = 1; a < 16; a++) if (Ge(a) && r[n * 16 + a] > 0) for (let n = e; n < e + 8; n++) t[n] || i.push({
				from: n,
				to: n,
				captures: [],
				drop: a,
				power: "salvation"
			});
			return;
		}
		case "March": {
			let e = N(n), r = n === 0 ? 1 : 6, a = n === 0 ? 7 : 0, o = S(1, n);
			for (let n = 0; n < 64; n++) {
				if (t[n] !== o || E(n) === r) continue;
				let s = M(n, 0, e), c = s < 0 ? -1 : M(s, 0, e);
				if (!(c < 0 || t[s] || t[c])) {
					if (E(c) === a) for (let e of ce[q.promotionSet]) i.push({
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
				if (!c || w(c) !== n) continue;
				let l = C(c), u = l === 4 ? ue : l === 3 ? de : l === 5 ? k : null;
				if (u) {
					r && _t(i, a, o, e);
					for (let [a, o] of u) {
						let l = !1;
						for (let u = M(e, a, o); u >= 0; u = M(u, a, o)) {
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
							if (r ? !l : w(a) === n && C(a) === 1) {
								l = !0;
								continue;
							}
							l && w(a) !== n && C(a) !== 6 && R(c, C(a)) && !(r && W[u]) && i.push({
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
				i && w(i) === n && (e |= 1 << C(i));
			}
			e &= -67;
			for (let r = 0; r < 64; r++) {
				let s = t[r];
				if (!s || w(s) !== n || C(s) === 6 || C(s) === 1) continue;
				let c = e & ~(1 << C(s));
				if (c) {
					_t(i, a, o, r);
					for (let e = 1; e < 16; e++) if (c >> e & 1) {
						gt.length = 0, $e(t, r, "all", gt, S(e, n));
						for (let e of gt) e.captures.length || e.swap || e.shove || e.selfRemove || W[e.to] || !P(s, e.to) || (W[e.to] = 1, i.push({
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
				if (!r || w(r) === n || C(r) === 6) continue;
				let a = C(r) === 1;
				for (let n = 0; n < 8; n++) {
					let o = U[e * 8 + n];
					o < 0 || t[o] || a && (E(o) === 0 || E(o) === 7) || !P(r, o) || i.push({
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
			if (e !== "Firewall" && (s.drawn >= q.piles[n].length || Oe(n, s.drawn) >= 8)) return;
			let r = z(t, n);
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
				if (r && w(r) === n && C(r) !== 6) for (let a = 0; a < 8; a++) {
					let o = U[e * 8 + a], s = o < 0 ? 0 : t[o];
					s && w(s) !== n && C(s) !== 6 && (C(r) !== 1 || E(o) !== 0 && E(o) !== 7) && (C(s) !== 1 || E(e) !== 0 && E(e) !== 7) && P(r, o) && P(s, e) && i.push({
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
				if (e === "EarthQuakeB" && !bt(t, a, n)) continue;
				let o = null;
				for (let e = 0; e < 8; e++) {
					let n = U[a * 8 + e], r = n < 0 ? 0 : t[n];
					if (!r || C(r) === 6) continue;
					let i = U[n * 8 + e];
					i < 0 || t[i] || C(r) === 1 && (E(i) === 0 || E(i) === 7) || !P(r, i) || (o ??= []).push({
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
			let r = e === "Burn" ? A : St(n), s = e === "Burn" ? "burn" : "firestarter";
			for (let e = 0; e < 64; e++) {
				let c = t[e];
				if (!c || w(c) !== n || C(c) === 6 || C(c) === 1) continue;
				let l = !1;
				for (let [u, d] of k) for (let f = M(e, u, d); f >= 0; f = M(f, u, d)) {
					let u = t[f];
					if (u) {
						w(u) !== n && C(u) !== 6 && r.includes(f) && R(c, C(u)) && (l ||= (_t(i, a, o, e), !0), W[f] || i.push({
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
				if (!r || w(r) !== n || C(r) === 6 || C(r) === 1) continue;
				let s = 0;
				for (let r = 0; r < 8; r++) {
					let i = U[e * 8 + r], a = i < 0 ? 0 : t[i];
					a && w(a) === n && (s |= 1 << C(a));
				}
				if (s &= ~(66 | 1 << C(r)), !s) continue;
				_t(i, a, o, e);
				let c = /* @__PURE__ */ new Set();
				for (let a = 1; a < 16; a++) if (s >> a & 1) {
					gt.length = 0, $e(t, e, "all", gt, S(a, n));
					for (let n of gt) {
						if (n.swap || n.shove || n.to !== e && !P(r, n.to) || n.captures.some((e) => C(t[e]) === 6 || !R(r, C(t[e]))) || n.to !== e && (!n.captures.length || n.captures.length === 1 && n.captures[0] === n.to) && W[n.to]) continue;
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
			let r = e === "Morph" ? "morph" : "morphb", a = t.includes(S(11, n)), o = !1;
			for (let e = 0; e < 64; e++) t[e] && w(t[e]) === n && C(t[e]) === 9 && (o = !0);
			for (let s = 0; s < 64; s++) {
				let c = t[s];
				if (c && w(c) === n && C(c) !== 6 && C(c) !== 1) for (let t of xt) t === C(c) || t === 11 && a || t === 9 && o || t === 5 && e === "MorphB" || !P(S(t, n), s) || i.push({
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
				let e = z(t, n);
				if (e < 0) return;
				for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r++) {
					let i = r || n ? M(e, r, n) : -1;
					i >= 0 && !t[i] && E(i) !== 0 && E(i) !== 7 && s.push(i);
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
				r && w(r) === n && C(r) === 1 && i.push({
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
				if (a && w(a) === n && C(a) !== 6 && C(a) !== 1) for (let o = e + 1; o < 64; o++) {
					let s = t[o];
					s && w(s) === n && C(s) !== 6 && C(s) !== 1 && C(s) !== C(a) && P(a, o) && P(s, e) && i.push({
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
function wt(e, t) {
	if (!e.pushes?.some((e) => e.from === t)) return e;
	let n = e.pushes.filter((e) => e.from !== t);
	return n.length ? {
		...e,
		pushes: n
	} : null;
}
function Tt(e, t, n, r, i = 0, a = !1, o = !1, s) {
	if (t === void 0 || t < 0) return;
	let c = Le(e, n, a);
	if (!c) return;
	let l = !s || s[t] !== 0 && w(s[t]) === e, u = i;
	for (let e = i; e < r.length; e++) {
		let n = r[e], i;
		c === "frozen" ? (i = n.from === t && n.power !== "ward" && n.power !== "freeze" && n.power !== "curse" && !He(n) && !n.drop && !n.pushes || n.swap === !0 && n.to === t && n.power !== "firewallb" || n.shove?.from === t || n.castle?.from === t, !i && l && n.pushes && (n = wt(n, t), i = !n)) : i = o ? n.captures.length > 0 || n.power === "curse" || n.power === "firewallb" : n.captures.includes(t) || n.power === "curse" && n.from === t || n.power === "firewallb" && n.to === t, i || (r[u++] = n);
	}
	r.length = u;
}
function Et(e, t, n, r, i) {
	if (t === void 0 || t < 0 || !I(e).length || Le(e ^ 1, e, n) !== "frozen") return;
	let a = !i || i[t] !== 0 && w(i[t]) !== e, o = 0;
	for (let e = 0; e < r.length; e++) {
		let n = r[e];
		n.power === "curse" && n.from === t || n.power === "firewallb" && n.to === t || a && n.pushes && !(n = wt(n, t)) || (r[o++] = n);
	}
	r.length = o;
}
function Dt(e, t, n, r, i = 0) {
	let a = r.length;
	if (i === 3) {
		let i = w(e[t]);
		for (let a = 0; a < 64; a++) a !== t && e[a] && w(e[a]) === i && et(e, a, n, r);
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
	et(e, t, n, r);
	let o = !i && (q.hasteSecond === "quiet" || !q.hasteCaptures), s = !i && (q.hasteApart || q.hasteNoThreat || q.hasteNoForward || q.hasteNoCheck), c = w(e[t]), l = a;
	for (let t = a; t < r.length; t++) {
		let n = r[t];
		(i !== 2 || n.captures.length) && (o ? n.captures.length === 0 : !n.captures.some((t) => C(e[t]) === 6)) && (!s || At(e, n, c)) && (r[l++] = n);
	}
	r.length = l, n === "all" && r.push({
		from: t,
		to: t,
		captures: [],
		pass: !0
	});
}
var Ot = (e, t, n) => it({
	board: e,
	turn: n,
	halfmove: 0,
	ply: 0
}, t).board;
function kt(e, t) {
	let n = z(e, t ^ 1);
	return n >= 0 && ut(e, n, t);
}
function At(e, t, n) {
	if (q.hasteNoForward && (E(t.to) - E(t.from)) * N(n) > 0) return !1;
	let r = Ot(e, t, n);
	if (q.hasteApart) for (let e = 0; e < 8; e++) {
		let i = U[t.to * 8 + e];
		if (i >= 0 && r[i] && w(r[i]) !== n) return !1;
	}
	if (q.hasteNoThreat) {
		let e = [];
		if (et(r, t.to, "captures", e), e.length) return !1;
	}
	return !q.hasteNoCheck || !kt(r, n);
}
function jt(e, t, n) {
	if (!t || !q.freezeQuiet || F(e) !== "Freeze") return;
	let r = 0;
	for (let e = 0; e < n.length; e++) n[e].captures.length || (n[r++] = n[e]);
	n.length = r;
}
function Mt(e, t, n) {
	if (q.guardReserve === "off") return;
	let r = S(9, t);
	if (q.guardReserve === "any") {
		for (let t = 0; t < 64; t++) !e[t] && P(r, t) && n.push({
			from: t,
			to: t,
			captures: [],
			drop: 9
		});
		return;
	}
	let i = q.guardReserve === "rank12" ? 2 : 1;
	for (let a = 0; a < i; a++) {
		let i = (t === 0 ? a : 7 - a) * 8;
		for (let t = i; t < i + 8; t++) !e[t] && P(r, t) && n.push({
			from: t,
			to: t,
			captures: [],
			drop: 9
		});
	}
}
var Nt = [
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
	return Nt.forEach((t, n) => {
		e[t.king] |= 1 << n, e[t.rook] |= 1 << n;
	}), e;
})();
function Pt(e) {
	let t = 0;
	return Nt.forEach((n, r) => {
		let i = r >> 1;
		e[n.king] === S(6, i) && e[n.rook] === S(4, i) && (t |= 1 << r);
	}), t;
}
function Ft(e, t) {
	if (!e || He(t)) return e;
	let n = t.pushes || t.to === t.from && !t.swap && t.promo === void 0 ? 0 : G[t.from] | G[t.to];
	for (let e = 0; e < t.captures.length; e++) n |= G[t.captures[e]];
	if (t.shove && (n |= G[t.shove.from] | G[t.shove.to]), t.pushes) for (let e of t.pushes) n |= G[e.from] | G[e.to];
	return t.drop2 !== void 0 && (n |= G[t.drop2]), e & ~n;
}
function It(e, t, n) {
	if (t.power || t.drop || Math.abs(t.to - t.from) !== 16 || e[t.to] !== S(1, n) || E(t.from) !== (n === 0 ? 1 : 6) || F(n) === "Darkness" || F(n ^ 1) === "Darkness") return -1;
	let r = S(1, n ^ 1), i = T(t.to);
	return i > 0 && e[t.to - 1] === r || i < 7 && e[t.to + 1] === r ? t.from + t.to >> 1 : -1;
}
function Lt(e, t, n, r, i, a) {
	if (i === "attacks") return;
	let o = a.length;
	if (r >= 0 && F(t) !== "Darkness") {
		let n = r - 8 * N(t), i = S(1, t), s = T(n);
		!e[r] && e[n] === S(1, t ^ 1) && !B(e, n, t ^ 1) && (s > 0 && e[n - 1] === i && R(i, 1) && a.push({
			from: n - 1,
			to: r,
			captures: [n]
		}), s < 7 && e[n + 1] === i && R(i, 1) && a.push({
			from: n + 1,
			to: r,
			captures: [n]
		})), qe() && Ye(e, a, o);
	}
	if (i !== "all" || !(n & (t === 0 ? 3 : 12))) return;
	let s = t ^ 1;
	for (let r = t * 2; r < t * 2 + 2; r++) {
		let i = Nt[r];
		n & 1 << r && e[i.king] === S(6, t) && e[i.rook] === S(4, t) && !i.empty.some((t) => e[t]) && (ut(e, i.king, s) || ut(e, i.rookTo, s) || a.push({
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
function Rt(e, t) {
	let n = z(e, t);
	return {
		from: n,
		to: n,
		captures: [],
		pass: !0
	};
}
function zt(e, t = "all") {
	let n = [], r = e.turn;
	if (e.haste !== void 0) Dt(e.board, e.haste, t, n, e.rage);
	else {
		for (let i = 0; i < 64; i++) e.board[i] && w(e.board[i]) === r && et(e.board, i, t, n);
		q.classicChess && Lt(e.board, r, e.castle ?? 0, e.ep ?? -1, t, n), t === "all" && e.waiting?.[r] && Mt(e.board, r, n), e.free ? (jt(r, !0, n), t === "all" && n.push(Rt(e.board, r))) : t === "all" && ht(e.board, r, e.used?.[r] ?? 0, e.lost, n, 0, n.length, pt(e, r));
	}
	let i = e.marks?.[r ^ 1], a = e.marks?.[r];
	return i && i.left !== 0 && Tt(r, i.sq, r ^ 1, n, 0, i.ward, i.all, e.board), a && a.left !== 0 && Et(r, a.sq, a.ward, n, e.board), n;
}
function Bt(e, t = "all") {
	let n = q.secondPlayerDoubleFirstTurn && e.ply === 1;
	return zt(e, t).filter((t) => {
		let r = it(e, t);
		return !ft(r, e.turn) && (!n || !ft(r, e.turn ^ 1));
	});
}
function Vt(e) {
	let t = [0, 0];
	for (let n = 0; n < 64; n++) {
		let r = e[n];
		if (!r) continue;
		let i = C(r);
		if (i === 1 || i === 4 || i === 5 || i === 7 || i === 10 || i === 11 || i === 13 || i === 15 || i === 12 && !q.ogreNoCapture || i === 9 && q.guardCaptures === "any" || i === 8 && q.paladinChecks) return !1;
		(i === 2 || i === 3 || i === 14) && t[w(r)]++;
	}
	return t[0] <= 1 && t[1] <= 1;
}
function Ht(e, t, n, r, i, a) {
	return !q.insufficientMaterial || !Vt(e) || q.guardCaptures === "any" && r && (r[0] > 0 || r[1] > 0) ? !1 : !Ut(e, 0, t?.[0] ?? 0, i?.[0] ?? 0, n, a?.[1]) && !Ut(e, 1, t?.[1] ?? 0, i?.[1] ?? 0, n, a?.[0]);
}
function Ut(e, t, n, r, i, a) {
	if (!I(t).length) return F(t) === "Strike" && Pe(t, n);
	if (Gt(t, n, r, a, "Strike")) return !0;
	if (i && Gt(t, n, r, a, "Salvation")) {
		for (let e = 1; e < 16; e++) if (Ge(e) && i[t * 16 + e] > 0) return !0;
	}
	if (Gt(t, n, r, a, "Morph") || Gt(t, n, r, a, "MorphB")) {
		for (let n = 0; n < 64; n++) if (e[n] && w(e[n]) === t && C(e[n]) !== 6) return !0;
	}
	for (let e of Wt) if (Gt(t, n, r, a, e)) return !0;
	return !1;
}
var Wt = [
	"Spawn",
	"SpawnK",
	"Spawn2",
	"SpawnK2"
];
function Gt(e, t, n, r, i) {
	return Me(e, t, i, n) || r === i && Me(e, t, "Mirror", n) || (Me(e, t, "Growth", n) || Me(e, t, "GrowthB", n)) && q.piles[e].indexOf(i, n) >= 0;
}
function Kt(e) {
	return z(e.board, e.turn) < 0 ? "checkmate" : Bt(e).length === 0 ? ft(e) ? "checkmate" : "stalemate" : q.fiftyMove && e.halfmove >= 100 ? "draw50" : Ht(e.board, e.used, e.lost, e.waiting, e.drawn, e.last) ? "drawMaterial" : "playing";
}
//#endregion
//#region src/rules/design.ts
var qt = {
	n: [0, 1],
	ne: [1, 1],
	e: [1, 0],
	se: [1, -1],
	s: [0, -1],
	sw: [-1, -1],
	w: [-1, 0],
	nw: [-1, 1]
}, Jt = (e, t) => ({
	move: 1,
	captured: !!(e[t] & 32),
	card: !1
}), K = (e, t, n) => {
	let r = T(e) + t, i = E(e) + n;
	return r < 0 || r > 7 || i < 0 || i > 7 ? -1 : D(r, i);
}, Yt = [
	[0, 1],
	[1, 1],
	[1, 0],
	[1, -1],
	[0, -1],
	[-1, -1],
	[-1, 0],
	[-1, 1]
];
function Xt(e, t, n, r = Jt(t, n)) {
	let i = w(t[n]), a = i === 1 ? 7 - E(n) : E(n);
	switch (e.on) {
		case "zone": return e.zone === "startRank" ? a === 1 : e.zone === "ownHalf" ? a <= 3 : e.zone === "enemyHalf" ? a >= 4 : e.zone === "lastRank" ? a === 7 : A.includes(n);
		case "near": return Yt.some(([r, a]) => {
			let o = K(n, r, a), s = o >= 0 ? t[o] : 0;
			return s ? e.who === "enemy" ? w(s) !== i : w(s) === i && (e.who === "friend" || C(s) === (e.who === "king" ? 6 : " PNBRQKALGMSOCVT".indexOf(e.who))) : !1;
		});
		case "fromMove": return r.move >= e.n;
		case "beforeMove": return r.move < e.n;
		case "afterFirstCapture": return r.captured;
		case "afterCard": return r.card;
		default: return !0;
	}
}
var Zt = {
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
function Qt(e, t, n, r) {
	let i = e.like && e.rules.some((e) => e.does.a === "movesLike" && Xt(e.when, t, n, r)), a = /* @__PURE__ */ new Map(), o = new Set(e.lines);
	for (let t of i ? [e, e.like] : [e]) {
		for (let e of t.squares) {
			let t = `${e.x},${e.y}`, n = a.get(t) ?? {
				x: e.x,
				y: e.y,
				m: !1,
				t: !1,
				s: !1
			}, r = Zt[e.mark];
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
function $t(e, t, n) {
	let r = e.rules.find((e) => e.does.a === "cannotBeTaken");
	return r?.does.a === "cannotBeTaken" && r.when.on !== "always" && Xt(r.when, t, n) ? r.does.by === "pawns" ? 1 : 4 : 0;
}
function en(e, t, n, r, i, a, o = Jt(e, t)) {
	let s = w(e[t]), c = s === 1 ? -1 : 1, l = e[t] & -16 | 15, u = n === "all", d = (n) => i.rules.find((r) => r.does.a === n && Xt(r.when, e, t, o))?.does, f = d("linesPass"), p = d("cannotTake"), m = n !== "attacks" && d("chain"), h = d("removedAfter"), g = i.rules.find((e) => e.does.a === "becomes"), { can: ee, lines: _ } = Qt(i, e, t, o), v = (e) => p?.a === "cannotTake" && (p.what === "any" || p.what === "king" && e === 6 || p.what === "pawns" && e === 1) ? "cannotTake" : R(l, e) ? null : "guardImmune", y = (e, t, n = []) => {
		if (t < 0 || !e[t] || w(e[t]) === s) return !1;
		let r = v(C(e[t]));
		return r && a?.push({
			sq: t,
			why: r,
			caps: n
		}), !r;
	}, te = r.length, ne = (t) => h?.a === "removedAfter" && t.some((t) => h.what === "any" || C(e[t]) !== 1), re = (e, t, n, r) => {
		for (let i of ee.values()) if (i.t) {
			let a = K(t, i.x, i.y * c);
			y(e, a, n) && r(a);
		}
		for (let i of _) {
			let [a, o] = qt[i];
			for (let i = K(t, a, o * c); i >= 0; i = K(i, a, o * c)) {
				let t = e[i];
				if (t) {
					if (w(t) === s) {
						if (f) continue;
						break;
					}
					if (y(e, i, n) && r(i), f?.a !== "linesPass" || f.over !== "any") break;
				}
			}
		}
	}, x = (e) => {
		e.captures.length && ne(e.captures) && (e.selfRemove = !0), r.push(e);
	}, ie = (e, n) => {
		let r = n[n.length - 1];
		if (!m || C(e[r]) === 6 || ne(n)) return;
		let i = new Uint8Array(e);
		i[r] = 0, i[t] = 0;
		let o = /* @__PURE__ */ new Set();
		re(i, r, n, (e) => {
			if (C(i[e]) === 6) {
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
			x({
				from: t,
				to: e,
				captures: r
			}), ie(i, r);
		});
	};
	for (let n of ee.values()) {
		let r = K(t, n.x, n.y * c);
		r < 0 || (e[r] ? n.s && y(e, r) && x({
			from: t,
			to: t,
			captures: [r]
		}) : n.m && u && x({
			from: t,
			to: r,
			captures: []
		}));
	}
	if (u) for (let n of _) {
		let [r, i] = qt[n];
		for (let n = K(t, r, i * c); n >= 0; n = K(n, r, i * c)) if (!e[n]) x({
			from: t,
			to: n,
			captures: []
		});
		else {
			if (w(e[n]) === s) {
				if (f) continue;
				break;
			}
			if (f?.a === "linesPass" && f.over === "any") continue;
			break;
		}
	}
	let ae = /* @__PURE__ */ new Set();
	if (re(e, t, [], (n) => {
		ae.has(n) || (ae.add(n), x({
			from: t,
			to: n,
			captures: [n]
		}), ie(e, [n]));
	}), u && d("step2")) {
		let n = K(t, 0, c), i = K(t, 0, 2 * c);
		n >= 0 && i >= 0 && !e[n] && !e[i] && !r.some((e, t) => t >= te && e.to === i && !e.captures.length) && x({
			from: t,
			to: i,
			captures: []
		});
	}
	let oe = d("swap"), se = d("push");
	if (u) for (let [n, i] of Yt) {
		let o = K(t, n, i * c), l = o >= 0 ? e[o] : 0;
		if (!l) continue;
		let u = C(l) === 6, d = K(o, n, i * c);
		oe?.a === "swap" && w(l) === s == (oe.with === "friend") && (u ? a?.push({
			sq: o,
			why: "swap",
			caps: []
		}) : P(l, t) && r.push({
			from: t,
			to: o,
			captures: [],
			swap: !0
		})), se?.a === "push" && d >= 0 && !e[d] && (u ? a?.push({
			sq: o,
			why: "push",
			caps: []
		}) : r.push({
			from: t,
			to: se.then === "follow" ? o : t,
			captures: [],
			shove: {
				from: o,
				to: d
			}
		}));
	}
	if (g?.does.a !== "becomes") return;
	let ce = (g.does.into === "choice" ? [
		"Q",
		"R",
		"B",
		"N"
	] : [g.does.into]).map((e) => b.indexOf(e)), S = s === 1 ? 0 : 7, T = r.splice(te);
	for (let e of T) if (!e.selfRemove && !e.swap && (g.when.on === "firstTake" ? e.captures.length > 0 && !o.captured : E(e.to) === S && e.to !== t)) for (let t of ce) r.push({
		...e,
		promo: t
	});
	else r.push(e);
}
//#endregion
//#region src/workshop/model.ts
var tn = Object.keys(ee), nn = [
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w",
	"nw"
], rn = [
	"n",
	"e",
	"s",
	"w"
], an = [
	"ne",
	"se",
	"sw",
	"nw"
], on = "3 of 3 rules. Remove one to add another.";
function sn(e, t, n) {
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
var cn = (e, t, n = "all") => e.flatMap(([e, t]) => sn(e, t, n)).map(([e, n]) => ({
	x: e,
	y: n,
	mark: t
})), ln = (e) => cn([[0, 1], [1, 1]], e), un = () => cn([[1, 2]], "both");
[...cn([[1, 1]], "take", "lr")], un(), [...an], [...rn], [...nn], [
	...cn([[0, 1]], "move"),
	...cn([[1, 1]], "move"),
	...cn([
		[0, 2],
		[2, 0],
		[0, -2],
		[2, 2]
	], "shoot", "lr")
], [...nn], ln("move"), ln("both"), ln("both"), ln("both");
var dn = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
m.map((e) => e.a);
function fn(e) {
	if (e.rules.length > 3) return on;
	if (new Set(e.rules.map((e) => e.does.a)).size < e.rules.length) return "Already in this piece.";
	for (let t of e.rules) if (!re(t)) return "That choice does not fit this rule.";
	return e.rules.some((e) => e.does.a === "cannotBeTaken" && e.does.by === "allButKing") && c(e) ? "Only a king can take this piece, so it cannot take. Remove that rule first." : null;
}
var pn = (e) => !e.squares.length && !e.lines.length && !e.rules.some((e) => e.does.a === "movesLike" || e.does.a === "step2"), mn = (e) => new TextDecoder().decode(Uint8Array.from(atob(e.replace(/-/g, "+").replace(/_/g, "/")), (e) => e.charCodeAt(0))), hn = /^[\p{L}\p{N} '()-]{1,18}$/u, gn = [
	"Frost",
	"Flame",
	"Stratus",
	"Mud",
	"Spirit",
	"Shadow"
], _n = (e) => Number.isInteger(e) && Math.abs(e) <= 3, vn = (e) => hn.test(e) && e.trim() === e;
function yn(e) {
	let { squares: t, lines: n, rules: i, look: a, letter: o } = e;
	if (typeof o != "string" || o.length !== 1 || !"DFHIJUWXYZ".includes(o) || !(y(a, [
		"body",
		"auto",
		"glow",
		"army"
	]) || y(a, [
		"body",
		"auto",
		"glow",
		"army",
		"figure"
	])) || !tn.concat("token").includes(a.body) || a.figure !== void 0 && (typeof a.figure != "string" || !r(a.figure)) || typeof a.auto != "boolean" || !(a.glow === null || gn.includes(a.glow)) || a.army !== 0 && a.army !== 1 || !Array.isArray(t) || t.length > 48 || !Array.isArray(n) || !Array.isArray(i) || i.length > 3) return !1;
	let s = [
		"both",
		"move",
		"take",
		"shoot",
		"moveShoot"
	];
	return !t.every((e) => y(e, [
		"x",
		"y",
		"mark"
	]) && _n(e.x) && _n(e.y) && (e.x || e.y) && s.includes(e.mark)) || new Set(t.map((e) => `${e.x},${e.y}`)).size !== t.length || !n.every((e) => nn.includes(e)) || new Set(n).size !== n.length ? !1 : i.every((e) => re(e));
}
function bn(e) {
	if (e.length > 4e3 || !/^[\w-]+$/.test(e)) return null;
	let t;
	try {
		t = JSON.parse(mn(e));
	} catch {
		return null;
	}
	if (!y(t, [
		"kind",
		"squares",
		"lines",
		"rules",
		"name",
		"look",
		"letter"
	]) || t.kind !== "piece" || typeof t.name != "string" || !vn(t.name) || !yn(t)) return null;
	let n = {
		v: 1,
		kind: "piece",
		id: dn(),
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
	return fn(n) || pn(n) ? null : n;
}
//#endregion
//#region src/rules/rules.ts
var xn = /* @__PURE__ */ "Mimic.Vault.Curse.SkyLift.Salvation.Rage.RageB.Mirror.MirrorB.Firewall.FirewallB.EarthQuake.EarthQuakeB.Burn.FireStarter.Control.Rescue.Growth.GrowthB.Rally.Morph.MorphB.Spawn.SpawnK.Spawn2.SpawnK2.MorphP.MorphS".split("."), Sn = Object.freeze({
	Frost: ["Freeze", "IceWall"],
	Flame: ["Strike", "Haste"],
	Stratus: ["Flight", "Sacrifice"],
	Mud: ["March", "Leap"],
	Spirit: ["HolyLight", "Mercy"],
	Shadow: ["DeathTouch", "Darkness"]
}), Cn = Object.freeze({
	Freeze: "freezeUses",
	IceWall: "iceWallUses",
	Strike: "strikeUses",
	Haste: "hasteUses",
	Flight: "flightUses",
	Sacrifice: "sacrificeUses",
	March: "marchUses",
	Leap: "leapUses"
}), wn = [...Object.keys(Cn), ...xn];
function Tn(e) {
	let t = e.trim();
	if (!t || t === "none" || t === "-") return null;
	let [n = "", r = ""] = t.split(":"), i = Object.keys(Sn).find((e) => e.toLowerCase() === n.toLowerCase());
	if (!i) throw Error(`unknown king "${n}" (${Object.keys(Sn).join(" | ")} | none)`);
	let a = Sn[i].find((e) => e.toLowerCase() === r.toLowerCase());
	if (!a) throw Error(`king ${i} has no power "${r}" (${Sn[i].join(" | ")})`);
	return {
		king: i,
		power: a
	};
}
function En(e) {
	let t = e.split(","), n = Tn(t[0] ?? "");
	return [n, t.length > 1 ? Tn(t[1]) : n];
}
var Dn = Object.freeze({
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
}), q = { ...Dn }, On = Object.freeze({
	...Dn,
	archerMove: "ortho",
	archerShots: "classic",
	beastCaptureForward: !1,
	beastMove: "forward",
	paladinKamikaze: "always",
	guardNextToKing: !1,
	promotionSet: "anyNonKing"
}), kn = Object.freeze({
	...On,
	archerMove: "fwdBack",
	archerShots: "forward3",
	beastMove: "diagFwdBack",
	beastCapture: "diagForward"
}), An = Object.freeze({
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
}), jn = [
	"fromMove",
	"beforeMove",
	"afterCard"
], Mn = ["", null];
function Nn() {
	let e = q.design?.code ?? "";
	return Mn[0] !== e && (Mn = [e, e ? bn(e) : null]), Mn[1];
}
function Pn(e) {
	Object.assign(q, Dn, e);
	for (let e of [0, 1]) {
		let t = q.kings[e]?.power, n = t && Cn[t], r = !!n && (t !== "March" && t !== "Leap" || q[n] !== 0);
		if (q.hands[e].length && r) throw Error(`side ${e} has a hand and the king power ${t}: card mode plays kings without spendable powers`);
		if (t && t in q.fromMove && !r) throw Error(`fromMove: ${t} is always on for side ${e}; only a spendable power or a card can wait for a move`);
	}
	for (let e of Object.keys(q.fromMove)) if (!wn.includes(e)) throw Error(`fromMove: ${e} is always on; only a spendable power or a card can wait for a move`);
	let t = q.design && fn(q.design), n = q.design?.rules.find((e) => jn.includes(e.when.on));
	if (t) throw Error(`design: ${t}`);
	if (n) throw Error(`design: the When "${n.when.on}" needs the game's history, which version 1 does not keep`);
	return q;
}
//#endregion
//#region src/rules/setup.ts
var Fn = "QOLRRBBNNAAGMMS";
function In(e, t) {
	for (let n = e.length - 1; n > 0; n--) {
		let r = Math.floor(t() * (n + 1));
		[e[n], e[r]] = [e[r], e[n]];
	}
	return e;
}
function Ln(e = Math.random, t = Fn, n = q) {
	for (;;) {
		let r = In([...In(t.split(""), e).slice(0, 7), "K"], e), i = r.indexOf("K"), a = r.indexOf("G");
		if (n.guardNextToKing && a >= 0 && Math.abs(a - i) !== 1) {
			let t = [i - 1, i + 1].filter((e) => e >= 0 && e < 8), n = t[t.length > 1 ? Math.floor(e() * 2) : 0];
			[r[a], r[n]] = [r[n], r[a]];
		}
		let o = r.flatMap((e, t) => e === "B" ? [t] : []);
		if (!(n.bishopsOppositeColours && o.length === 2 && (o[0] + o[1]) % 2 == 0)) return r.join("");
	}
}
function Rn(e) {
	if (q.guardReserve === "off") return e;
	let t = new Uint8Array(e.board), n = [e.waiting?.[0] ?? 0, e.waiting?.[1] ?? 0];
	for (let e = 0; e < 8; e++) for (let r of [0, 1]) {
		let i = D(e, r === 0 ? 0 : 7);
		t[i] && C(t[i]) === 9 && w(t[i]) === r && (t[i] = 0, n[r]++);
	}
	return n[0] || n[1] ? {
		...e,
		board: t,
		waiting: n
	} : e;
}
function zn(e = Ln()) {
	if (!/^[A-Z]{8}$/.test(e) || e.split("K").length !== 2) throw Error(`bad back rank ${e}`);
	let t = /* @__PURE__ */ new Uint8Array(64);
	for (let n = 0; n < 8; n++) {
		let r = b.indexOf(e[n]);
		if (r <= 0) throw Error(`bad piece letter ${e[n]}`);
		t[D(n, 0)] = S(r, 0), t[D(n, 7)] = S(r, 1), t[D(n, 1)] = S(1, 0), t[D(n, 6)] = S(1, 1);
	}
	let n = {
		board: t,
		turn: 0,
		halfmove: 0,
		ply: 0,
		move: 1
	};
	return q.classicChess && Pt(t) && (n.castle = Pt(t)), Rn(n);
}
function Bn(e) {
	let t = [];
	for (let n = 7; n >= 0; n--) {
		let r = "", i = 0;
		for (let t = 0; t < 8; t++) {
			let a = e.board[D(t, n)];
			if (!a) {
				i++;
				continue;
			}
			i &&= (r += i, 0);
			let o = a & 32 ? C(a) === 15 ? "U" : "H" : b[C(a)];
			r += w(a) === 0 ? o : o.toLowerCase();
		}
		i && (r += i), t.push(r);
	}
	let n = Vn(e), r = "KQkq".split("").filter((t, n) => (e.castle ?? 0) & 1 << n).join("") || "-";
	return `${t.join("/")} ${e.turn === 0 ? "w" : "b"} ${r} ${e.ep === void 0 ? "-" : O(e.ep)} ${e.halfmove} ${Te(e)}${n ? " " + n : ""}`;
}
function Vn(e) {
	let t = [];
	if (e.used && (e.used[0] || e.used[1]) && t.push(`u${e.used[0]}.${e.used[1]}`), e.marks?.forEach((e, n) => {
		e && t.push(`m${O(e.sq)}${n === 1 ? "b" : "w"}${e.all ? "a" : e.ward ? "i" : ""}${(e.left ?? 1) === 1 ? "" : e.left}`);
	}), e.free && t.push("f"), e.haste !== void 0 && t.push(`h${O(e.haste)}${e.rage ? " rto"[e.rage] : ""}`), e.lost) {
		let n = "";
		for (let t = 0; t < 2; t++) for (let r = 1; r < 16; r++) {
			let i = t === 0 ? b[r] : b[r].toLowerCase();
			n += i.repeat(Math.max(0, e.lost[t * 16 + r] ?? 0));
		}
		t.push(`l${n}`);
	}
	return e.waiting && (e.waiting[0] || e.waiting[1]) && t.push(`g${e.waiting[0]}.${e.waiting[1]}`), e.last && (e.last[0] || e.last[1]) && t.push(`y${e.last[0] ?? ""}.${e.last[1] ?? ""}`), e.drawn && (e.drawn[0] || e.drawn[1]) && t.push(`d${e.drawn[0]}.${e.drawn[1]}`), t.join("/");
}
function Hn(e, t) {
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
					sq: le(i.slice(0, 2)),
					...a ? { left: +a } : {},
					...r ? { ward: !0 } : {},
					...n ? { all: !0 } : {}
				}, t.marks = o;
			} else if (r === "f") t.free = !0;
			else if (r === "h") {
				t.haste = le(i);
				let e = "rto".indexOf(i[2]);
				i[2] && e >= 0 && (t.rage = e + 1);
			} else if (r === "y") {
				let n = (t) => {
					if (t) {
						if (!wn.includes(t)) throw Error(`bad card ${t} in ${e}`);
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
function Un(e, t, n) {
	if (!/^(-|K?Q?k?q?)$/.test(e)) throw Error(`bad castling field ${e}`);
	let r = 0;
	for (let t of e) t !== "-" && (r |= 1 << "KQkq".indexOf(t));
	if (r &= Pt(n.board), r && (n.castle = r), t === "-") return;
	if (!/^[a-h][36]$/.test(t)) throw Error(`bad en-passant field ${t}`);
	let i = le(t), a = n.turn ^ 1, o = a === 0 ? 8 : -8;
	It(n.board, {
		from: i - o,
		to: i + o,
		captures: []
	}, a) >= 0 && !n.board[i] && !n.board[i - o] && (n.ep = i);
}
function Wn(e) {
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
			c[D(r++, 7 - n)] = S(o, i === t ? 0 : 1) | a;
		}
	});
	let u = n === "w" ? 0 : 1, d = {
		board: c,
		turn: u,
		halfmove: +a,
		ply: (o - 1) * 2 + u,
		move: +o
	};
	return Hn(s, d), q.classicChess && Un(r, i, d), d;
}
function Gn(e, t) {
	let n = qn(e, t);
	return t.via === "mirror" ? n + "!Y" : t.via === "mirrorb" ? n + "!Z" : n;
}
var Kn = {
	salvation: "!R",
	spawn: "!S",
	spawnk: "!SK",
	spawn2: "!S2",
	spawnk2: "!SK2"
};
function qn(e, t) {
	let n = C(e.board[t.from]), r = n === 1 ? "" : b[n];
	if (t.pass) return "--";
	if (t.castle) return t.castle.from > t.from ? "O-O" : "O-O-O";
	if (t.drop) return `${b[t.drop]}@${O(t.to)}${t.drop2 === void 0 ? "" : "," + O(t.drop2)}${Kn[t.power ?? ""] ?? ""}`;
	if (t.power === "freeze") return `!F:${O(t.to)}`;
	if (t.power === "ward") return `!W:${O(t.to)}`;
	if (t.power === "sacrifice") return `!S:${O(t.from)}=${b[t.promo ?? 0]}`;
	if (t.power === "morph" || t.power === "morphb") return `!I${t.power === "morphb" ? "+" : ""}:${O(t.from)}=${b[t.promo ?? 0]}`;
	if (t.power === "morphp") return `!IP:${O(t.from)}=${b[t.promo ?? 0]}`;
	if (t.power === "morphs") return `!IS:${O(t.from)}<>${O(t.to)}`;
	if (t.power === "flight") return `${r}${O(t.from)}~${O(t.to)}`;
	if (t.power === "curse") return `!C:${O(t.from)}-${O(t.to)}`;
	if (t.power === "skylift") return `!K:${O(t.from)}<>${O(t.to)}`;
	if (t.power === "firewall") return "!P";
	if (t.power === "firewallb") return `!E:${O(t.from)}<>${O(t.to)}`;
	if (t.power === "quake" || t.power === "quakeb") return `${t.power === "quake" ? "!Q" : "!U"}:${O(t.from)}`;
	if (t.power === "rescue") return `!D:${O(t.from)}`;
	if (t.power === "growth") return "!G";
	if (t.power === "growthb") return "!G+";
	let i;
	return i = t.shove ? `${r}${O(t.from)}>${O(t.shove.from)}-${O(t.shove.to)}` : t.swap ? `${r}${O(t.from)}<>${O(t.to)}` : (n === 14 || t.power === "control") && t.captures.length === 1 && t.to !== t.captures[0] && (n === 14 || t.to !== t.from) ? `${r}${O(t.from)}x${O(t.captures[0])}-${O(t.to)}` : t.to === t.from ? `${r}${O(t.from)}*${O(t.captures[0])}` : t.captures.length > 1 ? `${r}${O(t.from)}${t.captures.map((e) => "x" + O(e)).join("")}` : `${r}${O(t.from)}${t.captures.length ? "x" : "-"}${O(t.to)}`, t.promo && (i += "=" + b[t.promo]), t.power === "strike" ? i += "!" : t.power === "haste" ? i += "!H" : t.power === "march" ? i += "!M" : t.power === "leap" ? i += "!L" : t.power === "mimic" ? i += "!X" : t.power === "vault" ? i += "!V" : t.power === "rage" ? i += "!A" : t.power === "rageb" ? i += "!B" : t.power === "rally" ? i += "!J" : t.power === "burn" ? i += "!N" : t.power === "firestarter" ? i += "!T" : t.power === "control" && (i += "!O"), i;
}
//#endregion
//#region src/rules/position-key.ts
var J = 2654435769, Jn = () => (J ^= J << 13, J ^= J >>> 17, J ^= J << 5, J >>> 0), Yn = 1779033703, Xn = () => {
	Jn();
	let e = Yn = Yn + 1831565813 | 0;
	return e = Math.imul(e ^ e >>> 15, 1 | e), e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, (e ^ e >>> 14) >>> 0 & 1048575;
}, Zn = 16, Qn = /* @__PURE__ */ new Int32Array(4096), $n = /* @__PURE__ */ new Int32Array(4096), er = (e, t, n) => {
	let r = (e * 2 + t) * Zn + n << 6;
	for (let e = r; e < r + 64; e++) Qn[e] = Jn() | 0, $n[e] = Xn();
};
for (let e = 0; e < 2; e++) for (let t = 0; t < 12; t++) er(0, e, t);
var tr = Jn() | 0, nr = Xn();
for (let e = 0; e < 2; e++) for (let t = 0; t < 12; t++) er(1, e, t);
for (let e = 0; e < 2; e++) for (let t = 0; t < 2; t++) for (let n = 12; n < Zn; n++) er(e, t, n);
var rr = (e, t) => ((e & 32 ? 2 : 0) + w(e)) * Zn + C(e) << 6 | t, ir = (e, t) => t * 4294967296 + (e >>> 0);
function ar(e, t, n) {
	let r = 0, i = 0;
	for (let t = 0; t < 64; t++) {
		let n = e[t];
		if (!n) continue;
		let a = rr(n, t);
		r ^= Qn[a], i ^= $n[a];
	}
	t && (r ^= tr, i ^= nr), n[0] = r, n[1] = i;
}
var Y = (e) => {
	let t = new Int32Array(e), n = new Int32Array(e);
	for (let r = 0; r < e; r++) t[r] = Jn() | 0, n[r] = Xn();
	return [t, n];
}, [or, sr] = Y(128), [cr, lr] = Y(64), [ur, dr] = Y(16), [fr, pr] = Y(128), [mr, hr] = Y(4), [gr, _r] = Y(1), [vr, yr] = Y(2), [br, xr] = Y(4), [Sr, Cr] = Y(8), wr = (e, t) => e * 4 + Math.min(t, 3), Tr = (e, t) => e * 8 + Math.min(t, 7), Er = (e, t) => e * 4 + Math.min(t, 3), [Dr, Or] = Y(2), [kr, Ar] = Y(2), [jr, Mr] = Y(64), [Nr, Pr] = Y(16), Fr = (e, t) => e * 8 + Math.min(t, 7), [Ir, Lr] = Y(1), Rr = Int32Array.of(...kr, ...Ir), zr = Int32Array.of(...Ar, ...Lr), [Br, Vr] = Y(64), Hr = Int32Array.of(...jr, ...Br), Ur = Int32Array.of(...Mr, ...Vr), Wr = (e, t) => t < 32 ? e * 32 + t : 64 + e * 32 + (t - 32), [Gr, Kr] = Y(4), [qr, Jr] = Y(8), Yr = /* @__PURE__ */ new Int32Array(2);
function Xr(e, t = Yr) {
	ar(e.board, e.turn, t);
	let n = t[0], r = t[1];
	for (let t = 0; t < 2; t++) {
		let i = e.used?.[t] ?? 0;
		if (I(t).length) for (let e = 0; e < 8; e++) i >> e & 1 && (n ^= ur[t * 8 + e], r ^= dr[t * 8 + e]);
		else if (i > 0 && De(t) > 0) {
			let e = Tr(t, i);
			n ^= ur[e], r ^= dr[e];
		}
		if (e.lost && Re(t)) for (let i = 1; i < 16; i++) {
			let a = e.lost[t * 16 + i];
			if (a > 0) {
				let e = Er(t * 16 + i, a);
				n ^= fr[e], r ^= pr[e];
			}
		}
		let a = e.waiting?.[t] ?? 0;
		if (a > 0) {
			let e = wr(t, a);
			n ^= Sr[e], r ^= Cr[e];
		}
		let o = e.last?.[t];
		if (o && ze()) {
			let e = Wr(t, wn.indexOf(o));
			n ^= Hr[e], r ^= Ur[e];
		}
		let s = e.drawn?.[t] ?? 0;
		if (s > 0) {
			let e = Fr(t, s);
			n ^= Nr[e], r ^= Pr[e];
		}
	}
	for (let t = 0; t < 2; t++) {
		let i = e.marks?.[t];
		if (!i) continue;
		let a = t * 64 + i.sq, o = i.left ?? 1;
		n ^= or[a], r ^= sr[a], o !== 1 && (n ^= t ? br[o] : mr[o], r ^= t ? xr[o] : hr[o]), i.ward && (n ^= vr[t], r ^= yr[t]), i.all && (n ^= Dr[t], r ^= Or[t]);
	}
	e.free && (n ^= gr[0], r ^= _r[0]), e.haste !== void 0 && (n ^= cr[e.haste], r ^= lr[e.haste]), e.rage && (n ^= Rr[e.rage - 1], r ^= zr[e.rage - 1]);
	for (let t = 0; t < 4; t++) (e.castle ?? 0) & 1 << t && (n ^= Gr[t], r ^= Kr[t]);
	return e.ep !== void 0 && (n ^= qr[e.ep & 7], r ^= Jr[e.ep & 7]), t[0] = n, t[1] = r, ir(n, r);
}
//#endregion
//#region src/game-rules.ts
function Zr(e) {
	if (e && typeof e == "object") {
		for (let t of Object.values(e)) Zr(t);
		Object.freeze(e);
	}
	return e;
}
var Qr = class {
	rules;
	constructor(e = Dn) {
		let t = { ...q };
		try {
			this.rules = Zr(structuredClone(Pn(structuredClone(e))));
		} finally {
			Object.assign(q, t);
		}
		Object.freeze(this);
	}
	#e(e) {
		let t = { ...q };
		try {
			return Object.assign(q, this.rules), e();
		} finally {
			Object.assign(q, t);
		}
	}
	startPosition(e) {
		let t = e ?? this.randomBackRank();
		return this.#e(() => zn(t));
	}
	fromFen(e) {
		return this.#e(() => Wn(e));
	}
	randomBackRank(e, t) {
		return Ln(e, t, this.rules);
	}
	positionKey(e) {
		return this.#e(() => Xr(e));
	}
	legalMoves(e) {
		return this.#e(() => Bt(e));
	}
	pseudoMoves(e, t = "all") {
		return this.#e(() => zt(e, t));
	}
	inCheck(e) {
		return this.#e(() => ft(e));
	}
	status(e) {
		return this.#e(() => Kt(e));
	}
	makeMove(e, t) {
		return this.#e(() => it(e, t));
	}
	toLan(e, t) {
		return Gn(e, t);
	}
	genPiece(e, t, n, r) {
		return this.#e(() => et(e, t, n, r));
	}
	designedMoves(e, t, n, r, i) {
		return this.#e(() => {
			let a = [];
			return en(e, t, "all", a, n, i, r), a;
		});
	}
	nameOf(...e) {
		return this.#e(() => ie(...e));
	}
	theName(...e) {
		return this.#e(() => ae(...e));
	}
	aName(...e) {
		return this.#e(() => oe(...e));
	}
	playedDesign() {
		return this.#e(() => {
			let e = Nn();
			return e ? Zr(structuredClone(e)) : null;
		});
	}
	markKind(...e) {
		return this.#e(() => Le(...e));
	}
}, $r = class {
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
	constructor(e, t = Dn) {
		this.owned = new Qr(t), this.newGame(e);
	}
	newGame(e, t) {
		let n = t ? new Qr(t) : this.owned, r = e ?? n.randomBackRank(), i = n.startPosition(r);
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
var ei = "sha256:91d1a4ff51b8dd058ac886755f461a65978d2d6fd91f89013f4601a953134760", ti = 1e3, ni = 8e6, ri = [
	"beginner",
	"casual",
	"club",
	"strong"
], X, Z, ii = !1, Q = !1;
function ai(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e) || Object.keys(e).some((e) => !t.includes(e))) throw Error("Malformed input");
	return e;
}
function $(e) {
	return Number.isSafeInteger(e) && e >= 0;
}
function oi(e) {
	if (typeof e != "string" || e.length > 4096) throw Error("Malformed FEN");
	let t = e.split(" "), n = t[0].split("/");
	if (t.length < 6 || t.length > 7 || !["w", "b"].includes(t[1]) || !(q.classicChess ? /^(-|K?Q?k?q?)$/.test(t[2]) && /^(-|[a-h][36])$/.test(t[3]) : t[2] === "-" && t[3] === "-") || !/^\d+$/.test(t[4]) || !/^[1-9]\d*$/.test(t[5]) || n.length !== 8 || n.some((e) => !/^[1-8PNBRQKALGMSOCVTHpnbrqkalgmsocvth]+$/.test(e) || [...e].reduce((e, t) => e + (/\d/.test(t) ? +t : 1), 0) !== 8) || (t[0].match(/K/g) ?? []).length !== 1 || (t[0].match(/k/g) ?? []).length !== 1) throw Error("Malformed FEN");
	if (t[6] && t[6].split("/").some((e) => !/^([ugd]\d+\.\d+|m[a-h][1-8][wb][ia]?\d*|f|h[a-h][1-8][rto]?|l[PNBRQKALGMSOCVTpnbrqkalgmsocvt]*|y[A-Za-z]*\.[A-Za-z]*)$/.test(e))) throw Error("Unsupported or malformed power state");
	let r = Wn(e);
	if ([
		...r.used ?? [],
		...r.waiting ?? [],
		...r.lost ?? [],
		...r.drawn ?? []
	].some((e) => !$(e) || e > 1e4) || r.marks?.some((e) => e && (!$(e.sq) || e.sq > 63 || e.left !== void 0 && (!$(e.left) || e.left > 2))) || r.haste !== void 0 && (!$(r.haste) || r.haste > 63)) throw Error("Malformed power state");
	if (!$(r.halfmove) || !$(r.ply) || !$(Te(r)) || Bn(r) !== e) throw Error("Noncanonical FEN");
	return r;
}
function si(e) {
	let t = ai(e, [
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
	if (t.hand !== void 0 && (!Array.isArray(t.hand) || t.hand.length > 8 || new Set(t.hand).size !== t.hand.length || [...t.hand].some((e) => !wn.includes(e)))) throw Error("Malformed hand");
	if (t.kings !== void 0 && (typeof t.kings != "string" || t.kings.length > 100 || t.kings.split(",").length !== 2 || t.kings.split(",").some((e) => e !== "none" && !En(`${e},none`)[0]))) throw Error("Malformed kings");
	let n = t.kings === void 0 ? void 0 : En(t.kings), r = t.preset === "2017" ? On : t.preset === "2021" ? kn : void 0, i = [t.hand ?? [], t.hand ?? []];
	try {
		Pn(structuredClone({
			...n?.some(Boolean) ? An : {},
			...r,
			...n ? { kings: n } : {},
			...t.classic ? { classicChess: !0 } : {},
			hands: i
		}));
	} catch (e) {
		throw Error(`Malformed setup: ${e.message}`);
	}
	if (q.piles.some((e) => e.length)) throw Error("Private card data unsupported");
	X = new $r(t.backRank ?? "RNBQKBNR", q), t.fen !== void 0 && X.load(oi(t.fen)), Z = {
		schema: "kingdown-local-match/1",
		engine: ei,
		setup: structuredClone(t),
		initialFen: Bn(X.pos),
		rules: structuredClone(q),
		revision: 0,
		commands: []
	};
}
function ci() {
	if (!X || !Q) throw Error("Match not initialized");
	let { piles: e, ...t } = q, n = X.status === "playing" ? X.legal.map((e) => ({
		lan: Gn(X.pos, e),
		move: e
	})) : [];
	return {
		rules: structuredClone(t),
		moves: structuredClone(n),
		revision: Z.revision,
		fen: Bn(X.pos),
		ply: X.pos.ply,
		turn: X.pos.turn,
		moveNumber: Te(X.pos),
		status: X.status,
		inCheck: X.inCheck,
		legal: n.map((e) => e.lan),
		history: X.history.map((e) => e.lan)
	};
}
function li(e) {
	if (!X || !Q) throw Error("Match not initialized");
	if (X.status !== "playing") throw Error("Match terminal");
	let t = ai(e, [
		"level",
		"maxTimeMs",
		"maxDepth"
	]), n = t.level;
	if (n !== void 0 && !ri.includes(n)) throw Error("Malformed level");
	let r = t.maxTimeMs === void 0 ? 250 : t.maxTimeMs, i = t.maxDepth === void 0 ? n ? void 0 : 4 : t.maxDepth;
	if (!$(r) || r < 1 || r > 5e3 || i !== void 0 && (!$(i) || i < 1 || i > 8)) throw Error("Malformed search bounds");
	return {
		kind: "runtime-search",
		engine: ei,
		revision: Z.revision,
		rules: structuredClone(q),
		pos: structuredClone(X.pos),
		history: X.history.map((e) => Xr(e.pos)),
		ply: X.history.length,
		legal: X.legal.map((e) => Gn(X.pos, e)),
		options: structuredClone(t)
	};
}
function ui(e) {
	let t = ai(e, [
		"id",
		"expectedRevision",
		"lan"
	]);
	if (typeof t.id != "string" || !t.id.length || t.id.length > 200 || typeof t.lan != "string" || !t.lan.length || t.lan.length > 1024 || !$(t.expectedRevision)) throw Error("Malformed command");
	return t;
}
function di(e) {
	if (!X || !Q) throw Error("Match not initialized");
	let t = ui(e), n = Z.commands.find((e) => e.id === t.id);
	if (n) {
		if (n.lan !== t.lan || n.expectedRevision !== t.expectedRevision) throw Error("Command ID conflict");
		return ci();
	}
	if (t.expectedRevision !== Z.revision) throw Error("Stale revision");
	if (X.status !== "playing") throw Error("Match terminal");
	if (Z.commands.length >= ti) throw Error("Match history limit reached");
	let r = X.legal.filter((e) => Gn(X.pos, e) === t.lan);
	if (r.length !== 1) throw Error("Illegal or ambiguous move");
	return X.play(r[0]), Z.revision++, Z.commands.push({
		...t,
		fen: Bn(X.pos),
		ply: X.pos.ply,
		status: X.status
	}), ci();
}
function fi(e) {
	if (typeof e != "string" || e.length > ni) throw Error("Malformed save");
	let t = ai(JSON.parse(e), [
		"schema",
		"engine",
		"setup",
		"initialFen",
		"rules",
		"revision",
		"commands"
	]);
	if (t.schema !== "kingdown-local-match/1" || t.engine !== ei) throw Object.assign(/* @__PURE__ */ Error("Incompatible save"), { code: "MATCH_INCOMPATIBLE" });
	if (!$(t.revision) || !Array.isArray(t.commands) || t.commands.length > ti || t.commands.length !== t.revision) throw Error("Malformed history");
	if (si(t.setup), t.initialFen !== Z.initialFen || JSON.stringify(t.rules) !== JSON.stringify(Z.rules)) throw Error("Incompatible setup or rules");
	Q = !0;
	for (let e of t.commands) {
		let t = ai(e, [
			"id",
			"expectedRevision",
			"lan",
			"fen",
			"ply",
			"status"
		]);
		if (t.expectedRevision !== Z.revision) throw Error("Invalid replay revision");
		let n = Z.revision, r = di({
			id: t.id,
			expectedRevision: t.expectedRevision,
			lan: t.lan
		});
		if (Z.revision !== n + 1 || r.fen !== t.fen || r.ply !== t.ply || r.status !== t.status) throw Error("Invalid replay");
	}
}
e.on("message", ({ id: t, op: n, input: r }) => {
	let i = Q;
	try {
		if (ii) throw Error("Match initialization failed");
		if ((n === "create" || n === "load") && X) throw Error("Already initialized");
		let i;
		switch (n) {
			case "create":
				si(r);
				break;
			case "load":
				fi(r);
				break;
			case "snapshot":
				i = ci();
				break;
			case "chooseMove":
				i = li(r);
				break;
			case "apply":
				i = di(r);
				break;
			case "save":
				ci(), i = JSON.stringify(Z);
				break;
			default: throw Error("Unknown operation");
		}
		(n === "create" || n === "load") && (Q = !0), e.postMessage({
			id: t,
			value: i
		});
	} catch (r) {
		(n === "create" || n === "load") && !i && (ii = !0, Q = !1, X = void 0), e.postMessage({
			id: t,
			error: r.message,
			code: r.code
		});
	}
});
//#endregion
export {};
