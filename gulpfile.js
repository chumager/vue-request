"use strict";
const {src, dest, parallel, watch: w} = require("gulp");
const terser = require("gulp-terser");
const debug = require("gulp-debug");
const babel = require("gulp-babel");
/*
 *const pkg = require("./package.json");
 *if (pkg.installConfig && pkg.installConfig.pnp) {
 *  const pnp = require("./.pnp.js");
 *  pnp.setupCompatibilityLayer();
 *  pnp.setup();
 *}
 */

const path = ["src/**/*.js"];
function js() {
  return src(path, {base: "src"})
    .pipe(debug())
    .pipe(babel())
    .pipe(terser())
    .pipe(dest("dist/"));
}
function transform(path) {
  return src(path, {base: "src"})
    .pipe(debug({title: "Transformando" /*, logger: Log*/}))
    .pipe(babel())
    .pipe(terser())
    .pipe(dest("dist/"));
}
function watch() {
  const watcher = w(path);
  watcher.on("change", transform);
  watcher.on("add", transform);
  return watcher;
}
exports.watch = watch;
exports.js = js;
exports.default = parallel(js);
