import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { MatSort, MatTableDataSource, MatSnackBar } from "@angular/material";
import { ApiService } from "../api.service";
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
  displayedColumns: string[] = ["Name", "State", "Status", "Image", "Actions"];
  expandedRow: Container | null;
  containersObservable: Observable<Container[]>;
  containers: MatTableDataSource<Container>;
  selectedImage: Image;
  images: Image[] = ImageHelper.GetAll();
  tag: Tag;
  showAlert: boolean = false;
  alertMessage: string = "";

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private api: ApiService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
    this.containers = new MatTableDataSource<Container>();
  }

  ngOnInit() {
    this.getContainers();
    this.containers.sort = this.sort;
  }

  getContainers() {
    this.api.getAllContainers().subscribe(containers => {
      this.containers.data = containers.map(
        container => new Container(container)
      );
    });
  }

  applyFilter(filterValue: string) {
    this.containers.filter = filterValue.trim().toLowerCase();
  }

  openImageSelectDialog(): void {
    const dialogRef = this.dialog.open(ImageSelectDialog, {
      width: "650px",
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
      width: "650px",
      data: { selectedImage: this.selectedImage }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.tag = result;
        this.createContainer();
      }
    });
  }

  createContainer(): void {
    this.api.createContainer(this.selectedImage, this.tag).subscribe(
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

  deleteContainer(id: string, $event: any): void {
    $event.stopPropagation();
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

  openPullConfirmDialog(): void {
    const dialogRef = this.dialog.open(PullConfirmDialog, {
      width: "650px",
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

    connection
      .start()
      .catch(err => console.log(err))
      .then(() => {
        connection.send(
          "pullImage",
          ImageHelper.GetFqin(this.selectedImage),
          TagHelper.resultingTag(this.tag)
        );
      });
    connection.on("pullProgress", (message: any) => {
      if (first) {
        first = false;
      } else {
        if (!progressIDs.includes(message.id)) {
          progressIDs.push(message.id);
          dialogRef.componentInstance.progresses.push(message);
        }
        let currProgress = dialogRef.componentInstance.progresses.find(
          p => p.id == message.id
        );
        currProgress.progressDetail = message.progressDetail;
        currProgress.progress = message.progress;
        currProgress.status = message.status;
      }
    });
    connection.on("pullFinished", () => {
      dialogRef.close();
      this.snackBar.open("Image pulled", "Close");
      this.createContainer();
    });
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
