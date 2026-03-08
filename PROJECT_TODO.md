# DriverAll – Groups Node Management Redesign (Notes + TODO)

## Core model (single source of truth)

### FieldDefinition (Admin > Fields)
- Lifecycle owner for criteria:
  - Create / update / delete a criterion only here.
  - Canonical keys and core properties live here (e.g. `key`, `label`, `active`, `showInCv`, `showInJobFilter`, `groupKey`).
- **Do not** create/delete criteria via Groups UI/API.

### FieldGroup + nodes (Admin > Groups)
- Manages group-level structure and rules for existing criteria.
- Node properties editable *only* in Groups:
  - `parentKey` (hierarchy)
  - `sortOrder` (ordering)
  - `coverage` (covers)
  - `requiredWith` (dependencies)
  - `active` (node-level active)
- FieldDefinition still controls whether a criterion exists; Groups only references existing FieldDefinition keys.

## Invariants (must always hold)

- **[INV-1] No orphan nodes**
  - Every `FieldGroup.nodes[i].key` must exist as a `FieldDefinition.key` assigned to that group.
  - If a FieldDefinition is deleted, the node must be removed and all references cleaned.

- **[INV-2] Deps/Coverage source**
  - CV dependency resolution must use **FieldGroup node rules** (`coverage`, `requiredWith`), *not* `FieldDefinition.coversKeys/requiresKeys`.

- **[INV-3] Filters reflect current state**
  - Public filter endpoints must not return nodes for deleted/inactive FieldDefinitions.

- **[INV-4] “System defaults” must not reappear**
  - If `DISABLE_DEFAULT_FIELDS=1`, DEFAULT_FIELDS must not be inserted or returned as fallback.

## Key endpoints and behavior

### Admin Fields
- **GET** `/api/admin/fields` (alias `/api/fields`)
  - Reads from Mongo.
  - If DB empty, may fallback to `DEFAULT_FIELDS` **unless** `DISABLE_DEFAULT_FIELDS=1`.

- **DELETE** `/api/admin/fields/:id`
  - Deletes FieldDefinition.
  - Must also:
    - remove the corresponding node from **all** FieldGroups (raw + slugified key variants)
    - clean references in other nodes: `parentKey`, `requiredWith`, `coverage`, `equivalentKeys`
  - If deleted key is part of DEFAULT_FIELDS, write tombstone to `DeletedDefaultField` so bootstrap doesn’t reinsert.

### Admin Groups
- **GET** `/api/admin/field-groups` (alias `/api/field-groups`)
  - Auto-materializes missing nodes for FieldDefinitions assigned to `groupKey`.
  - Also performs **orphan cleanup**:
    - removes nodes not present in Fields
    - cleans invalid references
    - if a group has `0` FieldDefinitions, clears nodes.

- **PUT** `/api/admin/field-groups/:id/nodes/:nodeKey`
  - Updates only hierarchy/rules fields (no create/delete here).

### Public filters
- **GET** `/api/jobs/filters?country=TR`
  - Returns groups + nodes.
  - Nodes are filtered by active FieldDefinitions and include rule fields:
    - `coverage`, `requiredWith`, `equivalentKeys`, `sortOrder`.

## Default/system criteria

- DEFAULT_FIELDS are defined in:
  - `drivercv-backend/routes/fieldDefinitions.js`

- To fully disable system defaults:
  - set in `drivercv-backend/.env`:
    - `DISABLE_DEFAULT_FIELDS=1`
  - Behavior:
    - bootstrap upsert in `server.js` is skipped
    - GET `/api/admin/fields` fallback returns empty (no default list)

- Tombstones:
  - Model: `drivercv-backend/models/DeletedDefaultField.js`
  - When a default criterion is deleted, its key is stored here.
  - Bootstrap reads tombstones and skips reinsertion.

## Frontend notes

### Admin > Groups UI
- File: `drivercv-frontend/app/admin/groups/page.tsx`
- No node create/delete UI.
- Node selection list (left) + editor panel (right).
- Fixed intermittent navigation error:
  - `loadGroups()` now sends `Authorization` header and retries once on transient errors.

### CV Editor
- File: `drivercv-frontend/components/CandidateProfileCvEditor.tsx`
- Dependency engine uses filter groups (FieldGroup nodes) for deps.
- CV display ordering:
  - Criteria within each group are sorted by node `sortOrder` (fallback: label).

## Quick verification checklist

### Deletion cleanup
- Delete a criterion in Admin > Fields.
- Verify:
  - **Groups**: node removed + references cleaned
  - **CV**: criterion no longer listed/used
  - **Jobs filters**: node not returned

### No default/system criteria
- Ensure `DISABLE_DEFAULT_FIELDS=1`.
- Restart backend.
- Verify:
  - default criteria do not come back
  - if DB empty, fields list is empty (no system fallback)

## Known warnings
- Backend logs a warning if `./routes/profileSchema` is missing; unrelated to Groups work.

## Current TODO
- [ ] Finish end-to-end verification for deletion (Fields -> Groups/CV/filters)
- [ ] Decide whether group ordering (not only node ordering) should be configurable
- [ ] (Optional) Add admin tool/button to run a one-time orphan cleanup sweep (if needed)
