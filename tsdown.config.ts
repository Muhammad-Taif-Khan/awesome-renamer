import { defineConfig } from "tsdown";

export default defineConfig({
   entry:'src/index.ts',
   format: ["esm", "cjs"],
  dts: true,
  exports:true,
  attw:true,
  publint:true,
  outDir: "dist",

  clean: true,

  target: "node18",

  platform: "node",

  sourcemap: false,

  minify: false,
});