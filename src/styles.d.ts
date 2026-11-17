declare module "*.css";
declare module "*.ttf" {
  const dataUrl: string;
  export default dataUrl;
}
