self.addEventListener("message", (message) => {
    const bytes = message.data.bytes;
    const tid = message.data.tid;
    const daily_seed = message.data.daily_seed;
    const range = message.data.range;
    const start = message.data.start;
    const end = message.data.end;
    let res = [];
    const importObject = {
        env: {
            found: function (seed, sid, step) {
                res.push([seed, sid, step]);
            }
        }
    };
    WebAssembly.instantiate(message.data.bytes, importObject)
        .then((results) => {
            const BLOCK_SIZE = 65536;
            let i = start;
            while (i < end) {
                self.postMessage({ type: "progress", progress: i - start });
                res = [];
                results.instance.exports.search(tid, daily_seed, range, i, i + BLOCK_SIZE);
                if (res.length > 0) {
                    self.postMessage({ type: "res", res: res });
                }
                i = Math.min(i + BLOCK_SIZE, end);
            }
            self.postMessage({ type: "progress", progress: i - start });
        }).catch(e => {
            self.postMessage(e.message);
        });
});