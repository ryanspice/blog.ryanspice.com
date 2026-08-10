# Article visual rules

Every new or promoted public article must ship with a small, intentional visual package. Visuals are part of the editorial contract, not a post-publication decoration pass.

## Required package

1. **Hero visual:** one accessible visual beside the title and opening copy on desktop, and above the title/opening copy on narrow screens. Use a licensed stock image, an original/generated illustration, a screenshot that proves the article, or a data/diagram visual.
2. **Body visuals:** one or two additive figures in the article body. A figure may be a stock image, screenshot, original/generated illustration, chart, table-derived graphic, Mermaid diagram, or locally rendered SVG/PNG.
3. **Evidence visual:** for comparison, analysis, workflow, architecture, benchmark, or process articles, at least one body visual must be a graph, chart, diagram, flow map, or other evidence-bearing visual. It can be one of the two body visuals or an additional figure when the article needs both a scene-setting image and an explanatory graphic.

Short personal notes may use one body visual when a second visual would be repetitive, but they still need the hero visual and should prefer a diagram when the article makes a process or system claim.

## Source and accessibility rules

- Prefer a source-specific stock image over a generic technology image when a photograph adds useful context.
- Record `*_credit` and `*_source` for stock, generated, redrawn, or externally derived visuals.
- Every visual needs accurate alt text. Charts and diagrams need a nearby caption or body explanation that states the takeaway; alt text alone is not a substitute for the data explanation.
- Do not use an image as a substitute for a claim, citation, or accessible text.
- Use Mermaid or a local SVG/PNG when the visual is structural, comparative, or data-driven. Remotion renders are appropriate when the same graph also needs a social still or motion variant.
- Reserve dimensions and keep visuals responsive; never introduce a remote embed that can block or shift the reading surface.

## Frontmatter and body contract

Use frontmatter `image` for the hero visual when available. `row_image` remains the archive/card visual and may be reused only when it is also suitable as the hero. Put body visuals in Markdown as standalone images/figures or Mermaid blocks so they remain part of the normalized article source.

Before marking a post publishable, verify:

- hero visual exists and has alt text;
- body contains one or two standalone figures;
- an evidence-bearing graph/diagram exists when the article type calls for it;
- credit/source metadata is present for non-original material;
- the rendered route shows the hero and body figures at desktop and mobile widths.
