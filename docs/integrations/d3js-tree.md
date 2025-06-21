Directory structure:
└── d3-d3/
    ├── README.md
    ├── API.md
    ├── bundle.js
    ├── CHANGES.md
    ├── LICENSE
    ├── package.json
    ├── prebuild.sh
    ├── rollup.config.js
    ├── .eslintrc.json
    ├── docs/
    │   ├── api.md
    │   ├── community.md
    │   ├── d3-array.md
    │   ├── d3-axis.md
    │   ├── d3-brush.md
    │   ├── d3-chord.md
    │   ├── d3-color.md
    │   ├── d3-contour.md
    │   ├── d3-delaunay.md
    │   ├── d3-dispatch.md
    │   ├── d3-drag.md
    │   ├── d3-dsv.md
    │   ├── d3-ease.md
    │   ├── d3-fetch.md
    │   ├── d3-force.md
    │   ├── d3-format.md
    │   ├── d3-geo.md
    │   ├── d3-hierarchy.md
    │   ├── d3-interpolate.md
    │   ├── d3-path.md
    │   ├── d3-polygon.md
    │   ├── d3-quadtree.md
    │   ├── d3-random.md
    │   ├── d3-scale-chromatic.md
    │   ├── d3-scale.md
    │   ├── d3-selection.md
    │   ├── d3-shape.md
    │   ├── d3-time-format.md
    │   ├── d3-time.md
    │   ├── d3-timer.md
    │   ├── d3-transition.md
    │   ├── d3-zoom.md
    │   ├── getting-started.md
    │   ├── index.md
    │   ├── what-is-d3.md
    │   ├── components/
    │   │   ├── ColorRamp.vue
    │   │   ├── ColorSpan.vue
    │   │   ├── ColorSwatches.vue
    │   │   ├── deferRender.js
    │   │   ├── ExampleAnimatedQuadtree.vue
    │   │   ├── ExampleArcs.vue
    │   │   ├── ExampleAxis.vue
    │   │   ├── ExampleBlankChart.vue
    │   │   ├── ExampleChord.vue
    │   │   ├── ExampleCollideForce.vue
    │   │   ├── ExampleCurve.vue
    │   │   ├── ExampleDisjointForce.vue
    │   │   ├── ExampleEase.vue
    │   │   ├── ExampleLinkForce.vue
    │   │   ├── LogoDiagram.vue
    │   │   ├── PlotRender.js
    │   │   ├── quadtreeFindVisited.js
    │   │   ├── quadtreeNodes.js
    │   │   ├── quadtreeVisitParent.js
    │   │   ├── UsMap.vue
    │   │   └── WorldMap.vue
    │   ├── d3-array/
    │   │   ├── add.md
    │   │   ├── bin.md
    │   │   ├── bisect.md
    │   │   ├── blur.md
    │   │   ├── group.md
    │   │   ├── intern.md
    │   │   ├── sets.md
    │   │   ├── sort.md
    │   │   ├── summarize.md
    │   │   ├── ticks.md
    │   │   └── transform.md
    │   ├── d3-chord/
    │   │   ├── chord.md
    │   │   └── ribbon.md
    │   ├── d3-contour/
    │   │   ├── contour.md
    │   │   └── density.md
    │   ├── d3-delaunay/
    │   │   ├── delaunay.md
    │   │   └── voronoi.md
    │   ├── d3-force/
    │   │   ├── center.md
    │   │   ├── collide.md
    │   │   ├── link.md
    │   │   ├── many-body.md
    │   │   ├── position.md
    │   │   └── simulation.md
    │   ├── d3-geo/
    │   │   ├── azimuthal.md
    │   │   ├── conic.md
    │   │   ├── cylindrical.md
    │   │   ├── math.md
    │   │   ├── path.md
    │   │   ├── projection.md
    │   │   ├── shape.md
    │   │   └── stream.md
    │   ├── d3-hierarchy/
    │   │   ├── cluster.md
    │   │   ├── hierarchy.md
    │   │   ├── pack.md
    │   │   ├── partition.md
    │   │   ├── stratify.md
    │   │   ├── tree.md
    │   │   └── treemap.md
    │   ├── d3-interpolate/
    │   │   ├── color.md
    │   │   ├── transform.md
    │   │   ├── value.md
    │   │   └── zoom.md
    │   ├── d3-scale/
    │   │   ├── band.md
    │   │   ├── diverging.md
    │   │   ├── linear.md
    │   │   ├── log.md
    │   │   ├── ordinal.md
    │   │   ├── point.md
    │   │   ├── pow.md
    │   │   ├── quantile.md
    │   │   ├── quantize.md
    │   │   ├── sequential.md
    │   │   ├── symlog.md
    │   │   ├── threshold.md
    │   │   └── time.md
    │   ├── d3-scale-chromatic/
    │   │   ├── categorical.md
    │   │   ├── cyclical.md
    │   │   ├── diverging.md
    │   │   └── sequential.md
    │   ├── d3-selection/
    │   │   ├── control-flow.md
    │   │   ├── events.md
    │   │   ├── joining.md
    │   │   ├── locals.md
    │   │   ├── modifying.md
    │   │   ├── namespaces.md
    │   │   └── selecting.md
    │   ├── d3-shape/
    │   │   ├── arc.md
    │   │   ├── area.md
    │   │   ├── curve.md
    │   │   ├── line.md
    │   │   ├── link.md
    │   │   ├── pie.md
    │   │   ├── radial-area.md
    │   │   ├── radial-line.md
    │   │   ├── radial-link.md
    │   │   ├── stack.md
    │   │   └── symbol.md
    │   ├── d3-transition/
    │   │   ├── control-flow.md
    │   │   ├── modifying.md
    │   │   ├── selecting.md
    │   │   └── timing.md
    │   ├── data/
    │   │   └── volcano.data.js
    │   ├── public/
    │   │   └── data/
    │   │       ├── riaa-us-revenue.csv
    │   │       └── volcano.json
    │   └── .vitepress/
    │       ├── config.ts
    │       └── theme/
    │           ├── custom.css
    │           ├── CustomFooter.vue
    │           ├── CustomLayout.vue
    │           ├── ExamplesGrid.vue
    │           ├── gallery.data.js
    │           ├── index.ts
    │           ├── ObservablePromo.vue
    │           ├── stargazers.data.ts
    │           └── VersionAndStars.vue
    ├── src/
    │   └── index.js
    ├── test/
    │   ├── d3-test.js
    │   ├── docs-test.js
    │   └── .eslintrc.json
    └── .github/
        ├── eslint.json
        └── workflows/
            ├── deploy.yml
            └── test.yml
