export type InspectorRoute =
  | "/"
  | "/memories"
  | "/search"
  | "/timeline"
  | "/context"
  | "/settings"
  | "/not-found";

export interface InspectorContext {
  route: InspectorRoute;
  selectedObservationId: number | null;
  selectedQuery: string | null;
}

const knownRoutes = new Set<InspectorRoute>([
  "/",
  "/memories",
  "/search",
  "/timeline",
  "/context",
  "/settings",
  "/not-found",
]);

export const deriveInspectorContext = (pathname: string): InspectorContext => {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const route = knownRoutes.has(normalizedPath as InspectorRoute) ? (normalizedPath as InspectorRoute) : "/not-found";

  return {
    route,
    selectedObservationId: null,
    selectedQuery: null,
  };
};
