// All app icons come from react-icons (Material Design set, plus the WhatsApp brand icon).
// Each export keeps the MUI-style API the screens already use: sx, fontSize="small|medium|large|inherit",
// color="primary|error|success|warning|inherit", className – so it also works inside MUI Chips, Tabs, Alerts and Buttons.
import { forwardRef } from "react";
import Box from "@mui/material/Box";
import { MdAccountBalance, MdAccountCircle, MdAdd, MdAddCard, MdAdminPanelSettings, MdArrowBack, MdBadge, MdBeachAccess, MdBlock, MdBolt, MdBugReport, MdCalendarViewMonth, MdCall, MdCampaign, MdCasino, MdCelebration, MdCheck, MdCheckCircle, MdChevronLeft, MdChevronRight, MdClose, MdCloud, MdCloudDone, MdCloudOff, MdCloudSync, MdCoPresent, MdContentCopy, MdCreditCard, MdDarkMode, MdDelete, MdDeleteForever, MdDone, MdDoneAll, MdDownload, MdEdit, MdEditNote, MdEmail, MdError, MdEvent, MdEventAvailable, MdEventBusy, MdEventRepeat, MdFactCheck, MdFamilyRestroom, MdFeedback, MdFilterAltOff, MdForum, MdGroup, MdGroupAdd, MdGroupOff, MdGroups, MdHistory, MdHowToReg, MdInbox, MdInfo, MdInsights, MdLightMode, MdLocationOn, MdLock, MdLockReset, MdLogout, MdMail, MdMarkEmailRead, MdMarkEmailUnread, MdMenu, MdMenuBook, MdMoreVert, MdNotifications, MdPassword, MdPayments, MdPendingActions, MdPerson, MdPersonAdd, MdPersonSearch, MdPlayCircle, MdPublic, MdRadioButtonUnchecked, MdReceipt, MdReceiptLong, MdRemove, MdReply, MdReportProblem, MdSave, MdSavings, MdSchedule, MdScience, MdSearch, MdSell, MdSend, MdSettings, MdSettingsBackupRestore, MdShield, MdSmartphone, MdSms, MdSpaceDashboard, MdStopCircle, MdStorage, MdThumbUp, MdTimelapse, MdToday, MdTranslate, MdTrendingDown, MdUndo, MdUpcoming, MdUploadFile, MdVisibility, MdVisibilityOff, MdVpnKey, MdWarningAmber, MdWavingHand, MdWeekend } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";

const SIZES = { small: "1.25rem", medium: "1.5rem", large: "2.1875rem", inherit: "inherit" };
const COLORS = { primary: "primary.main", secondary: "secondary.main", error: "error.main", warning: "warning.main", info: "info.main", success: "success.main", action: "action.active", disabled: "action.disabled" };

function wrap(RI, name) {
  const Icon = forwardRef(function Icon({ fontSize = "medium", color, sx, className, titleAccess, ...rest }, ref) {
    return (
      <Box component={RI} ref={ref} focusable="false" aria-hidden={titleAccess ? undefined : true} role={titleAccess ? "img" : undefined} aria-label={titleAccess}
        className={["MuiSvgIcon-root", className].filter(Boolean).join(" ")}
        sx={{ width: "1em", height: "1em", display: "inline-block", flexShrink: 0, userSelect: "none", fill: "currentColor",
          fontSize: SIZES[fontSize] || fontSize, color: COLORS[color] || (color === "inherit" ? "inherit" : undefined), ...sx }}
        {...rest} />
    );
  });
  Icon.displayName = name;
  Icon.muiName = "SvgIcon"; // lets MUI treat it like its own icons
  return Icon;
}

