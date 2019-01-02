import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { MatNativeDateModule } from "@angular/material";

import { AppComponent } from "./app.component";
import { NavMenuComponent } from "./nav-menu/nav-menu.component";
import { HomeComponent } from "./home/home.component";
import {
  FetchDataComponent,
  ImageSelectDialog,
  TagEntryDialog,
  PullConfirmDialog,
  PullProgressDialog
} from "./fetch-data/fetch-data.component";
import { MaterialModule } from "./material-module";

import { ApiService } from "./api.service";
import { HttpClientModule } from "@angular/common/http";

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    FetchDataComponent,
    ImageSelectDialog,
    TagEntryDialog,
    PullConfirmDialog,
    PullProgressDialog
  ],
  entryComponents: [
    ImageSelectDialog,
    TagEntryDialog,
    PullConfirmDialog,
    PullProgressDialog
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: "ng-cli-universal" }),
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: "", component: FetchDataComponent, pathMatch: "full" }
    ]),
    MaterialModule,
    MatNativeDateModule
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule {}
