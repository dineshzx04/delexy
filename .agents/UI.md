# UI & Layout Guidelines: 4-Tier Page Architecture

## 1. Universal Layout Hierarchy

Every page in the application is composed of 4 standard tiers:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. STATIC PAGE HEADER: Title (<h1>) + Purpose Subtitle (<p>)               │
├────────────────────────────────────────────────────────────────────────────┤
│ 2. LIFECYCLE BANNERS: State-level Alerts (Confirmed, Revised, Action Req.) │
├────────────────────────────────────────────────────────────────────────────┤
│ 3. CARD 1: Entity Overview (Ant Design Descriptions 3-column Grid)         │
├────────────────────────────────────────────────────────────────────────────┤
│ 4. CARD 2: Primary Workspace (Table / Form Matrix + Summary Totals Strip)  │
├────────────────────────────────────────────────────────────────────────────┤
│ 5. CARD 3: Communication Thread & Actions (Conversation Cards + Footer)    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Column Standards

### A. S.No Column Pattern
```tsx
{
  title: 'S.No',
  key: 'sno',
  width: 65,
  align: 'center',
  render: (_: any, __: any, index: number) => (
    <span className="font-mono text-xs text-slate-500 font-medium">
      {index + 1}
    </span>
  )
}
```

### B. Header Font Size Standard
Always specify `classNames={{ header: { cell: "text-[12px]" } }}` on Ant Design `Table`.

---

## 3. Communication Thread Card Pattern

```tsx
<div className="bg-white p-3 rounded-md border border-slate-200 shadow-2xs">
  <div className="flex items-center justify-between text-xs mb-1.5">
    <div className="flex items-center gap-2">
      <span className="font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
        Your Response
      </span>
      <span className="text-slate-600 font-medium text-[11px]">Round 1</span>
    </div>
    <span className="text-[11px] text-slate-400 font-mono">
      {new Date().toLocaleString()}
    </span>
  </div>
  <div className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
    Note content here...
  </div>
</div>
```

---

## 4. Ant Design Descriptions Standard

```tsx
<Descriptions
  bordered
  size="small"
  column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
  labelStyle={{ fontSize: "12px", fontWeight: 600, color: "#475569", backgroundColor: "#f8fafc", width: "150px" }}
  contentStyle={{ fontSize: "12px", color: "#1e293b" }}
>
  {/* Items */}
</Descriptions>
```
