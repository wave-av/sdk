/**
 * The SDK's own version, sent in the User-Agent header so gateway logs and support tickets can tell
 * which SDK release made a call. Kept equal to package.json "version" by
 * src/__tests__/version.test.ts: bump both together, or the test fails.
 */
export const SDK_VERSION = "3.0.0";
