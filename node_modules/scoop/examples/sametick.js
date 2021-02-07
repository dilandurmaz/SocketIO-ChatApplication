var fs = require('fs');
var scoop = require('../lib/scoop');

function correctCallback(callback) {
    process.nextTick(function() {
        callback(null, 'foo');
    });
}

function brokenCallback(callback) {
    callback(null, 'bar');
}

scoop(
    function first(ctx) {
        correctCallback(this('correct'));
    },
    function second(ctx) {
        brokenCallback(this('broken'));
    })(
    function finalize(err, ctx) {
        if (err) throw err;
        console.log(ctx);
    }
);
