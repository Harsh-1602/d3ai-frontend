declare module 'ngl' {
  export class Stage {
    constructor(element: HTMLElement, params?: any);
    loadFile(url: string, params?: any): Promise<any>;
    autoView(): void;
    handleResize(): void;
    dispose(): void;
  }
} 