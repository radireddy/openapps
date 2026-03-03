export const toPng = async (): Promise<string> => 'data:image/png;base64,';
export const toJpeg = async (): Promise<string> => 'data:image/jpeg;base64,';
export const toSvg = async (): Promise<string> => '<svg></svg>';
export const toBlob = async (): Promise<Blob> => new Blob();
export const toCanvas = async (): Promise<HTMLCanvasElement> =>
  document.createElement('canvas');
export const toPixelData = async (): Promise<Uint8ClampedArray> =>
  new Uint8ClampedArray();
