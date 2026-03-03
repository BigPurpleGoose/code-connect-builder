import type { PropType } from '@/types/connection';

export interface PropTypeDoc {
  label: string;
  description: string;
  whenToUse: string;
  exampleFigma: string;
  exampleOutput: string;
  inkPattern?: string;
}

export const PROP_TYPE_DOCS: Record<PropType, PropTypeDoc> = {
  string: {
    label: 'String',
    description: 'Maps a Figma text property or content layer to a React string prop.',
    whenToUse: 'Use when a Figma property holds text that maps directly to a string prop like `label`, `placeholder`, or `title`.',
    exampleFigma: 'Figma prop name: "Label Text"',
    exampleOutput: `label: figma.string('Label Text')`,
  },
  number: {
    label: 'Number (via String)',
    description: 'Maps a Figma numeric variable to a React prop using figma.string().',
    whenToUse: 'Use for props like `size`, `columns`, `maxWidth` that are driven by a Figma number variable. Note: figma.number() does NOT exist in the Code Connect API — the correct mapping is always figma.string().',
    exampleFigma: 'Figma prop name: "Column Count"',
    exampleOutput: `columns: figma.string('Column Count')`,
    inkPattern: 'The Code Connect API has no figma.number() method. Numeric Figma variables map as strings. For fixed numeric values, consider using an Enum prop type with a fixed hardcoded value instead.',
  },
  boolean: {
    label: 'Boolean',
    description: 'Maps a Figma boolean property to a React boolean prop. Four modes are available.',
    whenToUse: 'Use when toggling visibility, disabled state, or any on/off Figma control.',
    exampleFigma: 'Figma prop: "Show Icon" (boolean toggle in sidebar)',
    exampleOutput: `showIcon: figma.boolean('Show Icon')`,
    inkPattern: `Ink patterns:
• Simple — direct boolean pass-through
• Inverse — when Figma and React logic are opposite (e.g. "Enable Arrow" → disableArrow)
• Visibility — maps to a child layer when true, undefined when false (common for icon slots)
• Complex — custom true/false values (e.g. true → "large", false → "small")`,
  },
  enum: {
    label: 'Enum (Variant)',
    description: 'Maps a Figma variant property to a React prop by translating each option name.',
    whenToUse: 'Use for Figma variant properties like "Kind", "Size", "State" that have multiple named options.',
    exampleFigma: 'Figma variant: "Kind" → options: Primary, Secondary, Tertiary',
    exampleOutput: `kind: figma.enum('Kind', {
  'Primary': 'primary',
  'Secondary': 'secondary',
  'Tertiary': 'tertiary',
})`,
    inkPattern: 'Use the {} (Code) toggle when the React value is not a string — e.g. JSX, a number, true/false, or a component reference.',
  },
  instance: {
    label: 'Instance',
    description: 'Maps a Figma component instance swap property to a React prop.',
    whenToUse: 'Use when a Figma property lets designers swap out a nested component (e.g. an icon slot that accepts any icon component).',
    exampleFigma: 'Figma prop: "Icon" (instance swap)',
    exampleOutput: `icon: figma.instance('Icon')`,
  },
  children: {
    label: 'Children',
    description: 'Maps one or more Figma canvas layers to a React children prop.',
    whenToUse: 'Use to map specific named layers (or all layers) from the Figma canvas into a React children prop.',
    exampleFigma: 'Layer names: "Content", "Footer" (separate rows in the layer list)',
    exampleOutput: `children: figma.children(['Content', 'Footer'])`,
    inkPattern: 'Use the wildcard (*) option to pass all child layers. Use multiple layer inputs for a curated subset.',
  },
  nestedProps: {
    label: 'Nested Props',
    description: 'Aggregates props from a child component layer into the parent. Used for compound components.',
    whenToUse: 'Use when a parent component (e.g. Callout) contains a sub-component (e.g. Callout.Header) and you need to pass its props through.',
    exampleFigma: 'Figma layer: "Header" — a nested component with its own props',
    exampleOutput: `headerProps: figma.nestedProps('Header', {
  title: figma.string('Title Text'),
  onClose: figma.boolean('Show Close'),
})`,
    inkPattern: 'Common in Ink for Callout, Card, and Modal components that have typed sub-component prop interfaces.',
  },
  textContent: {
    label: 'Text Content',
    description: 'Extracts the raw text content from a named Figma layer.',
    whenToUse: 'Use when you need the literal text value from a Figma text layer (rather than a property in the sidebar).',
    exampleFigma: 'Figma layer: "Button Label" (a text layer on the canvas)',
    exampleOutput: `children: figma.textContent('Button Label')`,
  },
};

