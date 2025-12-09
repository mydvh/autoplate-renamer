import { AnalysisResult, PlateColor, Viewpoint } from "../types";

export const generateNewFilename = (originalName: string, result: AnalysisResult): string => {
  const extension = originalName.slice((Math.max(0, originalName.lastIndexOf(".")) || Infinity) + 1);
  const extString = extension ? `.${extension}` : '';

  // Rule 1: Determine Color Character
  // White -> T, Yellow -> V, Blue -> X, Others -> T
  let colorChar = 'T';
  switch (result.plateColor) {
    case PlateColor.WHITE:
      colorChar = 'T';
      break;
    case PlateColor.YELLOW:
      colorChar = 'V';
      break;
    case PlateColor.BLUE:
      colorChar = 'X';
      break;
    default:
      colorChar = 'T';
      break;
  }

  // Rule 2: Determine Prefix based on Viewpoint
  // Front -> "BS" + Plate + Color
  // Rear -> Plate + Color
  let newBaseName = "";
  const cleanPlate = result.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (result.viewpoint === Viewpoint.FRONT) {
    newBaseName = `BS${cleanPlate}${colorChar}`;
  } else {
    // Covers REAR and UNKNOWN (defaulting to REAR logic if standard is strict, or just applying basic pattern)
    // Prompt implies specific rule for "Rear", doesn't specify unknown, so we treat Rear as the base case without prefix.
    newBaseName = `${cleanPlate}${colorChar}`;
  }

  return `${newBaseName}${extString}`;
};
