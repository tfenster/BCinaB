export class Port {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;

  constructor(values: Object = {}) {
    Object.assign(this, values);
  }
}
