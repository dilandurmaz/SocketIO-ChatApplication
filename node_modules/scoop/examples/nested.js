var fs = require('fs');
var scoop = require('../lib/scoop');

function readFiles(files, callback) {
    scoop(
        function read(ctx) {
            for (i in files) {
                fs.readFile(files[i], 'utf8', this(['data']));
            }
        })(
        function finalize(err, ctx) {
            if (err) {
                callback(err);
            } else {
                callback(null, ctx['data']);
            }
        }
    );
}

scoop(
    function readFile(ctx) {
        fs.readFile('test.json', 'utf8', this('data'));
        readFiles(['simple.js', 'multiple.js', 'forcearray.js'], this('data'));
    },
    function toJSON(ctx) {
        ctx['json'] = JSON.parse(ctx['data'][0]);
    })(
    function finalize(err, ctx) {
        if (err) throw err;

        console.log(ctx['data'][0]);
        console.log(ctx['data'][1].length);
    }
);
