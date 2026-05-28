export type VersionType = "release" | "beta" | "dev";

const RELEASE_REGEX = /^v\d+\.\d+\.\d+$/;
const BETA_REGEX = /^v\d+\.\d+\.\d+(\.\d+)?b$/;

export function validateVersionFormat(version: string, type: VersionType): boolean {
  switch (type) {
    case "release":
      return RELEASE_REGEX.test(version);
    case "beta":
      return BETA_REGEX.test(version);
    case "dev":
      return version.length > 0;
    default:
      return false;
  }
}

export function getVersionTypeFromString(str: string): VersionType | null {
  if (str === "release" || str === "beta" || str === "dev") {
    return str;
  }
  return null;
}
