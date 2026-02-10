// Font palette — single source of truth for site-wide fonts.
// Change the values below to update every screen. CSS variables (--fontHeading, etc.)
// are set from this file in main.jsx, so you only need to edit here.
//
// If you add a custom font file: add @font-face in globals.css, then put the
// font name (same as in font-family) in one of the strings below.

export const fontHeading = "'Poetsen One', Arial, Helvetica, sans-serif";
export const fontBody = 'Inter, Arial, Helvetica, sans-serif';
export const fontMono = 'Fira Mono, Menlo, Monaco, Consolas, monospace';
export const fontAccent = 'Playfair Display, serif';

export default {
  fontHeading,
  fontBody,
  fontMono,
  fontAccent,
}; 