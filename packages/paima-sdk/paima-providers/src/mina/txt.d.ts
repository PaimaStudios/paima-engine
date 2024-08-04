// https://esbuild.github.io/content-types/#text
declare module '*.txt' {
  declare const code: string;
  export default code;
}
