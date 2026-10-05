/**
 * JOST Quality Suite — Product Classification Hierarchy & Ancestral Lineage Engine
 * Manages Product / Feature Taxonomy Tree (e.g. Pipe > Bend > Hole) and resolves ancestral inheritance for FMEA.
 */

(function (window) {
  'use strict';

  const TAXONOMY_FILE_NAME = 'product_classification_library.enc';

  // In-memory taxonomy tree cache
  let taxonomyNodes = [];

  // Seed default automotive product taxonomy if file is empty
  const DEFAULT_TAXONOMY = [
    // 1. Pipe / Tubular Family
    { id: 'prod-pipe', name: 'Pipe / Tube', parentId: null, path: 'Pipe', description: 'Generic tubular base components across chassis, cooling, and pneumatic lines' },
    { id: 'prod-pipe-bend', name: 'Bend / Curvature', parentId: 'prod-pipe', path: 'Pipe > Bend', description: 'Mandrel cold/hot bent tubular sections' },
    { id: 'prod-pipe-bend-flange', name: 'Flanged End', parentId: 'prod-pipe-bend', path: 'Pipe > Bend > Flanged End', description: 'Orbital flared or welded mounting flanges' },
    { id: 'prod-pipe-hole', name: 'Pierced Hole / Cutout', parentId: 'prod-pipe', path: 'Pipe > Hole', description: 'Laser cut or punched flow ports and mounting holes' },
    { id: 'prod-pipe-thread', name: 'Threaded Port / Insert', parentId: 'prod-pipe', path: 'Pipe > Threaded Port', description: 'Threaded coupling inserts for sensors or fittings' },

    // 2. Stamped Sheet Metal / Bracket Family
    { id: 'prod-bracket', name: 'Stamped Bracket / Plate', parentId: null, path: 'Bracket', description: 'Sheet metal press stamped brackets and mounting structural members' },
    { id: 'prod-bracket-bend', name: 'Formed Flange / Rib', parentId: 'prod-bracket', path: 'Bracket > Formed Rib', description: 'Brake-formed stiffener ribs and 90-deg flanges' },
    { id: 'prod-bracket-hole', name: 'Punched Hole / Slot', parentId: 'prod-bracket', path: 'Bracket > Punched Slot', description: 'High-precision mounting slots and clearance holes' },
    { id: 'prod-bracket-weld', name: 'Welded Gusset / Boss', parentId: 'prod-bracket', path: 'Bracket > Welded Gusset', description: 'Reinforcement gussets and welded standoffs' },

    // 3. Forged & Machined Pin Family (King Pin / Pivot Pin)
    { id: 'prod-pin', name: 'Forged Pin / Shaft', parentId: null, path: 'Forged Pin', description: 'Heavy-duty forged and machined pivot shafts and king pins' },
    { id: 'prod-pin-hardened', name: 'Induction Hardened Surface', parentId: 'prod-pin', path: 'Forged Pin > Induction Hardened', description: 'High-wear surface zones hardened via induction' },
    { id: 'prod-pin-spline', name: 'Machined Spline / Keyway', parentId: 'prod-pin', path: 'Forged Pin > Spline', description: 'Torque transmission splines and key slots' },

    // 4. Cast Iron / Ductile Housing Family (Fifth Wheel / Coupler)
    { id: 'prod-cast', name: 'Cast Housing / Base Plate', parentId: null, path: 'Cast Housing', description: 'Ductile iron and alloy steel casting bodies' },
    { id: 'prod-cast-bore', name: 'Precision Machined Bore', parentId: 'prod-cast', path: 'Cast Housing > Precision Bore', description: 'Reamed and honed pivot bearing bores' },
    { id: 'prod-cast-coating', name: 'Anti-Corrosion Coating', parentId: 'prod-cast', path: 'Cast Housing > Coating', description: 'Zinc-flake or e-coat corrosion protection' }
  ];

  const ProductClassificationEngine = {
    async init() {
      await this.loadTaxonomy();
      return taxonomyNodes;
    },

    async loadTaxonomy() {
      if (window.QualityStorageSync) {
        try {
          const data = await QualityStorageSync.readFile(TAXONOMY_FILE_NAME);
          if (Array.isArray(data) && data.length > 0) {
            // Merge defaults if only custom nodes exist
            const merged = [...data];
            DEFAULT_TAXONOMY.forEach(defNode => {
              if (!merged.some(m => m.id === defNode.id)) {
                merged.push(defNode);
              }
            });
            taxonomyNodes = merged;
            this.recalculateAllPaths();
            try { localStorage.setItem('jost_product_taxonomy', JSON.stringify(taxonomyNodes)); } catch (e) { }
            return taxonomyNodes;
          }
        } catch (e) {
          console.warn('[ProductClassificationEngine] Error reading taxonomy file:', e);
        }
      }

      // Check LocalStorage cache fallback
      try {
        const localRaw = localStorage.getItem('jost_product_taxonomy');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed];
            DEFAULT_TAXONOMY.forEach(defNode => {
              if (!merged.some(m => m.id === defNode.id)) {
                merged.push(defNode);
              }
            });
            taxonomyNodes = merged;
            this.recalculateAllPaths();
            return taxonomyNodes;
          }
        }
      } catch (e) { }

      // Fallback / Seed default taxonomy
      taxonomyNodes = JSON.parse(JSON.stringify(DEFAULT_TAXONOMY));
      this.recalculateAllPaths();
      try { localStorage.setItem('jost_product_taxonomy', JSON.stringify(taxonomyNodes)); } catch (e) { }
      if (window.QualityStorageSync) {
        try { await this.saveTaxonomy(); } catch (e) { }
      }
      return taxonomyNodes;
    },

    async saveTaxonomy() {
      try {
        localStorage.setItem('jost_product_taxonomy', JSON.stringify(taxonomyNodes));
      } catch (e) { }
      if (window.QualityStorageSync) {
        try {
          await QualityStorageSync.writeFile(TAXONOMY_FILE_NAME, taxonomyNodes);
        } catch (e) {
          console.warn('[ProductClassificationEngine] Error saving taxonomy file:', e);
        }
      }
      return taxonomyNodes;
    },

    getNodes() {
      return taxonomyNodes;
    },

    getNodeById(id) {
      return taxonomyNodes.find(n => n.id === id) || null;
    },

    // Build hierarchical tree structure for UI
    getTreeHierarchy() {
      const map = {};
      const roots = [];

      taxonomyNodes.forEach(node => {
        map[node.id] = { ...node, children: [] };
      });

      taxonomyNodes.forEach(node => {
        if (node.parentId && map[node.parentId]) {
          map[node.parentId].children.push(map[node.id]);
        } else {
          roots.push(map[node.id]);
        }
      });

      return roots;
    },

    // Compute full breadcrumb path
    computePath(nodeId, parentId) {
      if (!parentId) {
        const node = taxonomyNodes.find(n => n.id === nodeId);
        return node ? node.name : 'Unknown';
      }
      const parent = taxonomyNodes.find(n => n.id === parentId);
      const parentPath = parent ? (parent.path || parent.name) : '';
      const curr = taxonomyNodes.find(n => n.id === nodeId);
      const currName = curr ? curr.name : '';
      return parentPath ? `${parentPath} > ${currName}` : currName;
    },

    // Recompute all paths recursively after rename / move
    recalculateAllPaths() {
      const roots = this.getTreeHierarchy();
      const traverse = (node, parentPath) => {
        const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
        const target = taxonomyNodes.find(n => n.id === node.id);
        if (target) target.path = currentPath;
        if (node.children) {
          node.children.forEach(child => traverse(child, currentPath));
        }
      };
      roots.forEach(root => traverse(root, ''));
    },

    // Ancestral Lineage Resolver:
    // Given an array of selected node IDs, returns the complete, deduplicated chain of ancestors + nodes
    resolveAncestralLineage(selectedNodeIds = []) {
      const lineageSet = new Set();
      const lineageNodes = [];

      selectedNodeIds.forEach(id => {
        let curr = this.getNodeById(id);
        while (curr) {
          if (!lineageSet.has(curr.id)) {
            lineageSet.add(curr.id);
            lineageNodes.push(curr);
          }
          curr = curr.parentId ? this.getNodeById(curr.parentId) : null;
        }
      });

      return {
        nodeIds: Array.from(lineageSet),
        nodes: lineageNodes
      };
    },

    // Admin CRUD Operations
    async addNode({ name, parentId = null, description = '' }) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueId = 'prod-' + (parentId ? parentId.replace('prod-', '') + '-' : '') + slug + '-' + Math.floor(Math.random() * 1000);

      const newNode = {
        id: uniqueId,
        name: name.trim(),
        parentId: parentId || null,
        path: '',
        description: description.trim()
      };

      taxonomyNodes.push(newNode);
      this.recalculateAllPaths();
      await this.saveTaxonomy();
      return newNode;
    },

    async editNode(id, { name, description }) {
      const node = this.getNodeById(id);
      if (!node) throw new Error('Classification node not found');
      if (name) node.name = name.trim();
      if (description !== undefined) node.description = description.trim();
      this.recalculateAllPaths();
      await this.saveTaxonomy();
      return node;
    },

    async deleteNode(id) {
      // Check if child nodes exist
      const hasChildren = taxonomyNodes.some(n => n.parentId === id);
      if (hasChildren) {
        throw new Error('Cannot delete this classification node because it has child sub-features. Delete child nodes first.');
      }
      taxonomyNodes = taxonomyNodes.filter(n => n.id !== id);
      await this.saveTaxonomy();
      return true;
    }
  };

  window.ProductClassificationEngine = ProductClassificationEngine;
})(typeof window !== 'undefined' ? window : this);
