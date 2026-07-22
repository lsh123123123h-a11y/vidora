# Character Master and Derivative Design

## Goal

Make a root role asset an identity-only master image. A role derivative is the only role image eligible for storyboard, image, and video production references.

## Rules

1. A root role (`assetsId IS NULL`) is generated with a neutral identity prompt: white or light-gray seamless background, four views, plain unbranded base clothing, no props, no narrative action, and no scene.
2. A role derivative (`assetsId IS NOT NULL`) cannot generate until its root role has a completed image file.
3. A derivative prompt receives the root role's complete prompt and its image as a reference, plus the derivative description.
4. Storyboards may not bind a root role. Existing root-role bindings are returned as a clear validation error rather than being silently remapped.
5. Scenes and props retain their existing root/derivative behavior.

## Scope

This change does not regenerate existing images, choose a default costume automatically, or mutate existing storyboard bindings. It prevents new invalid work and reports existing invalid bindings clearly.
