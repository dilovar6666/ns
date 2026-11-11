# Blender workflow

Blender 5.3 currently exits immediately on this machine, including for `--version`. To inspect the unchanged source on a working Blender installation:

```sh
blender --background --python scripts/inspect_astronaut.py
```

The script imports the original GLB and prints objects, mesh counts, materials, collections, and actions. It does not save or alter the source.

For Anatomy View, acquire licensed, reviewed models for cardiovascular, skeletal, respiratory, renal, nervous, and muscular systems. In a new `.blend` file, place independently named objects under collections `ASTRONAUT`, `CARDIOVASCULAR`, `SKELETAL`, `RESPIRATORY`, `RENAL`, `NERVOUS`, and `MUSCULAR`. Verify orientation, scale, anatomical placement, attribution, polygon count, and materials. Export separate optimized GLBs for independent loading and visibility control. No anatomical objects are present in the supplied astronaut file.
