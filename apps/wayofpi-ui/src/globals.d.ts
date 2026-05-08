declare module "@mariozechner/pi-tui/menu" {
  export const Menu: any;
  export const menu: any;
  export const submenu: any;
  export const separator: any;
}

declare module "*.css";

interface ScrollbarConstructor {
  new (element: HTMLElement, options?: any): any;
}
declare var Scrollbar: ScrollbarConstructor;
