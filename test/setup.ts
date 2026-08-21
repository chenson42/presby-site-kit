// Runs after every test — unmounts whatever the previous test rendered into
// jsdom's shared `document`. Without this, a test file with several `render()`
// calls accumulates DOM across tests (e.g. two <h1>s where a test expects
// one), which is a false failure, not a real one.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
