import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";

export function checkAnchorError(error: any, errMsg: string) {
  if (error instanceof anchor.AnchorError) {
    assert.equal((error as anchor.AnchorError).error.errorMessage, errMsg);
  } else if (error.message && error.message.includes(errMsg)) {
    return;
  } else if (error.logs && Array.isArray(error.logs)) {
    const logsStr = error.logs.join(" ");
    if (logsStr.includes(errMsg)) {
      return;
    }
  } else {
    const errorStr = JSON.stringify(error);
    assert.fail(`Expected error message containing "${errMsg}", got: ${error.message || errorStr}`);
  }
}

export async function doAndCheckError(promise: Promise<any>, errMsg: string) {
  try {
    await promise;
    assert.fail(`Should have failed with error: ${errMsg}`);
  } catch (error: any) {
    checkAnchorError(error, errMsg);
  }
}

export * from "../scripts/utils";
