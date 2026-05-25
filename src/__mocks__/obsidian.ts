// Minimal Obsidian API mock for unit tests

export class Notice {
  constructor(public message: string) {}
}

export class TFile {
  constructor(public path: string) {}
}

export class WorkspaceLeaf {
  private _filePath: string | null;
  private _viewType: string;
  public tabHeaderEl: HTMLElement | undefined;

  constructor(filePath: string | null = null, viewType = "markdown") {
    this._filePath = filePath;
    this._viewType = viewType;
  }

  getViewState() {
    return {
      type: this._viewType,
      state: this._filePath ? { file: this._filePath } : {},
    };
  }

  async openFile(_file: TFile) {}
  async setViewState(_state: unknown) {}
  detach() {}
  getRoot() { return null; }
}

export class App {
  vault = {
    getAbstractFileByPath: (path: string) => new TFile(path),
  };

  workspace = new MockWorkspace();
}

class MockWorkspace {
  rootSplit = Symbol("rootSplit");
  private _leaves: WorkspaceLeaf[] = [];

  setLeaves(leaves: WorkspaceLeaf[]) {
    this._leaves = leaves;
    // Make all leaves report rootSplit as their root
    for (const leaf of leaves) {
      (leaf as unknown as { getRoot: () => unknown }).getRoot = () => this.rootSplit;
    }
  }

  iterateAllLeaves(cb: (leaf: WorkspaceLeaf) => void) {
    for (const leaf of this._leaves) cb(leaf);
  }

  getLeaf(type: boolean | string) {
    const leaf = new WorkspaceLeaf();
    (leaf as unknown as { getRoot: () => unknown }).getRoot = () => this.rootSplit;
    this._leaves.push(leaf);
    return leaf;
  }

  on() { return { unsubscribe: () => {} }; }
}
