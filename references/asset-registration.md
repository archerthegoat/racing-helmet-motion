# Asset preparation and registration

Use this reference when fitting a new portrait or helmet to the effect.

## Required inputs

### Portrait

- Keep the source RGB and facial proportions
- Remove only the background and export an alpha channel
- Use enough resolution for the target display without loading the original camera file in production
- The accepted reference uses a 1200 × 1600 portrait WebP

### Color helmet

- Prefer an owned or licensed front-facing image or a render from a licensed model
- Export transparent RGBA when possible
- Preserve visor, crown, chin, and side contours
- The accepted reference uses a 640 × 425 image with the helmet centered in a wider source frame

### Ghost

- Best: render the same model, camera, fit, and visor as the color helmet in a wireframe or translucent material
- Acceptable prototype: create a separate wireframe illustration, then state that it is a 2D approximation
- Keep the background fully transparent or pure black according to the shader's alpha extraction method
- The accepted reference uses a 1536 × 1024 image

## Registration checklist

Check the static composite at full opacity before motion:

- helmet center follows the head center
- visor opening exposes the intended part of the face
- crown leaves credible clearance above the hair
- chin and cheek contours do not cut through the face
- color and ghost share the same silhouette, camera, scale, and translation
- changing viewport size does not create drift between layers

The reference renderer computes `photoRect`, `visibleHelmet`, `helmetRect`, and `ghostRect` during layout. Those constants encode the accepted reference asset crop. Recalibrate them for other media rather than resizing the DOM layers independently.

## Asset routes

A real 3D model offers the best shared geometry for color and ghost materials. A photo composite is faster and can look convincing from one view, but it cannot create true parallax or prove the helmet was scanned. Photogrammetry of a reflective helmet is possible with an owned physical object, many overlapping views, controlled reflections, and likely manual cleanup of the visor.

Do not download or redistribute third-party models, product photos, or sponsor artwork without checking their terms. Keep the Skill media-free; supply project-specific assets at use time.
