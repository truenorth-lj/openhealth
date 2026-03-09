import "i18next";
import { resources } from "@open-health/shared/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: (typeof resources)["zh-TW"];
    // Allow cross-namespace access via "ns:key" syntax
    allowObjectInHTMLChildren: true;
  }
}
