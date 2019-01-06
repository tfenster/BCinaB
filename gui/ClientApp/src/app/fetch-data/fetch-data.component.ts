import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { MatSort, MatTableDataSource, MatSnackBar } from "@angular/material";
import { ApiService, GuiDef } from "../api.service";
import { Container } from "../model/container";
import { Observable } from "rxjs";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "@angular/animations";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Image, ImageHelper } from "../model/image";
import { Tag, TagHelper } from "../model/tag";
import * as signalR from "@aspnet/signalr";
import { environment } from "src/environments/environment";
import { ProgressMessage, Progress } from "../model/progressMessage";
import { BaseData } from "../model/baseData";
import { RegistryCredentials } from "../model/registryCredentials";

export interface ImageDialogData {
  images: Image[];
}

export interface TagEntryDialogData {
  selectedImage: Image;
}

export interface PullConfirmDialogData {
  selectedImage: Image;
  tag: Tag;
}

export interface DeleteConfirmDialogData {
  container: Container;
}

export interface BaseEntryDialogData {
  base: BaseData;
  apiNavcontainerhelperEnabled: boolean;
}

const HUB_URL = environment.hubUrl;

@Component({
  selector: "app-fetch-data",
  styleUrls: ["fetch-data.component.css"],
  templateUrl: "fetch-data.component.html",
  animations: [
    trigger("detailExpand", [
      state(
        "collapsed",
        style({ height: "0px", minHeight: "0", display: "none" })
      ),
      state("expanded", style({ height: "*" })),
      transition("expanded <=> collapsed", animate("0.3s"))
    ])
  ]
})
export class FetchDataComponent implements OnInit {
  displayedColumns: string[] = ["Name", "State", "Image", "Actions"];
  expandedRow: Container | null;
  containersObservable: Observable<Container[]>;
  containers: MatTableDataSource<Container>;
  selectedImage: Image;
  images: Image[] = ImageHelper.GetAll();
  tag: Tag;
  base: BaseData;
  showAlert: boolean = false;
  alertMessage: string = "";
  apiNavcontainerhelperEnabled: boolean = false;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private api: ApiService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    this.containers = new MatTableDataSource<Container>();
    api.getNavcontainerhelper().subscribe(result => {
      this.apiNavcontainerhelperEnabled = result === "true";
    });
  }

  ngOnInit() {
    this.getContainers();
    this.containers.sort = this.sort;
  }

  getContainers() {
    this.api.getAllContainers().subscribe(containers => {
      this.containers.data = containers.map(
        container => new Container(container, this.api)
      );
    });
  }

  applyFilter(filterValue: string) {
    this.containers.filter = filterValue.trim().toLowerCase();
  }

  openRegCredDialog(): void {
    const dialogRef = this.dialog.open(RegCredDialog, {
      width: "75%",
      data: { images: this.images }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.api
          .saveCredentials(result)
          .subscribe(
            () => this.snackBar.open("Credentials saved", "close"),
            e => this.snackBar.open("Failed to save credentials: " + e, "close")
          );
      }
    });
  }

  openImageSelectDialog(): void {
    const dialogRef = this.dialog.open(ImageSelectDialog, {
      width: "75%",
      data: { images: this.images }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.selectedImage = result;
        this.openTagEntryDialog();
      }
    });
  }

  openTagEntryDialog(): void {
    const dialogRef = this.dialog.open(TagEntryDialog, {
      width: "75%",
      data: { selectedImage: this.selectedImage }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.tag = result;
        this.openBaseEntryDialog();
      }
    });
  }

  openBaseEntryDialog(): void {
    const dialogRef = this.dialog.open(BaseEntryDialog, {
      width: "75%",
      data: {
        base: {
          name: "",
          acceptEula: false,
          useSsl: true
        },
        apiNavcontainerhelperEnabled: this.apiNavcontainerhelperEnabled
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.base = result;
        this.createContainer();
      }
    });
  }

  createContainer(): void {
    let guiDef: GuiDef = {
      image: this.selectedImage,
      tag: this.tag,
      base: this.base
    };
    this.api.createContainer(guiDef).subscribe(
      response => {
        if (response == "image not available locally") {
          this.openPullConfirmDialog();
        } else {
          this.snackBar.open("Container created", "close");
          this.getContainers();
        }
      },
      e => this.showError(e)
    );
  }

  stopContainer(id: string, $event: any): void {
    $event.stopPropagation();
    this.api.stopContainer(id).subscribe(
      response => {
        this.snackBar.open("Container stopped", "close");
        this.getContainers();
      },
      e => this.showError(e)
    );
  }

  restartContainer(id: string, $event: any): void {
    $event.stopPropagation();
    this.api.restartContainer(id).subscribe(
      response => {
        this.snackBar.open("Container restarted", "close");
        this.getContainers();
      },
      e => this.showError(e)
    );
  }

  startContainer(id: string, $event: any): void {
    $event.stopPropagation();
    this.api.startContainer(id).subscribe(
      response => {
        this.snackBar.open("Container started", "close");
        this.getContainers();
      },
      e => this.showError(e)
    );
  }

  deleteContainer(id: string): void {
    this.api.deleteContainer(id).subscribe(
      response => {
        this.snackBar.open("Container deleted", "close");
        this.getContainers();
      },
      e => this.showError(e)
    );
  }

  private showError(e: any): void {
    {
      this.showAlert = true;
      this.alertMessage = e;
    }
  }

  openDeleteConfirmDialog(selectedContainer: Container, $event: any): void {
    $event.stopPropagation();
    const dialogRef = this.dialog.open(DeleteConfirmDialog, {
      width: "75%",
      data: { container: selectedContainer.Name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) this.deleteContainer(selectedContainer.Id);
    });
  }

  openPullConfirmDialog(): void {
    const dialogRef = this.dialog.open(PullConfirmDialog, {
      width: "75%",
      data: { selectedImage: this.selectedImage, tag: this.tag }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != null) this.pullImage();
    });
  }

  // signalR progressHub
  pullImage(): void {
    let first: boolean = true;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .build();

    const dialogRef = this.dialog.open(PullProgressDialog, {
      width: "90%",
      height: "90%"
    });

    let progressIDs: string[] = [];
    let pullGuid: string = "";
    let keepaliveInterval: any;

    connection
      .start()
      .catch(err => console.log(err))
      .then(() => {
        connection.send(
          "pullImage",
          ImageHelper.GetFqin(this.selectedImage),
          TagHelper.resultingTag(this.tag),
          this.selectedImage.Registry
        );
        keepaliveInterval = setInterval(() => {
          connection.send("keepAlive", pullGuid);
        }, 3000);
      });
    connection.on("pullProgress", (message: any) => {
      if (first) {
        first = false;
      } else {
        if (!progressIDs.includes(message.id)) {
          progressIDs.push(message.id);
          dialogRef.componentInstance.progresses.push(message);
        }
        if (
          dialogRef.componentInstance === undefined ||
          dialogRef.componentInstance === null
        ) {
          // probably the dialog was closed
          this.snackBar.open("Image pull was cancelled", "Close");
          connection.off("pullProgress");
          connection.off("pullFinished");
          clearInterval(keepaliveInterval);
        }
        let currProgress = dialogRef.componentInstance.progresses.find(
          p => p.id == message.id
        );
        currProgress.progressDetail = message.progressDetail;
        currProgress.progress = message.progress;
        currProgress.status = message.status;
      }
    });
    connection.on("pullGuid", (message: any) => {
      pullGuid = message;
    });
    connection.on("pullFinished", () => {
      dialogRef.close();
      this.snackBar.open("Image pulled", "Close");
      this.createContainer();
      clearInterval(keepaliveInterval);
    });
  }
}

