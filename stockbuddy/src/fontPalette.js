// Font palette — single source of truth for site-wide fonts.
// Change the values below to update every screen. CSS variables (--fontHeading, etc.)
// are set from this file in main.jsx, so you only need to edit here.
//
// If you add a custom font file: add @font-face in globals.css, then put the
// font name (same as in font-family) in one of the strings below.

export const fontHeading = "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const fontBody = "'Helvetica Neue', Helvetica, Arial, sans-serif";
export const fontMono = "'Helvetica Neue', Helvetica, Arial, monospace";
export const fontAccent = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export default {
  fontHeading,
  fontBody,
  fontMono,
  fontAccent,
}; 