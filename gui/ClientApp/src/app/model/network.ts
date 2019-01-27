export class Network {
  Id: string;
  Name: string;
  Driver: string;

  constructor(values: Object = {}) {
    Object.assign(this, values);
  }
}
