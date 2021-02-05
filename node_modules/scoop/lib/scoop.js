// Copyright (c) 2012 Simon Brakhane
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

/*jslint node: true, plusplus: true, vars: true */

"use strict";

module.exports = (function () {
    var handler = function (key) {
        var forcearray = false;
        if (key instanceof Array) {
            forcearray = true;
            key = key[0];
        }

        if (!this.pending.hasOwnProperty(key)) {
            this.pending[key] = {
                pending: 0,
                result: []
            };
        }

        var state = this.pending[key];
        var id = state.pending++;

        this.globalpending++;

        return (function callback(err, data) {
            if (err) {
                throw err;
            }

            if (this.lock) {
                throw Error("Callback called in the same tick!");
            }

            this.globalpending--;
            var state = this.pending[key];

            state.pending--;
            state.result[id] = data;

            if (state.pending === 0) {
                var result = state.result;
                if (result.length === 1 && !forcearray) {
                    this.data[key] = result[0];
                } else {
                    this.data[key] = result;
                }
                delete this.pending[key];
            }

            if (this.globalpending === 0) {
                this.executor();
            }
        }).bind(this);
    };

    var executor = function (callback) {
        if (this.first) {
            this.first = false;
            this.callback = callback;
            this.handler = handler.bind(this);
        }

        this.lock = true;

        var fn = this.functions.shift();
        if (fn === undefined) {
            this.callback(null, this.data);
        } else {
            try {
                fn.call(this.handler, this.data);

                if (this.globalpending === 0) {
                    this.executor();
                }
            } catch (err) {
                this.callback(err, this.data);
            }
        }

        this.lock = false;
    };

    var context = {
        functions: Array.prototype.slice.call(arguments),
        first: true,
        lock: false,
        globalpending: 0,
        pending: {},
        data: {}
    };

    return (context.executor = executor.bind(context));
});
