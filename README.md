# Kilo - Minimal Display Component

A minimal React component for displaying content in a styled container.

## Usage

```tsx
import { Kilo } from '.kilo';

<Kilo height="300px">
  My Content Goes Here
</Kilo>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | string | `"200px"` | Height of the display area |
| `width` | string | `"100%"` | Width of the display area |
| `children` | ReactNode | `-` | Content to render inside |

## Styling

Kilo comes with basic styling for a clean interface. Customize via inline styles or CSS.

## Location

Stored in `.kilo/` folder within the main project.
