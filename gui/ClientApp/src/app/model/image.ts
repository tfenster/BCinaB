export interface Image {
  Id: string;
  Registry: string;
  Repository: string;
  Image: string;
  CuBased: boolean;
  NeedsMajor: boolean;
  Label: string;
}

export class ImageHelper {
  static GetFqin(image: Image): string {
    let reg = "";
    let repo = "";
    if (image.Registry != null) reg = image.Registry + "/";
    if (image.Repository != null) repo = image.Repository + "/";
    return reg + repo + image.Image;
  }

  static GetAll(): Image[] {
    return [
      {
        Id: "dynamics-nav",
        Registry: null,
        Repository: "microsoft",
        Image: "dynamics-nav",
        Label: "Dynamics NAV (dynamics-nav)",
        CuBased: true,
        NeedsMajor: true
      },
      {
        Id: "bcsandbox",
        Registry: "mcr.microsoft.com",
        Repository: "businesscentral",
        Image: "sandbox",
        Label: "Current D365 Business Central Cloud (businesscentral/sandbox)",
        CuBased: false,
        NeedsMajor: false
      },
      {
        Id: "bconprem",
        Registry: "mcr.microsoft.com",
        Repository: "businesscentral",
        Image: "onprem",
        Label: "D365 Business Central On-Premises (businesscentral/onprem)",
        CuBased: true,
        NeedsMajor: false
      },
      {
        Id: "bcsandbox-insider",
        Registry: "bcinsider.azurecr.io",
        Repository: null,
        Image: "bcsandbox",
        Label: "D365 Business Central Cloud next minor (insider bcsandbox)",
        CuBased: false,
        NeedsMajor: false
      },
      {
        Id: "bcsandbox-master",
        Registry: "bcinsider.azurecr.io",
        Repository: null,
        Image: "bcsandbox-master",
        Label:
          "D365 Business Central Cloud next major (insider bcsandbox-master)",
        CuBased: false,
        NeedsMajor: false
      } /*,
      {
        Id: "nanoserver",
        Registry: "mcr.microsoft.com",
        Repository: "windows",
        Image: "nanoserver:1809",
        Label: "Nanoserver",
        CuBased: false,
        NeedsMajor: false
      }*/
    ];
  }
}
