class InputError {
	constructor(message) {
		this.message = message;
	}
}

function on_submit() {
	try {
		let form = document.forms.f;
		let tid = Number(form.elements.tid.value);
		let daily_seed = read_lottery_input(form.elements.lottery);
		let range = Number(form.elements.range.value);
		search(tid, daily_seed, range);
	} catch(e) {
		if (e instanceof InputError) {
			alert(e.message);
		} else {
			throw e;
		}
	}
}

function search(tid, daily_seed, range) {
	let res = [];
    let importObject = {
        env: {
            found: function(seed, sid, step) {
				res.push([seed, sid, step]);
            }
        }
	};
	console.log([tid, daily_seed, range]);
	const MAX = 256 * 24 * 65536;
    fetch('search.wasm')
        .then((response) => response.arrayBuffer())
        .then((bytes) => WebAssembly.instantiate(bytes, importObject))
        .then((results) => {
			function loop(start) {
				let end = Math.min(MAX, start + 0x10000);
				res = [];
				results.instance.exports.search(tid, daily_seed, range, start, end);
				for (let r of res) {
					let [seed, sid, step] = r;
					$t.append($("<tr>").append($("<td>").text(step + " days ago"))
								.append($("<td>").text(hex(seed)))
								.append($("<td>").text(sid)));
				}
				$("#progress").text((end / MAX * 100).toFixed(1) + "%");
				if (end != MAX) {
					setTimeout(() => loop(end), 0);
				}
			}
			let $t = $("<table>");
			$t.append($("<tr><th>pos<th>seed<th>SID</tr>"));
			$("#result").empty().append($t);
			loop(0);
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