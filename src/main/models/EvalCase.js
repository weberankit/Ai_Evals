// Represents one golden-dataset example with expected behavior for eval assertions.
export class EvalCase {
  constructor(data) {
    Object.assign(this, data);
  }
}
