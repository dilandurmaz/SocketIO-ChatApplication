var fs = require('fs');
var scoop = require('../lib/scoop');

scoop(
    function readFile(ctx) {
        fs.readFile('test.json', 'utf8', this(['data']));
    },
    function toJSON(ctx) {
        ctx['json'] = JSON.parse(ctx['data'][0]);
    })(
    function finalize(err, ctx) {
        if (err) throw err;

        console.log(ctx['json']);
    }
);
