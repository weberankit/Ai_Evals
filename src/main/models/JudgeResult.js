// Converts parsed judge JSON into a predictable result object for validation/reporting.
export class JudgeResult {
  constructor(data) {
    Object.assign(this, data);
  }
}
