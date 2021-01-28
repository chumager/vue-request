"use strict";
const {src, dest, parallel, watch: w} = require("gulp");
const terser = require("gulp-terser");
const debug = require("gulp-debug");

const path = ["src/**/*.js"];
function js(localPath) {
  if (typeof localPath === "function") return;
  return src(localPath || path, {base: "src"})
    .pipe(debug())
    .pipe(
      terser({
        compress: {
          drop_console: true,
          module: true,
          keep_fnames: false
        }
      })
    )
    .pipe(dest("dist/"));
}
function watch() {
  const watcher = w(path);
  watcher.on("change", js);
  watcher.on("add", js);
  return watcher;
}
exports.watch = watch;
exports.js = js;
exports.default = parallel(js, watch);
