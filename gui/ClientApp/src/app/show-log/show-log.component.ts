import "rxjs/add/operator/switchMap";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import * as signalR from "@aspnet/signalr";
import { environment } from "src/environments/environment";

const HUB_URL = environment.hubUrl;

@Component({
  selector: "app-show-log",
  templateUrl: "./show-log.component.html",
  styleUrls: ["./show-log.component.css"]
})
export class ShowLogComponent implements OnInit {
  containerid: string;
  logText: string = "";

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.containerid = this.route.snapshot.paramMap.get("id");
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .build();

    let logGuid: string = "";
    let keepaliveInterval: any;

    connection
      .start()
      .catch(err => console.log(err))
      .then(() => {
        connection.send("getLog", this.containerid);
        keepaliveInterval = setInterval(() => {
          connection.send("keepAlive", logGuid);
        }, 3000);
      });
    connection.on("logGuid", (message: any) => {
      logGuid = message;
    });
    connection.on("log", (message: any) => {
      this.logText += message;
    });
  }
}
