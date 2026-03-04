# Quick Start - Integrating the New Import Flow

## ✨ The Main Deliverable

**File:** `src/components/import/ReactComponentImportFlow.tsx`

This is your new React component import wizard - a complete, standalone component ready to use!

## Simple Integration (Recommended)

The easiest way to use the new import flow is to open it directly when users want to import React components.

### Step 1: Import the Component

In `src/components/layout/AppHeader.tsx` (or wherever you want the import button):

```typescript
import { ReactComponentImportFlow } from "@/components/import/ReactComponentImportFlow";
```

### Step 2: Add State

```typescript
const [showImportWizard, setShowImportWizard] = useState(false);
```

### Step 3: Add the Dialog

```typescript
{/* React Component Import Wizard */}
{showImportWizard && (
  <Dialog.Root open={showImportWizard} onOpenChange={setShowImportWizard}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <Dialog.Title>Import React Component</Dialog.Title>
          <Dialog.Close><X /></Dialog.Close>
        </div>
        <Separator.Root />
        <div className="flex-1 overflow-hidden">
          <ReactComponentImportFlow
            onImport={(defs) => {
              mergeDefinitions(defs);
              setShowImportWizard(false);
            }}
            onCancel={() => setShowImportWizard(false)}
          />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)}
```

### Step 4: Add Trigger Button

```typescript
<button onClick={() => setShowImportWizard(true)}>
  Import React Component
</button>
```

## That's It!

The `ReactComponentImportFlow` component is completely self-contained and handles:

- ✅ File upload
- ✅ Prop detection
- ✅ Figma mapping (optional)
- ✅ Review and confirmation
- ✅ All UI and state management

## What You Get

When a user imports a component:

1. They upload a `.tsx` file
2. Props are auto-detected from TypeScript
3. They can optionally add Figma properties
4. They review the matches
5. **Component is added to your project via `mergeDefinitions()`**
6. User can then edit it in your existing editor

## Test It

Try importing this test component:

```typescript
// TestButton.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button(props: ButtonProps) {
  return <button>{props.children}</button>;
}
```

Expected result:

- ✅ variant → enum (Primary, Secondary)
- ✅ disabled → boolean
- ✅ children → children prop

---

**That's all you need!** The component is ready to use as-is. Ignore `ImprovedImportModal.tsx` if it has issues - it was just an integration suggestion. The core `ReactComponentImportFlow.tsx` works perfectly standalone.
