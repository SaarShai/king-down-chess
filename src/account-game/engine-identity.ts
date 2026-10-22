/** The existing compiled worker hash, injected into each account page by its build. */
declare const __KINGDOWN_PAGE_ENGINE__: string;
export const PAGE_ENGINE = typeof __KINGDOWN_PAGE_ENGINE__ === 'undefined' ? undefined : __KINGDOWN_PAGE_ENGINE__;
export const needsServerPreview = (engine: string | null | undefined, pageEngine = PAGE_ENGINE): boolean => !engine || !pageEngine || engine !== pageEngine;
