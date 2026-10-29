import type { DCLogic } from "./runtime";

declare const Component: new (props: Record<string, unknown>) => DCLogic;
export default Component;
