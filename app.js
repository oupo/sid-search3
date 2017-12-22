class InputError {
	constructor(message) {
		this.message = message;
	}
}

window.addEventListener("load", () => {
	let form = document.forms.f;
	if (navigator.hardwareConcurrency != undefined) {
		form.elements.num_worker.value = String(navigator.hardwareConcurrency);
	}
});

function on_submit() {
	try {
		let form = document.forms.f;
		let tid = Number(form.elements.tid.value);
		let daily_seed = read_lottery_input(form.elements.lottery);
		let range = Number(form.elements.range.value);
		let num_worker = Number(form.elements.num_worker.value);
		search(tid, daily_seed, range, num_worker);
	} catch (e) {
		if (e instanceof InputError) {
			alert(e.message);
		} else {
			throw e;
		}
	}
}

function search(tid, daily_seed, range, num_worker) {
	let res = [];
	let importObject = {
		env: {
			found: function (seed, sid, step) {
				res.push([seed, sid, step]);
			}
		}
	};
	const MAX = 256 * 24 * 65536;
	let progress = Array(num_worker).fill(0);
	let found_count = 0;
	fetch("search.wasm")
		.then((response) => response.arrayBuffer())
		.then((bytes) => {
			$("#status").text("num_worker=" + num_worker);
			let $t = $("<table>");
			$t.append($("<tr><th>pos<th>seed<th>SID</tr>"));
			$("#result").empty().append($t);
			const N = MAX / num_worker;
			for (let i = 0; i < num_worker; i++) {
				let worker = new Worker("worker.js");
				worker.addEventListener("message", (message) => {
					if (message.data.type == "progress") {
						progress[i] = message.data.progress;
						let sum = progress.reduce((x, y) => x + y, 0);
						$("#progress").text((sum / MAX * 100).toFixed(1) + "% " + found_count + " hits.");
					} else if (message.data.type == "res") {
						let res = message.data.res;
						for (let r of res) {
							let [seed, sid, step] = r;
							$t.append($("<tr>").append($("<td>").text(step + " days ago"))
								.append($("<td>").text(hex(seed >>> 0)))
								.append($("<td>").text(sid)));
							found_count++;
						}
					}
				});
				worker.postMessage({
					bytes: bytes,
					tid: tid,
					daily_seed: daily_seed,
					range: range,
					start: N * i,
					end: N * (i + 1)
				});
			}
		})
		.catch((e) => { console.log(e) });
}

function to_hex(x, n) {
	let s = x.toString(16);
	while (s.length < n) s = "0" + s;
	return s;
}
function hex(x) {
	return "0x" + to_hex(x, 8);
}

function read_lottery_input(input) {
	let s = input.value.replace(/^\s+|\s+$/g, "");
	if (/^(?:\d+(?:\s*,)?\s*)+$/.test(s)) {
		let numbers = s.match(/\d+/g).map(Number);
		let seeds = lottery_numbers_to_daily_seeds(numbers);
		if (seeds.length === 0) {
			throw new InputError("くじ番号に対応するseedが見つかりません");
		}
		if (seeds.length > 1) {
			throw new InputError("くじ番号に対応するseedが一通りに絞れません。もう1日分くじ番号を追加してください");
		}
		return seeds[0];
	} else if (/^0x[0-9a-f]+$/i.test(s)) {
		let seed = Number(s);
		return seed;
	} else {
		return 0;
	}
}