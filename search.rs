extern {
	fn found(seed: u32, sid: u32, step: u32);
}

fn next_mt_elem(a: u32, i: u32) -> u32 {
	return 1812433253 * (a ^ (a >> 30)) + i;
}

fn genrand(mt0: u32, mt1: u32, mt397: u32) -> u32 {
	let mut v: u32;
	v = (mt0 & 0x80000000) | (mt1 & 0x7fffffff);
	v = mt397 ^ (v >> 1) ^ (if (v & 1) != 0 { 0x9908b0df } else { 0 });
	v ^=  v >> 11;
	v ^= (v <<  7) & 0x9d2c5680;
	v ^= (v << 15) & 0xefc60000;
	v ^=  v >> 18;
	return v;
}

fn get_mt_result(seed: u32) -> (u32, u32) {
	let mt0 = seed;
	let mt1 = next_mt_elem(mt0, 1);
	let mt2 = next_mt_elem(mt1, 2);
	let mut mt = mt2;
	for i in 3..398 {
		mt = next_mt_elem(mt, i);
	}
	let mt397 = mt;
	let mt398 = next_mt_elem(mt, 398);
	return (genrand(mt0, mt1, mt397), genrand(mt1, mt2, mt398));
}

fn calc_index(a: u32, b: u32, s: u32, k: u32) -> u32 {
	if k == 0 {
		return 0;
	} else if (s & 1) == 0 {
		return calc_index(a * a, (a + 1) * b / 2, s / 2, k - 1) * 2;
	} else {
		return calc_index(a * a, (a + 1) * b / 2, (a * s + b) / 2, k - 1) * 2 - 1;
	}
}

fn daily_seed_to_index(seed: u32) -> u32 {
	return calc_index(0x6c078965, 1, seed, 32);
}

fn to_seed(i: u32) -> u32 {
	let a = i / (24*65536);
	let b = (i / 65536) % 24;
	let c = i % 65536;
	return (a << 24) | (b << 16) | c;
}

#[no_mangle]
pub unsafe fn search(tid: u32, daily_seed: u32, step_max: u32, pos_start: u32, pos_end: u32) {
	let index = daily_seed_to_index(daily_seed);
	for pos in pos_start..pos_end {
		let seed = to_seed(pos);
		let (dseed, trainer_id) = get_mt_result(seed);
		let idx = daily_seed_to_index(dseed);
		if (trainer_id & 0xffff) == tid && index - idx <= step_max {
		   found(seed, trainer_id >> 16, index - idx);
		}
	}
}