export interface DocSection {
  title: string;
  items: { term: string; desc: string; example?: string }[];
}

export const REFERENCE_SECTIONS: DocSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        term: 'What is Code Connect?',
        desc: 'Code Connect is a Figma feature that links design components to their real React code. When designers inspect a component in Dev Mode, they see the actual production code snippet — not generated stubs.',
      },
      {
        term: 'What does this tool produce?',
        desc: 'A *.figma.tsx file that you give to a developer to add to the codebase alongside the component. The file registers the connection using figma.connect().',
      },
      {
        term: 'figma.connect()',
        desc: 'The main registration function. First arg is the React component, second is the Figma URL, third is an options object with `props` mappings and an `example` render function.',
      },
      {
        term: 'Multiple definitions',
        desc: 'You can register sub-components (e.g. Button.Icon, Callout.Header) as separate figma.connect() calls in one file. Use the "Add Component" button in the sidebar to add more.',
      },
    ],
  },
  {
    title: 'Figma URL & Import Path',
    items: [
      {
        term: 'Finding the Figma URL',
        desc: 'In Figma, right-click any component in the canvas → "Copy link to selection". Paste the full URL. You can also use a node ID in the format 123:456.',
      },
      {
        term: 'Import Path',
        desc: 'The path where the React component is imported from, relative to the output file. E.g. if the output file is next to the component: ./Button. If it\'s in a package: @acme/ui.',
      },
    ],
  },
  {
    title: 'Ink Design System Patterns',
    items: [
      {
        term: 'Visibility Toggle',
        desc: 'For optional icon/element slots. Use Boolean → Visibility mode.\nMaps the layer when true, undefined when false so the prop disappears from the code snippet entirely.',
        example: `startElement: figma.boolean('Show Icon', {
  true: figma.children('Icon Layer'),
  false: undefined,
})`,
      },
      {
        term: 'Inverse Boolean',
        desc: 'When Figma\'s toggle is logically opposite to the React prop. E.g. Figma has "Enable Arrow" but React has `disableArrow`.',
        example: `disableArrow: figma.boolean('Enable Arrow', {
  true: false,
  false: true,
})`,
      },
      {
        term: 'Compound Component Nesting',
        desc: 'For components like Callout that have typed sub-component interfaces. Use Nested Props to bring sub-component Figma props into the parent connect call.',
        example: `headerProps: figma.nestedProps('Header', {
  title: figma.string('Title'),
  showClose: figma.boolean('Show Close'),
})`,
      },
    ],
  },
  {
    title: 'Common Mistakes',
    items: [
      {
        term: 'Figma prop name is case-sensitive',
        desc: 'The string you enter in "Figma Property / Layer Name" must match exactly how it appears in the Figma sidebar — including spaces, capitals, and punctuation.',
      },
      {
        term: 'Enum Figma values must match option names',
        desc: 'For Enum type, the left column must be the exact string Figma uses for each variant option (e.g. "Brand" not "brand" if Figma shows "Brand").',
      },
      {
        term: 'React prop name must be camelCase',
        desc: 'React props must be valid JavaScript identifiers: no spaces, no hyphens. The tool will suggest a camelCase conversion automatically.',
      },
    ],
  },
];
