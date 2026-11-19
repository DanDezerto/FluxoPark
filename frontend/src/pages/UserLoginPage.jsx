import React from "react";
import { createRoot } from "react-dom/client";
import { PortalLogin } from "../components/portal/PortalLogin.jsx";

createRoot(document.getElementById("root")).render(<PortalLogin accountType="driver" />);