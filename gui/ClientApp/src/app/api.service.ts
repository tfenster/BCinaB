import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { Observable } from "rxjs/Observable";
import { catchError } from "rxjs/operators";
import { Container } from "./model/container";
import { Image } from "./model/image";
import { Tag, TagHelper } from "./model/tag";
import {
  HttpHeaders,
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { throwError } from "rxjs";

const API_URL = environment.apiUrl;

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  // API: GET /container
  public getAllContainers(): Observable<Container[]> {
    return this.http
      .get<Container[]>(API_URL + "/container")
      .pipe(catchError(this.handleError));
  }

  // API: POST /container
  public createContainer(image: Image, tag: Tag): Observable<any> {
    const body = {
      Registry: image.Registry,
      Repository: image.Repository,
      Image: image.Image,
      Tag: TagHelper.resultingTag(tag),
      AcceptEula: true,
      BreakOnError: false
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
