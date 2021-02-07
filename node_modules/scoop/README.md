# scoop

Another control-flow library for node with little style changes and tweaks.

## License

MIT license

## How to install

Just as every other node.js package, just install it via npm.

    npm install scoop

## Why anyother control-flow lib?

scoop looks and feels more or less like all the other control-flow libraries, some facts:

-   errors are catched and forwarded to the finalizer to remove clutter
-   all functions share a common 'context' which is passed as the first argument
-   results from callbacks are pushed into the global 'context'
-   callbacks are generated and handled by the special 'this' variable
-   scoop calls may be arbitrary deep nested

I really liked [step](https://github.com/creationix/step/) for it's simplicity but it was also not perfectly what I wanted.

-   I realized I've never handled errors in a step except throwing it.
-   Sometimes the need to pass arguments down the chain and a closure or arguments just created clutter.
-   The real reason for scoop: I needed it to be nestable

## How to use

### Simple sample

From 'examples/simple.js':

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

The sample should be easy enough to get the main idea behind scoop. Whenever you call 'this' a callback is generated which excepts the usual callback style ('function (err, result)'). The argument used on 'this' is used as the 'key' for the result in the 'context'.

The context may be changed and read everytime you want and is never touched by scoop except for result population. You may also save the result of the first scoop call to specify a finailzer later.

### Beware of broken callbacks

From 'examples/sametick.js':

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

The passed functions have to return before every callback may be called. Scoop enforces that callbacks are not called in the same tick by throwing an Error if this happens.

### Multiple results for one key

From 'examples/multiple.js':

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

If a key is used multiple times the results are automatically stored in an array where the order is equal to the initial call order.

### Force Array creation

From 'examples/forcearray.js':

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

You may also force the Array creation by passing the desired key within an array. This tells scoop to create an array as the result regardless of the number of results.

### Nested calls

From 'examples/nested.js':

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

This example is combination of all the other samples with the addition of nesting. Please note that you aren't forced to use only one key for all the results you are expecting. Just use as many as you need.
