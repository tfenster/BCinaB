import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { Observable } from "rxjs/Observable";
import { catchError } from "rxjs/operators";
import { Container, ContainerInspect } from "./model/container";
import { Image } from "./model/image";
import { Tag, TagHelper } from "./model/tag";
import {
  HttpHeaders,
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { throwError } from "rxjs";
import { BaseData } from "./model/baseData";

const API_URL = environment.apiUrl;

export interface GuiDef {
  image: Image;
  tag: Tag;
  base: BaseData;
}

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  // API: GET /container
  public getAllContainers(): Observable<Container[]> {
    return this.http
      .get<Container[]>(API_URL + "/container")
      .pipe(catchError(this.handleError));
  }

  // API: GET /container/Details
  public getContainerInspect(id: string): Observable<ContainerInspect> {
    return this.http
      .get<ContainerInspect>(API_URL + "/container/details?id=" + id)
      .pipe(catchError(this.handleError));
  }

  // API: POST /container
  public createContainer(guiDef: GuiDef): Observable<any> {
    let env: string[] = [];

    if (guiDef.base.acceptEula) env.push("accept_eula=Y");
    if (!guiDef.base.useSsl) env.push("usessl=N");

    if (guiDef.base.auth != undefined && guiDef.base.auth != "") {
      env.push("auth=" + guiDef.base.auth);
    }
    if (guiDef.base.username != undefined && guiDef.base.username != "") {
      env.push("username=" + guiDef.base.username);
      guiDef.base.username = ""; // forget username for storage in container labels
    }
    if (guiDef.base.password != undefined && guiDef.base.password != "") {
      env.push("password=" + guiDef.base.password);
      guiDef.base.password = ""; // forget password for storage in container labels
    }

    env.push("ExitOnError=N");

    const body = {
      Registry: guiDef.image.Registry,
      Repository: guiDef.image.Repository,
      Image: guiDef.image.Image,
      Tag: TagHelper.resultingTag(guiDef.tag),
      Name: guiDef.base.name,
      Env: env,
      GuiDef: JSON.stringify(guiDef)
    };
    const headers = new HttpHeaders({
      "Content-Type": "application/json; charset=UTF-8"
    });
    let ret: Observable<any> = this.http
      .post(API_URL + "/container", body, { headers, responseType: "text" })
      .pipe(catchError(this.handleError));

    return ret;
  }

  // API: POST /container/stop/id={id}
  public stopContainer(id: string): Observable<any> {
    const body = {};
    const headers = new HttpHeaders({
      "Content-Type": "application/json; charset=UTF-8"
    });
    let ret: Observable<any> = this.http
      .post(API_URL + "/container/stop?id=" + id, body, {
        headers,
        responseType: "text"
      })
      .pipe(catchError(this.handleError));

    return ret;
  }

  // API: POST /container/restart/id={id}
  public restartContainer(id: string): Observable<any> {
    const body = {};
    const headers = new HttpHeaders({
      "Content-Type": "application/json; charset=UTF-8"
    });
    let ret: Observable<any> = this.http
      .post(API_URL + "/container/restart?id=" + id, body, {
        headers,
        responseType: "text"
      })
      .pipe(catchError(this.handleError));

    return ret;
  }

  // API: POST /container/start/id={id}
  public startContainer(id: string): Observable<any> {
    const body = {};
    const headers = new HttpHeaders({
      "Content-Type": "application/json; charset=UTF-8"
    });
    let ret: Observable<any> = this.http
      .post(API_URL + "/container/start?id=" + id, body, {
        headers,
        responseType: "text"
      })
      .pipe(catchError(this.handleError));

    return ret;
  }

  // API: DELETE /container/id={id}
  public deleteContainer(id: string): Observable<any> {
    let ret: Observable<any> = this.http
      .delete(API_URL + "/container?id=" + id)
      .pipe(catchError(this.handleError));

    return ret;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      return throwError("An error occurred:" + error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      return throwError(
        `Backend returned code ${error.status}, ` +
          `message was: ${error.error}`
      );
    }
  }
}
