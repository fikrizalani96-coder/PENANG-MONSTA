// Semakan pantas data (node tools/chkdata.js)
const fs = require('fs'); const vm = require('vm');
const ctx = { console, clamp: (v, a, b) => v < a ? a : v > b ? b : v }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../js/data.js', 'utf8') + ';this.SP=SP;this.MOVES=MOVES;this.DEX=DEX;', ctx);
console.log('monsta', Object.keys(ctx.SP).length, 'moves', Object.keys(ctx.MOVES).length);
for (let i = 1; i < ctx.DEX.length; i++) if (!ctx.DEX[i]) console.log('missing no', i);
