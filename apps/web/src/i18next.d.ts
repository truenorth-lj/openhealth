import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    // Allow dynamic keys (template literals, variables) without strict key checking
    allowObjectInHTMLChildren: true;
    returnNull: false;
  }
}
