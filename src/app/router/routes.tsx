import type { RouteObject } from "react-router-dom";

import { AppShell } from "@app/layout/app-shell";
import ContextPage from "@pages/context";
import DashboardPage from "@pages/dashboard";
import MemoriesPage from "@pages/memories";
import NotFoundPage from "@pages/not-found";
import SearchPage from "@pages/search";
import TimelinePage from "@pages/timeline";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
        handle: { inspectorRoute: "/" },
      },
      {
        path: "memories",
        element: <MemoriesPage />,
        handle: { inspectorRoute: "/memories" },
      },
      {
        path: "search",
        element: <SearchPage />,
        handle: { inspectorRoute: "/search" },
      },
      {
        path: "timeline",
        element: <TimelinePage />,
        handle: { inspectorRoute: "/timeline" },
      },
      {
        path: "context",
        element: <ContextPage />,
        handle: { inspectorRoute: "/context" },
      },
      {
        path: "context",
        element: <ContextPage />,
        handle: { inspectorRoute: "/context" },
      },
      {
        path: "*",
        element: <NotFoundPage />,
        handle: { inspectorRoute: "/not-found" },
      },
    ],
  },
];
