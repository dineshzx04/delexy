# Canonical 4-Tier Page Architecture Pattern

This rule establishes the standard page design architecture to be used across all screens and workspaces in the application (User, Business, and Platform admin).

---

## 1. Universal Visual & Structural Hierarchy

Every entity/workspace page follows this canonical layout (with Tier 2 being optional/conditional):

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Tier 1: STATIC PAGE HEADER (<h1> Title + <p> Functional Purpose)           │
├────────────────────────────────────────────────────────────────────────────┤
│ Tier 2: LIFECYCLE STATE BANNERS (OPTIONAL / Conditional Alerts)            │
├────────────────────────────────────────────────────────────────────────────┤
│ Tier 3: CARD 1 - ENTITY OVERVIEW (AntD Descriptions 3-col Grid)            │
├────────────────────────────────────────────────────────────────────────────┤
│ Tier 4: CARD 2 - PRIMARY WORKSPACE (Table / Matrix + Compact Totals Strip) │
├────────────────────────────────────────────────────────────────────────────┤
│ Tier 5: CARD 3 - COLLABORATION & ACTION FOOTER (Thread Cards + Buttons)    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Standards

### A. Static Page Header vs. Dynamic Context
- **Title (`<h1>`) & Subtitle (`<p>`)**: Always static. Clearly describes the feature/purpose of the screen. Never embed volatile IDs or conditional switches into the top `<h1>`.
- **Tier 2 - Lifecycle Banners (OPTIONAL / CONDITIONAL)**: 
  - **When to use**: Render state-level notices (`Alert`) directly below the header only when an entity has active lifecycle notifications, revision flags, or pending actions (e.g. `CONFIRMED`, `SELLER_REVISED`, `ACTION_REQUIRED`, `REVISION_REQUESTED`).
  - **When to omit**: Omit completely if the page/entity does not have active lifecycle states (e.g., standard registry, catalog, settings, or neutral data pages). Do not render empty or redundant banner placeholders.

### B. Serial Overview via Ant Design `Descriptions` (Card 1)
- Always use `<Descriptions bordered size="small" column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>`.
- Structure items systematically:
  1. Primary Identifiers (Line Item #, Entity/Product Name, Category Tag, Global Number/ID).
  2. Lifecycle Status & Rounds (Proposal Round, Award Round, Status Badge).
  3. Reference Values & Aggregates (Original Quantity, Target Allocation, Target Currency).

### C. Dedicated Primary Workspace Card (Card 2)
- Focuses strictly on data review and interactive editing (Table, Spec Grid, or Form Matrix).
- Concludes with a **Real-Time Summary & Variance Strip** (`bg-slate-50 border rounded-lg p-3`) displaying totals and inline deviation tags.

### D. Unified Communication Thread & Actions Card (Card 3)
- **Thread Cards**: Multi-party exchange (e.g. Buyer Notes, Seller Notes, Approver Feedback) rendered as conversation bubbles:
  - Role pill tag (e.g. Amber for `Buyer Note`, Indigo for `Your Response`).
  - Metadata in header (Round #, timestamp in font-mono).
  - Clean message box with italic text.
- **Action Footer**:
  - Right-aligned buttons below a subtle `Divider`.
  - In Action Mode: Secondary draft button + Primary confirm/submit button.
  - In View/Read-Only Mode: Single `Back to Workspace` button.

---

## 3. Universal State Mode Switch (`isViewMode`)

Derive a single boolean to toggle page interactivity:

```tsx
const isViewMode = isConfirmed || isSubmitted || isReadOnly;
```

- In `!isViewMode`: Renders interactive inputs (`InputNumber`, `Input.TextArea`) and submission action buttons.
- In `isViewMode`: Renders read-only text, submitted thread cards, and return navigation button.

---

## 4. Generic TypeScript / TSX Template

```tsx
import React, { useMemo } from "react";
import { Card, Descriptions, Button, Tag, Alert, Divider, Space, Table, Input } from "antd";
import { useBreadcrumb } from "../../contexts/BreadcrumbContext";

export const StandardPageTemplate: React.FC = () => {
  const isViewMode = false; // Derived from record state

  const breadcrumbs = useMemo(() => [
    { title: <a>Parent Workspace</a> },
    { title: <span>Current Entity</span> }
  ], []);
  useBreadcrumb(breadcrumbs);

  return (
    <div className="mx-auto space-y-4 pb-12">
      {/* 1. Static Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">
            Feature Page Title
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            A clear description of what this page allows the user to view or manage.
          </p>
        </div>
      </div>

      {/* 2. Lifecycle Status Alerts */}
      {/* e.g. <Alert type="success" showIcon message="..." /> */}

      {/* 3. Entity Overview Card */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={<span className="font-bold text-xs text-slate-800">Entity Overview</span>}
      >
        <Descriptions
          bordered
          size="small"
          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          labelStyle={{ fontSize: "12px", fontWeight: 600, color: "#475569", backgroundColor: "#f8fafc", width: "150px" }}
          contentStyle={{ fontSize: "12px", color: "#1e293b" }}
        >
          <Descriptions.Item label="Identifier">#ID-001</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color="blue">ACTIVE</Tag></Descriptions.Item>
          <Descriptions.Item label="Timestamp">Round 1</Descriptions.Item>
          <Descriptions.Item label="Primary Target">Value</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 4. Primary Workspace Card */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800">Workspace Details</span>
            <span className="text-xs text-slate-500">Summary count</span>
          </div>
        }
      >
        <div className="space-y-4">
          <Table size="small" bordered ... />

          {/* Aggregate / Variance Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {/* Aggregate values & notes */}
          </div>
        </div>
      </Card>

      {/* 5. Communication & Action Footer Card */}
      <Card
        size="small"
        className="shadow-sm border-slate-200 bg-white"
        title={<span className="font-bold text-xs text-slate-800">Notes & Actions</span>}
      >
        <div className="space-y-4">
          {/* Thread Cards */}
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <Tag color="blue" className="text-[10px] m-0">Role</Tag>
                <span className="text-[11px] text-slate-400 font-mono">Timestamp</span>
              </div>
              <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                Note content...
              </div>
            </div>
          </div>

          <Divider className="my-2" />

          {/* Right-Aligned Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {isViewMode ? (
              <Button type="primary" size="middle" className="text-xs font-semibold">
                Back to Workspace
              </Button>
            ) : (
              <Space>
                <Button type="default" size="middle" className="text-xs font-semibold">
                  Save Draft / Revise
                </Button>
                <Button type="primary" size="middle" className="text-xs font-semibold">
                  Confirm / Submit
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
```
