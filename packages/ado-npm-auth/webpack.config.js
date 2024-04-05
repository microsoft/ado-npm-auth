import path from "path";
import webpack from "webpack";
import { fileURLToPath } from "url";
import TerserPlugin from "terser-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: "production",
  entry: {
    cli: path.join(__dirname, "./lib/cli.js"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "ado-npm-auth.cjs",
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  target: "node",
  devtool: false,
  plugins: [
    // Keeps webpack from doing lots of chunks
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  experiments: {
    topLevelAwait: true,
  },
};
