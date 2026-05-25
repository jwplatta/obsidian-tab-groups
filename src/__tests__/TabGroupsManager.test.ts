import { App, WorkspaceLeaf } from "obsidian";
import { TabGroupsManager } from "../TabGroupsManager";
import { TabGroupsPluginData } from "../types";

function makeApp(leaves: WorkspaceLeaf[] = []): App {
  const app = new App();
  (app.workspace as unknown as { setLeaves: (l: WorkspaceLeaf[]) => void }).setLeaves(leaves);
  return app;
}

function makeLeaf(filePath: string, viewType = "markdown"): WorkspaceLeaf {
  return new WorkspaceLeaf(filePath, viewType);
}

function emptyData(): TabGroupsPluginData {
  return { groups: [], activeGroupId: null };
}

describe("TabGroupsManager", () => {
  let onDataChange: jest.Mock;

  beforeEach(() => {
    onDataChange = jest.fn().mockResolvedValue(undefined);
  });

  // ── createGroup ────────────────────────────────────────────────────────────

  describe("createGroup", () => {
    it("creates a group with the given name and current open leaves", () => {
      const leaves = [makeLeaf("a.md"), makeLeaf("b.md")];
      const app = makeApp(leaves);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("Work");

      expect(group.name).toBe("Work");
      expect(group.leaves).toHaveLength(2);
      expect(group.leaves.map(l => l.filePath)).toEqual(["a.md", "b.md"]);
    });

    it("assigns unique colors from the default palette", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const g1 = manager.createGroup("G1");
      const g2 = manager.createGroup("G2");

      expect(g1.color).not.toBe(g2.color);
    });

    it("removes captured files from existing groups (single membership)", () => {
      const leaf = makeLeaf("shared.md");
      const app = makeApp([leaf]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      manager.createGroup("First");
      manager.createGroup("Second");

      const groups = manager.getGroups();
      const allFiles = groups.flatMap(g => g.leaves.map(l => l.filePath));
      const unique = new Set(allFiles);
      expect(unique.size).toBe(allFiles.length);
    });

    it("accepts specific leaves instead of capturing current tabs", () => {
      const app = makeApp([makeLeaf("open.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("Specific", [{ filePath: "other.md", viewType: "markdown" }]);

      expect(group.leaves.map(l => l.filePath)).toEqual(["other.md"]);
    });

    it("calls onDataChange", () => {
      const app = makeApp([]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      manager.createGroup("X");

      expect(onDataChange).toHaveBeenCalled();
    });
  });

  // ── deleteGroup ────────────────────────────────────────────────────────────

  describe("deleteGroup", () => {
    it("removes the group", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("ToDelete");
      manager.deleteGroup(group.id);

      expect(manager.getGroups()).toHaveLength(0);
    });

    it("clears activeGroupId when the active group is deleted", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData({ groups: [], activeGroupId: null });

      const group = manager.createGroup("Active");
      // Manually set active
      const data = manager.getData();
      data.activeGroupId = group.id;
      manager.loadData(data);

      manager.deleteGroup(group.id);

      expect(manager.getActiveGroupId()).toBeNull();
    });

    it("does not affect other groups", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const g1 = manager.createGroup("Keep");
      const g2 = manager.createGroup("Remove");
      manager.deleteGroup(g2.id);

      const remaining = manager.getGroups();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]!.id).toBe(g1.id);
    });
  });

  // ── renameGroup ────────────────────────────────────────────────────────────

  describe("renameGroup", () => {
    it("updates the group name", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("Old");
      manager.renameGroup(group.id, "New");

      expect(manager.getGroups()[0]!.name).toBe("New");
    });
  });

  // ── updateGroupColor ───────────────────────────────────────────────────────

  describe("updateGroupColor", () => {
    it("updates the group color", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("G");
      manager.updateGroupColor(group.id, "#ff0000");

      expect(manager.getGroups()[0]!.color).toBe("#ff0000");
    });
  });

  // ── reorderGroup ───────────────────────────────────────────────────────────

  describe("reorderGroup", () => {
    function managerWithGroups(names: string[]) {
      const app = makeApp([]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());
      for (const name of names) manager.createGroup(name);
      return manager;
    }

    it("moves a group up", () => {
      const manager = managerWithGroups(["A", "B", "C"]);
      const id = manager.getGroups()[1]!.id; // B
      manager.reorderGroup(id, "up");
      expect(manager.getGroups().map(g => g.name)).toEqual(["B", "A", "C"]);
    });

    it("moves a group down", () => {
      const manager = managerWithGroups(["A", "B", "C"]);
      const id = manager.getGroups()[1]!.id; // B
      manager.reorderGroup(id, "down");
      expect(manager.getGroups().map(g => g.name)).toEqual(["A", "C", "B"]);
    });

    it("does nothing when moving the first group up", () => {
      const manager = managerWithGroups(["A", "B"]);
      const id = manager.getGroups()[0]!.id;
      manager.reorderGroup(id, "up");
      expect(manager.getGroups().map(g => g.name)).toEqual(["A", "B"]);
    });

    it("does nothing when moving the last group down", () => {
      const manager = managerWithGroups(["A", "B"]);
      const id = manager.getGroups()[1]!.id;
      manager.reorderGroup(id, "down");
      expect(manager.getGroups().map(g => g.name)).toEqual(["A", "B"]);
    });
  });

  // ── addLeafToGroup ─────────────────────────────────────────────────────────

  describe("addLeafToGroup", () => {
    it("adds a leaf to a group", () => {
      const app = makeApp([]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("G");
      const leaf = makeLeaf("new.md");
      manager.addLeafToGroup(group.id, leaf);

      expect(manager.getGroups()[0]!.leaves.map(l => l.filePath)).toContain("new.md");
    });

    it("enforces single membership — removes from other groups first", () => {
      const app = makeApp([makeLeaf("shared.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const g1 = manager.createGroup("G1");
      const g2 = manager.createGroup("G2");

      const leaf = makeLeaf("shared.md");
      manager.addLeafToGroup(g2.id, leaf);

      const g1Paths = manager.getGroups().find(g => g.id === g1.id)!.leaves.map(l => l.filePath);
      expect(g1Paths).not.toContain("shared.md");
    });

    it("does not add duplicates", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("G");
      const leaf = makeLeaf("a.md");
      manager.addLeafToGroup(group.id, leaf);
      manager.addLeafToGroup(group.id, leaf);

      const paths = manager.getGroups()[0]!.leaves.map(l => l.filePath);
      expect(paths.filter(p => p === "a.md")).toHaveLength(1);
    });
  });

  // ── removeLeafFromGroup ────────────────────────────────────────────────────

  describe("removeLeafFromGroup", () => {
    it("removes a leaf from its group", () => {
      const leaf = makeLeaf("a.md");
      const app = makeApp([leaf]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      manager.createGroup("G");
      manager.removeLeafFromGroup(leaf);

      expect(manager.getGroups()[0]!.leaves).toHaveLength(0);
    });
  });

  // ── getGroupForLeaf ────────────────────────────────────────────────────────

  describe("getGroupForLeaf", () => {
    it("returns the group a leaf belongs to", () => {
      const leaf = makeLeaf("a.md");
      const app = makeApp([leaf]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      const group = manager.createGroup("G");
      expect(manager.getGroupForLeaf(leaf)?.id).toBe(group.id);
    });

    it("returns null for a leaf not in any group", () => {
      const app = makeApp([]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());

      expect(manager.getGroupForLeaf(makeLeaf("unknown.md"))).toBeNull();
    });
  });

  // ── deduplicateLeaves (via loadData) ──────────────────────────────────────

  describe("deduplicateLeaves", () => {
    it("removes duplicate file paths across groups on load, keeping first occurrence", () => {
      const app = makeApp([]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData({
        groups: [
          { id: "g1", name: "G1", color: "#f00", createdAt: 1, leaves: [{ filePath: "dup.md", viewType: "markdown" }] },
          { id: "g2", name: "G2", color: "#00f", createdAt: 2, leaves: [{ filePath: "dup.md", viewType: "markdown" }, { filePath: "unique.md", viewType: "markdown" }] },
        ],
        activeGroupId: null,
      });

      const g1 = manager.getGroups().find(g => g.id === "g1")!;
      const g2 = manager.getGroups().find(g => g.id === "g2")!;

      expect(g1.leaves.map(l => l.filePath)).toContain("dup.md");
      expect(g2.leaves.map(l => l.filePath)).not.toContain("dup.md");
      expect(g2.leaves.map(l => l.filePath)).toContain("unique.md");
    });
  });

  // ── getData / loadData round-trip ─────────────────────────────────────────

  describe("getData", () => {
    it("returns a deep clone — mutations do not affect internal state", () => {
      const app = makeApp([makeLeaf("a.md")]);
      const manager = new TabGroupsManager(app, onDataChange);
      manager.loadData(emptyData());
      manager.createGroup("G");

      const data = manager.getData();
      data.groups[0]!.name = "Mutated";

      expect(manager.getGroups()[0]!.name).toBe("G");
    });
  });
});
