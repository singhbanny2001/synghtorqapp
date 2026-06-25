import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const NotFound = lazy(() => import("../pages/NotFound"));
const Home = lazy(() => import("../pages/home/page"));
const Login = lazy(() => import("../pages/login/page"));
const Register = lazy(() => import("../pages/register/page"));
const Dashboard = lazy(() => import("../pages/dashboard/page"));
const Vehicles = lazy(() => import("../pages/vehicles/page"));
const Track = lazy(() => import("../pages/track/page"));
const Analytics = lazy(() => import("../pages/analytics/page"));
const Services = lazy(() => import("../pages/services/page"));
const More = lazy(() => import("../pages/more/page"));
const Reports = lazy(() => import("../pages/reports/page"));
const Alerts = lazy(() => import("../pages/alerts/page"));
const Playback = lazy(() => import("../pages/playback/page"));
const VehicleDetail = lazy(() => import("../pages/vehicle-detail/page"));
const Renewals = lazy(() => import("../pages/renewals/page"));
const Expenses = lazy(() => import("../pages/expenses/page"));
const Account = lazy(() => import("../pages/account/page"));
const TeamManagement = lazy(() => import("../pages/team/page"));
const Devices = lazy(() => import("../pages/devices/page"));
const Drivers = lazy(() => import("../pages/drivers/page"));
const Security = lazy(() => import("../pages/security/page"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/vehicles",
    element: <Vehicles />,
  },
  {
    path: "/vehicle/:id",
    element: <VehicleDetail />,
  },
  {
    path: "/reports",
    element: <Reports />,
  },
  {
    path: "/alerts",
    element: <Alerts />,
  },
  {
    path: "/track",
    element: <Track />,
  },
  {
    path: "/analytics",
    element: <Analytics />,
  },
  {
    path: "/services",
    element: <Services />,
  },
  {
    path: "/renewals",
    element: <Renewals />,
  },
  {
    path: "/expenses",
    element: <Expenses />,
  },
  {
    path: "/more",
    element: <More />,
  },
  {
    path: "/account",
    element: <Account />,
  },
  {
    path: "/team",
    element: <TeamManagement />,
  },
  {
    path: "/devices",
    element: <Devices />,
  },
  {
    path: "/drivers",
    element: <Drivers />,
  },
  {
    path: "/security",
    element: <Security />,
  },
  {
    path: "/playback",
    element: <Playback />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
