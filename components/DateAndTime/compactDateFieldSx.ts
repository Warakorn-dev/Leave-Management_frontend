/** Tighter padding/font on phones so two date fields fit side by side. */
export const compactDateFieldSx = {
  '& .MuiPickersInputBase-root': {
    px: { xs: 1, sm: 1.75 },
    fontSize: { xs: 13, sm: 14 },
  },
  '& .MuiInputAdornment-root': { ml: { xs: 0.25, sm: 1 } },
  '& .MuiInputAdornment-root .MuiIconButton-root': { p: { xs: 0.25, sm: 1 } },
  '& .MuiInputAdornment-root svg': { fontSize: { xs: 18, sm: 20 } },
};
