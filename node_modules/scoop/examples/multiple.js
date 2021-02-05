var fs = require('fs');
var scoop = require('../lib/scoop');

scoop(
    function readFile(ctx) {
        fs.readFile('test.json', 'utf8', this('data'));
        fs.readFile('test.json', 'utf8', this('data'));
    },
    function toJSON(ctx) {
        ctx['json'] = [];
        for (i in ctx['data']) {
            ctx['json'].push(JSON.parse(ctx['data'][i]));
        }
    })(
    function finalize(err, ctx) {
        if (err) throw err;

        console.log(ctx['json']);
    }
);
