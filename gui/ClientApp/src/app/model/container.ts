import { Port } from "./port";
import { GuiDef } from "../api.service";

export class Container {
  Id: string;
  ShortId: string;
  Names: string[];
  Name: string;
  Image: string;
  State: string;
  Status: string;
  Ports: Port[];
  PortList: string;
  Command: string;
  Created: string;
  DisplayCreated: string;
  Labels: any;
  DisplayLabels: string[] = [];
  IPs: string[] = [];
  GuiDef: GuiDef;

  constructor(values: Object = {}) {
    Object.assign(this, values);
    this.Name = this.Names[0].substring(1);
    this.ShortId = this.Id.substring(0, 10);
    this.DisplayCreated =
      this.Created.substring(0, 10) + " " + this.Created.substring(11, 19);
    let sep = "";
    this.PortList = "";
    this.Ports.forEach(Port => {
      this.PortList += sep;
      if (Port.PublicPort) {
        this.PortList += Port.PublicPort + ":";
      }
      this.PortList += Port.PrivatePort;
      sep = ", ";
    });

    for (var key in this.Labels) {
      if (
        this.Labels.hasOwnProperty(key) &&
        key != "eula" &&
        key != "legal" &&
        key != "bcinab.guidef" &&
        this.Labels[key] != ""
      ) {
        this.DisplayLabels.push(key + ": " + this.Labels[key]);
      }
    }

    if (this.Labels.hasOwnProperty("bcinab.guidef")) {
      this.GuiDef = JSON.parse(this.Labels["bcinab.guidef"]);
    }

    let networks = values["NetworkSettings"]["Networks"];
    for (var network in networks) {
      this.IPs.push(networks[network]["IPAddress"]);
    }
  }

  webclientURL(): string {
    let url = "https://";
    if (!this.GuiDef.base.useSsl) url = "http://";
    url += this.IPs[0] + "/NAV";
    return url;
  }
}
