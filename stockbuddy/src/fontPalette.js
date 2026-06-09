// Font palette — single source of truth for site-wide fonts.
// Change the values below to update every screen. CSS variables (--fontHeading, etc.)
// are set from this file in main.jsx, so you only need to edit here.
//
// If you add a custom font file: add @font-face in globals.css, then put the
// font name (same as in font-family) in one of the strings below.

export const fontHeading = "'Creato Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const fontBody = "'Helvetica Neue', Helvetica, Arial, sans-serif";
// Real monospace stack for tabular figures — the signature of the Terminal
// Editorial look. Resolves to SF Mono (Apple), Cascadia/Consolas (Windows),
// then generic mono. Pair with `font-variant-numeric: tabular-nums`.
export const fontMono = "'SFMono-Regular', ui-monospace, 'Cascadia Mono', 'Cascadia Code', 'Consolas', 'Menlo', 'Liberation Mono', monospace";
export const fontAccent = "'Creato Display', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export default {
  fontHeading,
  fontBody,
  fontMono,
  fontAccent,
};
