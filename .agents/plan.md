# Refactor & Expand Mock Data: `src/data/business`

## Overview
This proposal populates rich, realistic, enterprise-grade mock data across all 5 entities in `src/data/business` (`parties.ts`, `partyClaims.ts`, `manufacturers.ts`, `brands.ts`, `brandParties.ts`) using standardized serial prefixes (`pty-1`, `clm-1`, `mfg-1`, `brd-1`, `brd-pty-1`). It covers every real-world lifecycle state: claimed business parties, unclaimed placeholder parties, pending and rejected party claims, manufacturer profiles, and multi-party brand associations.

---

## Detailed Plan

### 1. Update `src/data/business/parties.ts`
Provide active mock `Party[]` entries:
- `pty-1`: Claimed Business Party owned by `bus-a` (ASUS Tech Industrial Party)
- `pty-2`: Claimed Business Party owned by `bus-b` (Samsung Electronics Global Party)
- `pty-3`: Unclaimed Placeholder Business Party (owner: `null`, ASICS Corp Placeholder Party)
- `pty-4`: Claimed Business Party owned by `bus-c` (Business C Enterprise Party)
- `pty-5`: Claimed Business Subsidiary Party owned by `bus-a` (Tech World Global Distribution Party)
- `pty-6`: Claimed Individual User Party owned by `usr-1` (John Doe Personal Trading Party)
- `pty-7`: Unclaimed Suspended Placeholder Party (owner: `null`, Sony Logistics Unclaimed Party)

### 2. Update `src/data/business/partyClaims.ts`
Provide active mock `PartyClaim[]` entries:
- `clm-1`: Pending claim by `pty-4` (Business C) targeting unclaimed `pty-3` (ASICS Corp)
- `clm-2`: Rejected claim by `pty-5` (Tech World) targeting unclaimed `pty-7` (Sony Logistics)

### 3. Update `src/data/business/manufacturers.ts`
Provide active mock `Manufacturer[]` entries:
- `mfg-1`: Linked to `pty-1` (ASUS Tech Manufacturing Inc)
- `mfg-2`: Linked to `pty-2` (Samsung Electronics Co Ltd)
- `mfg-3`: Linked to `pty-3` (ASICS Global Manufacturing, pending verification)
- `mfg-4`: Linked to `pty-5` (Tech World Industrial Co)

### 4. Update `src/data/business/brands.ts`
Provide active mock `Brand[]` entries:
- `brd-1`: ASUS
- `brd-2`: Samsung
- `brd-3`: Sony
- `brd-4`: ASICS
- `brd-5`: Logitech

### 5. Update `src/data/business/brandParties.ts`
Provide active mock `BrandParty[]` entries:
- `brd-pty-1`: Brand `brd-1` (ASUS) $\rightarrow$ `pty-1` (`VERIFIED`, primary owner)
- `brd-pty-2`: Brand `brd-2` (Samsung) $\rightarrow$ `pty-2` (`VERIFIED`, primary owner)
- `brd-pty-3`: Brand `brd-3` (Sony) $\rightarrow$ `pty-2` (`VERIFIED`, primary owner)
- `brd-pty-4`: Brand `brd-4` (ASICS) $\rightarrow$ `pty-3` (`PENDING`, placeholder association)
- `brd-pty-5`: Brand `brd-1` (ASUS) $\rightarrow$ `pty-5` (`VERIFIED`, secondary authorized distributor — Multi-Party Brand Claim!)
- `brd-pty-6`: Brand `brd-5` (Logitech) $\rightarrow$ `pty-4` (`APPROVED`, primary owner)

### 6. Sync `src/data/catalog/sellerProducts.ts`
Update mock seller products to reference active serial IDs (`pty-1`, `brd-1`, `brd-2`, etc.) to preserve taxonomy integrity.

---

## User Review Required

> [!NOTE]
> All IDs follow clean serial prefixes (`pty-X`, `clm-X`, `mfg-X`, `brd-X`, `brd-pty-X`).

## Proposed Changes

### Business Component Mock Files
#### [MODIFY] [parties.ts](file:///d:/dinesh/workspace/delexy-prototype/src/data/business/parties.ts)
#### [MODIFY] [partyClaims.ts](file:///d:/dinesh/workspace/delexy-prototype/src/data/business/partyClaims.ts)
#### [MODIFY] [manufacturers.ts](file:///d:/dinesh/workspace/delexy-prototype/src/data/business/manufacturers.ts)
#### [MODIFY] [brands.ts](file:///d:/dinesh/workspace/delexy-prototype/src/data/business/brands.ts)
#### [MODIFY] [brandParties.ts](file:///d:/dinesh/workspace/delexy-prototype/src/data/business/brandParties.ts)

### Catalog Sync
#### [MODIFY] [sellerProducts.ts](file:///d:/dinesh/workspace/delexy-prototype/src/data/catalog/sellerProducts.ts)

---

## Verification Plan

### Automated Tests
- Run `npm run build` (`tsc -b && vite build`) to verify that all mock objects conform to TypeScript interfaces and database schemas.
