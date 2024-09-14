import gulp from "gulp";
const {src, dest, parallel, watch: w} = gulp;
/*
 *const gt = require("gulp-terser");
 *const terser = require("terser");
 */
//import gobf from "gulp-javascript-obfuscator";
import gt from "gulp-terser";
import {minify} from "terser";
import debug from "gulp-debug";
import stripDebug from "gulp-strip-debug";
import {deleteSync} from "del";
import path from "path";

//const path = ["**/*.js", "!dist/**/*", "!itdfw*.js", "!gulpfile.js", "!.pnp", "!ecosystem,config.js"];
const searchPath = ["src/**/*.js"];
function js() {
  return (
    src(searchPath, {base: "src"})
      .pipe(debug({title: "Ofuscando" /*, logger: Log*/}))
      //.pipe(gif(cond, gt({}, terser.minify)))
      //.pipe(stripDebug())
      .pipe(gt({}, minify))
      //.pipe(gobf({compact: true /*, controlFlowFlattening: true*/}))
      .pipe(dest("dist/"))
  );
}
function obfuscate(path) {
  return (
    src(path, {base: "src"})
      .pipe(debug({title: "Ofuscando" /*, logger: Log*/}))
      //.pipe(gif(cond, gt({}, terser.minify)))
      //.pipe(stripDebug())
      .pipe(gt({}, minify))
      //.pipe(gobf({compact: true /*, controlFlowFlattening: true*/}))
      .pipe(dest("dist/"))
  );
}
function watch() {
  const watcher = w(searchPath);
  watcher.on("change", obfuscate);
  watcher.on("add", obfuscate);
  watcher.on("unlink", filePath => {
    const filePathFromSrc = path.relative(path.resolve("src"), filePath);
    const destFilePath = path.resolve("dist", filePathFromSrc);
    console.log("Eliminando", destFilePath);
    deleteSync(destFilePath);
  });
  return watcher;
}
export {watch, js};
export default parallel(js, watch);
