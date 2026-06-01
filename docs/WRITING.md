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

Reference them from Markdown with root-relative URLs. If you include a title, it becomes a caption:

```md
![Alt text](/img/articles/my-article/diagram.png "Caption text shown under the image")
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
