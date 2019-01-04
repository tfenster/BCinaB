import { Image } from "./image";

export interface Tag {
  Major: string;
  Cu: string;
  Country: string;
  Build: string;
  Os: string;
  Image?: Image;
}

export class TagHelper {
  static resultingTag(tag: Tag): string {
    let retTag: string = "";
    if (tag.Build != "") retTag += tag.Build;
    if (tag.Major != "") retTag += tag.Major;
    if (tag.Cu != "") retTag += (retTag != "" ? "-" : "") + tag.Cu;
    if (tag.Country != "") retTag += (retTag != "" ? "-" : "") + tag.Country;
    if (tag.Os != "") retTag += (retTag != "" ? "-" : "") + "ltsc" + tag.Os;
    if (retTag == "") retTag = ":latest";
    
    return retTag;
  }
}
