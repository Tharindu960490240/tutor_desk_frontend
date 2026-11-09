import { useId } from "react";
import { Box, Typography } from "@mui/material";
import { display } from "../theme.js";

/**
 * TutorDesk mark: a graduation cap that forms a "T", with a gold tassel.
 * variant="tile"  – blue app tile (default)
 * variant="white" – white mark only, for dark or coloured backgrounds
 */
export function LogoMark({ size = 40, variant = "tile", title, sx }) {
  const id = useId().replace(/:/g, "");
  return (
    <Box component="svg" viewBox={variant === "white" ? "60 90 392 336" : "0 0 512 512"}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      sx={{ width: size, height: size, display: "block", flex: "none", ...sx }}>
      {variant === "tile" && (
        <>
          <defs>
            <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1e9be6" /><stop offset="1" stopColor="#01579b" /></linearGradient>
            <linearGradient id={`sh${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".55" stopColor="#fff" stopOpacity="0" /></linearGradient>
          </defs>
          <rect width="512" height="512" rx="120" fill={`url(#bg${id})`} />
          <rect width="512" height="512" rx="120" fill={`url(#sh${id})`} />
        </>
      )}
      <rect x="222" y="196" width="68" height="214" rx="34" fill="#fff" />
      <path d="M256 104 L432 176 Q440 180 432 184 L256 256 L80 184 Q72 180 80 176 Z" fill="#fff" />
      <path d="M256 180 L380 196 L380 268" fill="none" stroke="#ffc94a" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="364" y="262" width="32" height="54" rx="12" fill="#ffc94a" />
      <circle cx="256" cy="180" r="15" fill="#ffc94a" />
    </Box>
  );
}

/** Mark + "TutorDesk" wordmark */
export default function Logo({ size = 40, sx, wordSize }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: `${Math.round(size * 0.28)}px`, ...sx }}>
      <LogoMark size={size} title="TutorDesk" />
      <Typography component="span" aria-hidden sx={{ fontFamily: display, fontWeight: 700, fontSize: wordSize || size * 0.62, letterSpacing: "-.02em", lineHeight: 1 }}>
        Tutor<Box component="span" sx={{ color: "primary.main" }}>Desk</Box>
      </Typography>
    </Box>
  );
}
