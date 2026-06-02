# Writing guide (blog v0.1.0)

This blog renders Markdown through a unified pipeline (GFM + footnotes + callouts + images + syntax highlighting).

## Footnotes (GFM)

```md
Some point worth expanding.[^1]

[^1]: The footnote text goes down here. It can be multiple sentences.
```

## Callouts (Obsidian-style)

Non-collapsible:

```md
> [!NOTE] Why this matters
> This paragraph (and any additional quoted lines) become the callout body.
```

Collapsible (open by default with `+`):

```md
> [!WARNING]+ Read this before deploying
> This folds behind a disclosure triangle.
```

Collapsible (closed by default with `-`):

```md
> [!TIP]- Optional deep dive
> Keep this hidden unless the reader wants the extra detail.
```

Supported callout types are free-form (the label becomes a CSS class). Recommended set:

- `NOTE`
- `INFO`
- `TIP`
- `WARNING`
- `DANGER`

## Images (responsive + captions)

Store article images under:

```txt
static/img/articles/<article-slug>/...
```

Reference them from Markdown with root-relative URLs. If you include a title, it becomes a caption. Prefer generated responsive filenames when available (`-900w`, `-1200w`, `-1600w`); the renderer will add a matching `srcset` automatically for those sizes:

```md
![Alt text](/img/articles/my-article/diagram-1600w.webp "Caption text shown under the image")
```

Svelte routes/components can use the exported library component instead:

```svelte
<script lang="ts">
  import { Image } from '$lib';
</script>

<Image
  src="/img/articles/my-article/diagram-1600w.webp"
  alt="Alt text"
  caption="Caption text shown under the image"
  preset="content"
/>
```

## Code fences (syntax highlighting)

````md
```powershell
pnpm run build:blog
```

```ts
export function hello(name: string) {
  return `Hello ${name}`;
}
```
````

## Mermaid diagrams

````md
```mermaid
flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Do it]
  B -->|No| D[Skip]
```
````
