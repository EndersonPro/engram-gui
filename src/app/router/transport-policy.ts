export type NonHealthRouteKey = "search" | "timeline" | "context" | "observations" | "sync" | "stats";

export const nonHealthGraduationOrder: readonly NonHealthRouteKey[] = [
  "search",
  "timeline",
  "context",
  "observations",
  "sync",
  "stats",
];

export interface TransportPolicy {
  allowlistedRoutes: readonly NonHealthRouteKey[];
}

export interface GraduationPreconditionChecks {
  contract: boolean;
  adapter: boolean;
  guardrail: boolean;
}

export interface GraduationGateInput {
  allowlistedRoutes?: readonly NonHealthRouteKey[];
  checks: GraduationPreconditionChecks;
}

export type GraduationCoverageByRoute = Partial<Record<NonHealthRouteKey, GraduationPreconditionChecks>>;

export const transportPolicy: TransportPolicy = {
  allowlistedRoutes: ["search", "timeline", "context", "observations", "sync", "stats"],
};

export const isRouteTransportAllowlisted = (
  route: NonHealthRouteKey,
  allowlistedRoutes: readonly NonHealthRouteKey[] = transportPolicy.allowlistedRoutes,
): boolean => {
  return allowlistedRoutes.includes(route);
};

export const canGraduateRoute = (
  route: NonHealthRouteKey,
  allowlistedRoutes: readonly NonHealthRouteKey[] = transportPolicy.allowlistedRoutes,
): boolean => {
  const targetIndex = nonHealthGraduationOrder.indexOf(route);

  if (targetIndex <= 0) {
    return true;
  }

  const requiredPreviousRoutes = nonHealthGraduationOrder.slice(0, targetIndex);
  return requiredPreviousRoutes.every((requiredRoute) => allowlistedRoutes.includes(requiredRoute));
};

export const canGraduateRouteWithPreconditions = (
  route: NonHealthRouteKey,
  input: GraduationGateInput,
): boolean => {
  if (!canGraduateRoute(route, input.allowlistedRoutes ?? transportPolicy.allowlistedRoutes)) {
    return false;
  }

  return input.checks.contract && input.checks.adapter && input.checks.guardrail;
};

export const allowlistHasPreconditionCoverage = (
  allowlistedRoutes: readonly NonHealthRouteKey[] = transportPolicy.allowlistedRoutes,
  coverageByRoute: GraduationCoverageByRoute,
): boolean => {
  return allowlistedRoutes.every((route) => {
    const checks = coverageByRoute[route];

    if (!checks) {
      return false;
    }

    return canGraduateRouteWithPreconditions(route, {
      allowlistedRoutes,
      checks,
    });
  });
};
