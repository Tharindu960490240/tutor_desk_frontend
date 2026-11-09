import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import { useTheme } from "@mui/material/styles";
import { useI18n } from "../i18n/index.jsx";
import { LogoMark } from "./Logo.jsx";
import "../styles/loadingSpinner.css";

/** The animated logo + rings + "Loading..." text */
export function LoaderVisual() {
  const { t } = useI18n();
  const dark = useTheme().palette.mode === "dark";
  return (
    <>
      <div className="afc-loader">
        <span className="afc-loader-glow" />
        <span className="afc-loader-ring" />
        <span className="afc-loader-ring afc-loader-ring-slow" />
        {/* blue tile on light backgrounds, white mark on dark */}
        <span className="afc-loader-icon">
          {dark ? <LogoMark variant="white" size={42} /> : <LogoMark size={46} />}
        </span>
      </div>
      <p className="loading-text">
        {t("loading_word")}
        <span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>
      </p>
    </>
  );
}

/** Full-screen overlay, same props as AFC: <LoadingSpinner open={loading} /> */
export default function LoadingSpinner({ open }) {
  const dark = useTheme().palette.mode === "dark";
  return (
    <Modal open={!!open} closeAfterTransition disableAutoFocus disableEnforceFocus disableRestoreFocus
      slotProps={{ backdrop: { className: "loading-modal-backdrop" } }}>
      <Fade in={!!open}>
        <Box className={`loading-spinner-box${dark ? " dark" : ""}`} role="status" aria-live="polite">
          <LoaderVisual />
        </Box>
      </Fade>
    </Modal>
  );
}

/** Same loader inside the page (for screens that are still loading their data) */
export function InlineLoader({ compact }) {
  return <div className="loading-spinner-inline" role="status" aria-live="polite" style={compact ? { minHeight: 0, padding: "24px 16px" } : undefined}><LoaderVisual /></div>;
}