@Component({
  selector: "app-delete-confirm-dialog",
  templateUrl: "dialogs/delete-confirm.dialog.html"
})
export class DeleteConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<PullConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmDialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "app-pull-confirm-dialog",
  templateUrl: "dialogs/pull-confirm.dialog.html"
})
export class PullConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<PullConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: PullConfirmDialogData,
    private api: ApiService
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  getFqin(image: Image): string {
    return ImageHelper.GetFqin(image);
  }

  getResultingTag(tag: Tag): string {
    return TagHelper.resultingTag(tag);
  }
}

@Component({
  selector: "app-image-select-dialog",
  styleUrls: ["dialogs/image-select.dialog.css"],
  templateUrl: "dialogs/image-select.dialog.html"
})
export class ImageSelectDialog {
  selectedImage: string;

  constructor(
    public dialogRef: MatDialogRef<ImageSelectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ImageDialogData
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "app-registry-credentials-dialog",
  styleUrls: ["dialogs/registry-credentials.dialog.css"],
  templateUrl: "dialogs/registry-credentials.dialog.html"
})
export class RegCredDialog {
  regCreds: RegistryCredentials = {
    password: "",
    registry: "",
    username: ""
  };

  constructor(public dialogRef: MatDialogRef<RegCredDialog>) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "tag-entry-dialog",
  styleUrls: ["dialogs/tag-entry.dialog.css"],
  templateUrl: "dialogs/tag-entry.dialog.html"
})
export class TagEntryDialog {
  tag: Tag = {
    Build: "",
    Cu: "",
    Country: "",
    Major: "",
    Os: ""
  };

  constructor(
    public dialogRef: MatDialogRef<TagEntryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TagEntryDialogData
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  resultingTag(): string {
    return TagHelper.resultingTag(this.tag);
  }
}

@Component({
  selector: "base-entry-dialog",
  styleUrls: ["dialogs/base-entry.dialog.css"],
  templateUrl: "dialogs/base-entry.dialog.html"
})
export class BaseEntryDialog {
  constructor(
    public dialogRef: MatDialogRef<BaseEntryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: BaseEntryDialogData
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "pull-progress-dialog",
  templateUrl: "dialogs/pull-progress.dialog.html"
})
export class PullProgressDialog {
  public progresses: ProgressMessage[] = [];

  constructor(public dialogRef: MatDialogRef<PullProgressDialog>) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  percentage(progress: ProgressMessage): number {
    if (
      progress == undefined ||
      progress.progressDetail == undefined ||
      progress.progressDetail.current == undefined ||
      progress.progressDetail.total == undefined
    )
      return 100;
    return (
      (progress.progressDetail.current / progress.progressDetail.total) * 100
    );
  }

  text(progress: ProgressMessage): string {
    let progresstext = "";
    if (progress.progress != undefined)
      progresstext = progress.progress.substring(
        progress.progress.indexOf("]") + 1
      );
    return progress.status + ": " + progresstext + " (" + progress.id + ")";
  }
}