export const AccountBalanceRounded = wrap(MdAccountBalance, "AccountBalanceRounded");
export const AccountCircleRounded = wrap(MdAccountCircle, "AccountCircleRounded");
export const AddCardRounded = wrap(MdAddCard, "AddCardRounded");
export const AddRounded = wrap(MdAdd, "AddRounded");
export const AdminPanelSettingsRounded = wrap(MdAdminPanelSettings, "AdminPanelSettingsRounded");
export const ArrowBackRounded = wrap(MdArrowBack, "ArrowBackRounded");
export const BadgeRounded = wrap(MdBadge, "BadgeRounded");
export const BlockRounded = wrap(MdBlock, "BlockRounded");
export const BoltRounded = wrap(MdBolt, "BoltRounded");
export const BugReportRounded = wrap(MdBugReport, "BugReportRounded");
export const CalendarViewMonthRounded = wrap(MdCalendarViewMonth, "CalendarViewMonthRounded");
export const CallRounded = wrap(MdCall, "CallRounded");
export const CampaignRounded = wrap(MdCampaign, "CampaignRounded");
export const CasinoRounded = wrap(MdCasino, "CasinoRounded");
export const CelebrationRounded = wrap(MdCelebration, "CelebrationRounded");
export const CheckCircleRounded = wrap(MdCheckCircle, "CheckCircleRounded");
export const CheckRounded = wrap(MdCheck, "CheckRounded");
export const ChevronLeftRounded = wrap(MdChevronLeft, "ChevronLeftRounded");
export const ChevronRightRounded = wrap(MdChevronRight, "ChevronRightRounded");
export const CloseRounded = wrap(MdClose, "CloseRounded");
export const MenuRounded = wrap(MdMenu, "MenuRounded");
export const MenuBookRounded = wrap(MdMenuBook, "MenuBookRounded");
export const CloudDoneRounded = wrap(MdCloudDone, "CloudDoneRounded");
export const CloudOffRounded = wrap(MdCloudOff, "CloudOffRounded");
export const CloudRounded = wrap(MdCloud, "CloudRounded");
export const CloudSyncRounded = wrap(MdCloudSync, "CloudSyncRounded");
export const CoPresentRounded = wrap(MdCoPresent, "CoPresentRounded");
export const ContentCopyRounded = wrap(MdContentCopy, "ContentCopyRounded");
export const CreditCardRounded = wrap(MdCreditCard, "CreditCardRounded");
export const DarkModeRounded = wrap(MdDarkMode, "DarkModeRounded");
export const DeleteForeverRounded = wrap(MdDeleteForever, "DeleteForeverRounded");
export const DeleteRounded = wrap(MdDelete, "DeleteRounded");
export const DoneAllRounded = wrap(MdDoneAll, "DoneAllRounded");
export const DoneRounded = wrap(MdDone, "DoneRounded");
export const DownloadRounded = wrap(MdDownload, "DownloadRounded");
export const EditNoteRounded = wrap(MdEditNote, "EditNoteRounded");
export const EditRounded = wrap(MdEdit, "EditRounded");
export const EmailRounded = wrap(MdEmail, "EmailRounded");
export const ErrorRounded = wrap(MdError, "ErrorRounded");
export const EventAvailableRounded = wrap(MdEventAvailable, "EventAvailableRounded");
export const EventRounded = wrap(MdEvent, "EventRounded");
export const FactCheckRounded = wrap(MdFactCheck, "FactCheckRounded");
export const FamilyRestroomRounded = wrap(MdFamilyRestroom, "FamilyRestroomRounded");
export const FeedbackRounded = wrap(MdFeedback, "FeedbackRounded");
export const FilterAltOffRounded = wrap(MdFilterAltOff, "FilterAltOffRounded");
export const ForumRounded = wrap(MdForum, "ForumRounded");
export const GroupAddRounded = wrap(MdGroupAdd, "GroupAddRounded");
export const GroupOffRounded = wrap(MdGroupOff, "GroupOffRounded");
export const GroupRounded = wrap(MdGroup, "GroupRounded");
export const GroupsRounded = wrap(MdGroups, "GroupsRounded");
export const HistoryRounded = wrap(MdHistory, "HistoryRounded");
export const HowToRegRounded = wrap(MdHowToReg, "HowToRegRounded");
export const InboxRounded = wrap(MdInbox, "InboxRounded");
export const InfoRounded = wrap(MdInfo, "InfoRounded");
export const InsightsRounded = wrap(MdInsights, "InsightsRounded");
export const LightModeRounded = wrap(MdLightMode, "LightModeRounded");
export const LocationOnRounded = wrap(MdLocationOn, "LocationOnRounded");
export const LockResetRounded = wrap(MdLockReset, "LockResetRounded");
export const LockRounded = wrap(MdLock, "LockRounded");
export const LogoutRounded = wrap(MdLogout, "LogoutRounded");
export const MailRounded = wrap(MdMail, "MailRounded");
export const MarkEmailReadRounded = wrap(MdMarkEmailRead, "MarkEmailReadRounded");
export const MarkEmailUnreadRounded = wrap(MdMarkEmailUnread, "MarkEmailUnreadRounded");
export const MoreVertRounded = wrap(MdMoreVert, "MoreVertRounded");
export const NotificationsRounded = wrap(MdNotifications, "NotificationsRounded");
export const PasswordRounded = wrap(MdPassword, "PasswordRounded");
export const PaymentsRounded = wrap(MdPayments, "PaymentsRounded");
export const PendingActionsRounded = wrap(MdPendingActions, "PendingActionsRounded");
export const PersonAddRounded = wrap(MdPersonAdd, "PersonAddRounded");
export const PersonRounded = wrap(MdPerson, "PersonRounded");
export const PersonSearchRounded = wrap(MdPersonSearch, "PersonSearchRounded");
export const PublicRounded = wrap(MdPublic, "PublicRounded");
export const RadioButtonUncheckedRounded = wrap(MdRadioButtonUnchecked, "RadioButtonUncheckedRounded");
export const ReceiptLongRounded = wrap(MdReceiptLong, "ReceiptLongRounded");
export const ReceiptRounded = wrap(MdReceipt, "ReceiptRounded");
export const RemoveRounded = wrap(MdRemove, "RemoveRounded");
export const ReplyRounded = wrap(MdReply, "ReplyRounded");
export const ReportProblemRounded = wrap(MdReportProblem, "ReportProblemRounded");
export const SaveRounded = wrap(MdSave, "SaveRounded");
export const SavingsRounded = wrap(MdSavings, "SavingsRounded");
export const ScheduleRounded = wrap(MdSchedule, "ScheduleRounded");
export const ScienceRounded = wrap(MdScience, "ScienceRounded");
export const SearchRounded = wrap(MdSearch, "SearchRounded");
export const SellRounded = wrap(MdSell, "SellRounded");
export const SendRounded = wrap(MdSend, "SendRounded");
export const SettingsBackupRestoreRounded = wrap(MdSettingsBackupRestore, "SettingsBackupRestoreRounded");
export const SettingsRounded = wrap(MdSettings, "SettingsRounded");
export const ShieldRounded = wrap(MdShield, "ShieldRounded");
export const SmartphoneRounded = wrap(MdSmartphone, "SmartphoneRounded");
export const SmsRounded = wrap(MdSms, "SmsRounded");
export const SpaceDashboardRounded = wrap(MdSpaceDashboard, "SpaceDashboardRounded");
export const StorageRounded = wrap(MdStorage, "StorageRounded");
export const ThumbUpRounded = wrap(MdThumbUp, "ThumbUpRounded");
export const TimelapseRounded = wrap(MdTimelapse, "TimelapseRounded");
export const TodayRounded = wrap(MdToday, "TodayRounded");
export const TranslateRounded = wrap(MdTranslate, "TranslateRounded");
export const TrendingDownRounded = wrap(MdTrendingDown, "TrendingDownRounded");
export const UndoRounded = wrap(MdUndo, "UndoRounded");
export const UpcomingRounded = wrap(MdUpcoming, "UpcomingRounded");
export const UploadFileRounded = wrap(MdUploadFile, "UploadFileRounded");
export const VisibilityOffRounded = wrap(MdVisibilityOff, "VisibilityOffRounded");
export const VisibilityRounded = wrap(MdVisibility, "VisibilityRounded");
export const VpnKeyRounded = wrap(MdVpnKey, "VpnKeyRounded");
export const WarningAmberRounded = wrap(MdWarningAmber, "WarningAmberRounded");
export const WavingHandRounded = wrap(MdWavingHand, "WavingHandRounded");
export const WeekendRounded = wrap(MdWeekend, "WeekendRounded");
export const WhatsApp = wrap(FaWhatsapp, "WhatsApp");
export const EventBusyRounded = wrap(MdEventBusy, "EventBusyRounded");
export const EventRepeatRounded = wrap(MdEventRepeat, "EventRepeatRounded");
export const BeachAccessRounded = wrap(MdBeachAccess, "BeachAccessRounded");
export const StopCircleRounded = wrap(MdStopCircle, "StopCircleRounded");
export const PlayCircleRounded = wrap(MdPlayCircle, "PlayCircleRounded");
