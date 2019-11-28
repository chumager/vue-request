module.exports = {
  banner: true,
  bundleNodeModules: true,
  input: "src/vue-request.js",
  babel: {
    jsx: "this.$createElement"
  },
  output: {
    minify: true,
    minimal: true,
    extractCSS: false,
    moduleName: "vue-request.js",
    format: ["cjs", "cjs-min", "es-min", "umd-min"],
    target: "browser"
  },
  plugins: {
    vue: {
      css: true,
      template: {
        transpileOptions: {
          jsx: "h.createelement"
        }
      }
    }
  }
};
