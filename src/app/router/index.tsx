import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { appRoutes } from "@app/router/routes";

const router = createBrowserRouter(appRoutes);

export const AppRouterProvider = () => <RouterProvider router={router} />;
