function u32(x) { return x >>> 0; }

function mul(a, b) {
	return Math.imul(a, b);
}

function daily_seed_next(seed) {
    return u32(mul(seed, 0x6c078965) + 1);
}

function daily_seed_to_lottery_seed(seed) {
	return u32(mul(seed, 0x41c64e6d) + 0x3039);
}

function lottery_seed_to_daily_seed(seed) {
	return u32(mul(seed, 0xeeb9eb65) + 0xfc77a683);
}

function lottery_numbers_to_daily_seeds(numbers) {
	var ret = [];
	for (var i = 0; i < 65536; i ++) {
		var lottery_seed = u32(numbers[0] << 16 | i);
		var fseed = lottery_seed_to_daily_seed(lottery_seed);
		var seed = fseed;
		for (var j = 1; j < numbers.length; j ++) {
			seed = daily_seed_next(seed);
			var number = daily_seed_to_lottery_seed(seed) >>> 16;
			if (numbers[j] !== number) break;
		}
		if (j === numbers.length) {
			ret.push(fseed);
		}
	}
	return ret;
}

