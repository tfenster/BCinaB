export interface ProgressMessage {
  id: string;
  status: string;
  progress: string;
  progressDetail: Progress;
}

export interface Progress {
  current: number;
  total: number;
  start: number;
}

export class ProgressHelper {
  static calcProgress(p: Progress): number {
    return p.current / p.total;
  }
}
