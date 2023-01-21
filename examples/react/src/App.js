import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Embed from "routes/Embed";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Embed />,
  },
]);

const RootApp = () => <RouterProvider router={router} />

export default RootApp