var fs = require('fs');
var scoop = require('../lib/scoop');

scoop(
    function readFile(ctx) {
        // read the file and store the result in ctx['data']
        fs.readFile('test.json', 'utf8', this('data'));
    },
    function toJSON(ctx) {
        // read ctx['data'], transform it and save the result into ctx['json']
        ctx['json'] = JSON.parse(ctx['data']);
    })( // please note this line
    function finalize(err, ctx) {
        // test if there was any error
        if (err) throw err;

        // show that ctx['json'] is populated with the expected result
        console.log(ctx['json']['test']);
    }
);
