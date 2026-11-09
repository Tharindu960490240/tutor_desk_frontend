import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
import IconButton from "@mui/material/IconButton";
import { useI18n } from "../i18n/index.jsx";
import "../styles/customSnackbar.css";
import { CheckCircleRounded, CloseRounded, ErrorRounded, InfoRounded, WarningAmberRounded } from "../icons.jsx";

const AUTO_HIDE = 4000;

const VARIANTS = {
  success: { title: "toast_success", Icon: CheckCircleRounded },
  error: { title: "toast_error", Icon: ErrorRounded },
  warning: { title: "toast_warning", Icon: WarningAmberRounded },
  info: { title: "toast_info", Icon: InfoRounded },
};

const SlideFromRight = props => <Slide {...props} direction="left" />;

// Same props as the AFC version, plus an optional action button (e.g. Undo) and dark mode:
//   <CustomSnackbar open severity message onClose anchorOrigin action={{label, onClick}} dark />
export default function CustomSnackbar({
  open, severity = "info", message, onClose, action, dark,
  anchorOrigin = { vertical: "top", horizontal: "right" },
}) {
  const { t } = useI18n();
  const { title, Icon } = VARIANTS[severity] || VARIANTS.info;
  const duration = action ? AUTO_HIDE + 2000 : AUTO_HIDE; // a little longer when there's something to tap

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return; // a stray click should not hide the message
    if (onClose) onClose(event, reason);
  };

  return (
    <Snackbar anchorOrigin={anchorOrigin} open={open} autoHideDuration={duration} onClose={handleClose}
      slots={{ transition: SlideFromRight }} sx={{ top: { xs: 12, sm: 20 } }}>
      <div className={`afc-toast afc-toast-${severity}${dark ? " dark" : ""}`} role={severity === "error" ? "alert" : "status"}>
        <span className="afc-toast-icon"><Icon fontSize="small" /></span>
        <div className="afc-toast-body">
          <strong className="afc-toast-title">{t(title)}</strong>
          <span className="afc-toast-message">{message}</span>
          {action && (
            <button type="button" className="afc-toast-action" onClick={e => { action.onClick(); handleClose(e, "action"); }}>{action.label}</button>
          )}
        </div>
        <IconButton size="small" className="afc-toast-close" aria-label={t("close")} onClick={e => handleClose(e, "closeButton")}>
          <CloseRounded fontSize="small" />
        </IconButton>
        {/* shrinking bar = time left before the message hides */}
        <span className="afc-toast-progress" style={{ animationDuration: `${duration}ms` }} />
      </div>
    </Snackbar>
  );
}
