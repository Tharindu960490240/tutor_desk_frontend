import { Component } from "react";
import { Box, Button, Typography } from "@mui/material";
import { tl } from "../i18n/index.jsx";
import { api, auth } from "../api.js";
import { ReportProblemRounded } from "../icons.jsx";

/** Catches crashes, shows a friendly screen and reports the error as feedback (if signed in). */
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error(error, info);
    if (!auth.token) return;
    const msg = `[automatic crash report]\n${error?.message || error}\n\n${(error?.stack || "").slice(0, 1500)}\n\nComponent stack:${(info?.componentStack || "").slice(0, 1200)}`;
    api("/feedback", { method: "POST", body: { message: msg, page: window.location.pathname } }).catch(() => {});
  }
  render() {
    if (!this.state.error) return this.props.children;
    const lg = this.props.lang || "en";
    return (
      <Box role="alert" sx={{ minHeight: "80dvh", display: "grid", placeItems: "center", textAlign: "center", p: 3 }}>
        <Box sx={{ maxWidth: 420 }}>
          <ReportProblemRounded sx={{ fontSize: 52, color: "warning.main" }} />
          <Typography variant="h5" sx={{ mt: 1 }}>{tl(lg, "crash_title")}</Typography>
          <Typography color="text.secondary" sx={{ my: 2 }}>{tl(lg, "crash_p")}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>{tl(lg, "reload")}</Button>
        </Box>
      </Box>
    );
  }
}
