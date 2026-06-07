import type messages from "../../messages/es.json";

declare module "use-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
