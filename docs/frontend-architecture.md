# Frontend Architecture & Design Patterns

This document serves as a blueprint for the frontend architecture of the B2B SaaS platform. It details the structural patterns, routing logic, state management, and styling conventions used in this project, which can serve as a highly scalable boilerplate for future React applications.

## 1. Technology Stack
*   **Core:** React 18+, TypeScript, Vite
*   **Routing:** React Router v6
*   **Component Library:** Ant Design (AntD)
*   **Styling:** Tailwind CSS
*   **Class Merging:** `clsx` + `tailwind-merge` (exported as a `cn` utility)
*   **Icons:** Lucide React

---

## 2. Routing & Layout Strategy (`App.tsx`)

The application uses nested routing combined with layout wrapper components to maintain persistent UI elements (like sidebars and headers) across page navigations.

### The Dynamic Layout Pattern
A core challenge in multi-tenant/SaaS applications is sharing routes (like `/profile` or `/settings`) across different contexts (e.g., a standard User Dashboard vs. a Super Admin Platform Dashboard) without duplicating routes. 

We solve this using an **ActiveLayout Wrapper**:
```tsx
const ActiveLayout: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  // Dynamically swap the layout wrapper while keeping the URL the same
  return activeWorkspace?.type === 'platform' ? <PlatformLayout /> : <DashboardLayout />;
};
```
Common routes are then nested under this dynamic wrapper:
```tsx
<Route element={<ActiveLayout />}>
  <Route path="profile" element={<UserProfile />} />
  <Route path="settings/account" element={<AccountSettings />} />
</Route>
```

### Granular Error Boundaries
Instead of wrapping the entire `<Routes>` tree in an error boundary (which results in a white screen of death if a child page crashes), Error Boundaries are placed **inside** the layout routes, wrapping the `<Outlet />` or specific pages:
```tsx
<Route path="/" element={<DashboardLayout />}>
  {/* If UserProfile crashes, only the content area shows the error. The sidebar/header remain intact! */}
  <Route element={<ErrorBoundary />}>
    <Route path="profile" element={<UserProfile />} />
  </Route>
</Route>
```

---

## 3. Breadcrumb Management Strategy

Breadcrumbs are inherently tied to the active route, but defining them globally in a routing config is rigid. Instead, we use a **Bottom-Up Context Approach**.

1.  **The Context (`BreadcrumbContext.tsx`)**: Holds global state (`customBreadcrumbs`). The active Layout component (e.g., `DashboardLayout`) reads from this context and renders the breadcrumb UI in the header.
2.  **The Hook (`useBreadcrumb`)**: A custom hook exposed to child pages.
3.  **The Page Implementation**: Child pages push their specific breadcrumb configuration up to the context when they mount, and clean it up when they unmount.

**Critical Anti-Pattern Prevention (Infinite Loops):**
Because `useBreadcrumb` calls a `setState` function in the parent context, passing an inline array directly to it will trigger an infinite re-render loop. 
**Always memoize the breadcrumb array in child pages:**
```tsx
const AccountSettings: React.FC = () => {
  const breadcrumbs = React.useMemo(() => [
    { title: <Link to="/">App</Link>, url: '/' },
    { title: <span className="font-semibold">Account Settings</span> }
  ], []);

  useBreadcrumb(breadcrumbs); // Safe!

  return <div>...</div>;
};
```

---

## 4. UI & Styling: Tailwind + Ant Design

Combining a utility-first CSS framework (Tailwind) with a robust component library (AntD) provides the best of both worlds: rapid layout building and complex, accessible components.

### Implementation Rules:
1.  **Prefixing Component Imports**: To avoid naming collisions and make it instantly clear what is a third-party UI component versus a local HTML element, always alias AntD and Lucide imports:
    ```tsx
    import { Button as AntButton, Table as AntTable } from 'antd';
    import * as Lucide from 'lucide-react';
    
    // Usage:
    <AntButton icon={<Lucide.Save size={16} />}>Save</AntButton>
    ```
2.  **Tailwind for Layout & Overrides**: Use Tailwind for all container sizing, grids, flexbox, margins, padding, and typography. Use AntD purely for the complex interactive logic (Selects, DatePickers, Data Tables).
3.  **The `cn` Utility**: When building reusable local components, use the `cn` utility (`clsx` + `tailwind-merge`) to allow parent components to safely override child Tailwind classes without specificity conflicts.
    import { cn } from '../lib/utils';
    
    <div className={cn("p-4 bg-white rounded-md", props.className)}>
    ```

### 4.1. Which Ant Design Components to Use?
We intentionally **avoid** using Ant Design's structural Layout components (`Layout`, `Header`, `Sider`, `Content`) because they dictate DOM structure and are notoriously rigid to style precisely with Tailwind. Instead, we use standard HTML `<div>` tags paired with Tailwind for all page scaffolding.

**We exclusively use AntD for complex, data-heavy, or highly interactive components, including:**
*   **Data Entry:** `<AntForm>`, `<AntInput>`, `<AntSelect>`, `<AntSwitch>`, `<AntDatePicker>`, `<AntUpload>`
*   **Data Display:** `<AntTable>`, `<AntAvatar>`, `<AntTag>`, `<AntBadge>`, `<AntTabs>`, `<AntSteps>`
*   **Feedback & Overlays:** `<AntAlert>`, `<AntModal>`, `<AntDrawer>`, `<AntDropdown>`, `<AntTooltip>`
*   **Actions:** `<AntButton>` (used specifically for primary actions where loading states or standard AntD button aesthetics are desired)

### 4.2. CSS Layering (Solving Tailwind + AntD Conflicts)
A common issue when mixing Tailwind with component libraries is that the library's default styles can inadvertently override Tailwind's utility classes. We solve this natively in `src/index.css` using modern CSS `@layer` declarations (leveraging Tailwind v4 capabilities):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Explicitly define CSS layer order */
@layer theme, base, antd, utilities;
@import "tailwindcss";
```

**How this works:**
1. By explicitly defining `@layer theme, base, antd, utilities;`, we control the cascade.
2. Ant Design's injected CSS-in-JS styles are conceptually positioned lower in the cascade precedence.
3. Tailwind's `utilities` layer is positioned last, meaning if you apply a Tailwind class like `bg-sky-600` to an `<AntButton>`, the Tailwind class will **always** win and override the AntD default style without needing to resort to `!important`.

---

## 5. State Management & Workspaces
The `WorkspaceContext` is the heart of the B2B architecture. It dictates the user's current operating context.
*   **State:** It tracks `workspaces` (an array of all orgs the user belongs to) and `activeWorkspace`.
*   **Behavior:** When a user switches workspaces, the application doesn't just change data—it inherently changes the routing context, triggering the `ActiveLayout` to re-evaluate and potentially swapping the entire sidebar navigation tree instantly without a hard reload.
