import assert from "node:assert/strict";
import { test } from "node:test";
import { existingApplicationMessage } from "../lib/creator-application-status";

test("existing applications explain the next action for each review outcome", () => {
  assert.match(existingApplicationMessage("Pending"), /awaiting review/);
  assert.match(existingApplicationMessage("Pending"), /do not need to upload/);
  assert.match(existingApplicationMessage("Accepted"), /accepted.*dashboard/);
  assert.match(existingApplicationMessage("Need Proof"), /additional proof.*Contact us/);
  assert.match(existingApplicationMessage("Rejected"), /not approved.*Contact us/);
});

test("duplicate submissions do not claim the new upload was saved or reveal review status", () => {
  const message = existingApplicationMessage();
  assert.match(message, /did not replace it/);
  assert.match(message, /Sign in with the application email/);
  assert.doesNotMatch(message, /awaiting review|has been accepted|not approved/);
  assert.equal(existingApplicationMessage("unexpected"), message);
});
