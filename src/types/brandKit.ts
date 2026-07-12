export type ImageFit = "cover" | "contain";

export type BrandTemplate = {
  showLogo: boolean;
  showContact: boolean;
  footerHeight: number;
  outputWidth: number;
  outputHeight: number;
  imageFit: ImageFit;
  imageZoom: number;
  imageX: number;
  imageY: number;
  logoX: number;
  logoY: number;
  logoSize: number;
  nameX: number;
  nameY: number;
  nameSize: number;
  contactX: number;
  contactY: number;
  contactSize: number;
};

export type BrandKit = {
  id: string;
  version: 1;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  contact: string;
  website: string;
  slogan: string;
  logo: string;
  template: BrandTemplate;
};

export type BrandKitNormalizationResult = {
  brandKit: BrandKit;
  repaired: boolean;
  repairs: string[];
};
