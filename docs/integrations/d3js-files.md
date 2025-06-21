(Files content cropped to 300k characters, download full ingest to see more)
================================================
FILE: README.md
================================================
# D3: Data-Driven Documents

<a href="https://d3js.org"><img src="./docs/public/logo.svg" width="256" height="256"></a>

**D3** (or **D3.js**) is a free, open-source JavaScript library for visualizing data. Its low-level approach built on web standards offers unparalleled flexibility in authoring dynamic, data-driven graphics. For more than a decade D3 has powered groundbreaking and award-winning visualizations, become a foundational building block of higher-level chart libraries, and fostered a vibrant community of data practitioners around the world.

<a href="https://observablehq.observablehq.cloud/oss-analytics/@d3/d3">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://observablehq.observablehq.cloud/oss-analytics/d3/downloads-dark.svg">
    <img alt="Daily downloads of Observable Framework" src="https://observablehq.observablehq.cloud/oss-analytics/d3/downloads.svg">
  </picture>
</a>

<sub>Daily downloads of D3 · [oss-analytics](https://observablehq.observablehq.cloud/oss-analytics/)</sub>

## Resources

* [Documentation](https://d3js.org)
* [Examples](https://observablehq.com/@d3/gallery)
* [Releases](https://github.com/d3/d3/releases)
* [Getting help](https://d3js.org/community)



================================================
FILE: API.md
================================================
# D3 API Reference

The [API Reference](https://d3js.org/api) is now part of the documentation website.


================================================
FILE: bundle.js
================================================
export {version} from "./package.json";
export * from "./src/index.js";



================================================
FILE: CHANGES.md
================================================
# Changes in D3 7.0

[Released June 11, 2021.](https://github.com/d3/d3/releases/tag/v7.0.0)

*This document covers only major changes. For minor and patch changes, please see the [release notes](https://github.com/d3/d3/releases).*

D3 now ships as pure ES modules and requires Node.js 12 or higher. For more, please read [Sindre Sorhus’s FAQ](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

[d3.bin](https://github.com/d3/d3-array/blob/main/README.md#bin) now ignores nulls. [d3.ascending](https://github.com/d3/d3-array/blob/main/README.md#ascending) and [d3.descending](https://github.com/d3/d3-array/blob/main/README.md#descending) no longer consider null comparable.

[Ordinal scales](https://github.com/d3/d3-scale/blob/main/README.md#ordinal-scales) now use [InternMap](https://github.com/mbostock/internmap) for domains; domain values are now uniqued by coercing to a primitive value via *object*.valueOf instead of coercing to a string via *object*.toString.

Array-likes (*e.g.*, a live NodeList such as *element*.childNodes) are converted to arrays in [d3.selectAll](https://github.com/d3/d3-selection/blob/main/README.md#selectAll) and [*selection*.selectAll](https://github.com/d3/d3-selection/blob/main/README.md#selection_selectAll).

# Changes in D3 6.0

[Released August 26, 2020.](https://github.com/d3/d3/releases/tag/v6.0.0)

D3 now **uses native collections** (Map and Set) and **accepts iterables**. [d3.group and d3.rollup](https://observablehq.com/@d3/d3-group) are powerful new aggregation functions that replace d3.nest and work great [with d3-hierarchy](https://observablehq.com/d/9a453665f405eebf) and d3-selection. There are lots of new helpers in d3-array, too, such as [d3.greatest](https://observablehq.com/@d3/d3-least), [d3.quickselect](https://observablehq.com/@d3/d3-quickselect), and [d3.fsum](https://observablehq.com/@d3/d3-fsum).

D3 now **passes events directly to listeners**, replacing the d3.event global and bringing D3 inline with vanilla JavaScript and most other frameworks.

**d3-delaunay** (based on Vladimir Agafonkin’s excellent [Delaunator](https://github.com/mapbox/delaunator)) replaces d3-voronoi, offering dramatic improvements to performance, robustness, and [search](https://observablehq.com/@d3/delaunay-find). And there’s a new [d3-geo-voronoi](https://github.com/Fil/d3-geo-voronoi) for spherical (geographical) data! **d3-random** is [greatly expanded](https://github.com/d3/d3-random/blob/master/README.md) and includes a fast [linear congruential generator](https://observablehq.com/@d3/d3-randomlcg) for seeded randomness. **d3-chord** has new layouts for [directed](https://observablehq.com/@d3/directed-chord-diagram) and transposed chord diagrams. **d3-scale** adds a new [radial scale](https://observablehq.com/@d3/radial-stacked-bar-chart-ii) type.

… and a variety of other small enhancements. [More than 450 examples](https://observablehq.com/@d3/gallery) have been updated to D3 6.0!

### d3-array

* Accept iterables.
* Add [d3.group](https://github.com/d3/d3-array/blob/master/README.md#group).
* Add [d3.groups](https://github.com/d3/d3-array/blob/master/README.md#groups).
* Add [d3.index](https://github.com/d3/d3-array/blob/master/README.md#index).
* Add [d3.indexes](https://github.com/d3/d3-array/blob/master/README.md#indexes).
* Add [d3.rollup](https://github.com/d3/d3-array/blob/master/README.md#rollup).
* Add [d3.rollups](https://github.com/d3/d3-array/blob/master/README.md#rollups).
* Add [d3.maxIndex](https://github.com/d3/d3-array/blob/master/README.md#maxIndex).
* Add [d3.minIndex](https://github.com/d3/d3-array/blob/master/README.md#minIndex).
* Add [d3.greatest](https://github.com/d3/d3-array/blob/master/README.md#greatest).
* Add [d3.greatestIndex](https://github.com/d3/d3-array/blob/master/README.md#greatestIndex).
* Add [d3.least](https://github.com/d3/d3-array/blob/master/README.md#least).
* Add [d3.leastIndex](https://github.com/d3/d3-array/blob/master/README.md#leastIndex).
* Add [d3.bin](https://github.com/d3/d3-array/blob/master/README.md#bin).
* Add [d3.count](https://github.com/d3/d3-array/blob/master/README.md#count).
* Add [d3.cumsum](https://github.com/d3/d3-array/blob/master/README.md#cumsum).
* Add [d3.fsum](https://github.com/d3/d3-array/blob/master/README.md#fsum).
* Add [d3.Adder](https://github.com/d3/d3-array/blob/master/README.md#Adder).
* Add [d3.quantileSorted](https://github.com/d3/d3-array/blob/master/README.md#quantileSorted).
* Add [d3.quickselect](https://github.com/d3/d3-array/blob/master/README.md#quickselect).
* Add [*bisector*.center](https://github.com/d3/d3-array/blob/master/README.md#bisector_center).
* Allow more than two iterables for [d3.cross](https://github.com/d3/d3-array/blob/master/README.md#cross).
* Accept non-sorted input with [d3.quantile](https://github.com/d3/d3-array/blob/master/README.md#quantile).
* Fix a *array*.sort bug in Safari.
* Fix bin thresholds to ignore NaN input.
* Fix [d3.ticks](https://github.com/d3/d3-array/blob/master/README.md#ticks) to not return ticks outside the domain.
* Improve the performance of [d3.median](https://github.com/d3/d3-array/blob/master/README.md#median).

See https://observablehq.com/@d3/d3-array-2-0 for details.

### d3-brush

* Add [*event*.mode](https://github.com/d3/d3-brush/blob/master/README.md#brush-events).
* Change [*brush*.on](https://github.com/d3/d3-brush/blob/master/README.md#brush_on) to pass the *event* directly to listeners.
* Improve multitouch (two-touch) interaction.

### d3-chord

* Add [d3.chordDirected](https://github.com/d3/d3-chord/blob/master/README.md#chordDirected).
* Add [d3.chordTranspose](https://github.com/d3/d3-chord/blob/master/README.md#chordTranspose).
* Add [d3.ribbonArrow](https://github.com/d3/d3-chord/blob/master/README.md#ribbonArrow).
* Add [*ribbon*.padAngle](https://github.com/d3/d3-chord/blob/master/README.md#ribbon_padAngle).
* Add [*ribbon*.sourceRadius](https://github.com/d3/d3-chord/blob/master/README.md#ribbon_sourceRadius).
* Add [*ribbon*.targetRadius](https://github.com/d3/d3-chord/blob/master/README.md#ribbon_targetRadius).

### d3-delaunay

* Add [d3.Delaunay](https://github.com/d3/d3-delaunay/blob/master/README.md).

### d3-drag

* Change [*drag*.on](https://github.com/d3/d3-drag/blob/master/README.md#drag_on) to pass the *event* directly to listeners.

### d3-force

* Add *iterations* argument to [*simulation*.tick](https://github.com/d3/d3-force/blob/master/README.md#simulation_tick).
* Add [*forceCenter*.strength](https://github.com/d3/d3-force/blob/master/README.md#center_strength).
* Add [*forceSimulation*.randomSource](https://github.com/d3/d3-force/blob/master/README.md#simulation_randomSource).
* All built-in forces are now fully deterministic (including “jiggling” coincident nodes).
* Improve the default phyllotaxis layout slightly by offsetting by one half-radius.
* Improve the error message when a link references an unknown node.
* [*force*.initialize](https://github.com/d3/d3-force/blob/master/README.md#force_initialize) is now passed a random source.
* Fix bug when initializing nodes with fixed positions.

### d3-format

* Change the default minus sign to the minus sign (−) instead of hyphen-minus (-).
* Fix decimal `d` formatting of numbers greater than or equal to 1e21.

### d3-geo

* Fix clipping of some degenerate polygons.

### d3-hierarchy

* Accept iterables.
* Add [*node*[Symbol.iterator]](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_iterator); hierarchies are now iterable.
* Add [*node*.find](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_find).
* Change [*node*.each](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_each) to pass the traversal index.
* Change [*node*.eachAfter](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_eachAfter) to pass the traversal index.
* Change [*node*.eachBefore](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_eachBefore) to pass the traversal index.
* Fix [d3.packSiblings](https://github.com/d3/d3-hierarchy/blob/master/README.md#packSiblings) for huge circles.
* Fix divide-by-zero bug in [d3.treemapBinary](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemapBinary).
* Fix divide-by-zero bug in [d3.treemapResquarify](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemapResquarify).

### d3-interpolate

* Add [*interpolateZoom*.rho](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateZoom_rho). (#25)
* Allow [d3.piecewise](https://github.com/d3/d3-interpolate/blob/master/README.md#piecewise) to default to using d3.interpolate. #90
* Change [d3.interpolateTransformCss](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateTransformCss) to use DOMMatrix and require absolute units. #83

### d3-quadtree

* Fix an infinite loop when coordinates diverge to huge values.

### d3-random

* Add [d3.randomLcg](https://github.com/d3/d3-random/blob/master/README.md#randomLcg).
* Add [d3.randomGamma](https://github.com/d3/d3-random/blob/master/README.md#randomGamma).
* Add [d3.randomBeta](https://github.com/d3/d3-random/blob/master/README.md#randomBeta).
* Add [d3.randomWeibull](https://github.com/d3/d3-random/blob/master/README.md#randomWeibull).
* Add [d3.randomCauchy](https://github.com/d3/d3-random/blob/master/README.md#randomCauchy).
* Add [d3.randomLogistic](https://github.com/d3/d3-random/blob/master/README.md#randomLogistic).
* Add [d3.randomPoisson](https://github.com/d3/d3-random/blob/master/README.md#randomPoisson).
* Add [d3.randomInt](https://github.com/d3/d3-random/blob/master/README.md#randomInt).
* Add [d3.randomBinomial](https://github.com/d3/d3-random/blob/master/README.md#randomBinomial).
* Add [d3.randomGeometric](https://github.com/d3/d3-random/blob/master/README.md#randomGeometric).
* Add [d3.randomPareto](https://github.com/d3/d3-random/blob/master/README.md#randomPareto).
* Add [d3.randomBernoulli](https://github.com/d3/d3-random/blob/master/README.md#randomBernoulli).
* Allow [d3.randomBates](https://github.com/d3/d3-random/blob/master/README.md#randomBates) to take fractional *n*.
* Allow [d3.randomIrwinHall](https://github.com/d3/d3-random/blob/master/README.md#randomIrwinHall) to take fractional *n*.
* Don’t wrap Math.random in the default source.

Thanks to @Lange, @p-v-d-Veeken, @svanschooten, @Parcly-Taxel and @jrus for your contributions!

### d3-scale

* Accept iterables.
* Add [*diverging*.rangeRound](https://github.com/d3/d3-scale/blob/master/README.md#diverging_rangeRound).
* Add [*sequential*.range](https://github.com/d3/d3-scale/blob/master/README.md#sequential_range) (for compatibility with d3-axis).
* Add [*sequential*.rangeRound](https://github.com/d3/d3-scale/blob/master/README.md#sequential_rangeRound).
* Add [*sequentialQuantile*.quantiles](https://github.com/d3/d3-scale/blob/master/README.md#sequentialQuantile_quantiles).
* Add [d3.scaleRadial](https://github.com/d3/d3-scale/blob/master/README.md#radial-scales).
* [*diverging*.range](https://github.com/d3/d3-scale/blob/master/README.md#diverging_range) can now be used to set the interpolator.
* [*sequential*.range](https://github.com/d3/d3-scale/blob/master/README.md#sequential_range) can now be used to set the interpolator.
* [d3.scaleDiverging](https://github.com/d3/d3-scale/blob/master/README.md#diverging-scales) can now accept a range array in place of an interpolator.
* [d3.scaleSequential](https://github.com/d3/d3-scale/blob/master/README.md#sequential-scales) can now accept a range array in place of an interpolator.
* Fix [*continuous*.nice](https://github.com/d3/d3-scale/blob/master/README.md#continuous_nice) to ensure that niced domains always span ticks.
* Fix [*log*.ticks](https://github.com/d3/d3-scale/blob/master/README.md#log_ticks) for small domains.
* Fix [*log*.ticks](https://github.com/d3/d3-scale/blob/master/README.md#log_ticks) for small domains. #44
* Fix [*scale*.clamp](https://github.com/d3/d3-scale/blob/master/README.md#continuous_clamp) for [sequential quantile scales](https://github.com/d3/d3-scale/blob/master/README.md#scaleSequentialQuantile). Thanks, @Fil!
* Fix [*scale*.clamp](https://github.com/d3/d3-scale/blob/master/README.md#continuous_clamp) for continuous scales with more domain values than range values.
* Fix [diverging scales](https://github.com/d3/d3-scale/blob/master/README.md#diverging-scales) with descending domains.
* Remove deprecated *step* argument from [*time*.ticks](https://github.com/d3/d3-scale/blob/master/README.md#time_ticks) and [*time*.nice](https://github.com/d3/d3-scale/blob/master/README.md#time_nice).

### d3-selection

* Add [*selection*.selectChild](https://github.com/d3/d3-selection/blob/master/README.md#selection_selectChild).
* Add [*selection*.selectChildren](https://github.com/d3/d3-selection/blob/master/README.md#selection_selectChildren).
* Add [d3.pointer](https://github.com/d3/d3-selection/blob/master/README.md#pointer).
* Add [d3.pointers](https://github.com/d3/d3-selection/blob/master/README.md#pointers).
* Add *selection*[Symbol.iterator]; selections are now iterable!
* Accept iterables with [*selection*.data](https://github.com/d3/d3-selection/blob/master/README.md#selection_data).
* Accept iterables with [d3.selectAll](https://github.com/d3/d3-selection/blob/master/README.md#selectAll).
* Change [*selection*.on](https://github.com/d3/d3-selection/blob/master/README.md#selection_on) to pass the *event* directly to listeners.
* Remove index and group from *selection*.on listeners!
* Remove d3.event!
* Remove d3.mouse.
* Remove d3.touch.
* Remove d3.touches.
* Remove d3.customEvent.
* Remove d3.clientPoint.
* Remove d3.sourceEvent.
* Fix *selection*.merge(*transition*) to error.

For an overview of changes, see https://observablehq.com/@d3/d3-selection-2-0.

### d3-shape

* Accept iterables.
* Add [d3.line](https://github.com/d3/d3-shape/blob/master/README.md#line)(*x*, *y*) shorthand.
* Add [d3.area](https://github.com/d3/d3-shape/blob/master/README.md#area)(*x*, *y0*, *y1*) shorthand.
* Add [d3.symbol](https://github.com/d3/d3-shape/blob/master/README.md#symbol)(*type*, *size*) shorthand.

### d3-time-format

* Add ISO 8601 “week year” (`%G` and `%g`).

### d3-timer

* Fix [*interval*.restart](https://github.com/d3/d3-timer/blob/master/README.md#timer_restart) to restart as an interval.

### d3-transition

* Add [*transition*.easeVarying](https://github.com/d3/d3-transition/blob/master/README.md#transition_easeVarying).
* Add *transition*[Symbol.iterator]; transitions are now iterable.
* Fix [*selection*.transition](https://github.com/d3/d3-transition/blob/master/README.md#selection_transition) to error if the named transition to inherit is not found.
* Fix [*transition*.end](https://github.com/d3/d3-transition/blob/master/README.md#transition_end) to resolve immediately if the selection is empty.

### d3-zoom

* Add [*zoom*.tapDistance](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_tapDistance).
* Change [*zoom*.on](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_on) to pass the *event* directly to listeners.
* Change the default [*zoom*.filter](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_filter) to observe *wheel* events if the control key is pressed.
* Change the default [*zoom*.wheelDelta](ttps://github.com/d3/d3-zoom/blob/master/README.md#zoom_wheelDelta) to go faster if the control key is pressed.
* Don‘t set touch-action: none.
* Upgrade to [d3-selection 2](https://observablehq.com/@d3/d3-selection-2-0).

### Breaking Changes

D3 6.0 introduces several non-backwards-compatible changes.

* Remove [d3.event](https://observablehq.com/d/f91cccf0cad5e9cb#events).
* Change [*selection*.on](https://observablehq.com/d/f91cccf0cad5e9cb#events) to pass the *event* directly to listeners.
* Change [*transition*.on](https://observablehq.com/d/f91cccf0cad5e9cb#events) to pass the *event* directly to listeners.
* Change [*brush*.on](https://observablehq.com/d/f91cccf0cad5e9cb#event_brush) to pass the *event* directly to listeners.
* Change [*drag*.on](https://observablehq.com/d/f91cccf0cad5e9cb#event_drag) to pass the *event* directly to listeners.
* Change [*zoom*.on](https://observablehq.com/d/f91cccf0cad5e9cb#event_zoom) to pass the *event* directly to listeners.
* Remove d3.mouse; use [d3.pointer](https://observablehq.com/d/f91cccf0cad5e9cb#pointer).
* Remove d3.touch; use [d3.pointer](https://observablehq.com/d/f91cccf0cad5e9cb#pointer).
* Remove d3.touches; use [d3.pointers](https://observablehq.com/d/f91cccf0cad5e9cb#pointer).
* Remove d3.clientPoint; use [d3.pointer](https://observablehq.com/d/f91cccf0cad5e9cb#pointer).
* Remove d3.voronoi; use [d3.Delaunay](https://observablehq.com/d/f91cccf0cad5e9cb#delaunay).
* Remove d3.nest; use [d3.group](https://observablehq.com/d/f91cccf0cad5e9cb#group) and [d3.rollup](https://observablehq.com/d/f91cccf0cad5e9cb#group).
* Remove d3.map; use [Map](https://observablehq.com/d/f91cccf0cad5e9cb#collection).
* Remove d3.set; use [Set](https://observablehq.com/d/f91cccf0cad5e9cb#collection).
* Remove d3.keys; use [Object.keys](https://observablehq.com/d/f91cccf0cad5e9cb#collection).
* Remove d3.values; use [Object.values](https://observablehq.com/d/f91cccf0cad5e9cb#collection).
* Remove d3.entries; use [Object.entries](https://observablehq.com/d/f91cccf0cad5e9cb#collection).
* Rename d3.histogram to [d3.bin](https://observablehq.com/d/f91cccf0cad5e9cb#bin).
* Rename d3.scan to [d3.leastIndex](https://observablehq.com/d/f91cccf0cad5e9cb#leastIndex).
* Change [d3.interpolateTransformCss](https://observablehq.com/d/f91cccf0cad5e9cb#interpolateTransformCss) to require absolute units.
* Change [d3.format](https://observablehq.com/d/f91cccf0cad5e9cb#minus) to default to the minus sign instead of hyphen-minus for negative values.

D3 now requires a browser that supports [ES2015](http://www.ecma-international.org/ecma-262/6.0/). For older browsers, you must bring your own transpiler.

Lastly, support for [Bower](https://bower.io) has been dropped; D3 is now exclusively published to npm and GitHub.

See our [migration guide](https://observablehq.com/d/f91cccf0cad5e9cb) for help upgrading.

# Changes in D3 5.0

[Released March 22, 2018.](https://github.com/d3/d3/releases/tag/v5.0.0)

D3 5.0 introduces only a few non-backwards-compatible changes.

D3 now uses [Promises](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Using_promises) instead of asynchronous callbacks to load data. Promises simplify the structure of asynchronous code, especially in modern browsers that support [async and await](https://javascript.info/async-await). (See this [introduction to promises](https://observablehq.com/@observablehq/introduction-to-promises) on [Observable](https://observablehq.com).) For example, to load a CSV file in v4, you might say:

```js
d3.csv("file.csv", function(error, data) {
  if (error) throw error;
  console.log(data);
});
```

In v5, using promises:

```js
d3.csv("file.csv").then(function(data) {
  console.log(data);
});
```

Note that you don’t need to rethrow the error—the promise will reject automatically, and you can *promise*.catch if desired. Using await, the code is even simpler:

```js
const data = await d3.csv("file.csv");
console.log(data);
```

With the adoption of promises, D3 now uses the [Fetch API](https://fetch.spec.whatwg.org/) instead of [XMLHttpRequest](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest): the [d3-request](https://github.com/d3/d3-request) module has been replaced by [d3-fetch](https://github.com/d3/d3-fetch). Fetch supports many powerful new features, such as [streaming responses](https://observablehq.com/@mbostock/streaming-shapefiles). D3 5.0 also deprecates and removes the [d3-queue](https://github.com/d3/d3-queue) module. Use [Promise.all](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) to run a batch of asynchronous tasks in parallel, or a helper library such as [p-queue](https://github.com/sindresorhus/p-queue) to [control concurrency](https://observablehq.com/@mbostock/hello-p-queue).

D3 no longer provides the d3.schemeCategory20* categorical color schemes. These twenty-color schemes were flawed because their grouped design could falsely imply relationships in the data: a shared hue can imply that the encoded data are part of a group (a super-category), while relative lightness can imply order. Instead, D3 now includes [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic), which implements excellent schemes from ColorBrewer, including [categorical](https://github.com/d3/d3-scale-chromatic/blob/master/README.md#categorical), [diverging](https://github.com/d3/d3-scale-chromatic/blob/master/README.md#diverging), [sequential single-hue](https://github.com/d3/d3-scale-chromatic/blob/master/README.md#sequential-single-hue) and [sequential multi-hue](https://github.com/d3/d3-scale-chromatic/blob/master/README.md#sequential-multi-hue) schemes. These schemes are available in both discrete and continuous variants.

D3 now provides implementations of [marching squares](https://observablehq.com/@d3/contours) and [density estimation](https://observablehq.com/@d3/density-contours) via [d3-contour](https://github.com/d3/d3-contour)! There are two new [d3-selection](https://github.com/d3/d3-selection) methods: [*selection*.clone](https://github.com/d3/d3-selection/blob/master/README.md#selection_clone) for inserting clones of the selected nodes, and [d3.create](https://github.com/d3/d3-selection/blob/master/README.md#create) for creating detached elements. [Geographic projections](https://github.com/d3/d3-geo) now support [*projection*.angle](https://github.com/d3/d3-geo/blob/master/README.md#projection_angle), which has enabled several fantastic new [polyhedral projections](https://github.com/d3/d3-geo-polygon) by Philippe Rivière.

Lastly, D3’s [package.json](https://github.com/d3/d3/blob/master/package.json) no longer pins exact versions of the dependent D3 modules. This fixes an issue with [duplicate installs](https://github.com/d3/d3/issues/3256) of D3 modules.

# Changes in D3 4.0

[Released June 28, 2016.](https://github.com/d3/d3/releases/tag/v4.0.0)

D3 4.0 is modular. Instead of one library, D3 is now [many small libraries](#table-of-contents) that are designed to work together. You can pick and choose which parts to use as you see fit. Each library is maintained in its own repository, allowing decentralized ownership and independent release cycles. The default bundle combines about thirty of these microlibraries.

```html
<script src="https://d3js.org/d3.v4.js"></script>
```

As before, you can load optional plugins on top of the default bundle, such as [ColorBrewer scales](https://github.com/d3/d3-scale-chromatic):

```html
<script src="https://d3js.org/d3.v4.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v0.3.js"></script>
```

You are not required to use the default bundle! If you’re just using [d3-selection](https://github.com/d3/d3-selection), use it as a standalone library. Like the default bundle, you can load D3 microlibraries using vanilla script tags or RequireJS (great for HTTP/2!):

```html
<script src="https://d3js.org/d3-selection.v1.js"></script>
```

You can also `cat` D3 microlibraries into a custom bundle, or use tools such as [Webpack](https://webpack.github.io/) and [Rollup](http://rollupjs.org/) to create [optimized bundles](https://bl.ocks.org/mbostock/bb09af4c39c79cffcde4). Custom bundles are great for applications that use a subset of D3’s features; for example, a React chart library might use D3 for scales and shapes, and React to manipulate the DOM. The D3 microlibraries are written as [ES6 modules](http://www.2ality.com/2014/09/es6-modules-final.html), and Rollup lets you pick at the symbol level to produce smaller bundles.

Small files are nice, but modularity is also about making D3 more *fun*. Microlibraries are easier to understand, develop and test. They make it easier for new people to get involved and contribute. They reduce the distinction between a “core module” and a “plugin”, and increase the pace of development in D3 features.

If you don’t care about modularity, you can mostly ignore this change and keep using the default bundle. However, there is one unavoidable consequence of adopting ES6 modules: every symbol in D3 4.0 now shares a flat namespace rather than the nested one of D3 3.x. For example, d3.scale.linear is now d3.scaleLinear, and d3.layout.treemap is now d3.treemap. The adoption of ES6 modules also means that D3 is now written exclusively in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) and has better readability. And there have been many other significant improvements to D3’s features! (Nearly all of the code from D3 3.x has been rewritten.) These changes are covered below.

### Other Global Changes

The default [UMD bundle](https://github.com/umdjs/umd) is now [anonymous](https://github.com/requirejs/requirejs/wiki/Updating-existing-libraries#register-as-an-anonymous-module-). No `d3` global is exported if AMD or CommonJS is detected. In a vanilla environment, the D3 microlibraries share the `d3` global, even if you load them independently; thus, code you write is the same whether or not you use the default bundle. (See [Let’s Make a (D3) Plugin](https://bost.ocks.org/mike/d3-plugin/) for more.) The generated bundle is no longer stored in the Git repository; Bower has been repointed to [d3-bower](https://github.com/mbostock-bower/d3-bower), and you can find the generated files on [npm](https://unpkg.com/d3) or attached to the [latest release](https://github.com/d3/d3/releases/latest). The non-minified default bundle is no longer mangled, making it more readable and preserving inline comments.

To the consternation of some users, 3.x employed Unicode variable names such as λ, φ, τ and π for a concise representation of mathematical operations. A downside of this approach was that a SyntaxError would occur if you loaded the non-minified D3 using ISO-8859-1 instead of UTF-8. 3.x also used Unicode string literals, such as the SI-prefix µ for 1e-6. 4.0 uses only ASCII variable names and ASCII string literals (see [rollup-plugin-ascii](https://github.com/mbostock/rollup-plugin-ascii)), avoiding encoding problems.

### Table of Contents

* [Arrays](#arrays-d3-array)
* [Axes](#axes-d3-axis)
* [Brushes](#brushes-d3-brush)
* [Chords](#chords-d3-chord)
* [Collections](#collections-d3-collection)
* [Colors](#colors-d3-color)
* [Dispatches](#dispatches-d3-dispatch)
* [Dragging](#dragging-d3-drag)
* [Delimiter-Separated Values](#delimiter-separated-values-d3-dsv)
* [Easings](#easings-d3-ease)
* [Forces](#forces-d3-force)
* [Number Formats](#number-formats-d3-format)
* [Geographies](#geographies-d3-geo)
* [Hierarchies](#hierarchies-d3-hierarchy)
* [Internals](#internals)
* [Interpolators](#interpolators-d3-interpolate)
* [Paths](#paths-d3-path)
* [Polygons](#polygons-d3-polygon)
* [Quadtrees](#quadtrees-d3-quadtree)
* [Queues](#queues-d3-queue)
* [Random Numbers](#random-numbers-d3-random)
* [Requests](#requests-d3-request)
* [Scales](#scales-d3-scale)
* [Selections](#selections-d3-selection)
* [Shapes](#shapes-d3-shape)
* [Time Formats](#time-formats-d3-time-format)
* [Time Intervals](#time-intervals-d3-time)
* [Timers](#timers-d3-timer)
* [Transitions](#transitions-d3-transition)
* [Voronoi Diagrams](#voronoi-diagrams-d3-voronoi)
* [Zooming](#zooming-d3-zoom)

## [Arrays (d3-array)](https://github.com/d3/d3-array/blob/master/README.md)

The new [d3.scan](https://github.com/d3/d3-array/blob/master/README.md#scan) method performs a linear scan of an array, returning the index of the least element according to the specified comparator. This is similar to [d3.min](https://github.com/d3/d3-array/blob/master/README.md#min) and [d3.max](https://github.com/d3/d3-array/blob/master/README.md#max), except you can use it to find the position of an extreme element, rather than just calculate an extreme value.

```js
var data = [
  {name: "Alice", value: 2},
  {name: "Bob", value: 3},
  {name: "Carol", value: 1},
  {name: "Dwayne", value: 5}
];

var i = d3.scan(data, function(a, b) { return a.value - b.value; }); // 2
data[i]; // {name: "Carol", value: 1}
```

The new [d3.ticks](https://github.com/d3/d3-array/blob/master/README.md#ticks) and [d3.tickStep](https://github.com/d3/d3-array/blob/master/README.md#tickStep) methods are useful for generating human-readable numeric ticks. These methods are a low-level alternative to [*continuous*.ticks](https://github.com/d3/d3-scale/blob/master/README.md#continuous_ticks) from [d3-scale](https://github.com/d3/d3-scale). The new implementation is also more accurate, returning the optimal number of ticks as measured by relative error.

```js
var ticks = d3.ticks(0, 10, 5); // [0, 2, 4, 6, 8, 10]
```

The [d3.range](https://github.com/d3/d3-array/blob/master/README.md#range) method no longer makes an elaborate attempt to avoid floating-point error when *step* is not an integer. The returned values are strictly defined as *start* + *i* \* *step*, where *i* is an integer. (Learn more about [floating point math](http://0.30000000000000004.com/).) d3.range returns the empty array for infinite ranges, rather than throwing an error.

The method signature for optional accessors has been changed to be more consistent with array methods such as [*array*.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach): the accessor is passed the current element (*d*), the index (*i*), and the array (*data*), with *this* as undefined. This affects [d3.min](https://github.com/d3/d3-array/blob/master/README.md#min), [d3.max](https://github.com/d3/d3-array/blob/master/README.md#max), [d3.extent](https://github.com/d3/d3-array/blob/master/README.md#extent), [d3.sum](https://github.com/d3/d3-array/blob/master/README.md#sum), [d3.mean](https://github.com/d3/d3-array/blob/master/README.md#mean), [d3.median](https://github.com/d3/d3-array/blob/master/README.md#median), [d3.quantile](https://github.com/d3/d3-array/blob/master/README.md#quantile), [d3.variance](https://github.com/d3/d3-array/blob/master/README.md#variance) and [d3.deviation](https://github.com/d3/d3-array/blob/master/README.md#deviation). The [d3.quantile](https://github.com/d3/d3-array/blob/master/README.md#quantile) method previously did not take an accessor. Some methods with optional arguments now treat those arguments as missing if they are null or undefined, rather than strictly checking arguments.length.

The new [d3.histogram](https://github.com/d3/d3-array/blob/master/README.md#histograms) API replaces d3.layout.histogram. Rather than exposing *bin*.x and *bin*.dx on each returned bin, the histogram exposes *bin*.x0 and *bin*.x1, guaranteeing that *bin*.x0 is exactly equal to *bin*.x1 on the preceding bin. The “frequency” and “probability” modes are no longer supported; each bin is simply an array of elements from the input data, so *bin*.length is equal to D3 3.x’s *bin*.y in frequency mode. To compute a probability distribution, divide the number of elements in each bin by the total number of elements.

The *histogram*.range method has been renamed [*histogram*.domain](https://github.com/d3/d3-array/blob/master/README.md#histogram_domain) for consistency with scales. The *histogram*.bins method has been renamed [*histogram*.thresholds](https://github.com/d3/d3-array/blob/master/README.md#histogram_thresholds), and no longer accepts an upper value: *n* thresholds will produce *n* + 1 bins. If you specify a desired number of bins rather than thresholds, d3.histogram now uses [d3.ticks](https://github.com/d3/d3-array/blob/master/README.md#ticks) to compute nice bin thresholds. In addition to the default Sturges’ formula, D3 now implements the [Freedman-Diaconis rule](https://github.com/d3/d3-array/blob/master/README.md#thresholdFreedmanDiaconis) and [Scott’s normal reference rule](https://github.com/d3/d3-array/blob/master/README.md#thresholdScott).

## [Axes (d3-axis)](https://github.com/d3/d3-axis/blob/master/README.md)

To render axes properly in D3 3.x, you needed to style them:

```html
<style>

.axis path,
.axis line {
  fill: none;
  stroke: #000;
  shape-rendering: crispEdges;
}

.axis text {
  font: 10px sans-serif;
}

</style>
<script>

d3.select(".axis")
    .call(d3.svg.axis()
        .scale(x)
        .orient("bottom"));

</script>
```

If you didn’t, you saw this:

<img src="https://raw.githubusercontent.com/d3/d3/master/img/axis-v3.png" width="100%" height="105">

D3 4.0 provides default styles and shorter syntax. In place of d3.svg.axis and *axis*.orient, D3 4.0 now provides four constructors for each orientation: [d3.axisTop](https://github.com/d3/d3-axis/blob/master/README.md#axisTop), [d3.axisRight](https://github.com/d3/d3-axis/blob/master/README.md#axisRight), [d3.axisBottom](https://github.com/d3/d3-axis/blob/master/README.md#axisBottom), [d3.axisLeft](https://github.com/d3/d3-axis/blob/master/README.md#axisLeft). These constructors accept a scale, so you can reduce all of the above to:

```html
<script>

d3.select(".axis")
    .call(d3.axisBottom(x));

</script>
```

And get this:

<img src="https://raw.githubusercontent.com/d3/d3/master/img/axis-v4.png" width="100%" height="105">

As before, you can customize the axis appearance either by applying stylesheets or by modifying the axis elements. The default appearance has been changed slightly to offset the axis by a half-pixel;  this fixes a crisp-edges rendering issue on Safari where the axis would be drawn two-pixels thick.

There’s now an [*axis*.tickArguments](https://github.com/d3/d3-axis/blob/master/README.md#axis_tickArguments) method, as an alternative to [*axis*.ticks](https://github.com/d3/d3-axis/blob/master/README.md#axis_ticks) that also allows the axis tick arguments to be inspected. The [*axis*.tickSize](https://github.com/d3/d3-axis/blob/master/README.md#axis_tickSize) method has been changed to only allow a single argument when setting the tick size. The *axis*.innerTickSize and *axis*.outerTickSize methods have been renamed [*axis*.tickSizeInner](https://github.com/d3/d3-axis/blob/master/README.md#axis_tickSizeInner) and [*axis*.tickSizeOuter](https://github.com/d3/d3-axis/blob/master/README.md#axis_tickSizeOuter), respectively.

## [Brushes (d3-brush)](https://github.com/d3/d3-brush/blob/master/README.md)

Replacing d3.svg.brush, there are now three classes of brush for brushing along the *x*-dimension, the *y*-dimension, or both: [d3.brushX](https://github.com/d3/d3-brush/blob/master/README.md#brushX), [d3.brushY](https://github.com/d3/d3-brush/blob/master/README.md#brushY), [d3.brush](https://github.com/d3/d3-brush/blob/master/README.md#brush). Brushes are no longer dependent on [scales](#scales-d3-scale); instead, each brush defines a selection in screen coordinates. This selection can be [inverted](https://github.com/d3/d3-scale/blob/master/README.md#continuous_invert) if you want to compute the corresponding data domain. And rather than rely on the scales’ ranges to determine the brushable area, there is now a [*brush*.extent](https://github.com/d3/d3-brush/blob/master/README.md#brush_extent) method for setting it. If you do not set the brush extent, it defaults to the full extent of the owner SVG element. The *brush*.clamp method has also been eliminated; brushing is always restricted to the brushable area defined by the brush extent.

Brushes no longer store the active brush selection (*i.e.*, the highlighted region; the brush’s position) internally. The brush’s position is now stored on any elements to which the brush has been applied. The brush’s position is available as *event*.selection within a brush event or by calling [d3.brushSelection](https://github.com/d3/d3-brush/blob/master/README.md#brushSelection) on a given *element*. To move the brush programmatically, use [*brush*.move](https://github.com/d3/d3-brush/blob/master/README.md#brush_move) with a given [selection](#selections-d3-selection) or [transition](#transitions-d3-transition); see the [brush snapping example](https://bl.ocks.org/mbostock/6232537). The *brush*.event method has been removed.

Brush interaction has been improved. By default, brushes now ignore right-clicks intended for the context menu; you can change this behavior using [*brush*.filter](https://github.com/d3/d3-brush/blob/master/README.md#brush_filter). Brushes also ignore emulated mouse events on iOS. Holding down SHIFT (⇧) while brushing locks the *x*- or *y*-position of the brush. Holding down META (⌘) while clicking and dragging starts a new selection, rather than translating the existing selection.

The default appearance of the brush has also been improved and slightly simplified. Previously it was necessary to apply styles to the brush to give it a reasonable appearance, such as:

```css
.brush .extent {
  stroke: #fff;
  fill-opacity: .125;
  shape-rendering: crispEdges;
}
```

These styles are now applied by default as attributes; if you want to customize the brush appearance, you can still apply external styles or modify the brush elements. (D3 4.0 features a similar improvement to [axes](#axes-d3-axis).) A new [*brush*.handleSize](https://github.com/d3/d3-brush/blob/master/README.md#brush_handleSize) method lets you override the brush handle size; it defaults to six pixels.

The brush now consumes handled events, making it easier to combine with other interactive behaviors such as [dragging](#dragging-d3-drag) and [zooming](#zooming-d3-zoom). The *brushstart* and *brushend* events have been renamed to *start* and *end*, respectively. The brush event no longer reports a *event*.mode to distinguish between resizing and dragging the brush.

## [Chords (d3-chord)](https://github.com/d3/d3-chord/blob/master/README.md)

Pursuant to the great namespace flattening:

* d3.layout.chord ↦ [d3.chord](https://github.com/d3/d3-chord/blob/master/README.md#chord)
* d3.svg.chord ↦ [d3.ribbon](https://github.com/d3/d3-chord/blob/master/README.md#ribbon)

For consistency with [*arc*.padAngle](https://github.com/d3/d3-shape/blob/master/README.md#arc_padAngle), *chord*.padding has also been renamed to [*ribbon*.padAngle](https://github.com/d3/d3-chord/blob/master/README.md#ribbon_padAngle). A new [*ribbon*.context](https://github.com/d3/d3-chord/blob/master/README.md#ribbon_context) method lets you render chord diagrams to Canvas! See also [d3-path](#paths-d3-path).

## [Collections (d3-collection)](https://github.com/d3/d3-collection/blob/master/README.md)

The [d3.set](https://github.com/d3/d3-collection/blob/master/README.md#set) constructor now accepts an existing set for making a copy. If you pass an array to d3.set, you can also pass a value accessor. This accessor takes the standard arguments: the current element (*d*), the index (*i*), and the array (*data*), with *this* undefined. For example:

```js
var yields = [
  {yield: 22.13333, variety: "Manchuria",        year: 1932, site: "Grand Rapids"},
  {yield: 26.76667, variety: "Peatland",         year: 1932, site: "Grand Rapids"},
  {yield: 28.10000, variety: "No. 462",          year: 1931, site: "Duluth"},
  {yield: 38.50000, variety: "Svansota",         year: 1932, site: "Waseca"},
  {yield: 40.46667, variety: "Svansota",         year: 1931, site: "Crookston"},
  {yield: 36.03333, variety: "Peatland",         year: 1932, site: "Waseca"},
  {yield: 34.46667, variety: "Wisconsin No. 38", year: 1931, site: "Grand Rapids"}
];

var sites = d3.set(yields, function(d) { return d.site; }); // Grand Rapids, Duluth, Waseca, Crookston
```

The [d3.map](https://github.com/d3/d3-collection/blob/master/README.md#map) constructor also follows the standard array accessor argument pattern.

The *map*.forEach and *set*.forEach methods have been renamed to [*map*.each](https://github.com/d3/d3-collection/blob/master/README.md#map_each) and [*set*.each](https://github.com/d3/d3-collection/blob/master/README.md#set_each) respectively. The order of arguments for *map*.each has also been changed to *value*, *key* and *map*, while the order of arguments for *set*.each is now *value*, *value* and *set*. This is closer to ES6 [*map*.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach) and [*set*.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/forEach). Also like ES6 Map and Set, *map*.set and *set*.add now return the current collection (rather than the added value) to facilitate method chaining. New [*map*.clear](https://github.com/d3/d3-collection/blob/master/README.md#map_clear) and [*set*.clear](https://github.com/d3/d3-collection/blob/master/README.md#set_clear) methods can be used to empty collections.

The [*nest*.map](https://github.com/d3/d3-collection/blob/master/README.md#nest_map) method now always returns a d3.map instance. For a plain object, use [*nest*.object](https://github.com/d3/d3-collection/blob/master/README.md#nest_object) instead. When used in conjunction with [*nest*.rollup](https://github.com/d3/d3-collection/blob/master/README.md#nest_rollup), [*nest*.entries](https://github.com/d3/d3-collection/blob/master/README.md#nest_entries) now returns {key, value} objects for the leaf entries, instead of {key, values}. This makes *nest*.rollup easier to use in conjunction with [hierarchies](#hierarchies-d3-hierarchy), as in this [Nest Treemap example](https://bl.ocks.org/mbostock/2838bf53e0e65f369f476afd653663a2).

## [Colors (d3-color)](https://github.com/d3/d3-color/blob/master/README.md)

All colors now have opacity exposed as *color*.opacity, which is a number in [0, 1]. You can pass an optional opacity argument to the color space constructors [d3.rgb](https://github.com/d3/d3-color/blob/master/README.md#rgb), [d3.hsl](https://github.com/d3/d3-color/blob/master/README.md#hsl), [d3.lab](https://github.com/d3/d3-color/blob/master/README.md#lab), [d3.hcl](https://github.com/d3/d3-color/blob/master/README.md#hcl) or [d3.cubehelix](https://github.com/d3/d3-color/blob/master/README.md#cubehelix).

You can now parse rgba(…) and hsla(…) CSS color specifiers or the string “transparent” using [d3.color](https://github.com/d3/d3-color/blob/master/README.md#color). The “transparent” color is defined as an RGB color with zero opacity and undefined red, green and blue channels; this differs slightly from CSS which defines it as transparent black, but is useful for simplifying color interpolation logic where either the starting or ending color has undefined channels. The [*color*.toString](https://github.com/d3/d3-color/blob/master/README.md#color_toString) method now likewise returns an rgb(…) or rgba(…) string with integer channel values, not the hexadecimal RGB format, consistent with CSS computed values. This improves performance by short-circuiting transitions when the element’s starting style matches its ending style.

The new [d3.color](https://github.com/d3/d3-color/blob/master/README.md#color) method is the primary method for parsing colors: it returns a d3.color instance in the appropriate color space, or null if the CSS color specifier is invalid. For example:

```js
var red = d3.color("hsl(0, 80%, 50%)"); // {h: 0, l: 0.5, s: 0.8, opacity: 1}
```

The parsing implementation is now more robust. For example, you can no longer mix integers and percentages in rgb(…), and it correctly handles whitespace, decimal points, number signs, and other edge cases. The color space constructors d3.rgb, d3.hsl, d3.lab, d3.hcl and d3.cubehelix now always return a copy of the input color, converted to the corresponding color space. While [*color*.rgb](https://github.com/d3/d3-color/blob/master/README.md#color_rgb) remains, *rgb*.hsl has been removed; use d3.hsl to convert a color to the RGB color space.

The RGB color space no longer greedily quantizes and clamps channel values when creating colors, improving accuracy in color space conversion. Quantization and clamping now occurs in *color*.toString when formatting a color for display. You can use the new [*color*.displayable](https://github.com/d3/d3-color/blob/master/README.md#color_displayable) to test whether a color is [out-of-gamut](https://en.wikipedia.org/wiki/Gamut).

The [*rgb*.brighter](https://github.com/d3/d3-color/blob/master/README.md#rgb_brighter) method no longer special-cases black. This is a multiplicative operator, defining a new color *r*′, *g*′, *b*′ where *r*′ = *r* × *pow*(0.7, *k*), *g*′ = *g* × *pow*(0.7, *k*) and *b*′ = *b* × *pow*(0.7, *k*); a brighter black is still black.

There’s a new [d3.cubehelix](https://github.com/d3/d3-color/blob/master/README.md#cubehelix) color space, generalizing Dave Green’s color scheme! (See also [d3.interpolateCubehelixDefault](https://github.com/d3/d3-scale/blob/master/README.md#interpolateCubehelixDefault) from [d3-scale](#scales-d3-scale).) You can continue to define your own custom color spaces, too; see [d3-hsv](https://github.com/d3/d3-hsv) for an example.

## [Dispatches (d3-dispatch)](https://github.com/d3/d3-dispatch/blob/master/README.md)

Rather than decorating the *dispatch* object with each event type, the dispatch object now exposes generic [*dispatch*.call](https://github.com/d3/d3-dispatch/blob/master/README.md#dispatch_call) and [*dispatch*.apply](https://github.com/d3/d3-dispatch/blob/master/README.md#dispatch_apply) methods which take the *type* string as the first argument. For example, in D3 3.x, you might say:

```js
dispatcher.foo.call(that, "Hello, Foo!");
```

To dispatch a *foo* event in D3 4.0, you’d say:

```js
dispatcher.call("foo", that, "Hello, Foo!");
```

The [*dispatch*.on](https://github.com/d3/d3-dispatch/blob/master/README.md#dispatch_on) method now accepts multiple typenames, allowing you to add or remove listeners for multiple events simultaneously. For example, to send both *foo* and *bar* events to the same listener:

```js
dispatcher.on("foo bar", function(message) {
  console.log(message);
});
```

This matches the new behavior of [*selection*.on](https://github.com/d3/d3-selection/blob/master/README.md#selection_on) in [d3-selection](#selections-d3-selection). The *dispatch*.on method now validates that the specifier *listener* is a function, rather than throwing an error in the future.

The new implementation d3.dispatch is faster, using fewer closures to improve performance. There’s also a new [*dispatch*.copy](https://github.com/d3/d3-dispatch/blob/master/README.md#dispatch_copy) method for making a copy of a dispatcher; this is used by [d3-transition](#transitions-d3-transition) to improve the performance of transitions in the common case where all elements in a transition have the same transition event listeners.

## [Dragging (d3-drag)](https://github.com/d3/d3-drag/blob/master/README.md)

The drag behavior d3.behavior.drag has been renamed to d3.drag. The *drag*.origin method has been replaced by [*drag*.subject](https://github.com/d3/d3-drag/blob/master/README.md#drag_subject), which allows you to define the thing being dragged at the start of a drag gesture. This is particularly useful with Canvas, where draggable objects typically share a Canvas element (as opposed to SVG, where draggable objects typically have distinct DOM elements); see the [circle dragging example](https://bl.ocks.org/mbostock/444757cc9f0fde320a5f469cd36860f4).

A new [*drag*.container](https://github.com/d3/d3-drag/blob/master/README.md#drag_container) method lets you override the parent element that defines the drag gesture coordinate system. This defaults to the parent node of the element to which the drag behavior was applied. For dragging on Canvas elements, you probably want to use the Canvas element as the container.

[Drag events](https://github.com/d3/d3-drag/blob/master/README.md#drag-events) now expose an [*event*.on](https://github.com/d3/d3-drag/blob/master/README.md#event_on) method for registering temporary listeners for duration of the current drag gesture; these listeners can capture state for the current gesture, such as the thing being dragged. A new *event*.active property lets you detect whether multiple (multitouch) drag gestures are active concurrently. The *dragstart* and *dragend* events have been renamed to *start* and *end*. By default, drag behaviors now ignore right-clicks intended for the context menu; use [*drag*.filter](https://github.com/d3/d3-drag/blob/master/README.md#drag_filter) to control which events are ignored. The drag behavior also ignores emulated mouse events on iOS. The drag behavior now consumes handled events, making it easier to combine with other interactive behaviors such as [zooming](#zooming-d3-zoom).

The new [d3.dragEnable](https://github.com/d3/d3-drag/blob/master/README.md#dragEnable) and [d3.dragDisable](https://github.com/d3/d3-drag/blob/master/README.md#dragDisable) methods provide a low-level API for implementing drag gestures across browsers and devices. These methods are also used by other D3 components, such as the [brush](#brushes-d3-brush).

## [Delimiter-Separated Values (d3-dsv)](https://github.com/d3/d3-dsv/blob/master/README.md)

Pursuant to the great namespace flattening, various CSV and TSV methods have new names:

* d3.csv.parse ↦ [d3.csvParse](https://github.com/d3/d3-dsv/blob/master/README.md#csvParse)
* d3.csv.parseRows ↦ [d3.csvParseRows](https://github.com/d3/d3-dsv/blob/master/README.md#csvParseRows)
* d3.csv.format ↦ [d3.csvFormat](https://github.com/d3/d3-dsv/blob/master/README.md#csvFormat)
* d3.csv.formatRows ↦ [d3.csvFormatRows](https://github.com/d3/d3-dsv/blob/master/README.md#csvFormatRows)
* d3.tsv.parse ↦ [d3.tsvParse](https://github.com/d3/d3-dsv/blob/master/README.md#tsvParse)
* d3.tsv.parseRows ↦ [d3.tsvParseRows](https://github.com/d3/d3-dsv/blob/master/README.md#tsvParseRows)
* d3.tsv.format ↦ [d3.tsvFormat](https://github.com/d3/d3-dsv/blob/master/README.md#tsvFormat)
* d3.tsv.formatRows ↦ [d3.tsvFormatRows](https://github.com/d3/d3-dsv/blob/master/README.md#tsvFormatRows)

The [d3.csv](https://github.com/d3/d3-request/blob/master/README.md#csv) and [d3.tsv](https://github.com/d3/d3-request/blob/master/README.md#tsv) methods for loading files of the corresponding formats have not been renamed, however! Those are defined in [d3-request](#requests-d3-request).There’s no longer a d3.dsv method, which served the triple purpose of defining a DSV formatter, a DSV parser and a DSV requestor; instead, there’s just [d3.dsvFormat](https://github.com/d3/d3-dsv/blob/master/README.md#dsvFormat) which you can use to define a DSV formatter and parser. You can use [*request*.response](https://github.com/d3/d3-request/blob/master/README.md#request_response) to make a request and then parse the response body, or just use [d3.text](https://github.com/d3/d3-request/blob/master/README.md#text).

The [*dsv*.parse](https://github.com/d3/d3-dsv/blob/master/README.md#dsv_parse) method now exposes the column names and their input order as *data*.columns. For example:

```js
d3.csv("cars.csv", function(error, data) {
  if (error) throw error;
  console.log(data.columns); // ["Year", "Make", "Model", "Length"]
});
```

You can likewise pass an optional array of column names to [*dsv*.format](https://github.com/d3/d3-dsv/blob/master/README.md#dsv_format) to format only a subset of columns, or to specify the column order explicitly:

```js
var string = d3.csvFormat(data, ["Year", "Model", "Length"]);
```

The parser is a bit faster and the formatter is a bit more robust: inputs are coerced to strings before formatting, fixing an obscure crash, and deprecated support for falling back to [*dsv*.formatRows](https://github.com/d3/d3-dsv/blob/master/README.md#dsv_formatRows) when the input *data* is an array of arrays has been removed.

## [Easings (d3-ease)](https://github.com/d3/d3-ease/blob/master/README.md)

D3 3.x used strings, such as “cubic-in-out”, to identify easing methods; these strings could be passed to d3.ease or *transition*.ease. D3 4.0 uses symbols instead, such as [d3.easeCubicInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeCubicInOut). Symbols are simpler and cleaner. They work well with Rollup to produce smaller custom bundles. You can still define your own custom easing function, too, if desired. Here’s the full list of equivalents:

* linear ↦ [d3.easeLinear](https://github.com/d3/d3-ease/blob/master/README.md#easeLinear)¹
* linear-in ↦ [d3.easeLinear](https://github.com/d3/d3-ease/blob/master/README.md#easeLinear)¹
* linear-out ↦ [d3.easeLinear](https://github.com/d3/d3-ease/blob/master/README.md#easeLinear)¹
* linear-in-out ↦ [d3.easeLinear](https://github.com/d3/d3-ease/blob/master/README.md#easeLinear)¹
* linear-out-in ↦ [d3.easeLinear](https://github.com/d3/d3-ease/blob/master/README.md#easeLinear)¹
* poly-in ↦ [d3.easePolyIn](https://github.com/d3/d3-ease/blob/master/README.md#easePolyIn)
* poly-out ↦ [d3.easePolyOut](https://github.com/d3/d3-ease/blob/master/README.md#easePolyOut)
* poly-in-out ↦ [d3.easePolyInOut](https://github.com/d3/d3-ease/blob/master/README.md#easePolyInOut)
* poly-out-in ↦ REMOVED²
* quad-in ↦ [d3.easeQuadIn](https://github.com/d3/d3-ease/blob/master/README.md#easeQuadIn)
* quad-out ↦ [d3.easeQuadOut](https://github.com/d3/d3-ease/blob/master/README.md#easeQuadOut)
* quad-in-out ↦ [d3.easeQuadInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeQuadInOut)
* quad-out-in ↦ REMOVED²
* cubic-in ↦ [d3.easeCubicIn](https://github.com/d3/d3-ease/blob/master/README.md#easeCubicIn)
* cubic-out ↦ [d3.easeCubicOut](https://github.com/d3/d3-ease/blob/master/README.md#easeCubicOut)
* cubic-in-out ↦ [d3.easeCubicInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeCubicInOut)
* cubic-out-in ↦ REMOVED²
* sin-in ↦ [d3.easeSinIn](https://github.com/d3/d3-ease/blob/master/README.md#easeSinIn)
* sin-out ↦ [d3.easeSinOut](https://github.com/d3/d3-ease/blob/master/README.md#easeSinOut)
* sin-in-out ↦ [d3.easeSinInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeSinInOut)
* sin-out-in ↦ REMOVED²
* exp-in ↦ [d3.easeExpIn](https://github.com/d3/d3-ease/blob/master/README.md#easeExpIn)
* exp-out ↦ [d3.easeExpOut](https://github.com/d3/d3-ease/blob/master/README.md#easeExpOut)
* exp-in-out ↦ [d3.easeExpInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeExpInOut)
* exp-out-in ↦ REMOVED²
* circle-in ↦ [d3.easeCircleIn](https://github.com/d3/d3-ease/blob/master/README.md#easeCircleIn)
* circle-out ↦ [d3.easeCircleOut](https://github.com/d3/d3-ease/blob/master/README.md#easeCircleOut)
* circle-in-out ↦ [d3.easeCircleInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeCircleInOut)
* circle-out-in ↦ REMOVED²
* elastic-in ↦ [d3.easeElasticOut](https://github.com/d3/d3-ease/blob/master/README.md#easeElasticOut)²
* elastic-out ↦ [d3.easeElasticIn](https://github.com/d3/d3-ease/blob/master/README.md#easeElasticIn)²
* elastic-in-out ↦ REMOVED²
* elastic-out-in ↦ [d3.easeElasticInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeElasticInOut)²
* back-in ↦ [d3.easeBackIn](https://github.com/d3/d3-ease/blob/master/README.md#easeBackIn)
* back-out ↦ [d3.easeBackOut](https://github.com/d3/d3-ease/blob/master/README.md#easeBackOut)
* back-in-out ↦ [d3.easeBackInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeBackInOut)
* back-out-in ↦ REMOVED²
* bounce-in ↦ [d3.easeBounceOut](https://github.com/d3/d3-ease/blob/master/README.md#easeBounceOut)²
* bounce-out ↦ [d3.easeBounceIn](https://github.com/d3/d3-ease/blob/master/README.md#easeBounceIn)²
* bounce-in-out ↦ REMOVED²
* bounce-out-in ↦ [d3.easeBounceInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeBounceInOut)²

¹ The -in, -out and -in-out variants of linear easing are identical, so there’s just d3.easeLinear.
<br>² Elastic and bounce easing were inadvertently reversed in 3.x, so 4.0 eliminates -out-in easing!

For convenience, there are also default aliases for each easing method. For example, [d3.easeCubic](https://github.com/d3/d3-ease/blob/master/README.md#easeCubic) is an alias for [d3.easeCubicInOut](https://github.com/d3/d3-ease/blob/master/README.md#easeCubicInOut). Most default to -in-out; the exceptions are [d3.easeBounce](https://github.com/d3/d3-ease/blob/master/README.md#easeBounce) and [d3.easeElastic](https://github.com/d3/d3-ease/blob/master/README.md#easeElastic), which default to -out.

Rather than pass optional arguments to d3.ease or *transition*.ease, parameterizable easing functions now have named parameters: [*poly*.exponent](https://github.com/d3/d3-ease/blob/master/README.md#poly_exponent), [*elastic*.amplitude](https://github.com/d3/d3-ease/blob/master/README.md#elastic_amplitude), [*elastic*.period](https://github.com/d3/d3-ease/blob/master/README.md#elastic_period) and [*back*.overshoot](https://github.com/d3/d3-ease/blob/master/README.md#back_overshoot). For example, in D3 3.x you might say:

```js
var e = d3.ease("elastic-out-in", 1.2);
```

The equivalent in D3 4.0 is:

```js
var e = d3.easeElastic.amplitude(1.2);
```

Many of the easing functions have been optimized for performance and accuracy. Several bugs have been fixed, as well, such as the interpretation of the overshoot parameter for back easing, and the period parameter for elastic easing. Also, [d3-transition](#transitions-d3-transition) now explicitly guarantees that the last tick of the transition happens at exactly *t* = 1, avoiding floating point errors in some easing functions.

There’s now a nice [visual reference](https://github.com/d3/d3-ease/blob/master/README.md) and an [animated reference](https://bl.ocks.org/mbostock/248bac3b8e354a9103c4) to the new easing functions, too!

## [Forces (d3-force)](https://github.com/d3/d3-force/blob/master/README.md)

The force layout d3.layout.force has been renamed to d3.forceSimulation. The force simulation now uses [velocity Verlet integration](https://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet) rather than position Verlet, tracking the nodes’ positions (*node*.x, *node*.y) and velocities (*node*.vx, *node*.vy) rather than their previous positions (*node*.px, *node*.py).

Rather than hard-coding a set of built-in forces, the force simulation is now extensible: you specify which forces you want! The approach affords greater flexibility through composition. The new forces are more flexible, too: force parameters can typically be configured per-node or per-link. There are separate positioning forces for [*x*](https://github.com/d3/d3-force/blob/master/README.md#forceX) and [*y*](https://github.com/d3/d3-force/blob/master/README.md#forceY) that replace *force*.gravity; [*x*.x](https://github.com/d3/d3-force/blob/master/README.md#x_x) and [*y*.y](https://github.com/d3/d3-force/blob/master/README.md#y_y) replace *force*.size. The new [link force](https://github.com/d3/d3-force/blob/master/README.md#forceLink) replaces *force*.linkStrength and employs better default heuristics to improve stability. The new [many-body force](https://github.com/d3/d3-force/blob/master/README.md#forceManyBody) replaces *force*.charge and supports a new [minimum-distance parameter](https://github.com/d3/d3-force/blob/master/README.md#manyBody_distanceMin) and performance improvements thanks to 4.0’s [new quadtrees](#quadtrees-d3-quadtree). There are also brand-new forces for [centering nodes](https://github.com/d3/d3-force/blob/master/README.md#forceCenter) and [collision resolution](https://github.com/d3/d3-force/blob/master/README.md#forceCollision).

The new forces and simulation have been carefully crafted to avoid nondeterminism. Rather than initializing nodes randomly, if the nodes do not have preset positions, they are placed in a phyllotaxis pattern:

<img alt="Phyllotaxis" src="https://raw.githubusercontent.com/d3/d3-force/master/img/phyllotaxis.png" width="420" height="219">

Random jitter is still needed to resolve link, collision and many-body forces if there are coincident nodes, but at least in the common case, the force simulation (and the resulting force-directed graph layout) is now consistent across browsers and reloads. D3 no longer plays dice!

The force simulation has several new methods for greater control over heating, such as [*simulation*.alphaMin](https://github.com/d3/d3-force/blob/master/README.md#simulation_alphaMin) and [*simulation*.alphaDecay](https://github.com/d3/d3-force/blob/master/README.md#simulation_alphaDecay), and the internal timer. Calling [*simulation*.alpha](https://github.com/d3/d3-force/blob/master/README.md#simulation_alpha) now has no effect on the internal timer, which is controlled independently via [*simulation*.stop](https://github.com/d3/d3-force/blob/master/README.md#simulation_stop) and [*simulation*.restart](https://github.com/d3/d3-force/blob/master/README.md#simulation_restart). The force layout’s internal timer now starts automatically on creation, removing *force*.start. As in 3.x, you can advance the simulation manually using [*simulation*.tick](https://github.com/d3/d3-force/blob/master/README.md#simulation_tick). The *force*.friction parameter is replaced by *simulation*.velocityDecay. A new [*simulation*.alphaTarget](https://github.com/d3/d3-force/blob/master/README.md#simulation_alphaTarget) method allows you to set the desired alpha (temperature) of the simulation, such that the simulation can be smoothly reheated during interaction, and then smoothly cooled again. This improves the stability of the graph during interaction.

The force layout no longer depends on the [drag behavior](#dragging-d3-drag), though you can certainly create [draggable force-directed graphs](https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048)! Set *node*.fx and *node*.fy to fix a node’s position. As an alternative to a [Voronoi](#voronoi-d3-voronoi) SVG overlay, you can now use [*simulation*.find](https://github.com/d3/d3-force/blob/master/README.md#simulation_find) to find the closest node to a pointer.

## [Number Formats (d3-format)](https://github.com/d3/d3-format/blob/master/README.md)

If a precision is not specified, the formatting behavior has changed: there is now a default precision of 6 for all directives except *none*, which defaults to 12. In 3.x, if you did not specify a precision, the number was formatted using its shortest unique representation (per [*number*.toString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString)); this could lead to unexpected digits due to [floating point math](http://0.30000000000000004.com/). The new default precision in 4.0 produces more consistent results:

```js
var f = d3.format("e");
f(42);        // "4.200000e+1"
f(0.1 + 0.2); // "3.000000e-1"
```

To trim insignificant trailing zeroes, use the *none* directive, which is similar `g`. For example:

```js
var f = d3.format(".3");
f(0.12345);   // "0.123"
f(0.10000);   // "0.1"
f(0.1 + 0.2); // "0.3"
```

Under the hood, number formatting has improved accuracy with very large and very small numbers by using [*number*.toExponential](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential) rather than [Math.log](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log) to extract the mantissa and exponent. Negative zero (-0, an IEEE 754 construct) and very small numbers that round to zero are now formatted as unsigned zero. The inherently unsafe d3.round method has been removed, along with d3.requote.

The [d3.formatPrefix](https://github.com/d3/d3-format/blob/master/README.md#formatPrefix) method has been changed. Rather than returning an SI-prefix string, it returns an SI-prefix format function for a given *specifier* and reference *value*. For example, to format thousands:

```js
var f = d3.formatPrefix(",.0", 1e3);
f(1e3); // "1k"
f(1e4); // "10k"
f(1e5); // "100k"
f(1e6); // "1,000k"
```

Unlike the `s` format directive, d3.formatPrefix always employs the same SI-prefix, producing consistent results:

```js
var f = d3.format(".0s");
f(1e3); // "1k"
f(1e4); // "10k"
f(1e5); // "100k"
f(1e6); // "1M"
```

The new `(` sign option uses parentheses for negative values. This is particularly useful in conjunction with `$`. For example:

```js
d3.format("+.0f")(-42);  // "-42"
d3.format("(.0f")(-42);  // "(42)"
d3.format("+$.0f")(-42); // "-$42"
d3.format("($.0f")(-42); // "($42)"
```

The new `=` align option places any sign and symbol to the left of any padding:

```js
d3.format(">6d")(-42);  // "   -42"
d3.format("=6d")(-42);  // "-   42"
d3.format(">(6d")(-42); // "  (42)"
d3.format("=(6d")(-42); // "(  42)"
```

The `b`, `o`, `d` and `x` directives now round to the nearest integer, rather than returning the empty string for non-integers:

```js
d3.format("b")(41.9); // "101010"
d3.format("o")(41.9); // "52"
d3.format("d")(41.9); // "42"
d3.format("x")(41.9); // "2a"
```

The `c` directive is now for character data (*i.e.*, literal strings), not for character codes. The is useful if you just want to apply padding and alignment and don’t care about formatting numbers. For example, the infamous [left-pad](http://blog.npmjs.org/post/141577284765/kik-left-pad-and-npm) (as well as center- and right-pad!) can be conveniently implemented as:

```js
d3.format(">10c")("foo"); // "       foo"
d3.format("^10c")("foo"); // "   foo    "
d3.format("<10c")("foo"); // "foo       "
```

There are several new methods for computing suggested decimal precisions; these are used by [d3-scale](#scales-d3-scale) for tick formatting, and are helpful for implementing custom number formats: [d3.precisionFixed](https://github.com/d3/d3-format/blob/master/README.md#precisionFixed), [d3.precisionPrefix](https://github.com/d3/d3-format/blob/master/README.md#precisionPrefix) and [d3.precisionRound](https://github.com/d3/d3-format/blob/master/README.md#precisionRound). There’s also a new [d3.formatSpecifier](https://github.com/d3/d3-format/blob/master/README.md#formatSpecifier) method for parsing, validating and debugging format specifiers; it’s also good for deriving related format specifiers, such as when you want to substitute the precision automatically.

You can now set the default locale using [d3.formatDefaultLocale](https://github.com/d3/d3-format/blob/master/README.md#formatDefaultLocale)! The locales are published as [JSON](https://github.com/d3/d3-request/blob/master/README.md#json) to [npm](https://unpkg.com/d3-format/locale/).

## [Geographies (d3-geo)](https://github.com/d3/d3-geo/blob/master/README.md)

Pursuant to the great namespace flattening, various methods have new names:

* d3.geo.graticule ↦ [d3.geoGraticule](https://github.com/d3/d3-geo/blob/master/README.md#geoGraticule)
* d3.geo.circle ↦ [d3.geoCircle](https://github.com/d3/d3-geo/blob/master/README.md#geoCircle)
* d3.geo.area ↦ [d3.geoArea](https://github.com/d3/d3-geo/blob/master/README.md#geoArea)
* d3.geo.bounds ↦ [d3.geoBounds](https://github.com/d3/d3-geo/blob/master/README.md#geoBounds)
* d3.geo.centroid ↦ [d3.geoCentroid](https://github.com/d3/d3-geo/blob/master/README.md#geoCentroid)
* d3.geo.distance ↦ [d3.geoDistance](https://github.com/d3/d3-geo/blob/master/README.md#geoDistance)
* d3.geo.interpolate ↦ [d3.geoInterpolate](https://github.com/d3/d3-geo/blob/master/README.md#geoInterpolate)
* d3.geo.length ↦ [d3.geoLength](https://github.com/d3/d3-geo/blob/master/README.md#geoLength)
* d3.geo.rotation ↦ [d3.geoRotation](https://github.com/d3/d3-geo/blob/master/README.md#geoRotation)
* d3.geo.stream ↦ [d3.geoStream](https://github.com/d3/d3-geo/blob/master/README.md#geoStream)
* d3.geo.path ↦ [d3.geoPath](https://github.com/d3/d3-geo/blob/master/README.md#geoPath)
* d3.geo.projection ↦ [d3.geoProjection](https://github.com/d3/d3-geo/blob/master/README.md#geoProjection)
* d3.geo.projectionMutator ↦ [d3.geoProjectionMutator](https://github.com/d3/d3-geo/blob/master/README.md#geoProjectionMutator)
* d3.geo.albers ↦ [d3.geoAlbers](https://github.com/d3/d3-geo/blob/master/README.md#geoAlbers)
* d3.geo.albersUsa ↦ [d3.geoAlbersUsa](https://github.com/d3/d3-geo/blob/master/README.md#geoAlbersUsa)
* d3.geo.azimuthalEqualArea ↦ [d3.geoAzimuthalEqualArea](https://github.com/d3/d3-geo/blob/master/README.md#geoAzimuthalEqualArea)
* d3.geo.azimuthalEquidistant ↦ [d3.geoAzimuthalEquidistant](https://github.com/d3/d3-geo/blob/master/README.md#geoAzimuthalEquidistant)
* d3.geo.conicConformal ↦ [d3.geoConicConformal](https://github.com/d3/d3-geo/blob/master/README.md#geoConicConformal)
* d3.geo.conicEqualArea ↦ [d3.geoConicEqualArea](https://github.com/d3/d3-geo/blob/master/README.md#geoConicEqualArea)
* d3.geo.conicEquidistant ↦ [d3.geoConicEquidistant](https://github.com/d3/d3-geo/blob/master/README.md#geoConicEquidistant)
* d3.geo.equirectangular ↦ [d3.geoEquirectangular](https://github.com/d3/d3-geo/blob/master/README.md#geoEquirectangular)
* d3.geo.gnomonic ↦ [d3.geoGnomonic](https://github.com/d3/d3-geo/blob/master/README.md#geoGnomonic)
* d3.geo.mercator ↦ [d3.geoMercator](https://github.com/d3/d3-geo/blob/master/README.md#geoMercator)
* d3.geo.orthographic ↦ [d3.geoOrthographic](https://github.com/d3/d3-geo/blob/master/README.md#geoOrthographic)
* d3.geo.stereographic ↦ [d3.geoStereographic](https://github.com/d3/d3-geo/blob/master/README.md#geoStereographic)
* d3.geo.transverseMercator ↦ [d3.geoTransverseMercator](https://github.com/d3/d3-geo/blob/master/README.md#geoTransverseMercator)

Also renamed for consistency:

* *circle*.origin ↦ [*circle*.center](https://github.com/d3/d3-geo/blob/master/README.md#circle_center)
* *circle*.angle ↦ [*circle*.radius](https://github.com/d3/d3-geo/blob/master/README.md#circle_radius)
* *graticule*.majorExtent ↦ [*graticule*.extentMajor](https://github.com/d3/d3-geo/blob/master/README.md#graticule_extentMajor)
* *graticule*.minorExtent ↦ [*graticule*.extentMinor](https://github.com/d3/d3-geo/blob/master/README.md#graticule_extentMinor)
* *graticule*.majorStep ↦ [*graticule*.stepMajor](https://github.com/d3/d3-geo/blob/master/README.md#graticule_stepMajor)
* *graticule*.minorStep ↦ [*graticule*.stepMinor](https://github.com/d3/d3-geo/blob/master/README.md#graticule_stepMinor)

Projections now have more appropriate defaults. For example, [d3.geoOrthographic](https://github.com/d3/d3-geo/blob/master/README.md#geoOrthographic) has a 90° clip angle by default, showing only the front hemisphere, and [d3.geoGnomonic](https://github.com/d3/d3-geo/blob/master/README.md#geoGnomonic) has a default 60° clip angle. The default [projection](https://github.com/d3/d3-geo/blob/master/README.md#path_projection) for [d3.geoPath](https://github.com/d3/d3-geo/blob/master/README.md#geoPath) is now null rather than [d3.geoAlbersUsa](https://github.com/d3/d3-geo/blob/master/README.md#geoAlbersUsa); a null projection is used with [pre-projected geometry](https://bl.ocks.org/mbostock/5557726) and is typically faster to render.

“Fallback projections”—when you pass a function rather than a projection to [*path*.projection](https://github.com/d3/d3-geo/blob/master/README.md#path_projection)—are no longer supported. For geographic projections, use [d3.geoProjection](https://github.com/d3/d3-geo/blob/master/README.md#geoProjection) or [d3.geoProjectionMutator](https://github.com/d3/d3-geo/blob/master/README.md#geoProjectionMutator) to define a custom projection. For arbitrary geometry transformations, implement the [stream interface](https://github.com/d3/d3-geo/blob/master/README.md#streams); see also [d3.geoTransform](https://github.com/d3/d3-geo/blob/master/README.md#geoTransform). The “raw” projections (e.g., d3.geo.equirectangular.raw) are no longer exported.

## [Hierarchies (d3-hierarchy)](https://github.com/d3/d3-hierarchy/blob/master/README.md)

Pursuant to the great namespace flattening:

* d3.layout.cluster ↦ [d3.cluster](https://github.com/d3/d3-hierarchy/blob/master/README.md#cluster)
* d3.layout.hierarchy ↦ [d3.hierarchy](https://github.com/d3/d3-hierarchy/blob/master/README.md#hierarchy)
* d3.layout.pack ↦ [d3.pack](https://github.com/d3/d3-hierarchy/blob/master/README.md#pack)
* d3.layout.partition ↦ [d3.partition](https://github.com/d3/d3-hierarchy/blob/master/README.md#partition)
* d3.layout.tree ↦ [d3.tree](https://github.com/d3/d3-hierarchy/blob/master/README.md#tree)
* d3.layout.treemap ↦ [d3.treemap](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap)

As an alternative to using JSON to represent hierarchical data (such as the “flare.json format” used by many D3 examples), the new [d3.stratify](https://github.com/d3/d3-hierarchy/blob/master/README.md#stratify) operator simplifies the conversion of tabular data to hierarchical data! This is convenient if you already have data in a tabular format, such as the result of a SQL query or a CSV file:

```
name,parent
Eve,
Cain,Eve
Seth,Eve
Enos,Seth
Noam,Seth
Abel,Eve
Awan,Eve
Enoch,Awan
Azura,Eve
```

To convert this to a root [*node*](https://github.com/d3/d3-hierarchy/blob/master/README.md#hierarchy):

```js
var root = d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
    (nodes);
```

The resulting *root* can be passed to [d3.tree](https://github.com/d3/d3-hierarchy/blob/master/README.md#tree) to produce a tree diagram like this:

<img src="https://raw.githubusercontent.com/d3/d3/master/img/stratify.png" width="298" height="137">

Root nodes can also be created from JSON data using [d3.hierarchy](https://github.com/d3/d3-hierarchy/blob/master/README.md#hierarchy). The hierarchy layouts now take these root nodes as input rather than operating directly on JSON data, which helps to provide a cleaner separation between the input data and the computed layout. (For example, use [*node*.copy](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_copy) to isolate layout changes.) It also simplifies the API: rather than each hierarchy layout needing to implement value and sorting accessors, there are now generic [*node*.sum](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_sum) and [*node*.sort](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_sort) methods that work with any hierarchy layout.

The new d3.hierarchy API also provides a richer set of methods for manipulating hierarchical data. For example, to generate an array of all nodes in topological order, use [*node*.descendants](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_descendants); for just leaf nodes, use [*node*.leaves](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_leaves). To highlight the ancestors of a given *node* on mouseover, use [*node*.ancestors](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_ancestors). To generate an array of {source, target} links for a given hierarchy, use [*node*.links](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_links); this replaces *treemap*.links and similar methods on the other layouts. The new [*node*.path](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_path) method replaces d3.layout.bundle; see also [d3.curveBundle](https://github.com/d3/d3-shape/blob/master/README.md#curveBundle) for hierarchical edge bundling.

The hierarchy layouts have been rewritten using new, non-recursive traversal methods ([*node*.each](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_each), [*node*.eachAfter](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_eachAfter) and [*node*.eachBefore](https://github.com/d3/d3-hierarchy/blob/master/README.md#node_eachBefore)), improving performance on large datasets. The d3.tree layout no longer uses a *node*.\_ field to store temporary state during layout.

Treemap tiling is now [extensible](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap-tiling) via [*treemap*.tile](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_tile)! The default squarified tiling algorithm, [d3.treemapSquarify](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemapSquarify), has been completely rewritten, improving performance and fixing bugs in padding and rounding. The *treemap*.sticky method has been replaced with the [d3.treemapResquarify](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemapResquarify), which is identical to d3.treemapSquarify except it performs stable neighbor-preserving updates. The *treemap*.ratio method has been replaced with [*squarify*.ratio](https://github.com/d3/d3-hierarchy/blob/master/README.md#squarify_ratio). And there’s a new [d3.treemapBinary](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemapBinary) for binary treemaps!

Treemap padding has also been improved. The treemap now distinguishes between [outer padding](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_paddingOuter) that separates a parent from its children, and [inner padding](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_paddingInner) that separates adjacent siblings. You can set the [top-](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_paddingTop), [right-](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_paddingRight), [bottom-](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_paddingBottom) and [left-](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap_paddingLeft)outer padding separately. There are new examples for the traditional [nested treemap](https://bl.ocks.org/mbostock/911ad09bdead40ec0061) and for Lü and Fogarty’s [cascaded treemap](https://bl.ocks.org/mbostock/f85ffb3a5ac518598043). And there’s a new example demonstrating [d3.nest with d3.treemap](https://bl.ocks.org/mbostock/2838bf53e0e65f369f476afd653663a2).

The space-filling layouts [d3.treemap](https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap) and [d3.partition](https://github.com/d3/d3-hierarchy/blob/master/README.md#partition) now output *x0*, *x1*, *y0*, *y1* on each node instead of *x0*, *dx*, *y0*, *dy*. This improves accuracy by ensuring that the edges of adjacent cells are exactly equal, rather than sometimes being slightly off due to floating point math. The partition layout now supports [rounding](https://github.com/d3/d3-hierarchy/blob/master/README.md#partition_round) and [padding](https://github.com/d3/d3-hierarchy/blob/master/README.md#partition_padding).

The circle-packing layout, [d3.pack](https://github.com/d3/d3-hierarchy/blob/master/README.md#pack), has been completely rewritten to better implement Wang et al.’s algorithm, fixing major bugs and improving results! Welzl’s algorithm is now used to compute the exact [smallest enclosing circle](https://bl.ocks.org/mbostock/29c534ff0b270054a01c) for each parent, rather than the approximate answer used by Wang et al. The 3.x output is shown on the left; 4.0 is shown on the right:

<img alt="Circle Packing in 3.x" src="https://raw.githubusercontent.com/d3/d3/master/img/pack-v3.png" width="420" height="420"> <img alt="Circle Packing in 4.0" src="https://raw.githubusercontent.com/d3/d3/master/img/pack-v4.png" width="420" height="420">

A non-hierarchical implementation is also available as [d3.packSiblings](https://github.com/d3/d3-hierarchy/blob/master/README.md#packSiblings), and the smallest enclosing circle implementation is available as [d3.packEnclose](https://github.com/d3/d3-hierarchy/blob/master/README.md#packEnclose). [Pack padding](https://github.com/d3/d3-hierarchy/blob/master/README.md#pack_padding) now applies between a parent and its children, as well as between adjacent siblings. In addition, you can now specify padding as a function that is computed dynamically for each parent.

## Internals

The d3.rebind method has been removed. (See the [3.x source](https://github.com/d3/d3/blob/v3.5.17/src/core/rebind.js).) If you want to wrap a getter-setter method, the recommend pattern is to implement a wrapper method and check the return value. For example, given a *component* that uses an internal [*dispatch*](#dispatches-d3-dispatch), *component*.on can rebind *dispatch*.on as follows:

```js
component.on = function() {
  var value = dispatch.on.apply(dispatch, arguments);
  return value === dispatch ? component : value;
};
```

The d3.functor method has been removed. (See the [3.x source](https://github.com/d3/d3/blob/v3.5.17/src/core/functor.js).) If you want to promote a constant value to a function, the recommended pattern is to implement a closure that returns the constant value. If desired, you can use a helper method as follows:

```js
function constant(x) {
  return function() {
    return x;
  };
}
```

Given a value *x*, to promote *x* to a function if it is not already:

```js
var fx = typeof x === "function" ? x : constant(x);
```

## [Interpolators (d3-interpolate)](https://github.com/d3/d3-interpolate/blob/master/README.md)

The [d3.interpolate](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolate) method no longer delegates to d3.interpolators, which has been removed; its behavior is now defined by the library. It is now slightly faster in the common case that *b* is a number. It only uses [d3.interpolateRgb](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateRgb) if *b* is a valid CSS color specifier (and not approximately one). And if the end value *b* is null, undefined, true or false, d3.interpolate now returns a constant function which always returns *b*.

The behavior of [d3.interpolateObject](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateObject) and [d3.interpolateArray](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateArray) has changed slightly with respect to properties or elements in the start value *a* that do not exist in the end value *b*: these properties and elements are now ignored, such that the ending value of the interpolator at *t* = 1 is now precisely equal to *b*. So, in 3.x:

```js
d3.interpolateObject({foo: 2, bar: 1}, {foo: 3})(0.5); // {bar: 1, foo: 2.5} in 3.x
```

Whereas in 4.0, *a*.bar is ignored:

```js
d3.interpolateObject({foo: 2, bar: 1}, {foo: 3})(0.5); // {foo: 2.5} in 4.0
```

If *a* or *b* are undefined or not an object, they are now implicitly converted to the empty object or empty array as appropriate, rather than throwing a TypeError.

The d3.interpolateTransform interpolator has been renamed to [d3.interpolateTransformSvg](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateTransformSvg), and there is a new [d3.interpolateTransformCss](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateTransformCss) to interpolate CSS transforms! This allows [d3-transition](#transitions-d3-transition) to automatically interpolate both the SVG [transform attribute](https://www.w3.org/TR/SVG/coords.html#TransformAttribute) and the CSS [transform style property](https://www.w3.org/TR/css-transforms-1/#transform-property). (Note, however, that only 2D CSS transforms are supported.) The d3.transform method has been removed.

Color space interpolators now interpolate opacity (see [d3-color](#colors-d3-color)) and return rgb(…) or rgba(…) CSS color specifier strings rather than using the RGB hexadecimal format. This is necessary to support opacity interpolation, but is also beneficial because it matches CSS computed values. When a channel in the start color *a* is undefined, color interpolators now use the corresponding channel value from the end color *b*, or *vice versa*. This logic previously applied to some channels (such as saturation in HSL), but now applies to all channels in all color spaces, and is especially useful when interpolating to or from transparent.

There are now “long” versions of cylindrical color space interpolators: [d3.interpolateHslLong](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateHslLong), [d3.interpolateHclLong](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateHclLong) and [d3.interpolateCubehelixLong](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateCubehelixLong). These interpolators use linear interpolation of hue, rather than using the shortest path around the 360° hue circle. See [d3.interpolateRainbow](https://github.com/d3/d3-scale/blob/master/README.md#interpolateRainbow) for an example. The Cubehelix color space is now supported by [d3-color](#colors-d3-color), and so there are now [d3.interpolateCubehelix](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateCubehelix) and [d3.interpolateCubehelixLong](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateCubehelixLong) interpolators.

[Gamma-corrected color interpolation](https://web.archive.org/web/20160112115812/http://www.4p8.com/eric.brasseur/gamma.html) is now supported for both RGB and Cubehelix color spaces as [*interpolate*.gamma](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolate_gamma). For example, to interpolate from purple to orange with a gamma of 2.2 in RGB space:

```js
var interpolate = d3.interpolateRgb.gamma(2.2)("purple", "orange");
```

There are new interpolators for uniform non-rational [B-splines](https://en.wikipedia.org/wiki/B-spline)! These are useful for smoothly interpolating between an arbitrary sequence of values from *t* = 0 to *t* = 1, such as to generate a smooth color gradient from a discrete set of colors. The [d3.interpolateBasis](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateBasis) and [d3.interpolateBasisClosed](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateBasisClosed) interpolators generate one-dimensional B-splines, while [d3.interpolateRgbBasis](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateRgbBasis) and [d3.interpolateRgbBasisClosed](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateRgbBasisClosed) generate three-dimensional B-splines through RGB color space. These are used by [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic) to generate continuous color scales from ColorBrewer’s discrete color schemes, such as [PiYG](https://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5).

There’s also now a [d3.quantize](https://github.com/d3/d3-interpolate/blob/master/README.md#quantize) method for generating uniformly-spaced discrete samples from a continuous interpolator. This is useful for taking one of the built-in color scales (such as [d3.interpolateViridis](https://github.com/d3/d3-scale/blob/master/README.md#interpolateViridis)) and quantizing it for use with [d3.scaleQuantize](https://github.com/d3/d3-scale/blob/master/README.md#scaleQuantize), [d3.scaleQuantile](https://github.com/d3/d3-scale/blob/master/README.md#scaleQuantile) or [d3.scaleThreshold](https://github.com/d3/d3-scale/blob/master/README.md#scaleThreshold).

## [Paths (d3-path)](https://github.com/d3/d3-path/blob/master/README.md)

The [d3.path](https://github.com/d3/d3-path/blob/master/README.md#path) serializer implements the [CanvasPathMethods API](https://www.w3.org/TR/2dcontext/#canvaspathmethods), allowing you to write code that can render to either Canvas or SVG. For example, given some code that draws to a canvas:

```js
function drawCircle(context, radius) {
  context.moveTo(radius, 0);
  context.arc(0, 0, radius, 0, 2 * Math.PI);
}
```

You can render to SVG as follows:

```js
var context = d3.path();
drawCircle(context, 40);
pathElement.setAttribute("d", context.toString());
```

The path serializer enables [d3-shape](#shapes-d3-shape) to support both Canvas and SVG; see [*line*.context](https://github.com/d3/d3-shape/blob/master/README.md#line_context) and [*area*.context](https://github.com/d3/d3-shape/blob/master/README.md#area_context), for example.

## [Polygons (d3-polygon)](https://github.com/d3/d3-polygon/blob/master/README.md)

There’s no longer a d3.geom.polygon constructor; instead you just pass an array of vertices to the polygon methods. So instead of *polygon*.area and *polygon*.centroid, there’s [d3.polygonArea](https://github.com/d3/d3-polygon/blob/master/README.md#polygonArea) and [d3.polygonCentroid](https://github.com/d3/d3-polygon/blob/master/README.md#polygonCentroid). There are also new [d3.polygonContains](https://github.com/d3/d3-polygon/blob/master/README.md#polygonContains) and [d3.polygonLength](https://github.com/d3/d3-polygon/blob/master/README.md#polygonLength) methods. There’s no longer an equivalent to *polygon*.clip, but if [Sutherland–Hodgman clipping](https://en.wikipedia.org/wiki/Sutherland–Hodgman_algorithm) is needed, please [file a feature request](https://github.com/d3/d3-polygon/issues).

The d3.geom.hull operator has been simplified: instead of an operator with *hull*.x and *hull*.y accessors, there’s just the [d3.polygonHull](https://github.com/d3/d3-polygon/blob/master/README.md#polygonHull) method which takes an array of points and returns the convex hull.

## [Quadtrees (d3-quadtree)](https://github.com/d3/d3-quadtree/blob/master/README.md)

The d3.geom.quadtree method has been replaced by [d3.quadtree](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree). 4.0 removes the concept of quadtree “generators” (configurable functions that build a quadtree from an array of data); there are now just quadtrees, which you can create via d3.quadtree and add data to via [*quadtree*.add](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_add) and [*quadtree*.addAll](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_addAll). This code in 3.x:

```js
var quadtree = d3.geom.quadtree()
    .extent([[0, 0], [width, height]])
    (data);
```

Can be rewritten in 4.0 as:

```js
var quadtree = d3.quadtree()
    .extent([[0, 0], [width, height]])
    .addAll(data);
```

The new quadtree implementation is vastly improved! It is no longer recursive, avoiding stack overflows when there are large numbers of coincident points. The internal storage is now more efficient, and the implementation is also faster; constructing a quadtree of 1M normally-distributed points takes about one second in 4.0, as compared to three seconds in 3.x.

The change in [internal *node* structure](https://github.com/d3/d3-quadtree/blob/master/README.md#nodes) affects [*quadtree*.visit](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_visit): use *node*.length to distinguish leaf nodes from internal nodes. For example, to iterate over all data in a quadtree:

```js
quadtree.visit(function(node) {
  if (!node.length) {
    do {
      console.log(node.data);
    } while (node = node.next)
  }
});
```

There’s a new [*quadtree*.visitAfter](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_visitAfter) method for visiting nodes in post-order traversal. This feature is used in [d3-force](#forces-d3-force) to implement the [Barnes–Hut approximation](https://en.wikipedia.org/wiki/Barnes–Hut_simulation).

You can now remove data from a quadtree using [*quadtree*.remove](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_remove) and [*quadtree*.removeAll](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_removeAll). When adding data to a quadtree, the quadtree will now expand its extent by repeated doubling if the new point is outside the existing extent of the quadtree. There are also [*quadtree*.extent](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_extent) and [*quadtree*.cover](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_cover) methods for explicitly expanding the extent of the quadtree after creation.

Quadtrees support several new utility methods: [*quadtree*.copy](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_copy) returns a copy of the quadtree sharing the same data; [*quadtree*.data](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_data) generates an array of all data in the quadtree; [*quadtree*.size](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_size) returns the number of data points in the quadtree; and [*quadtree*.root](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_root) returns the root node, which is useful for manual traversal of the quadtree. The [*quadtree*.find](https://github.com/d3/d3-quadtree/blob/master/README.md#quadtree_find) method now takes an optional search radius, which is useful for pointer-based selection in [force-directed graphs](https://bl.ocks.org/mbostock/ad70335eeef6d167bc36fd3c04378048).

## [Queues (d3-queue)](https://github.com/d3/d3-queue/blob/master/README.md)

Formerly known as Queue.js and queue-async, [d3.queue](https://github.com/d3/d3-queue) is now included in the default bundle, making it easy to load data files in parallel. It has been rewritten with fewer closures to improve performance, and there are now stricter checks in place to guarantee well-defined behavior. You can now use instanceof d3.queue and inspect the queue’s internal private state.

## [Random Numbers (d3-random)](https://github.com/d3/d3-random/blob/master/README.md)

Pursuant to the great namespace flattening, the random number generators have new names:

* d3.random.normal ↦ [d3.randomNormal](https://github.com/d3/d3-random/blob/master/README.md#randomNormal)
* d3.random.logNormal ↦ [d3.randomLogNormal](https://github.com/d3/d3-random/blob/master/README.md#randomLogNormal)
* d3.random.bates ↦ [d3.randomBates](https://github.com/d3/d3-random/blob/master/README.md#randomBates)
* d3.random.irwinHall ↦ [d3.randomIrwinHall](https://github.com/d3/d3-random/blob/master/README.md#randomIrwinHall)

There are also new random number generators for [exponential](https://github.com/d3/d3-random/blob/master/README.md#randomExponential) and [uniform](https://github.com/d3/d3-random/blob/master/README.md#randomUniform) distributions. The [normal](https://github.com/d3/d3-random/blob/master/README.md#randomNormal) and [log-normal](https://github.com/d3/d3-random/blob/master/README.md#randomLogNormal) random generators have been optimized.

## [Requests (d3-request)](https://github.com/d3/d3-request/blob/master/README.md)

The d3.xhr method has been renamed to [d3.request](https://github.com/d3/d3-request/blob/master/README.md#request). Basic authentication is now supported using [*request*.user](https://github.com/d3/d3-request/blob/master/README.md#request_user) and [*request*.password](https://github.com/d3/d3-request/blob/master/README.md#request_password). You can now configure a timeout using [*request*.timeout](https://github.com/d3/d3-request/blob/master/README.md#request_timeout).

If an error occurs, the corresponding [ProgressEvent](https://xhr.spec.whatwg.org/#interface-progressevent) of type “error” is now passed to the error listener, rather than the [XMLHttpRequest](https://xhr.spec.whatwg.org/#interface-xmlhttprequest). Likewise, the ProgressEvent is passed to progress event listeners, rather than using [d3.event](https://github.com/d3/d3-selection/blob/master/README.md#event). If [d3.xml](https://github.com/d3/d3-request/blob/master/README.md#xml) encounters an error parsing XML, this error is now reported to error listeners rather than returning a null response.

The [d3.request](https://github.com/d3/d3-request/blob/master/README.md#request), [d3.text](https://github.com/d3/d3-request/blob/master/README.md#text) and [d3.xml](https://github.com/d3/d3-request/blob/master/README.md#xml) methods no longer take an optional mime type as the second argument; use [*request*.mimeType](https://github.com/d3/d3-request/blob/master/README.md#request_mimeType) instead. For example:

```js
d3.xml("file.svg").mimeType("image/svg+xml").get(function(error, svg) {
  …
});
```

With the exception of [d3.html](https://github.com/d3/d3-request/blob/master/README.md#html) and [d3.xml](https://github.com/d3/d3-request/blob/master/README.md#xml), Node is now supported via [node-XMLHttpRequest](https://github.com/driverdan/node-XMLHttpRequest).

## [Scales (d3-scale)](https://github.com/d3/d3-scale/blob/master/README.md)

Pursuant to the great namespace flattening:

* d3.scale.linear ↦ [d3.scaleLinear](https://github.com/d3/d3-scale/blob/master/README.md#scaleLinear)
* d3.scale.sqrt ↦ [d3.scaleSqrt](https://github.com/d3/d3-scale/blob/master/README.md#scaleSqrt)
* d3.scale.pow ↦ [d3.scalePow](https://github.com/d3/d3-scale/blob/master/README.md#scalePow)
* d3.scale.log ↦ [d3.scaleLog](https://github.com/d3/d3-scale/blob/master/README.md#scaleLog)
* d3.scale.quantize ↦ [d3.scaleQuantize](https://github.com/d3/d3-scale/blob/master/README.md#scaleQuantize)
* d3.scale.threshold ↦ [d3.scaleThreshold](https://github.com/d3/d3-scale/blob/master/README.md#scaleThreshold)
* d3.scale.quantile ↦ [d3.scaleQuantile](https://github.com/d3/d3-scale/blob/master/README.md#scaleQuantile)
* d3.scale.identity ↦ [d3.scaleIdentity](https://github.com/d3/d3-scale/blob/master/README.md#scaleIdentity)
* d3.scale.ordinal ↦ [d3.scaleOrdinal](https://github.com/d3/d3-scale/blob/master/README.md#scaleOrdinal)
* d3.time.scale ↦ [d3.scaleTime](https://github.com/d3/d3-scale/blob/master/README.md#scaleTime)
* d3.time.scale.utc ↦ [d3.scaleUtc](https://github.com/d3/d3-scale/blob/master/README.md#scaleUtc)

Scales now generate ticks in the same order as the domain: if you have a descending domain, you now get descending ticks. This change affects the order of tick elements generated by [axes](#axes-d3-axis). For example:

```js
d3.scaleLinear().domain([10, 0]).ticks(5); // [10, 8, 6, 4, 2, 0]
```

[Log tick formatting](https://github.com/d3/d3-scale/blob/master/README.md#log_tickFormat) now assumes a default *count* of ten, not Infinity, if not specified. Log scales with  domains that span many powers (such as from 1e+3 to 1e+29) now return only one [tick](https://github.com/d3/d3-scale/blob/master/README.md#log_ticks) per power rather than returning *base* ticks per power. Non-linear quantitative scales are slightly more accurate.

You can now control whether an ordinal scale’s domain is implicitly extended when the scale is passed a value that is not already in its domain. By default, [*ordinal*.unknown](https://github.com/d3/d3-scale/blob/master/README.md#ordinal_unknown) is [d3.scaleImplicit](https://github.com/d3/d3-scale/blob/master/README.md#scaleImplicit), causing unknown values to be added to the domain:

```js
var x = d3.scaleOrdinal()
    .domain([0, 1])
    .range(["red", "green", "blue"]);

x.domain(); // [0, 1]
x(2); // "blue"
x.domain(); // [0, 1, 2]
```

By setting *ordinal*.unknown, you instead define the output value for unknown inputs. This is particularly useful for choropleth maps where you want to assign a color to missing data.

```js
var x = d3.scaleOrdinal()
    .domain([0, 1])
    .range(["red", "green", "blue"])
    .unknown(undefined);

x.domain(); // [0, 1]
x(2); // undefined
x.domain(); // [0, 1]
```

The *ordinal*.rangeBands and *ordinal*.rangeRoundBands methods have been replaced with a new subclass of ordinal scale: [band scales](https://github.com/d3/d3-scale/blob/master/README.md#band-scales). The following code in 3.x:

```js
var x = d3.scale.ordinal()
    .domain(["a", "b", "c"])
    .rangeBands([0, width]);
```

Is equivalent to this in 4.0:

```js
var x = d3.scaleBand()
    .domain(["a", "b", "c"])
    .range([0, width]);
```

The new [*band*.padding](https://github.com/d3/d3-scale/blob/master/README.md#band_padding), [*band*.paddingInner](https://github.com/d3/d3-scale/blob/master/README.md#band_paddingInner) and [*band*.paddingOuter](https://github.com/d3/d3-scale/blob/master/README.md#band_paddingOuter) methods replace the optional arguments to *ordinal*.rangeBands. The new [*band*.bandwidth](https://github.com/d3/d3-scale/blob/master/README.md#band_bandwidth) and [*band*.step](https://github.com/d3/d3-scale/blob/master/README.md#band_step) methods replace *ordinal*.rangeBand. There’s also a new [*band*.align](https://github.com/d3/d3-scale/blob/master/README.md#band_align) method which you can use to control how the extra space outside the bands is distributed, say to shift columns closer to the *y*-axis.

Similarly, the *ordinal*.rangePoints and *ordinal*.rangeRoundPoints methods have been replaced with a new subclass of ordinal scale: [point scales](https://github.com/d3/d3-scale/blob/master/README.md#point-scales). The following code in 3.x:

```js
var x = d3.scale.ordinal()
    .domain(["a", "b", "c"])
    .rangePoints([0, width]);
```

Is equivalent to this in 4.0:

```js
var x = d3.scalePoint()
    .domain(["a", "b", "c"])
    .range([0, width]);
```

The new [*point*.padding](https://github.com/d3/d3-scale/blob/master/README.md#point_padding) method replaces the optional *padding* argument to *ordinal*.rangePoints. Like *ordinal*.rangeBand with *ordinal*.rangePoints, the [*point*.bandwidth](https://github.com/d3/d3-scale/blob/master/README.md#point_bandwidth) method always returns zero; a new [*point*.step](https://github.com/d3/d3-scale/blob/master/README.md#point_step) method returns the interval between adjacent points.

The [ordinal scale constructor](https://github.com/d3/d3-scale/blob/master/README.md#ordinal-scales) now takes an optional *range* for a shorter alternative to [*ordinal*.range](https://github.com/d3/d3-scale/blob/master/README.md#ordinal_range). This is especially useful now that the categorical color scales have been changed to simple arrays of colors rather than specialized ordinal scale constructors:

* d3.scale.category10 ↦ [d3.schemeCategory10](https://github.com/d3/d3-scale/blob/master/README.md#schemeCategory10)
* d3.scale.category20 ↦ [d3.schemeCategory20](https://github.com/d3/d3-scale/blob/master/README.md#schemeCategory20)
* d3.scale.category20b ↦ [d3.schemeCategory20b](https://github.com/d3/d3-scale/blob/master/README.md#schemeCategory20b)
* d3.scale.category20c ↦ [d3.schemeCategory20c](https://github.com/d3/d3-scale/blob/master/README.md#schemeCategory20c)

The following code in 3.x:

```js
var color = d3.scale.category10();
```

Is equivalent to this in 4.0:

```js
var color = d3.scaleOrdinal(d3.schemeCategory10);
```

[Sequential scales](https://github.com/d3/d3-scale/blob/master/README.md#scaleSequential), are a new class of scales with a fixed output [interpolator](https://github.com/d3/d3-scale/blob/master/README.md#sequential_interpolator) instead of a [range](https://github.com/d3/d3-scale/blob/master/README.md#continuous_range). Typically these scales are used to implement continuous sequential or diverging color schemes. Inspired by Matplotlib’s new [perceptually-motived colormaps](https://bids.github.io/colormap/), 4.0 now features [viridis](https://github.com/d3/d3-scale/blob/master/README.md#interpolateViridis), [inferno](https://github.com/d3/d3-scale/blob/master/README.md#interpolateInferno), [magma](https://github.com/d3/d3-scale/blob/master/README.md#interpolateMagma), [plasma](https://github.com/d3/d3-scale/blob/master/README.md#interpolatePlasma) interpolators for use with sequential scales. Using [d3.quantize](https://github.com/d3/d3-interpolate/blob/master/README.md#quantize), these interpolators can also be applied to [quantile](https://github.com/d3/d3-scale/blob/master/README.md#quantile-scales), [quantize](https://github.com/d3/d3-scale/blob/master/README.md#quantize-scales) and [threshold](https://github.com/d3/d3-scale/blob/master/README.md#threshold-scales) scales.

[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/viridis.png" width="100%" height="40" alt="viridis">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateViridis)
[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/inferno.png" width="100%" height="40" alt="inferno">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateInferno)
[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/magma.png" width="100%" height="40" alt="magma">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateMagma)
[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/plasma.png" width="100%" height="40" alt="plasma">](https://github.com/d3/d3-scale/blob/master/README.md#interpolatePlasma)

4.0 also ships new Cubehelix schemes, including [Dave Green’s default](https://github.com/d3/d3-scale/blob/master/README.md#interpolateCubehelixDefault) and a [cyclical rainbow](https://github.com/d3/d3-scale/blob/master/README.md#interpolateRainbow) inspired by [Matteo Niccoli](https://mycarta.wordpress.com/2013/02/21/perceptual-rainbow-palette-the-method/):

[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/cubehelix.png" width="100%" height="40" alt="cubehelix">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateCubehelixDefault)
[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/rainbow.png" width="100%" height="40" alt="rainbow">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateRainbow)
[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/warm.png" width="100%" height="40" alt="warm">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateWarm)
[<img src="https://raw.githubusercontent.com/d3/d3-scale/v1.0.0/img/cool.png" width="100%" height="40" alt="cool">](https://github.com/d3/d3-scale/blob/master/README.md#interpolateCool)

For even more sequential and categorical color schemes, see [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic).

For an introduction to scales, see [Introducing d3-scale](https://medium.com/@mbostock/introducing-d3-scale-61980c51545f).

## [Selections (d3-selection)](https://github.com/d3/d3-selection/blob/master/README.md)

Selections no longer subclass Array using [prototype chain injection](http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection); they are now plain objects, improving performance. The internal fields (*selection*.\_groups, *selection*.\_parents) are private; please use the documented public API to manipulate selections. The new [*selection*.nodes](https://github.com/d3/d3-selection/blob/master/README.md#selection_nodes) method generates an array of all nodes in a selection.

Selections are now immutable: the elements and parents in a selection never change. (The elements’ attributes and content will of course still be modified!) The [*selection*.sort](https://github.com/d3/d3-selection/blob/master/README.md#selection_sort) and [*selection*.data](https://github.com/d3/d3-selection/blob/master/README.md#selection_data) methods now return new selections rather than modifying the selection in-place. In addition, [*selection*.append](https://github.com/d3/d3-selection/blob/master/README.md#selection_append) no longer merges entering nodes into the update selection; use [*selection*.merge](https://github.com/d3/d3-selection/blob/master/README.md#selection_merge) to combine enter and update after a data join. For example, the following [general update pattern](https://bl.ocks.org/mbostock/a8a5baa4c4a470cda598) in 3.x:

```js
var circle = svg.selectAll("circle").data(data) // UPDATE
    .style("fill", "blue");

circle.exit().remove(); // EXIT

circle.enter().append("circle") // ENTER; modifies UPDATE! 🌶
    .style("fill", "green");

circle // ENTER + UPDATE
    .style("stroke", "black");
```

Would be rewritten in 4.0 as:

```js
var circle = svg.selectAll("circle").data(data) // UPDATE
    .style("fill", "blue");

circle.exit().remove(); // EXIT

circle.enter().append("circle") // ENTER
    .style("fill", "green")
  .merge(circle) // ENTER + UPDATE
    .style("stroke", "black");
```

This change is discussed further in [What Makes Software Good](https://medium.com/@mbostock/what-makes-software-good-943557f8a488).

In 3.x, the [*selection*.enter](https://github.com/d3/d3-selection/blob/master/README.md#selection_enter) and [*selection*.exit](https://github.com/d3/d3-selection/blob/master/README.md#selection_exit) methods were undefined until you called *selection*.data, resulting in a TypeError if you attempted to access them. In 4.0, now they simply return the empty selection if the selection has not been joined to data.

In 3.x, [*selection*.append](https://github.com/d3/d3-selection/blob/master/README.md#selection_append) would always append the new element as the last child of its parent. A little-known trick was to use [*selection*.insert](https://github.com/d3/d3-selection/blob/master/README.md#selection_insert) without specifying a *before* selector when entering nodes, causing the entering nodes to be inserted before the following element in the update selection. In 4.0, this is now the default behavior of *selection*.append; if you do not specify a *before* selector to *selection*.insert, the inserted element is appended as the last child. This change makes the general update pattern preserve the relative order of elements and data. For example, given the following DOM:

```html
<div>a</div>
<div>b</div>
<div>f</div>
```

And the following code:

```js
var div = d3.select("body").selectAll("div")
  .data(["a", "b", "c", "d", "e", "f"], function(d) { return d || this.textContent; });

div.enter().append("div")
    .text(function(d) { return d; });
```

The resulting DOM will be:

```html
<div>a</div>
<div>b</div>
<div>c</div>
<div>d</div>
<div>e</div>
<div>f</div>
```

Thus, the entering *c*, *d* and *e* are inserted before *f*, since *f* is the following element in the update selection. Although this behavior is sufficient to preserve order if the new data’s order is stable, if the data changes order, you must still use [*selection*.order](https://github.com/d3/d3-selection/blob/master/README.md#selection_order) to reorder elements.

There is now only one class of selection. 3.x implemented enter selections using a special class with different behavior for *enter*.append and *enter*.select; a consequence of this design was that enter selections in 3.x lacked [certain methods](https://github.com/d3/d3/issues/2043). In 4.0, enter selections are simply normal selections; they have the same methods and the same behavior. Placeholder [enter nodes](https://github.com/d3/d3-selection/blob/master/src/selection/enter.js) now implement [*node*.appendChild](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild), [*node*.insertBefore](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore), [*node*.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector), and [*node*.querySelectorAll](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).

The [*selection*.data](https://github.com/d3/d3-selection/blob/master/README.md#selection_data) method has been changed slightly with respect to duplicate keys. In 3.x, if multiple data had the same key, the duplicate data would be ignored and not included in enter, update or exit; in 4.0 the duplicate data is always put in the enter selection. In both 3.x and 4.0, if multiple elements have the same key, the duplicate elements are put in the exit selection. Thus, 4.0’s behavior is now symmetric for enter and exit, and the general update pattern will now produce a DOM that matches the data even if there are duplicate keys.

Selections have several new methods! Use [*selection*.raise](https://github.com/d3/d3-selection/blob/master/README.md#selection_raise) to move the selected elements to the front of their siblings, so that they are drawn on top; use [*selection*.lower](https://github.com/d3/d3-selection/blob/master/README.md#selection_lower) to move them to the back. Use [*selection*.dispatch](https://github.com/d3/d3-selection/blob/master/README.md#selection_dispatch) to dispatch a [custom event](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) to event listeners.

When called in getter mode, [*selection*.data](https://github.com/d3/d3-selection/blob/master/README.md#selection_data) now returns the data for all elements in the selection, rather than just the data for the first group of elements. The [*selection*.call](https://github.com/d3/d3-selection/blob/master/README.md#selection_call) method no longer sets the `this` context when invoking the specified function; the *selection* is passed as the first argument to the function, so use that. The [*selection*.on](https://github.com/d3/d3-selection/blob/master/README.md#selection_on) method now accepts multiple whitespace-separated typenames, so you can add or remove multiple listeners simultaneously. For example:

```js
selection.on("mousedown touchstart", function() {
  console.log(d3.event.type);
});
```

The arguments passed to callback functions has changed slightly in 4.0 to be more consistent. The standard arguments are the element’s datum (*d*), the element’s index (*i*), and the element’s group (*nodes*), with *this* as the element. The slight exception to this convention is *selection*.data, which is evaluated for each group rather than each element; it is passed the group’s parent datum (*d*), the group index (*i*), and the selection’s parents (*parents*), with *this* as the group’s parent.

The new [d3.local](https://github.com/d3/d3-selection/blob/master/README.md#local-variables) provides a mechanism for defining [local variables](https://bl.ocks.org/mbostock/e1192fe405703d8321a5187350910e08): state that is bound to DOM elements, and available to any descendant element. This can be a convenient alternative to using [*selection*.each](https://github.com/d3/d3-selection/blob/master/README.md#selection_each) or storing local state in data.

The d3.ns.prefix namespace prefix map has been renamed to [d3.namespaces](https://github.com/d3/d3-selection/blob/master/README.md#namespaces), and the d3.ns.qualify method has been renamed to [d3.namespace](https://github.com/d3/d3-selection/blob/master/README.md#namespace). Several new low-level methods are now available, as well. [d3.matcher](https://github.com/d3/d3-selection/blob/master/README.md#matcher) is used internally by [*selection*.filter](https://github.com/d3/d3-selection/blob/master/README.md#selection_filter); [d3.selector](https://github.com/d3/d3-selection/blob/master/README.md#selector) is used by [*selection*.select](https://github.com/d3/d3-selection/blob/master/README.md#selection_select); [d3.selectorAll](https://github.com/d3/d3-selection/blob/master/README.md#selectorAll) is used by [*selection*.selectAll](https://github.com/d3/d3-selection/blob/master/README.md#selection_selectAll); [d3.creator](https://github.com/d3/d3-selection/blob/master/README.md#creator) is used by [*selection*.append](https://github.com/d3/d3-selection/blob/master/README.md#selection_append) and [*selection*.insert](https://github.com/d3/d3-selection/blob/master/README.md#selection_insert). The new [d3.window](https://github.com/d3/d3-selection/blob/master/README.md#window) returns the owner window for a given element, window or document. The new [d3.customEvent](https://github.com/d3/d3-selection/blob/master/README.md#customEvent) temporarily sets [d3.event](https://github.com/d3/d3-selection/blob/master/README.md#event) while invoking a function, allowing you to implement controls which dispatch custom events; this is used by [d3-drag](https://github.com/d3/d3-drag), [d3-zoom](https://github.com/d3/d3-zoom) and [d3-brush](https://github.com/d3/d3-brush).

For the sake of parsimony, the multi-value methods—where you pass an object to set multiple attributes, styles or properties simultaneously—have been extracted to [d3-selection-multi](https://github.com/d3/d3-selection-multi) and are no longer part of the default bundle. The multi-value map methods have also been renamed to plural form to reduce overload: [*selection*.attrs](https://github.com/d3/d3-selection-multi/blob/master/README.md#selection_attrs), [*selection*.styles](https://github.com/d3/d3-selection-multi/blob/master/README.md#selection_styles) and [*selection*.properties](https://github.com/d3/d3-selection-multi/blob/master/README.md#selection_properties).

## [Shapes (d3-shape)](https://github.com/d3/d3-shape/blob/master/README.md)

Pursuant to the great namespace flattening:

* d3.svg.line ↦ [d3.line](https://github.com/d3/d3-shape/blob/master/README.md#lines)
* d3.svg.line.radial ↦ [d3.radialLine](https://github.com/d3/d3-shape/blob/master/README.md#radialLine)
* d3.svg.area ↦ [d3.area](https://github.com/d3/d3-shape/blob/master/README.md#areas)
* d3.svg.area.radial ↦ [d3.radialArea](https://github.com/d3/d3-shape/blob/master/README.md#radialArea)
* d3.svg.arc ↦ [d3.arc](https://github.com/d3/d3-shape/blob/master/README.md#arcs)
* d3.svg.symbol ↦ [d3.symbol](https://github.com/d3/d3-shape/blob/master/README.md#symbols)
* d3.svg.symbolTypes ↦ [d3.symbolTypes](https://github.com/d3/d3-shape/blob/master/README.md#symbolTypes)
* d3.layout.pie ↦ [d3.pie](https://github.com/d3/d3-shape/blob/master/README.md#pies)
* d3.layout.stack ↦ [d3.stack](https://github.com/d3/d3-shape/blob/master/README.md#stacks)
* d3.svg.diagonal ↦ REMOVED (see [d3/d3-shape#27](https://github.com/d3/d3-shape/issues/27))
* d3.svg.diagonal.radial ↦ REMOVED

Shapes are no longer limited to SVG; they can now render to Canvas! Shape generators now support an optional *context*: given a [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D), you can render a shape as a canvas path to be filled or stroked. For example, a [canvas pie chart](https://bl.ocks.org/mbostock/8878e7fd82034f1d63cf) might use an arc generator:

```js
var arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0)
    .context(context);
```

To render an arc for a given datum *d*:

```js
context.beginPath();
arc(d);
context.fill();
```

See [*line*.context](https://github.com/d3/d3-shape/blob/master/README.md#line_context), [*area*.context](https://github.com/d3/d3-shape/blob/master/README.md#area_context) and [*arc*.context](https://github.com/d3/d3-shape/blob/master/README.md#arc_context) for more. Under the hood, shapes use [d3-path](#paths-d3-path) to serialize canvas path methods to SVG path data when the context is null; thus, shapes are optimized for rendering to canvas. You can also now derive lines from areas. The line shares most of the same accessors, such as [*line*.defined](https://github.com/d3/d3-shape/blob/master/README.md#line_defined) and [*line*.curve](https://github.com/d3/d3-shape/blob/master/README.md#line_curve), with the area from which it is derived. For example, to render the topline of an area, use [*area*.lineY1](https://github.com/d3/d3-shape/blob/master/README.md#area_lineY1); for the baseline, use [*area*.lineY0](https://github.com/d3/d3-shape/blob/master/README.md#area_lineY0).

4.0 introduces a new curve API for specifying how line and area shapes interpolate between data points. The *line*.interpolate and *area*.interpolate methods have been replaced with [*line*.curve](https://github.com/d3/d3-shape/blob/master/README.md#line_curve) and [*area*.curve](https://github.com/d3/d3-shape/blob/master/README.md#area_curve). Curves are implemented using the [curve interface](https://github.com/d3/d3-shape/blob/master/README.md#custom-curves) rather than as a function that returns an SVG path data string; this allows curves to render to either SVG or Canvas. In addition, *line*.curve and *area*.curve now take a function which instantiates a curve for a given *context*, rather than a string. The full list of equivalents:

* linear ↦ [d3.curveLinear](https://github.com/d3/d3-shape/blob/master/README.md#curveLinear)
* linear-closed ↦ [d3.curveLinearClosed](https://github.com/d3/d3-shape/blob/master/README.md#curveLinearClosed)
* step ↦ [d3.curveStep](https://github.com/d3/d3-shape/blob/master/README.md#curveStep)
* step-before ↦ [d3.curveStepBefore](https://github.com/d3/d3-shape/blob/master/README.md#curveStepBefore)
* step-after ↦ [d3.curveStepAfter](https://github.com/d3/d3-shape/blob/master/README.md#curveStepAfter)
* basis ↦ [d3.curveBasis](https://github.com/d3/d3-shape/blob/master/README.md#curveBasis)
* basis-open ↦ [d3.curveBasisOpen](https://github.com/d3/d3-shape/blob/master/README.md#curveBasisOpen)
* basis-closed ↦ [d3.curveBasisClosed](https://github.com/d3/d3-shape/blob/master/README.md#curveBasisClosed)
* bundle ↦ [d3.curveBundle](https://github.com/d3/d3-shape/blob/master/README.md#curveBundle)
* cardinal ↦ [d3.curveCardinal](https://github.com/d3/d3-shape/blob/master/README.md#curveCardinal)
* cardinal-open ↦ [d3.curveCardinalOpen](https://github.com/d3/d3-shape/blob/master/README.md#curveCardinalOpen)
* cardinal-closed ↦ [d3.curveCardinalClosed](https://github.com/d3/d3-shape/blob/master/README.md#curveCardinalClosed)
* monotone ↦ [d3.curveMonotoneX](https://github.com/d3/d3-shape/blob/master/README.md#curveMonotoneX)

But that’s not all! 4.0 now provides parameterized Catmull–Rom splines as proposed by [Yuksel *et al.*](http://www.cemyuksel.com/research/catmullrom_param/). These are available as [d3.curveCatmullRom](https://github.com/d3/d3-shape/blob/master/README.md#curveCatmullRom), [d3.curveCatmullRomClosed](https://github.com/d3/d3-shape/blob/master/README.md#curveCatmullRomClosed) and [d3.curveCatmullRomOpen](https://github.com/d3/d3-shape/blob/master/README.md#curveCatmullRomOpen).

<img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/catmullRom.png" width="888" height="240" alt="catmullRom">
<img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/catmullRomOpen.png" width="888" height="240" alt="catmullRomOpen">
<img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/catmullRomClosed.png" width="888" height="330" alt="catmullRomClosed">

Each curve type can define its own named parameters, replacing *line*.tension and *area*.tension. For example, Catmull–Rom splines are parameterized using [*catmullRom*.alpha](https://github.com/d3/d3-shape/blob/master/README.md#curveCatmullRom_alpha) and defaults to 0.5, which corresponds to a centripetal spline that avoids self-intersections and overshoot. For a uniform Catmull–Rom spline instead:

```js
var line = d3.line()
    .curve(d3.curveCatmullRom.alpha(0));
```

4.0 fixes the interpretation of the cardinal spline *tension* parameter, which is now specified as [*cardinal*.tension](https://github.com/d3/d3-shape/blob/master/README.md#curveCardinal_tension) and defaults to zero for a uniform Catmull–Rom spline; a tension of one produces a linear curve. The first and last segments of basis and cardinal curves have also been fixed! The undocumented *interpolate*.reverse field has been removed. Curves can define different behavior for toplines and baselines by counting the sequence of [*curve*.lineStart](https://github.com/d3/d3-shape/blob/master/README.md#curve_lineStart) within [*curve*.areaStart](https://github.com/d3/d3-shape/blob/master/README.md#curve_areaStart). See the [d3.curveStep implementation](https://github.com/d3/d3-shape/blob/master/src/curve/step.js) for an example.

4.0 fixes numerous bugs in the monotone curve implementation, and introduces [d3.curveMonotoneY](https://github.com/d3/d3-shape/blob/master/README.md#curveMonotoneY); this is like d3.curveMonotoneX, except it requires that the input points are monotone in *y* rather than *x*, such as for a vertically-oriented line chart. The new [d3.curveNatural](https://github.com/d3/d3-shape/blob/master/README.md#curveNatural) produces a [natural cubic spline](http://mathworld.wolfram.com/CubicSpline.html). The default [β](https://github.com/d3/d3-shape/blob/master/README.md#bundle_beta) for [d3.curveBundle](https://github.com/d3/d3-shape/blob/master/README.md#curveBundle) is now 0.85, rather than 0.7, matching the values used by [Holten](https://www.win.tue.nl/vis1/home/dholten/papers/bundles_infovis.pdf). 4.0 also has a more robust implementation of arc padding; see [*arc*.padAngle](https://github.com/d3/d3-shape/blob/master/README.md#arc_padAngle) and [*arc*.padRadius](https://github.com/d3/d3-shape/blob/master/README.md#arc_padRadius).

4.0 introduces a new symbol type API. Symbol types are passed to [*symbol*.type](https://github.com/d3/d3-shape/blob/master/README.md#symbol_type) in place of strings. The equivalents are:

* circle ↦ [d3.symbolCircle](https://github.com/d3/d3-shape/blob/master/README.md#symbolCircle)
* cross ↦ [d3.symbolCross](https://github.com/d3/d3-shape/blob/master/README.md#symbolCross)
* diamond ↦ [d3.symbolDiamond](https://github.com/d3/d3-shape/blob/master/README.md#symbolDiamond)
* square ↦ [d3.symbolSquare](https://github.com/d3/d3-shape/blob/master/README.md#symbolSquare)
* triangle-down ↦ REMOVED
* triangle-up ↦ [d3.symbolTriangle](https://github.com/d3/d3-shape/blob/master/README.md#symbolTriangle)
* ADDED ↦ [d3.symbolStar](https://github.com/d3/d3-shape/blob/master/README.md#symbolStar)
* ADDED ↦ [d3.symbolWye](https://github.com/d3/d3-shape/blob/master/README.md#symbolWye)

The full set of symbol types is now:

<a href="#symbolCircle"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/circle.png" width="100" height="100"></a><a href="#symbolCross"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/cross.png" width="100" height="100"></a><a href="#symbolDiamond"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/diamond.png" width="100" height="100"></a><a href="#symbolSquare"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/square.png" width="100" height="100"></a><a href="#symbolStar"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/star.png" width="100" height="100"></a><a href="#symbolTriangle"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/triangle.png" width="100" height="100"><a href="#symbolWye"><img src="https://raw.githubusercontent.com/d3/d3-shape/master/img/wye.png" width="100" height="100"></a>

Lastly, 4.0 overhauls the stack layout API, replacing d3.layout.stack with [d3.stack](https://github.com/d3/d3-shape/blob/master/README.md#stacks). The stack generator no longer needs an *x*-accessor. In addition, the API has been simplified: the *stack* generator now accepts tabular input, such as this array of objects:

```js
var data = [
  {month: new Date(2015, 0, 1), apples: 3840, bananas: 1920, cherries: 960, dates: 400},
  {month: new Date(2015, 1, 1), apples: 1600, bananas: 1440, cherries: 960, dates: 400},
  {month: new Date(2015, 2, 1), apples:  640, bananas:  960, cherries: 640, dates: 400},
  {month: new Date(2015, 3, 1), apples:  320, bananas:  480, cherries: 640, dates: 400}
];
```

To generate the stack layout, first define a stack generator, and then apply it to the data:

```js
var stack = d3.stack()
    .keys(["apples", "bananas", "cherries", "dates"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

var series = stack(data);
```

The resulting array has one element per *series*. Each series has one point per month, and each point has a lower and upper value defining the baseline and topline:

```js
[
  [[   0, 3840], [   0, 1600], [   0,  640], [   0,  320]], // apples
  [[3840, 5760], [1600, 3040], [ 640, 1600], [ 320,  800]], // bananas
  [[5760, 6720], [3040, 4000], [1600, 2240], [ 800, 1440]], // cherries
  [[6720, 7120], [4000, 4400], [2240, 2640], [1440, 1840]], // dates
]
```

Each series in then typically passed to an [area generator](https://github.com/d3/d3-shape/blob/master/README.md#areas) to render an area chart, or used to construct rectangles for a bar chart. Stack generators no longer modify the input data, so *stack*.out has been removed.

For an introduction to shapes, see [Introducing d3-shape](https://medium.com/@mbostock/introducing-d3-shape-73f8367e6d12).

## [Time Formats (d3-time-format)](https://github.com/d3/d3-time-format/blob/master/README.md)

Pursuant to the great namespace flattening, the format constructors have new names:

* d3.time.format ↦ [d3.timeFormat](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormat)
* d3.time.format.utc ↦ [d3.utcFormat](https://github.com/d3/d3-time-format/blob/master/README.md#utcFormat)
* d3.time.format.iso ↦ [d3.isoFormat](https://github.com/d3/d3-time-format/blob/master/README.md#isoFormat)

The *format*.parse method has also been removed in favor of separate [d3.timeParse](https://github.com/d3/d3-time-format/blob/master/README.md#timeParse), [d3.utcParse](https://github.com/d3/d3-time-format/blob/master/README.md#utcParse) and [d3.isoParse](https://github.com/d3/d3-time-format/blob/master/README.md#isoParse) parser constructors. Thus, this code in 3.x:

```js
var parseTime = d3.time.format("%c").parse;
```

Can be rewritten in 4.0 as:

```js
var parseTime = d3.timeParse("%c");
```

The multi-scale time format d3.time.format.multi has been replaced by [d3.scaleTime](https://github.com/d3/d3-scale/blob/master/README.md#scaleTime)’s [tick format](https://github.com/d3/d3-scale/blob/master/README.md#time_tickFormat). Time formats now coerce inputs to dates, and time parsers coerce inputs to strings. The `%Z` directive now allows more flexible parsing of time zone offsets, such as `-0700`, `-07:00`, `-07`, and `Z`. The `%p` directive is now parsed correctly when the locale’s period name is longer than two characters (*e.g.*, “a.m.”).

The default U.S. English locale now uses 12-hour time and a more concise representation of the date. This aligns with local convention and is consistent with [*date*.toLocaleString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString) in Chrome, Firefox and Node:

```js
var now = new Date;
d3.timeFormat("%c")(new Date); // "6/23/2016, 2:01:33 PM"
d3.timeFormat("%x")(new Date); // "6/23/2016"
d3.timeFormat("%X")(new Date); // "2:01:38 PM"
```

You can now set the default locale using [d3.timeFormatDefaultLocale](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatDefaultLocale)! The locales are published as [JSON](https://github.com/d3/d3-request/blob/master/README.md#json) to [npm](https://unpkg.com/d3-time-format/locale/).

The performance of time formatting and parsing has been improved, and the UTC formatter and parser have a cleaner implementation (that avoids temporarily overriding the Date global).

## [Time Intervals (d3-time)](https://github.com/d3/d3-time/blob/master/README.md)

Pursuant to the great namespace flattening, the local time intervals have been renamed:

* ADDED ↦ [d3.timeMillisecond](https://github.com/d3/d3-time/blob/master/README.md#timeMillisecond)
* d3.time.second ↦ [d3.timeSecond](https://github.com/d3/d3-time/blob/master/README.md#timeSecond)
* d3.time.minute ↦ [d3.timeMinute](https://github.com/d3/d3-time/blob/master/README.md#timeMinute)
* d3.time.hour ↦ [d3.timeHour](https://github.com/d3/d3-time/blob/master/README.md#timeHour)
* d3.time.day ↦ [d3.timeDay](https://github.com/d3/d3-time/blob/master/README.md#timeDay)
* d3.time.sunday ↦ [d3.timeSunday](https://github.com/d3/d3-time/blob/master/README.md#timeSunday)
* d3.time.monday ↦ [d3.timeMonday](https://github.com/d3/d3-time/blob/master/README.md#timeMonday)
* d3.time.tuesday ↦ [d3.timeTuesday](https://github.com/d3/d3-time/blob/master/README.md#timeTuesday)
* d3.time.wednesday ↦ [d3.timeWednesday](https://github.com/d3/d3-time/blob/master/README.md#timeWednesday)
* d3.time.thursday ↦ [d3.timeThursday](https://github.com/d3/d3-time/blob/master/README.md#timeThursday)
* d3.time.friday ↦ [d3.timeFriday](https://github.com/d3/d3-time/blob/master/README.md#timeFriday)
* d3.time.saturday ↦ [d3.timeSaturday](https://github.com/d3/d3-time/blob/master/README.md#timeSaturday)
* d3.time.week ↦ [d3.timeWeek](https://github.com/d3/d3-time/blob/master/README.md#timeWeek)
* d3.time.month ↦ [d3.timeMonth](https://github.com/d3/d3-time/blob/master/README.md#timeMonth)
* d3.time.year ↦ [d3.timeYear](https://github.com/d3/d3-time/blob/master/README.md#timeYear)

The UTC time intervals have likewise been renamed:

* ADDED ↦ [d3.utcMillisecond](https://github.com/d3/d3-time/blob/master/README.md#utcMillisecond)
* d3.time.second.utc ↦ [d3.utcSecond](https://github.com/d3/d3-time/blob/master/README.md#utcSecond)
* d3.time.minute.utc ↦ [d3.utcMinute](https://github.com/d3/d3-time/blob/master/README.md#utcMinute)
* d3.time.hour.utc ↦ [d3.utcHour](https://github.com/d3/d3-time/blob/master/README.md#utcHour)
* d3.time.day.utc ↦ [d3.utcDay](https://github.com/d3/d3-time/blob/master/README.md#utcDay)
* d3.time.sunday.utc ↦ [d3.utcSunday](https://github.com/d3/d3-time/blob/master/README.md#utcSunday)
* d3.time.monday.utc ↦ [d3.utcMonday](https://github.com/d3/d3-time/blob/master/README.md#utcMonday)
* d3.time.tuesday.utc ↦ [d3.utcTuesday](https://github.com/d3/d3-time/blob/master/README.md#utcTuesday)
* d3.time.wednesday.utc ↦ [d3.utcWednesday](https://github.com/d3/d3-time/blob/master/README.md#utcWednesday)
* d3.time.thursday.utc ↦ [d3.utcThursday](https://github.com/d3/d3-time/blob/master/README.md#utcThursday)
* d3.time.friday.utc ↦ [d3.utcFriday](https://github.com/d3/d3-time/blob/master/README.md#utcFriday)
* d3.time.saturday.utc ↦ [d3.utcSaturday](https://github.com/d3/d3-time/blob/master/README.md#utcSaturday)
* d3.time.week.utc ↦ [d3.utcWeek](https://github.com/d3/d3-time/blob/master/README.md#utcWeek)
* d3.time.month.utc ↦ [d3.utcMonth](https://github.com/d3/d3-time/blob/master/README.md#utcMonth)
* d3.time.year.utc ↦ [d3.utcYear](https://github.com/d3/d3-time/blob/master/README.md#utcYear)

The local time range aliases have been renamed:

* d3.time.seconds ↦ [d3.timeSeconds](https://github.com/d3/d3-time/blob/master/README.md#timeSeconds)
* d3.time.minutes ↦ [d3.timeMinutes](https://github.com/d3/d3-time/blob/master/README.md#timeMinutes)
* d3.time.hours ↦ [d3.timeHours](https://github.com/d3/d3-time/blob/master/README.md#timeHours)
* d3.time.days ↦ [d3.timeDays](https://github.com/d3/d3-time/blob/master/README.md#timeDays)
* d3.time.sundays ↦ [d3.timeSundays](https://github.com/d3/d3-time/blob/master/README.md#timeSundays)
* d3.time.mondays ↦ [d3.timeMondays](https://github.com/d3/d3-time/blob/master/README.md#timeMondays)
* d3.time.tuesdays ↦ [d3.timeTuesdays](https://github.com/d3/d3-time/blob/master/README.md#timeTuesdays)
* d3.time.wednesdays ↦ [d3.timeWednesdays](https://github.com/d3/d3-time/blob/master/README.md#timeWednesdays)
* d3.time.thursdays ↦ [d3.timeThursdays](https://github.com/d3/d3-time/blob/master/README.md#timeThursdays)
* d3.time.fridays ↦ [d3.timeFridays](https://github.com/d3/d3-time/blob/master/README.md#timeFridays)
* d3.time.saturdays ↦ [d3.timeSaturdays](https://github.com/d3/d3-time/blob/master/README.md#timeSaturdays)
* d3.time.weeks ↦ [d3.timeWeeks](https://github.com/d3/d3-time/blob/master/README.md#timeWeeks)
* d3.time.months ↦ [d3.timeMonths](https://github.com/d3/d3-time/blob/master/README.md#timeMonths)
* d3.time.years ↦ [d3.timeYears](https://github.com/d3/d3-time/blob/master/README.md#timeYears)

The UTC time range aliases have been renamed:

* d3.time.seconds.utc ↦ [d3.utcSeconds](https://github.com/d3/d3-time/blob/master/README.md#utcSeconds)
* d3.time.minutes.utc ↦ [d3.utcMinutes](https://github.com/d3/d3-time/blob/master/README.md#utcMinutes)
* d3.time.hours.utc ↦ [d3.utcHours](https://github.com/d3/d3-time/blob/master/README.md#utcHours)
* d3.time.days.utc ↦ [d3.utcDays](https://github.com/d3/d3-time/blob/master/README.md#utcDays)
* d3.time.sundays.utc ↦ [d3.utcSundays](https://github.com/d3/d3-time/blob/master/README.md#utcSundays)
* d3.time.mondays.utc ↦ [d3.utcMondays](https://github.com/d3/d3-time/blob/master/README.md#utcMondays)
* d3.time.tuesdays.utc ↦ [d3.utcTuesdays](https://github.com/d3/d3-time/blob/master/README.md#utcTuesdays)
* d3.time.wednesdays.utc ↦ [d3.utcWednesdays](https://github.com/d3/d3-time/blob/master/README.md#utcWednesdays)
* d3.time.thursdays.utc ↦ [d3.utcThursdays](https://github.com/d3/d3-time/blob/master/README.md#utcThursdays)
* d3.time.fridays.utc ↦ [d3.utcFridays](https://github.com/d3/d3-time/blob/master/README.md#utcFridays)
* d3.time.saturdays.utc ↦ [d3.utcSaturdays](https://github.com/d3/d3-time/blob/master/README.md#utcSaturdays)
* d3.time.weeks.utc ↦ [d3.utcWeeks](https://github.com/d3/d3-time/blob/master/README.md#utcWeeks)
* d3.time.months.utc ↦ [d3.utcMonths](https://github.com/d3/d3-time/blob/master/README.md#utcMonths)
* d3.time.years.utc ↦ [d3.utcYears](https://github.com/d3/d3-time/blob/master/README.md#utcYears)

The behavior of [*interval*.range](https://github.com/d3/d3-time/blob/master/README.md#interval_range) (and the convenience aliases such as [d3.timeDays](https://github.com/d3/d3-time/blob/master/README.md#timeDays)) has been changed when *step* is greater than one. Rather than filtering the returned dates using the field number, *interval*.range now behaves like [d3.range](https://github.com/d3/d3-array/blob/master/README.md#range): it simply skips, returning every *step*th date. For example, the following code in 3.x returns only odd days of the month:

```js
d3.time.days(new Date(2016, 4, 28), new Date(2016, 5, 5), 2);
// [Sun May 29 2016 00:00:00 GMT-0700 (PDT),
//  Tue May 31 2016 00:00:00 GMT-0700 (PDT),
//  Wed Jun 01 2016 00:00:00 GMT-0700 (PDT),
//  Fri Jun 03 2016 00:00:00 GMT-0700 (PDT)]
```

Note the returned array of dates does not start on the *start* date because May 28 is even. Also note that May 31 and June 1 are one day apart, not two! The behavior of d3.timeDays in 4.0 is probably closer to what you expect:

```js
d3.timeDays(new Date(2016, 4, 28), new Date(2016, 5, 5), 2);
// [Sat May 28 2016 00:00:00 GMT-0700 (PDT),
//  Mon May 30 2016 00:00:00 GMT-0700 (PDT),
//  Wed Jun 01 2016 00:00:00 GMT-0700 (PDT),
//  Fri Jun 03 2016 00:00:00 GMT-0700 (PDT)]
```

If you want a filtered view of a time interval (say to guarantee that two overlapping ranges are consistent, such as when generating [time scale ticks](https://github.com/d3/d3-scale/blob/master/README.md#time_ticks)), you can use the new [*interval*.every](https://github.com/d3/d3-time/blob/master/README.md#interval_every) method or its more general cousin [*interval*.filter](https://github.com/d3/d3-time/blob/master/README.md#interval_filter):

```js
d3.timeDay.every(2).range(new Date(2016, 4, 28), new Date(2016, 5, 5));
// [Sun May 29 2016 00:00:00 GMT-0700 (PDT),
//  Tue May 31 2016 00:00:00 GMT-0700 (PDT),
//  Wed Jun 01 2016 00:00:00 GMT-0700 (PDT),
//  Fri Jun 03 2016 00:00:00 GMT-0700 (PDT)]
```

Time intervals now expose an [*interval*.count](https://github.com/d3/d3-time/blob/master/README.md#interval_count) method for counting the number of interval boundaries after a *start* date and before or equal to an *end* date. This replaces d3.time.dayOfYear and related methods in 3.x. For example, this code in 3.x:

```js
var now = new Date;
d3.time.dayOfYear(now); // 165
```

Can be rewritten in 4.0 as:

```js
var now = new Date;
d3.timeDay.count(d3.timeYear(now), now); // 165
```

Likewise, in place of 3.x’s d3.time.weekOfYear, in 4.0 you would say:

```js
d3.timeWeek.count(d3.timeYear(now), now); // 24
```

The new *interval*.count is of course more general. For example, you can use it to compute hour-of-week for a heatmap:

```js
d3.timeHour.count(d3.timeWeek(now), now); // 64
```

Here are all the equivalences from 3.x to 4.0:

* d3.time.dayOfYear ↦ [d3.timeDay](https://github.com/d3/d3-time/blob/master/README.md#timeDay).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.sundayOfYear ↦ [d3.timeSunday](https://github.com/d3/d3-time/blob/master/README.md#timeSunday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.mondayOfYear ↦ [d3.timeMonday](https://github.com/d3/d3-time/blob/master/README.md#timeMonday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.tuesdayOfYear ↦ [d3.timeTuesday](https://github.com/d3/d3-time/blob/master/README.md#timeTuesday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.wednesdayOfYear ↦ [d3.timeWednesday](https://github.com/d3/d3-time/blob/master/README.md#timeWednesday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.thursdayOfYear ↦ [d3.timeThursday](https://github.com/d3/d3-time/blob/master/README.md#timeThursday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.fridayOfYear ↦ [d3.timeFriday](https://github.com/d3/d3-time/blob/master/README.md#timeFriday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.saturdayOfYear ↦ [d3.timeSaturday](https://github.com/d3/d3-time/blob/master/README.md#timeSaturday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.weekOfYear ↦ [d3.timeWeek](https://github.com/d3/d3-time/blob/master/README.md#timeWeek).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.dayOfYear.utc ↦ [d3.utcDay](https://github.com/d3/d3-time/blob/master/README.md#utcDay).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.sundayOfYear.utc ↦ [d3.utcSunday](https://github.com/d3/d3-time/blob/master/README.md#utcSunday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.mondayOfYear.utc ↦ [d3.utcMonday](https://github.com/d3/d3-time/blob/master/README.md#utcMonday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.tuesdayOfYear.utc ↦ [d3.utcTuesday](https://github.com/d3/d3-time/blob/master/README.md#utcTuesday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.wednesdayOfYear.utc ↦ [d3.utcWednesday](https://github.com/d3/d3-time/blob/master/README.md#utcWednesday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.thursdayOfYear.utc ↦ [d3.utcThursday](https://github.com/d3/d3-time/blob/master/README.md#utcThursday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.fridayOfYear.utc ↦ [d3.utcFriday](https://github.com/d3/d3-time/blob/master/README.md#utcFriday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.saturdayOfYear.utc ↦ [d3.utcSaturday](https://github.com/d3/d3-time/blob/master/README.md#utcSaturday).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)
* d3.time.weekOfYear.utc ↦ [d3.utcWeek](https://github.com/d3/d3-time/blob/master/README.md#utcWeek).[count](https://github.com/d3/d3-time/blob/master/README.md#interval_count)

D3 4.0 now also lets you define custom time intervals using [d3.timeInterval](https://github.com/d3/d3-time/blob/master/README.md#timeInterval). The [d3.timeYear](https://github.com/d3/d3-time/blob/master/README.md#timeYear), [d3.utcYear](https://github.com/d3/d3-time/blob/master/README.md#utcYear), [d3.timeMillisecond](https://github.com/d3/d3-time/blob/master/README.md#timeMillisecond) and [d3.utcMillisecond](https://github.com/d3/d3-time/blob/master/README.md#utcMillisecond) intervals have optimized implementations of [*interval*.every](https://github.com/d3/d3-time/blob/master/README.md#interval_every), which is necessary to generate time ticks for very large or very small domains efficiently. More generally, the performance of time intervals has been improved, and time intervals now do a better job with respect to daylight savings in various locales.

## [Timers (d3-timer)](https://github.com/d3/d3-timer/blob/master/README.md)

In D3 3.x, the only way to stop a timer was for its callback to return true. For example, this timer stops after one second:

```js
d3.timer(function(elapsed) {
  console.log(elapsed);
  return elapsed >= 1000;
});
```

In 4.0, use [*timer*.stop](https://github.com/d3/d3-timer/blob/master/README.md#timer_stop) instead:

```js
var t = d3.timer(function(elapsed) {
  console.log(elapsed);
  if (elapsed >= 1000) {
    t.stop();
  }
});
```

The primary benefit of *timer*.stop is that timers are not required to self-terminate: they can be stopped externally, allowing for the immediate and synchronous disposal of associated resources, and the separation of concerns. The above is equivalent to:

```js
var t = d3.timer(function(elapsed) {
  console.log(elapsed);
});

d3.timeout(function() {
  t.stop();
}, 1000);
```

This improvement extends to [d3-transition](#transitions-d3-transition): now when a transition is interrupted, its resources are immediately freed rather than having to wait for transition to start.

4.0 also introduces a new [*timer*.restart](https://github.com/d3/d3-timer/blob/master/README.md#timer_restart) method for restarting timers, for replacing the callback of a running timer, or for changing its delay or reference time. Unlike *timer*.stop followed by [d3.timer](https://github.com/d3/d3-timer/blob/master/README.md#timer), *timer*.restart maintains the invocation priority of an existing timer: it guarantees that the order of invocation of active timers remains the same. The d3.timer.flush method has been renamed to [d3.timerFlush](https://github.com/d3/d3-timer/blob/master/README.md#timerFlush).

Some usage patterns in D3 3.x could cause the browser to hang when a background page returned to the foreground. For example, the following code schedules a transition every second:

```js
setInterval(function() {
  d3.selectAll("div").transition().call(someAnimation); // BAD
}, 1000);
```

If such code runs in the background for hours, thousands of queued transitions will try to run simultaneously when the page is foregrounded. D3 4.0 avoids this hang by freezing time in the background: when a page is in the background, time does not advance, and so no queue of timers accumulates to run when the page returns to the foreground. Use d3.timer instead of transitions to schedule a long-running animation, or use [d3.timeout](https://github.com/d3/d3-timer/blob/master/README.md#timeout) and [d3.interval](https://github.com/d3/d3-timer/blob/master/README.md#interval) in place of setTimeout and setInterval to prevent transitions from being queued in the background:

```js
d3.interval(function() {
  d3.selectAll("div").transition().call(someAnimation); // GOOD
}, 1000);
```

By freezing time in the background, timers are effectively “unaware” of being backgrounded. It’s like nothing happened! 4.0 also now uses high-precision time ([performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)) where available; the current time is available as [d3.now](https://github.com/d3/d3-timer/blob/master/README.md#now).

## [Transitions (d3-transition)](https://github.com/d3/d3-transition/blob/master/README.md)

The [*selection*.transition](https://github.com/d3/d3-transition/blob/master/README.md#selection_transition) method now takes an optional *transition* instance which can be used to synchronize a new transition with an existing transition. (This change is discussed further in [What Makes Software Good?](https://medium.com/@mbostock/what-makes-software-good-943557f8a488)) For example:

```js
var t = d3.transition()
    .duration(750)
    .ease(d3.easeLinear);

d3.selectAll(".apple").transition(t)
    .style("fill", "red");

d3.selectAll(".orange").transition(t)
    .style("fill", "orange");
```

Transitions created this way inherit timing from the closest ancestor element, and thus are synchronized even when the referenced *transition* has variable timing such as a staggered delay. This method replaces the deeply magical behavior of *transition*.each in 3.x; in 4.0, [*transition*.each](https://github.com/d3/d3-transition/blob/master/README.md#transition_each) is identical to [*selection*.each](https://github.com/d3/d3-selection/blob/master/README.md#selection_each). Use the new [*transition*.on](https://github.com/d3/d3-transition/blob/master/README.md#transition_on) method to listen to transition events.

The meaning of [*transition*.delay](https://github.com/d3/d3-transition/blob/master/README.md#transition_delay) has changed for chained transitions created by [*transition*.transition](https://github.com/d3/d3-transition/blob/master/README.md#transition_transition). The specified delay is now relative to the *previous* transition in the chain, rather than the *first* transition in the chain; this makes it easier to insert interstitial pauses. For example:

```js
d3.selectAll(".apple")
  .transition() // First fade to green.
    .style("fill", "green")
  .transition() // Then red.
    .style("fill", "red")
  .transition() // Wait one second. Then brown, and remove.
    .delay(1000)
    .style("fill", "brown")
    .remove();
```

Time is now frozen in the background; see [d3-timer](#timers-d3-timer) for more information. While it was previously the case that transitions did not run in the background, now they pick up where they left off when the page returns to the foreground. This avoids page hangs by not scheduling an unbounded number of transitions in the background. If you want to schedule an infinitely-repeating transition, use transition events, or use [d3.timeout](https://github.com/d3/d3-timer/blob/master/README.md#timeout) and [d3.interval](https://github.com/d3/d3-timer/blob/master/README.md#interval) in place of [setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout) and [setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval).

The [*selection*.interrupt](https://github.com/d3/d3-transition/blob/master/README.md#selection_interrupt) method now cancels all scheduled transitions on the selected elements, in addition to interrupting any active transition. When transitions are interrupted, any resources associated with the transition are now released immediately, rather than waiting until the transition starts, improving performance. (See also [*timer*.stop](https://github.com/d3/d3-timer/blob/master/README.md#timer_stop).) The new [d3.interrupt](https://github.com/d3/d3-transition/blob/master/README.md#interrupt) method is an alternative to [*selection*.interrupt](https://github.com/d3/d3-transition/blob/master/README.md#selection_interrupt) for quickly interrupting a single node.

The new [d3.active](https://github.com/d3/d3-transition/blob/master/README.md#active) method allows you to select the currently-active transition on a given *node*, if any. This is useful for modifying in-progress transitions and for scheduling infinitely-repeating transitions. For example, this transition continuously oscillates between red and blue:

```js
d3.select("circle")
  .transition()
    .on("start", function repeat() {
        d3.active(this)
            .style("fill", "red")
          .transition()
            .style("fill", "blue")
          .transition()
            .on("start", repeat);
      });
```

The [life cycle of a transition](https://github.com/d3/d3-transition/blob/master/README.md#the-life-of-a-transition) is now more formally defined and enforced. For example, attempting to change the duration of a running transition now throws an error rather than silently failing. The [*transition*.remove](https://github.com/d3/d3-transition/blob/master/README.md#transition_remove) method has been fixed if multiple transition names are in use: the element is only removed if it has no scheduled transitions, regardless of name. The [*transition*.ease](https://github.com/d3/d3-transition/blob/master/README.md#transition_ease) method now always takes an [easing function](#easings-d3-ease), not a string. When a transition ends, the tweens are invoked one last time with *t* equal to exactly 1, regardless of the associated easing function.

As with [selections](#selections-d3-selection) in 4.0, all transition callback functions now receive the standard arguments: the element’s datum (*d*), the element’s index (*i*), and the element’s group (*nodes*), with *this* as the element. This notably affects [*transition*.attrTween](https://github.com/d3/d3-transition/blob/master/README.md#transition_attrTween) and [*transition*.styleTween](https://github.com/d3/d3-transition/blob/master/README.md#transition_styleTween), which no longer pass the *tween* function the current attribute or style value as the third argument. The *transition*.attrTween and *transition*.styleTween methods can now be called in getter modes for debugging or to share tween definitions between transitions.

Homogenous transitions are now optimized! If all elements in a transition share the same tween, interpolator, or event listeners, this state is now shared across the transition rather than separately allocated for each element. 4.0 also uses an optimized default interpolator in place of [d3.interpolate](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolate) for [*transition*.attr](https://github.com/d3/d3-transition/blob/master/README.md#transition_attr) and [*transition*.style](https://github.com/d3/d3-transition/blob/master/README.md#transition_style). And transitions can now interpolate both [CSS](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateTransformCss) and [SVG](https://github.com/d3/d3-interpolate/blob/master/README.md#interpolateTransformSvg) transforms.

For reusable components that support transitions, such as [axes](#axes-d3-axis), a new [*transition*.selection](https://github.com/d3/d3-transition/blob/master/README.md#transition_selection) method returns the [selection](#selections-d3-selection) that corresponds to a given transition. There is also a new [*transition*.merge](https://github.com/d3/d3-transition/blob/master/README.md#transition_merge) method that is equivalent to [*selection*.merge](https://github.com/d3/d3-selection/blob/master/README.md#selection_merge).

For the sake of parsimony, the multi-value map methods have been extracted to [d3-selection-multi](https://github.com/d3/d3-selection-multi) and are no longer part of the default bundle. The multi-value map methods have also been renamed to plural form to reduce overload: [*transition*.attrs](https://github.com/d3/d3-selection-multi/blob/master/README.md#transition_attrs) and [*transition*.styles](https://github.com/d3/d3-selection-multi/blob/master/README.md#transition_styles).

## [Voronoi Diagrams (d3-voronoi)](https://github.com/d3/d3-voronoi/blob/master/README.md)

The d3.geom.voronoi method has been renamed to [d3.voronoi](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi), and the *voronoi*.clipExtent method has been renamed to [*voronoi*.extent](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi_extent). The undocumented *polygon*.point property in 3.x, which is the element in the input *data* corresponding to the polygon, has been renamed to *polygon*.data.

Calling [*voronoi*](https://github.com/d3/d3-voronoi/blob/master/README.md#_voronoi) now returns the full [Voronoi diagram](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi-diagrams), which includes topological information: each Voronoi edge exposes *edge*.left and *edge*.right specifying the sites on either side of the edge, and each Voronoi cell is defined as an array of these edges and a corresponding site. The Voronoi diagram can be used to efficiently compute both the Voronoi and Delaunay tessellations for a set of points: [*diagram*.polygons](https://github.com/d3/d3-voronoi/blob/master/README.md#diagram_polygons), [*diagram*.links](https://github.com/d3/d3-voronoi/blob/master/README.md#diagram_links), and [*diagram*.triangles](https://github.com/d3/d3-voronoi/blob/master/README.md#diagram_triangles). The new topology is also useful in conjunction with TopoJSON; see the [Voronoi topology example](https://bl.ocks.org/mbostock/cd52a201d7694eb9d890).

The [*voronoi*.polygons](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi_polygons) and [*diagram*.polygons](https://github.com/d3/d3-voronoi/blob/master/README.md#diagram_polygons) now require an [extent](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi_extent); there is no longer an implicit extent of ±1e6. The [*voronoi*.links](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi_links), [*voronoi*.triangles](https://github.com/d3/d3-voronoi/blob/master/README.md#voronoi_triangles), [*diagram*.links](https://github.com/d3/d3-voronoi/blob/master/README.md#diagram_links) and [*diagram*.triangles](https://github.com/d3/d3-voronoi/blob/master/README.md#diagram_triangles) are now affected by the clip extent: as the Delaunay is computed as the dual of the Voronoi, two sites are only linked if the clipped cells are touching. To compute the Delaunay triangulation without respect to clipping, set the extent to null.

The Voronoi generator finally has well-defined behavior for coincident vertices: the first of a set of coincident points has a defined cell, while the subsequent duplicate points have null cells. The returned array of polygons is sparse, so by using *array*.forEach or *array*.map, you can easily skip undefined cells. The Voronoi generator also now correctly handles the case where no cell edges intersect the extent.

## [Zooming (d3-zoom)](https://github.com/d3/d3-zoom/blob/master/README.md)

The zoom behavior d3.behavior.zoom has been renamed to d3.zoom. Zoom behaviors no longer store the active zoom transform (*i.e.*, the visible region; the scale and translate) internally. The zoom transform is now stored on any elements to which the zoom behavior has been applied. The zoom transform is available as *event*.transform within a zoom event or by calling [d3.zoomTransform](https://github.com/d3/d3-zoom/blob/master/README.md#zoomTransform) on a given *element*. To zoom programmatically, use [*zoom*.transform](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_transform) with a given [selection](#selections-d3-selection) or [transition](#transitions-d3-transition); see the [zoom transitions example](https://bl.ocks.org/mbostock/b783fbb2e673561d214e09c7fb5cedee). The *zoom*.event method has been removed.

To make programmatic zooming easier, there are several new convenience methods on top of *zoom*.transform: [*zoom*.translateBy](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_translateBy), [*zoom*.scaleBy](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_scaleBy) and [*zoom*.scaleTo](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_scaleTo). There is also a new API for describing [zoom transforms](https://github.com/d3/d3-zoom/blob/master/README.md#zoom-transforms). Zoom behaviors are no longer dependent on [scales](#scales-d3-scale), but you can use [*transform*.rescaleX](https://github.com/d3/d3-zoom/blob/master/README.md#transform_rescaleX), [*transform*.rescaleY](https://github.com/d3/d3-zoom/blob/master/README.md#transform_rescaleY), [*transform*.invertX](https://github.com/d3/d3-zoom/blob/master/README.md#transform_invertX) or [*transform*.invertY](https://github.com/d3/d3-zoom/blob/master/README.md#transform_invertY) to transform a scale’s domain. 3.x’s *event*.scale is replaced with *event*.transform.k, and *event*.translate is replaced with *event*.transform.x and *event*.transform.y. The *zoom*.center method has been removed in favor of programmatic zooming.

The zoom behavior finally supports simple constraints on panning! The new [*zoom*.translateExtent](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_translateExtent) lets you define the viewable extent of the world: the currently-visible extent (the extent of the viewport, as defined by [*zoom*.extent](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_extent)) is always contained within the translate extent. The *zoom*.size method has been replaced by *zoom*.extent, and the default behavior is now smarter: it defaults to the extent of the zoom behavior’s owner element, rather than being hardcoded to 960×500. (This also improves the default path chosen during smooth zoom transitions!)

The zoom behavior’s interaction has also improved. It now correctly handles concurrent wheeling and dragging, as well as concurrent touching and mousing. The zoom behavior now ignores wheel events at the limits of its scale extent, allowing you to scroll past a zoomable area. The *zoomstart* and *zoomend* events have been renamed *start* and *end*. By default, zoom behaviors now ignore right-clicks intended for the context menu; use [*zoom*.filter](https://github.com/d3/d3-zoom/blob/master/README.md#zoom_filter) to control which events are ignored. The zoom behavior also ignores emulated mouse events on iOS. The zoom behavior now consumes handled events, making it easier to combine with other interactive behaviors such as [dragging](#dragging-d3-drag).



================================================
FILE: LICENSE
================================================
Copyright 2010-2023 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.



================================================
FILE: package.json
================================================
{
  "name": "d3",
  "version": "7.9.0",
  "description": "Data-Driven Documents",
  "homepage": "https://d3js.org",
  "repository": {
    "type": "git",
    "url": "https://github.com/d3/d3.git"
  },
  "keywords": [
    "d3",
    "dom",
    "visualization",
    "svg",
    "animation",
    "canvas"
  ],
  "license": "ISC",
  "author": {
    "name": "Mike Bostock",
    "url": "https://bost.ocks.org/mike"
  },
  "type": "module",
  "files": [
    "dist/d3.js",
    "dist/d3.min.js",
    "src/**/*.js"
  ],
  "module": "src/index.js",
  "main": "src/index.js",
  "jsdelivr": "dist/d3.min.js",
  "unpkg": "dist/d3.min.js",
  "exports": {
    "umd": "./dist/d3.min.js",
    "default": "./src/index.js"
  },
  "dependencies": {
    "d3-array": "^3.2.4",
    "d3-axis": "^3.0.0",
    "d3-brush": "^3.0.0",
    "d3-chord": "^3.0.1",
    "d3-color": "^3.1.0",
    "d3-contour": "^4.0.2",
    "d3-delaunay": "^6.0.4",
    "d3-dispatch": "^3.0.1",
    "d3-drag": "^3.0.0",
    "d3-dsv": "^3.0.1",
    "d3-ease": "^3.0.1",
    "d3-fetch": "^3.0.1",
    "d3-force": "^3.0.0",
    "d3-format": "^3.1.0",
    "d3-geo": "^3.1.1",
    "d3-hierarchy": "^3.1.2",
    "d3-interpolate": "^3.0.1",
    "d3-path": "^3.1.0",
    "d3-polygon": "^3.0.1",
    "d3-quadtree": "^3.0.1",
    "d3-random": "^3.0.1",
    "d3-scale": "^4.0.2",
    "d3-scale-chromatic": "^3.1.0",
    "d3-selection": "^3.0.0",
    "d3-shape": "^3.2.0",
    "d3-time": "^3.1.0",
    "d3-time-format": "^4.1.0",
    "d3-timer": "^3.0.1",
    "d3-transition": "^3.0.1",
    "d3-zoom": "^3.0.0"
  },
  "devDependencies": {
    "@observablehq/plot": "^0.6.7",
    "@observablehq/runtime": "^5.7.3",
    "@rollup/plugin-json": "^6.1.0",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-terser": "^0.4.0",
    "eslint": "^8.57.0",
    "mocha": "^10.3.0",
    "rollup": "^3.29.4",
    "topojson-client": "^3.1.0",
    "vitepress": "^1.4.0"
  },
  "scripts": {
    "test": "mocha 'test/**/*-test.js' && eslint src test",
    "prepublishOnly": "rm -rf dist && rollup -c",
    "postpublish": "git push && git push --tags",
    "docs:dev": "node --experimental-network-imports node_modules/vitepress/dist/node/cli.js dev docs",
    "docs:build": "./prebuild.sh && node --experimental-network-imports node_modules/vitepress/dist/node/cli.js build docs",
    "docs:preview": "vitepress preview docs"
  },
  "engines": {
    "node": ">=12"
  }
}



================================================
FILE: prebuild.sh
================================================
#!/usr/bin/env bash

cp -v ./build/d3.github.com/colorbrewer.v1.css docs/public/colorbrewer.v1.css
cp -v ./build/d3.github.com/colorbrewer.v1.js docs/public/colorbrewer.v1.js
cp -v ./build/d3.github.com/colorbrewer.v1.min.js docs/public/colorbrewer.v1.min.js
cp -v ./build/d3.github.com/d3-array.v0.6.js docs/public/d3-array.v0.6.js
cp -v ./build/d3.github.com/d3-array.v0.6.min.js docs/public/d3-array.v0.6.min.js
cp -v ./build/d3.github.com/d3-array.v0.7.js docs/public/d3-array.v0.7.js
cp -v ./build/d3.github.com/d3-array.v0.7.min.js docs/public/d3-array.v0.7.min.js
cp -v ./build/d3.github.com/d3-array.v0.8.js docs/public/d3-array.v0.8.js
cp -v ./build/d3.github.com/d3-array.v0.8.min.js docs/public/d3-array.v0.8.min.js
cp -v ./build/d3.github.com/d3-array.v1.js docs/public/d3-array.v1.js
cp -v ./build/d3.github.com/d3-array.v1.min.js docs/public/d3-array.v1.min.js
cp -v ./build/d3.github.com/d3-array.v2.js docs/public/d3-array.v2.js
cp -v ./build/d3.github.com/d3-array.v2.min.js docs/public/d3-array.v2.min.js
cp -v ./build/d3.github.com/d3-array.v3.js docs/public/d3-array.v3.js
cp -v ./build/d3.github.com/d3-array.v3.min.js docs/public/d3-array.v3.min.js
cp -v ./build/d3.github.com/d3-axis.v0.1.js docs/public/d3-axis.v0.1.js
cp -v ./build/d3.github.com/d3-axis.v0.1.min.js docs/public/d3-axis.v0.1.min.js
cp -v ./build/d3.github.com/d3-axis.v0.2.js docs/public/d3-axis.v0.2.js
cp -v ./build/d3.github.com/d3-axis.v0.2.min.js docs/public/d3-axis.v0.2.min.js
cp -v ./build/d3.github.com/d3-axis.v0.3.js docs/public/d3-axis.v0.3.js
cp -v ./build/d3.github.com/d3-axis.v0.3.min.js docs/public/d3-axis.v0.3.min.js
cp -v ./build/d3.github.com/d3-axis.v0.4.js docs/public/d3-axis.v0.4.js
cp -v ./build/d3.github.com/d3-axis.v0.4.min.js docs/public/d3-axis.v0.4.min.js
cp -v ./build/d3.github.com/d3-axis.v1.js docs/public/d3-axis.v1.js
cp -v ./build/d3.github.com/d3-axis.v1.min.js docs/public/d3-axis.v1.min.js
cp -v ./build/d3.github.com/d3-axis.v2.js docs/public/d3-axis.v2.js
cp -v ./build/d3.github.com/d3-axis.v2.min.js docs/public/d3-axis.v2.min.js
cp -v ./build/d3.github.com/d3-axis.v3.js docs/public/d3-axis.v3.js
cp -v ./build/d3.github.com/d3-axis.v3.min.js docs/public/d3-axis.v3.min.js
cp -v ./build/d3.github.com/d3-brush.v0.1.js docs/public/d3-brush.v0.1.js
cp -v ./build/d3.github.com/d3-brush.v0.1.min.js docs/public/d3-brush.v0.1.min.js
cp -v ./build/d3.github.com/d3-brush.v0.2.js docs/public/d3-brush.v0.2.js
cp -v ./build/d3.github.com/d3-brush.v0.2.min.js docs/public/d3-brush.v0.2.min.js
cp -v ./build/d3.github.com/d3-brush.v1.js docs/public/d3-brush.v1.js
cp -v ./build/d3.github.com/d3-brush.v1.min.js docs/public/d3-brush.v1.min.js
cp -v ./build/d3.github.com/d3-brush.v2.js docs/public/d3-brush.v2.js
cp -v ./build/d3.github.com/d3-brush.v2.min.js docs/public/d3-brush.v2.min.js
cp -v ./build/d3.github.com/d3-brush.v3.js docs/public/d3-brush.v3.js
cp -v ./build/d3.github.com/d3-brush.v3.min.js docs/public/d3-brush.v3.min.js
cp -v ./build/d3.github.com/d3-chord.v0.0.js docs/public/d3-chord.v0.0.js
cp -v ./build/d3.github.com/d3-chord.v0.0.min.js docs/public/d3-chord.v0.0.min.js
cp -v ./build/d3.github.com/d3-chord.v1.js docs/public/d3-chord.v1.js
cp -v ./build/d3.github.com/d3-chord.v1.min.js docs/public/d3-chord.v1.min.js
cp -v ./build/d3.github.com/d3-chord.v2.js docs/public/d3-chord.v2.js
cp -v ./build/d3.github.com/d3-chord.v2.min.js docs/public/d3-chord.v2.min.js
cp -v ./build/d3.github.com/d3-chord.v3.js docs/public/d3-chord.v3.js
cp -v ./build/d3.github.com/d3-chord.v3.min.js docs/public/d3-chord.v3.min.js
cp -v ./build/d3.github.com/d3-collection.v0.1.js docs/public/d3-collection.v0.1.js
cp -v ./build/d3.github.com/d3-collection.v0.1.min.js docs/public/d3-collection.v0.1.min.js
cp -v ./build/d3.github.com/d3-collection.v0.2.js docs/public/d3-collection.v0.2.js
cp -v ./build/d3.github.com/d3-collection.v0.2.min.js docs/public/d3-collection.v0.2.min.js
cp -v ./build/d3.github.com/d3-collection.v0.3.js docs/public/d3-collection.v0.3.js
cp -v ./build/d3.github.com/d3-collection.v0.3.min.js docs/public/d3-collection.v0.3.min.js
cp -v ./build/d3.github.com/d3-collection.v1.js docs/public/d3-collection.v1.js
cp -v ./build/d3.github.com/d3-collection.v1.min.js docs/public/d3-collection.v1.min.js
cp -v ./build/d3.github.com/d3-color.v0.3.js docs/public/d3-color.v0.3.js
cp -v ./build/d3.github.com/d3-color.v0.3.min.js docs/public/d3-color.v0.3.min.js
cp -v ./build/d3.github.com/d3-color.v0.4.js docs/public/d3-color.v0.4.js
cp -v ./build/d3.github.com/d3-color.v0.4.min.js docs/public/d3-color.v0.4.min.js
cp -v ./build/d3.github.com/d3-color.v0.5.js docs/public/d3-color.v0.5.js
cp -v ./build/d3.github.com/d3-color.v0.5.min.js docs/public/d3-color.v0.5.min.js
cp -v ./build/d3.github.com/d3-color.v1.js docs/public/d3-color.v1.js
cp -v ./build/d3.github.com/d3-color.v1.min.js docs/public/d3-color.v1.min.js
cp -v ./build/d3.github.com/d3-color.v2.js docs/public/d3-color.v2.js
cp -v ./build/d3.github.com/d3-color.v2.min.js docs/public/d3-color.v2.min.js
cp -v ./build/d3.github.com/d3-color.v3.js docs/public/d3-color.v3.js
cp -v ./build/d3.github.com/d3-color.v3.min.js docs/public/d3-color.v3.min.js
cp -v ./build/d3.github.com/d3-contour.v0.0.js docs/public/d3-contour.v0.0.js
cp -v ./build/d3.github.com/d3-contour.v0.0.min.js docs/public/d3-contour.v0.0.min.js
cp -v ./build/d3.github.com/d3-contour.v1.js docs/public/d3-contour.v1.js
cp -v ./build/d3.github.com/d3-contour.v1.min.js docs/public/d3-contour.v1.min.js
cp -v ./build/d3.github.com/d3-contour.v2.js docs/public/d3-contour.v2.js
cp -v ./build/d3.github.com/d3-contour.v2.min.js docs/public/d3-contour.v2.min.js
cp -v ./build/d3.github.com/d3-contour.v3.js docs/public/d3-contour.v3.js
cp -v ./build/d3.github.com/d3-contour.v3.min.js docs/public/d3-contour.v3.min.js
cp -v ./build/d3.github.com/d3-contour.v4.js docs/public/d3-contour.v4.js
cp -v ./build/d3.github.com/d3-contour.v4.min.js docs/public/d3-contour.v4.min.js
cp -v ./build/d3.github.com/d3-dispatch.v0.2.js docs/public/d3-dispatch.v0.2.js
cp -v ./build/d3.github.com/d3-dispatch.v0.2.min.js docs/public/d3-dispatch.v0.2.min.js
cp -v ./build/d3.github.com/d3-dispatch.v0.3.js docs/public/d3-dispatch.v0.3.js
cp -v ./build/d3.github.com/d3-dispatch.v0.3.min.js docs/public/d3-dispatch.v0.3.min.js
cp -v ./build/d3.github.com/d3-dispatch.v0.4.js docs/public/d3-dispatch.v0.4.js
cp -v ./build/d3.github.com/d3-dispatch.v0.4.min.js docs/public/d3-dispatch.v0.4.min.js
cp -v ./build/d3.github.com/d3-dispatch.v0.5.js docs/public/d3-dispatch.v0.5.js
cp -v ./build/d3.github.com/d3-dispatch.v0.5.min.js docs/public/d3-dispatch.v0.5.min.js
cp -v ./build/d3.github.com/d3-dispatch.v1.js docs/public/d3-dispatch.v1.js
cp -v ./build/d3.github.com/d3-dispatch.v1.min.js docs/public/d3-dispatch.v1.min.js
cp -v ./build/d3.github.com/d3-dispatch.v2.js docs/public/d3-dispatch.v2.js
cp -v ./build/d3.github.com/d3-dispatch.v2.min.js docs/public/d3-dispatch.v2.min.js
cp -v ./build/d3.github.com/d3-dispatch.v3.js docs/public/d3-dispatch.v3.js
cp -v ./build/d3.github.com/d3-dispatch.v3.min.js docs/public/d3-dispatch.v3.min.js
cp -v ./build/d3.github.com/d3-drag.v0.0.js docs/public/d3-drag.v0.0.js
cp -v ./build/d3.github.com/d3-drag.v0.0.min.js docs/public/d3-drag.v0.0.min.js
cp -v ./build/d3.github.com/d3-drag.v0.1.js docs/public/d3-drag.v0.1.js
cp -v ./build/d3.github.com/d3-drag.v0.1.min.js docs/public/d3-drag.v0.1.min.js
cp -v ./build/d3.github.com/d3-drag.v0.2.js docs/public/d3-drag.v0.2.js
cp -v ./build/d3.github.com/d3-drag.v0.2.min.js docs/public/d3-drag.v0.2.min.js
cp -v ./build/d3.github.com/d3-drag.v0.3.js docs/public/d3-drag.v0.3.js
cp -v ./build/d3.github.com/d3-drag.v0.3.min.js docs/public/d3-drag.v0.3.min.js
cp -v ./build/d3.github.com/d3-drag.v1.js docs/public/d3-drag.v1.js
cp -v ./build/d3.github.com/d3-drag.v1.min.js docs/public/d3-drag.v1.min.js
cp -v ./build/d3.github.com/d3-drag.v2.js docs/public/d3-drag.v2.js
cp -v ./build/d3.github.com/d3-drag.v2.min.js docs/public/d3-drag.v2.min.js
cp -v ./build/d3.github.com/d3-drag.v3.js docs/public/d3-drag.v3.js
cp -v ./build/d3.github.com/d3-drag.v3.min.js docs/public/d3-drag.v3.min.js
cp -v ./build/d3.github.com/d3-dsv.v0.1.js docs/public/d3-dsv.v0.1.js
cp -v ./build/d3.github.com/d3-dsv.v0.1.min.js docs/public/d3-dsv.v0.1.min.js
cp -v ./build/d3.github.com/d3-dsv.v0.2.js docs/public/d3-dsv.v0.2.js
cp -v ./build/d3.github.com/d3-dsv.v0.2.min.js docs/public/d3-dsv.v0.2.min.js
cp -v ./build/d3.github.com/d3-dsv.v0.3.js docs/public/d3-dsv.v0.3.js
cp -v ./build/d3.github.com/d3-dsv.v0.3.min.js docs/public/d3-dsv.v0.3.min.js
cp -v ./build/d3.github.com/d3-dsv.v0.4.js docs/public/d3-dsv.v0.4.js
cp -v ./build/d3.github.com/d3-dsv.v0.4.min.js docs/public/d3-dsv.v0.4.min.js
cp -v ./build/d3.github.com/d3-dsv.v1.js docs/public/d3-dsv.v1.js
cp -v ./build/d3.github.com/d3-dsv.v1.min.js docs/public/d3-dsv.v1.min.js
cp -v ./build/d3.github.com/d3-dsv.v2.js docs/public/d3-dsv.v2.js
cp -v ./build/d3.github.com/d3-dsv.v2.min.js docs/public/d3-dsv.v2.min.js
cp -v ./build/d3.github.com/d3-dsv.v3.js docs/public/d3-dsv.v3.js
cp -v ./build/d3.github.com/d3-dsv.v3.min.js docs/public/d3-dsv.v3.min.js
cp -v ./build/d3.github.com/d3-ease.v0.3.js docs/public/d3-ease.v0.3.js
cp -v ./build/d3.github.com/d3-ease.v0.3.min.js docs/public/d3-ease.v0.3.min.js
cp -v ./build/d3.github.com/d3-ease.v0.4.js docs/public/d3-ease.v0.4.js
cp -v ./build/d3.github.com/d3-ease.v0.4.min.js docs/public/d3-ease.v0.4.min.js
cp -v ./build/d3.github.com/d3-ease.v0.5.js docs/public/d3-ease.v0.5.js
cp -v ./build/d3.github.com/d3-ease.v0.5.min.js docs/public/d3-ease.v0.5.min.js
cp -v ./build/d3.github.com/d3-ease.v0.6.js docs/public/d3-ease.v0.6.js
cp -v ./build/d3.github.com/d3-ease.v0.6.min.js docs/public/d3-ease.v0.6.min.js
cp -v ./build/d3.github.com/d3-ease.v0.7.js docs/public/d3-ease.v0.7.js
cp -v ./build/d3.github.com/d3-ease.v0.7.min.js docs/public/d3-ease.v0.7.min.js
cp -v ./build/d3.github.com/d3-ease.v0.8.js docs/public/d3-ease.v0.8.js
cp -v ./build/d3.github.com/d3-ease.v0.8.min.js docs/public/d3-ease.v0.8.min.js
cp -v ./build/d3.github.com/d3-ease.v1.js docs/public/d3-ease.v1.js
cp -v ./build/d3.github.com/d3-ease.v1.min.js docs/public/d3-ease.v1.min.js
cp -v ./build/d3.github.com/d3-ease.v2.js docs/public/d3-ease.v2.js
cp -v ./build/d3.github.com/d3-ease.v2.min.js docs/public/d3-ease.v2.min.js
cp -v ./build/d3.github.com/d3-ease.v3.js docs/public/d3-ease.v3.js
cp -v ./build/d3.github.com/d3-ease.v3.min.js docs/public/d3-ease.v3.min.js
cp -v ./build/d3.github.com/d3-fetch.v0.js docs/public/d3-fetch.v0.js
cp -v ./build/d3.github.com/d3-fetch.v0.min.js docs/public/d3-fetch.v0.min.js
cp -v ./build/d3.github.com/d3-fetch.v1.js docs/public/d3-fetch.v1.js
cp -v ./build/d3.github.com/d3-fetch.v1.min.js docs/public/d3-fetch.v1.min.js
cp -v ./build/d3.github.com/d3-fetch.v2.js docs/public/d3-fetch.v2.js
cp -v ./build/d3.github.com/d3-fetch.v2.min.js docs/public/d3-fetch.v2.min.js
cp -v ./build/d3.github.com/d3-fetch.v3.js docs/public/d3-fetch.v3.js
cp -v ./build/d3.github.com/d3-fetch.v3.min.js docs/public/d3-fetch.v3.min.js
cp -v ./build/d3.github.com/d3-force.v0.0.js docs/public/d3-force.v0.0.js
cp -v ./build/d3.github.com/d3-force.v0.0.min.js docs/public/d3-force.v0.0.min.js
cp -v ./build/d3.github.com/d3-force.v0.1.js docs/public/d3-force.v0.1.js
cp -v ./build/d3.github.com/d3-force.v0.1.min.js docs/public/d3-force.v0.1.min.js
cp -v ./build/d3.github.com/d3-force.v0.2.js docs/public/d3-force.v0.2.js
cp -v ./build/d3.github.com/d3-force.v0.2.min.js docs/public/d3-force.v0.2.min.js
cp -v ./build/d3.github.com/d3-force.v0.3.js docs/public/d3-force.v0.3.js
cp -v ./build/d3.github.com/d3-force.v0.3.min.js docs/public/d3-force.v0.3.min.js
cp -v ./build/d3.github.com/d3-force.v0.4.js docs/public/d3-force.v0.4.js
cp -v ./build/d3.github.com/d3-force.v0.4.min.js docs/public/d3-force.v0.4.min.js
cp -v ./build/d3.github.com/d3-force.v0.5.js docs/public/d3-force.v0.5.js
cp -v ./build/d3.github.com/d3-force.v0.5.min.js docs/public/d3-force.v0.5.min.js
cp -v ./build/d3.github.com/d3-force.v0.6.js docs/public/d3-force.v0.6.js
cp -v ./build/d3.github.com/d3-force.v0.6.min.js docs/public/d3-force.v0.6.min.js
cp -v ./build/d3.github.com/d3-force.v0.7.js docs/public/d3-force.v0.7.js
cp -v ./build/d3.github.com/d3-force.v0.7.min.js docs/public/d3-force.v0.7.min.js
cp -v ./build/d3.github.com/d3-force.v1.js docs/public/d3-force.v1.js
cp -v ./build/d3.github.com/d3-force.v1.min.js docs/public/d3-force.v1.min.js
cp -v ./build/d3.github.com/d3-force.v2.js docs/public/d3-force.v2.js
cp -v ./build/d3.github.com/d3-force.v2.min.js docs/public/d3-force.v2.min.js
cp -v ./build/d3.github.com/d3-force.v3.js docs/public/d3-force.v3.js
cp -v ./build/d3.github.com/d3-force.v3.min.js docs/public/d3-force.v3.min.js
cp -v ./build/d3.github.com/d3-format.v0.4.js docs/public/d3-format.v0.4.js
cp -v ./build/d3.github.com/d3-format.v0.4.min.js docs/public/d3-format.v0.4.min.js
cp -v ./build/d3.github.com/d3-format.v0.5.js docs/public/d3-format.v0.5.js
cp -v ./build/d3.github.com/d3-format.v0.5.min.js docs/public/d3-format.v0.5.min.js
cp -v ./build/d3.github.com/d3-format.v0.6.js docs/public/d3-format.v0.6.js
cp -v ./build/d3.github.com/d3-format.v0.6.min.js docs/public/d3-format.v0.6.min.js
cp -v ./build/d3.github.com/d3-format.v1.js docs/public/d3-format.v1.js
cp -v ./build/d3.github.com/d3-format.v1.min.js docs/public/d3-format.v1.min.js
cp -v ./build/d3.github.com/d3-format.v2.js docs/public/d3-format.v2.js
cp -v ./build/d3.github.com/d3-format.v2.min.js docs/public/d3-format.v2.min.js
cp -v ./build/d3.github.com/d3-format.v3.js docs/public/d3-format.v3.js
cp -v ./build/d3.github.com/d3-format.v3.min.js docs/public/d3-format.v3.min.js
cp -v ./build/d3.github.com/d3-geo-projection.v1.js docs/public/d3-geo-projection.v1.js
cp -v ./build/d3.github.com/d3-geo-projection.v1.min.js docs/public/d3-geo-projection.v1.min.js
cp -v ./build/d3.github.com/d3-geo-projection.v2.js docs/public/d3-geo-projection.v2.js
cp -v ./build/d3.github.com/d3-geo-projection.v2.min.js docs/public/d3-geo-projection.v2.min.js
cp -v ./build/d3.github.com/d3-geo-projection.v3.js docs/public/d3-geo-projection.v3.js
cp -v ./build/d3.github.com/d3-geo-projection.v3.min.js docs/public/d3-geo-projection.v3.min.js
cp -v ./build/d3.github.com/d3-geo-projection.v4.js docs/public/d3-geo-projection.v4.js
cp -v ./build/d3.github.com/d3-geo-projection.v4.min.js docs/public/d3-geo-projection.v4.min.js
cp -v ./build/d3.github.com/d3-geo.v0.0.js docs/public/d3-geo.v0.0.js
cp -v ./build/d3.github.com/d3-geo.v0.0.min.js docs/public/d3-geo.v0.0.min.js
cp -v ./build/d3.github.com/d3-geo.v0.1.js docs/public/d3-geo.v0.1.js
cp -v ./build/d3.github.com/d3-geo.v0.1.min.js docs/public/d3-geo.v0.1.min.js
cp -v ./build/d3.github.com/d3-geo.v1.js docs/public/d3-geo.v1.js
cp -v ./build/d3.github.com/d3-geo.v1.min.js docs/public/d3-geo.v1.min.js
cp -v ./build/d3.github.com/d3-geo.v2.js docs/public/d3-geo.v2.js
cp -v ./build/d3.github.com/d3-geo.v2.min.js docs/public/d3-geo.v2.min.js
cp -v ./build/d3.github.com/d3-geo.v3.js docs/public/d3-geo.v3.js
cp -v ./build/d3.github.com/d3-geo.v3.min.js docs/public/d3-geo.v3.min.js
cp -v ./build/d3.github.com/d3-hexbin.v0.2.js docs/public/d3-hexbin.v0.2.js
cp -v ./build/d3.github.com/d3-hexbin.v0.2.min.js docs/public/d3-hexbin.v0.2.min.js
cp -v ./build/d3.github.com/d3-hexbin.v1.js docs/public/d3-hexbin.v1.js
cp -v ./build/d3.github.com/d3-hexbin.v1.min.js docs/public/d3-hexbin.v1.min.js
cp -v ./build/d3.github.com/d3-hierarchy.v0.1.js docs/public/d3-hierarchy.v0.1.js
cp -v ./build/d3.github.com/d3-hierarchy.v0.1.min.js docs/public/d3-hierarchy.v0.1.min.js
cp -v ./build/d3.github.com/d3-hierarchy.v0.2.js docs/public/d3-hierarchy.v0.2.js
cp -v ./build/d3.github.com/d3-hierarchy.v0.2.min.js docs/public/d3-hierarchy.v0.2.min.js
cp -v ./build/d3.github.com/d3-hierarchy.v0.3.js docs/public/d3-hierarchy.v0.3.js
cp -v ./build/d3.github.com/d3-hierarchy.v0.3.min.js docs/public/d3-hierarchy.v0.3.min.js
cp -v ./build/d3.github.com/d3-hierarchy.v1.js docs/public/d3-hierarchy.v1.js
cp -v ./build/d3.github.com/d3-hierarchy.v1.min.js docs/public/d3-hierarchy.v1.min.js
cp -v ./build/d3.github.com/d3-hierarchy.v2.js docs/public/d3-hierarchy.v2.js
cp -v ./build/d3.github.com/d3-hierarchy.v2.min.js docs/public/d3-hierarchy.v2.min.js
cp -v ./build/d3.github.com/d3-hierarchy.v3.js docs/public/d3-hierarchy.v3.js
cp -v ./build/d3.github.com/d3-hierarchy.v3.min.js docs/public/d3-hierarchy.v3.min.js
cp -v ./build/d3.github.com/d3-hsv.v0.0.js docs/public/d3-hsv.v0.0.js
cp -v ./build/d3.github.com/d3-hsv.v0.0.min.js docs/public/d3-hsv.v0.0.min.js
cp -v ./build/d3.github.com/d3-hsv.v0.1.js docs/public/d3-hsv.v0.1.js
cp -v ./build/d3.github.com/d3-hsv.v0.1.min.js docs/public/d3-hsv.v0.1.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.2.js docs/public/d3-interpolate.v0.2.js
cp -v ./build/d3.github.com/d3-interpolate.v0.2.min.js docs/public/d3-interpolate.v0.2.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.3.js docs/public/d3-interpolate.v0.3.js
cp -v ./build/d3.github.com/d3-interpolate.v0.3.min.js docs/public/d3-interpolate.v0.3.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.4.js docs/public/d3-interpolate.v0.4.js
cp -v ./build/d3.github.com/d3-interpolate.v0.4.min.js docs/public/d3-interpolate.v0.4.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.5.js docs/public/d3-interpolate.v0.5.js
cp -v ./build/d3.github.com/d3-interpolate.v0.5.min.js docs/public/d3-interpolate.v0.5.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.6.js docs/public/d3-interpolate.v0.6.js
cp -v ./build/d3.github.com/d3-interpolate.v0.6.min.js docs/public/d3-interpolate.v0.6.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.7.js docs/public/d3-interpolate.v0.7.js
cp -v ./build/d3.github.com/d3-interpolate.v0.7.min.js docs/public/d3-interpolate.v0.7.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.8.js docs/public/d3-interpolate.v0.8.js
cp -v ./build/d3.github.com/d3-interpolate.v0.8.min.js docs/public/d3-interpolate.v0.8.min.js
cp -v ./build/d3.github.com/d3-interpolate.v0.9.js docs/public/d3-interpolate.v0.9.js
cp -v ./build/d3.github.com/d3-interpolate.v0.9.min.js docs/public/d3-interpolate.v0.9.min.js
cp -v ./build/d3.github.com/d3-interpolate.v1.js docs/public/d3-interpolate.v1.js
cp -v ./build/d3.github.com/d3-interpolate.v1.min.js docs/public/d3-interpolate.v1.min.js
cp -v ./build/d3.github.com/d3-interpolate.v2.js docs/public/d3-interpolate.v2.js
cp -v ./build/d3.github.com/d3-interpolate.v2.min.js docs/public/d3-interpolate.v2.min.js
cp -v ./build/d3.github.com/d3-interpolate.v3.js docs/public/d3-interpolate.v3.js
cp -v ./build/d3.github.com/d3-interpolate.v3.min.js docs/public/d3-interpolate.v3.min.js
cp -v ./build/d3.github.com/d3-path.v0.1.js docs/public/d3-path.v0.1.js
cp -v ./build/d3.github.com/d3-path.v0.1.min.js docs/public/d3-path.v0.1.min.js
cp -v ./build/d3.github.com/d3-path.v0.2.js docs/public/d3-path.v0.2.js
cp -v ./build/d3.github.com/d3-path.v0.2.min.js docs/public/d3-path.v0.2.min.js
cp -v ./build/d3.github.com/d3-path.v1.js docs/public/d3-path.v1.js
cp -v ./build/d3.github.com/d3-path.v1.min.js docs/public/d3-path.v1.min.js
cp -v ./build/d3.github.com/d3-path.v2.js docs/public/d3-path.v2.js
cp -v ./build/d3.github.com/d3-path.v2.min.js docs/public/d3-path.v2.min.js
cp -v ./build/d3.github.com/d3-path.v3.js docs/public/d3-path.v3.js
cp -v ./build/d3.github.com/d3-path.v3.min.js docs/public/d3-path.v3.min.js
cp -v ./build/d3.github.com/d3-polygon.v0.1.js docs/public/d3-polygon.v0.1.js
cp -v ./build/d3.github.com/d3-polygon.v0.1.min.js docs/public/d3-polygon.v0.1.min.js
cp -v ./build/d3.github.com/d3-polygon.v0.2.js docs/public/d3-polygon.v0.2.js
cp -v ./build/d3.github.com/d3-polygon.v0.2.min.js docs/public/d3-polygon.v0.2.min.js
cp -v ./build/d3.github.com/d3-polygon.v0.3.js docs/public/d3-polygon.v0.3.js
cp -v ./build/d3.github.com/d3-polygon.v0.3.min.js docs/public/d3-polygon.v0.3.min.js
cp -v ./build/d3.github.com/d3-polygon.v1.js docs/public/d3-polygon.v1.js
cp -v ./build/d3.github.com/d3-polygon.v1.min.js docs/public/d3-polygon.v1.min.js
cp -v ./build/d3.github.com/d3-polygon.v2.js docs/public/d3-polygon.v2.js
cp -v ./build/d3.github.com/d3-polygon.v2.min.js docs/public/d3-polygon.v2.min.js
cp -v ./build/d3.github.com/d3-polygon.v3.js docs/public/d3-polygon.v3.js
cp -v ./build/d3.github.com/d3-polygon.v3.min.js docs/public/d3-polygon.v3.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.1.js docs/public/d3-quadtree.v0.1.js
cp -v ./build/d3.github.com/d3-quadtree.v0.1.min.js docs/public/d3-quadtree.v0.1.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.2.js docs/public/d3-quadtree.v0.2.js
cp -v ./build/d3.github.com/d3-quadtree.v0.2.min.js docs/public/d3-quadtree.v0.2.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.3.js docs/public/d3-quadtree.v0.3.js
cp -v ./build/d3.github.com/d3-quadtree.v0.3.min.js docs/public/d3-quadtree.v0.3.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.4.js docs/public/d3-quadtree.v0.4.js
cp -v ./build/d3.github.com/d3-quadtree.v0.4.min.js docs/public/d3-quadtree.v0.4.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.5.js docs/public/d3-quadtree.v0.5.js
cp -v ./build/d3.github.com/d3-quadtree.v0.5.min.js docs/public/d3-quadtree.v0.5.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.6.js docs/public/d3-quadtree.v0.6.js
cp -v ./build/d3.github.com/d3-quadtree.v0.6.min.js docs/public/d3-quadtree.v0.6.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.7.js docs/public/d3-quadtree.v0.7.js
cp -v ./build/d3.github.com/d3-quadtree.v0.7.min.js docs/public/d3-quadtree.v0.7.min.js
cp -v ./build/d3.github.com/d3-quadtree.v0.8.js docs/public/d3-quadtree.v0.8.js
cp -v ./build/d3.github.com/d3-quadtree.v0.8.min.js docs/public/d3-quadtree.v0.8.min.js
cp -v ./build/d3.github.com/d3-quadtree.v1.js docs/public/d3-quadtree.v1.js
cp -v ./build/d3.github.com/d3-quadtree.v1.min.js docs/public/d3-quadtree.v1.min.js
cp -v ./build/d3.github.com/d3-quadtree.v2.js docs/public/d3-quadtree.v2.js
cp -v ./build/d3.github.com/d3-quadtree.v2.min.js docs/public/d3-quadtree.v2.min.js
cp -v ./build/d3.github.com/d3-quadtree.v3.js docs/public/d3-quadtree.v3.js
cp -v ./build/d3.github.com/d3-quadtree.v3.min.js docs/public/d3-quadtree.v3.min.js
cp -v ./build/d3.github.com/d3-queue.v1.js docs/public/d3-queue.v1.js
cp -v ./build/d3.github.com/d3-queue.v1.min.js docs/public/d3-queue.v1.min.js
cp -v ./build/d3.github.com/d3-queue.v2.js docs/public/d3-queue.v2.js
cp -v ./build/d3.github.com/d3-queue.v2.min.js docs/public/d3-queue.v2.min.js
cp -v ./build/d3.github.com/d3-queue.v3.js docs/public/d3-queue.v3.js
cp -v ./build/d3.github.com/d3-queue.v3.min.js docs/public/d3-queue.v3.min.js
cp -v ./build/d3.github.com/d3-random.v0.1.js docs/public/d3-random.v0.1.js
cp -v ./build/d3.github.com/d3-random.v0.1.min.js docs/public/d3-random.v0.1.min.js
cp -v ./build/d3.github.com/d3-random.v0.2.js docs/public/d3-random.v0.2.js
cp -v ./build/d3.github.com/d3-random.v0.2.min.js docs/public/d3-random.v0.2.min.js
cp -v ./build/d3.github.com/d3-random.v0.3.js docs/public/d3-random.v0.3.js
cp -v ./build/d3.github.com/d3-random.v0.3.min.js docs/public/d3-random.v0.3.min.js
cp -v ./build/d3.github.com/d3-random.v1.js docs/public/d3-random.v1.js
cp -v ./build/d3.github.com/d3-random.v1.min.js docs/public/d3-random.v1.min.js
cp -v ./build/d3.github.com/d3-random.v2.js docs/public/d3-random.v2.js
cp -v ./build/d3.github.com/d3-random.v2.min.js docs/public/d3-random.v2.min.js
cp -v ./build/d3.github.com/d3-random.v3.js docs/public/d3-random.v3.js
cp -v ./build/d3.github.com/d3-random.v3.min.js docs/public/d3-random.v3.min.js
cp -v ./build/d3.github.com/d3-request.v0.2.js docs/public/d3-request.v0.2.js
cp -v ./build/d3.github.com/d3-request.v0.2.min.js docs/public/d3-request.v0.2.min.js
cp -v ./build/d3.github.com/d3-request.v0.3.js docs/public/d3-request.v0.3.js
cp -v ./build/d3.github.com/d3-request.v0.3.min.js docs/public/d3-request.v0.3.min.js
cp -v ./build/d3.github.com/d3-request.v0.4.js docs/public/d3-request.v0.4.js
cp -v ./build/d3.github.com/d3-request.v0.4.min.js docs/public/d3-request.v0.4.min.js
cp -v ./build/d3.github.com/d3-request.v0.5.js docs/public/d3-request.v0.5.js
cp -v ./build/d3.github.com/d3-request.v0.5.min.js docs/public/d3-request.v0.5.min.js
cp -v ./build/d3.github.com/d3-request.v1.js docs/public/d3-request.v1.js
cp -v ./build/d3.github.com/d3-request.v1.min.js docs/public/d3-request.v1.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.0.js docs/public/d3-scale-chromatic.v0.0.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.0.min.js docs/public/d3-scale-chromatic.v0.0.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.1.js docs/public/d3-scale-chromatic.v0.1.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.1.min.js docs/public/d3-scale-chromatic.v0.1.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.2.js docs/public/d3-scale-chromatic.v0.2.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.2.min.js docs/public/d3-scale-chromatic.v0.2.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.3.js docs/public/d3-scale-chromatic.v0.3.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v0.3.min.js docs/public/d3-scale-chromatic.v0.3.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v1.js docs/public/d3-scale-chromatic.v1.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v1.min.js docs/public/d3-scale-chromatic.v1.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v2.js docs/public/d3-scale-chromatic.v2.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v2.min.js docs/public/d3-scale-chromatic.v2.min.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v3.js docs/public/d3-scale-chromatic.v3.js
cp -v ./build/d3.github.com/d3-scale-chromatic.v3.min.js docs/public/d3-scale-chromatic.v3.min.js
cp -v ./build/d3.github.com/d3-scale.v0.3.js docs/public/d3-scale.v0.3.js
cp -v ./build/d3.github.com/d3-scale.v0.3.min.js docs/public/d3-scale.v0.3.min.js
cp -v ./build/d3.github.com/d3-scale.v0.4.js docs/public/d3-scale.v0.4.js
cp -v ./build/d3.github.com/d3-scale.v0.4.min.js docs/public/d3-scale.v0.4.min.js
cp -v ./build/d3.github.com/d3-scale.v0.5.js docs/public/d3-scale.v0.5.js
cp -v ./build/d3.github.com/d3-scale.v0.5.min.js docs/public/d3-scale.v0.5.min.js
cp -v ./build/d3.github.com/d3-scale.v0.6.js docs/public/d3-scale.v0.6.js
cp -v ./build/d3.github.com/d3-scale.v0.6.min.js docs/public/d3-scale.v0.6.min.js
cp -v ./build/d3.github.com/d3-scale.v0.7.js docs/public/d3-scale.v0.7.js
cp -v ./build/d3.github.com/d3-scale.v0.7.min.js docs/public/d3-scale.v0.7.min.js
cp -v ./build/d3.github.com/d3-scale.v0.8.js docs/public/d3-scale.v0.8.js
cp -v ./build/d3.github.com/d3-scale.v0.8.min.js docs/public/d3-scale.v0.8.min.js
cp -v ./build/d3.github.com/d3-scale.v0.9.js docs/public/d3-scale.v0.9.js
cp -v ./build/d3.github.com/d3-scale.v0.9.min.js docs/public/d3-scale.v0.9.min.js
cp -v ./build/d3.github.com/d3-scale.v1.js docs/public/d3-scale.v1.js
cp -v ./build/d3.github.com/d3-scale.v1.min.js docs/public/d3-scale.v1.min.js
cp -v ./build/d3.github.com/d3-scale.v2.js docs/public/d3-scale.v2.js
cp -v ./build/d3.github.com/d3-scale.v2.min.js docs/public/d3-scale.v2.min.js
cp -v ./build/d3.github.com/d3-scale.v3.js docs/public/d3-scale.v3.js
cp -v ./build/d3.github.com/d3-scale.v3.min.js docs/public/d3-scale.v3.min.js
cp -v ./build/d3.github.com/d3-scale.v4.js docs/public/d3-scale.v4.js
cp -v ./build/d3.github.com/d3-scale.v4.min.js docs/public/d3-scale.v4.min.js
cp -v ./build/d3.github.com/d3-selection-multi.v0.2.js docs/public/d3-selection-multi.v0.2.js
cp -v ./build/d3.github.com/d3-selection-multi.v0.2.min.js docs/public/d3-selection-multi.v0.2.min.js
cp -v ./build/d3.github.com/d3-selection-multi.v0.3.js docs/public/d3-selection-multi.v0.3.js
cp -v ./build/d3.github.com/d3-selection-multi.v0.3.min.js docs/public/d3-selection-multi.v0.3.min.js
cp -v ./build/d3.github.com/d3-selection-multi.v0.4.js docs/public/d3-selection-multi.v0.4.js
cp -v ./build/d3.github.com/d3-selection-multi.v0.4.min.js docs/public/d3-selection-multi.v0.4.min.js
cp -v ./build/d3.github.com/d3-selection-multi.v1.js docs/public/d3-selection-multi.v1.js
cp -v ./build/d3.github.com/d3-selection-multi.v1.min.js docs/public/d3-selection-multi.v1.min.js
cp -v ./build/d3.github.com/d3-selection.v0.5.js docs/public/d3-selection.v0.5.js
cp -v ./build/d3.github.com/d3-selection.v0.5.min.js docs/public/d3-selection.v0.5.min.js
cp -v ./build/d3.github.com/d3-selection.v0.6.js docs/public/d3-selection.v0.6.js
cp -v ./build/d3.github.com/d3-selection.v0.6.min.js docs/public/d3-selection.v0.6.min.js
cp -v ./build/d3.github.com/d3-selection.v0.7.js docs/public/d3-selection.v0.7.js
cp -v ./build/d3.github.com/d3-selection.v0.7.min.js docs/public/d3-selection.v0.7.min.js
cp -v ./build/d3.github.com/d3-selection.v0.8.js docs/public/d3-selection.v0.8.js
cp -v ./build/d3.github.com/d3-selection.v0.8.min.js docs/public/d3-selection.v0.8.min.js
cp -v ./build/d3.github.com/d3-selection.v0.9.js docs/public/d3-selection.v0.9.js
cp -v ./build/d3.github.com/d3-selection.v0.9.min.js docs/public/d3-selection.v0.9.min.js
cp -v ./build/d3.github.com/d3-selection.v1.js docs/public/d3-selection.v1.js
cp -v ./build/d3.github.com/d3-selection.v1.min.js docs/public/d3-selection.v1.min.js
cp -v ./build/d3.github.com/d3-selection.v2.js docs/public/d3-selection.v2.js
cp -v ./build/d3.github.com/d3-selection.v2.min.js docs/public/d3-selection.v2.min.js
cp -v ./build/d3.github.com/d3-selection.v3.js docs/public/d3-selection.v3.js
cp -v ./build/d3.github.com/d3-selection.v3.min.js docs/public/d3-selection.v3.min.js
cp -v ./build/d3.github.com/d3-shape.v0.2.js docs/public/d3-shape.v0.2.js
cp -v ./build/d3.github.com/d3-shape.v0.2.min.js docs/public/d3-shape.v0.2.min.js
cp -v ./build/d3.github.com/d3-shape.v0.3.js docs/public/d3-shape.v0.3.js
cp -v ./build/d3.github.com/d3-shape.v0.3.min.js docs/public/d3-shape.v0.3.min.js
cp -v ./build/d3.github.com/d3-shape.v0.4.js docs/public/d3-shape.v0.4.js
cp -v ./build/d3.github.com/d3-shape.v0.4.min.js docs/public/d3-shape.v0.4.min.js
cp -v ./build/d3.github.com/d3-shape.v0.5.js docs/public/d3-shape.v0.5.js
cp -v ./build/d3.github.com/d3-shape.v0.5.min.js docs/public/d3-shape.v0.5.min.js
cp -v ./build/d3.github.com/d3-shape.v0.6.js docs/public/d3-shape.v0.6.js
cp -v ./build/d3.github.com/d3-shape.v0.6.min.js docs/public/d3-shape.v0.6.min.js
cp -v ./build/d3.github.com/d3-shape.v0.7.js docs/public/d3-shape.v0.7.js
cp -v ./build/d3.github.com/d3-shape.v0.7.min.js docs/public/d3-shape.v0.7.min.js
cp -v ./build/d3.github.com/d3-shape.v1.js docs/public/d3-shape.v1.js
cp -v ./build/d3.github.com/d3-shape.v1.min.js docs/public/d3-shape.v1.min.js
cp -v ./build/d3.github.com/d3-shape.v2.js docs/public/d3-shape.v2.js
cp -v ./build/d3.github.com/d3-shape.v2.min.js docs/public/d3-shape.v2.min.js
cp -v ./build/d3.github.com/d3-shape.v3.js docs/public/d3-shape.v3.js
cp -v ./build/d3.github.com/d3-shape.v3.min.js docs/public/d3-shape.v3.min.js
cp -v ./build/d3.github.com/d3-tile.v0.0.js docs/public/d3-tile.v0.0.js
cp -v ./build/d3.github.com/d3-tile.v0.0.min.js docs/public/d3-tile.v0.0.min.js
cp -v ./build/d3.github.com/d3-time-format.v0.2.js docs/public/d3-time-format.v0.2.js
cp -v ./build/d3.github.com/d3-time-format.v0.2.min.js docs/public/d3-time-format.v0.2.min.js
cp -v ./build/d3.github.com/d3-time-format.v0.3.js docs/public/d3-time-format.v0.3.js
cp -v ./build/d3.github.com/d3-time-format.v0.3.min.js docs/public/d3-time-format.v0.3.min.js
cp -v ./build/d3.github.com/d3-time-format.v0.4.js docs/public/d3-time-format.v0.4.js
cp -v ./build/d3.github.com/d3-time-format.v0.4.min.js docs/public/d3-time-format.v0.4.min.js
cp -v ./build/d3.github.com/d3-time-format.v1.js docs/public/d3-time-format.v1.js
cp -v ./build/d3.github.com/d3-time-format.v1.min.js docs/public/d3-time-format.v1.min.js
cp -v ./build/d3.github.com/d3-time-format.v2.js docs/public/d3-time-format.v2.js
cp -v ./build/d3.github.com/d3-time-format.v2.min.js docs/public/d3-time-format.v2.min.js
cp -v ./build/d3.github.com/d3-time-format.v3.js docs/public/d3-time-format.v3.js
cp -v ./build/d3.github.com/d3-time-format.v3.min.js docs/public/d3-time-format.v3.min.js
cp -v ./build/d3.github.com/d3-time-format.v4.js docs/public/d3-time-format.v4.js
cp -v ./build/d3.github.com/d3-time-format.v4.min.js docs/public/d3-time-format.v4.min.js
cp -v ./build/d3.github.com/d3-time.v0.1.js docs/public/d3-time.v0.1.js
cp -v ./build/d3.github.com/d3-time.v0.1.min.js docs/public/d3-time.v0.1.min.js
cp -v ./build/d3.github.com/d3-time.v0.2.js docs/public/d3-time.v0.2.js
cp -v ./build/d3.github.com/d3-time.v0.2.min.js docs/public/d3-time.v0.2.min.js
cp -v ./build/d3.github.com/d3-time.v0.3.js docs/public/d3-time.v0.3.js
cp -v ./build/d3.github.com/d3-time.v0.3.min.js docs/public/d3-time.v0.3.min.js
cp -v ./build/d3.github.com/d3-time.v1.js docs/public/d3-time.v1.js
cp -v ./build/d3.github.com/d3-time.v1.min.js docs/public/d3-time.v1.min.js
cp -v ./build/d3.github.com/d3-time.v2.js docs/public/d3-time.v2.js
cp -v ./build/d3.github.com/d3-time.v2.min.js docs/public/d3-time.v2.min.js
cp -v ./build/d3.github.com/d3-time.v3.js docs/public/d3-time.v3.js
cp -v ./build/d3.github.com/d3-time.v3.min.js docs/public/d3-time.v3.min.js
cp -v ./build/d3.github.com/d3-timer.v0.1.js docs/public/d3-timer.v0.1.js
cp -v ./build/d3.github.com/d3-timer.v0.1.min.js docs/public/d3-timer.v0.1.min.js
cp -v ./build/d3.github.com/d3-timer.v0.2.js docs/public/d3-timer.v0.2.js
cp -v ./build/d3.github.com/d3-timer.v0.2.min.js docs/public/d3-timer.v0.2.min.js
cp -v ./build/d3.github.com/d3-timer.v0.3.js docs/public/d3-timer.v0.3.js
cp -v ./build/d3.github.com/d3-timer.v0.3.min.js docs/public/d3-timer.v0.3.min.js
cp -v ./build/d3.github.com/d3-timer.v0.4.js docs/public/d3-timer.v0.4.js
cp -v ./build/d3.github.com/d3-timer.v0.4.min.js docs/public/d3-timer.v0.4.min.js
cp -v ./build/d3.github.com/d3-timer.v0.5.js docs/public/d3-timer.v0.5.js
cp -v ./build/d3.github.com/d3-timer.v0.5.min.js docs/public/d3-timer.v0.5.min.js
cp -v ./build/d3.github.com/d3-timer.v1.js docs/public/d3-timer.v1.js
cp -v ./build/d3.github.com/d3-timer.v1.min.js docs/public/d3-timer.v1.min.js
cp -v ./build/d3.github.com/d3-timer.v2.js docs/public/d3-timer.v2.js
cp -v ./build/d3.github.com/d3-timer.v2.min.js docs/public/d3-timer.v2.min.js
cp -v ./build/d3.github.com/d3-timer.v3.js docs/public/d3-timer.v3.js
cp -v ./build/d3.github.com/d3-timer.v3.min.js docs/public/d3-timer.v3.min.js
cp -v ./build/d3.github.com/d3-transition.v0.0.js docs/public/d3-transition.v0.0.js
cp -v ./build/d3.github.com/d3-transition.v0.0.min.js docs/public/d3-transition.v0.0.min.js
cp -v ./build/d3.github.com/d3-transition.v0.1.js docs/public/d3-transition.v0.1.js
cp -v ./build/d3.github.com/d3-transition.v0.1.min.js docs/public/d3-transition.v0.1.min.js
cp -v ./build/d3.github.com/d3-transition.v0.2.js docs/public/d3-transition.v0.2.js
cp -v ./build/d3.github.com/d3-transition.v0.2.min.js docs/public/d3-transition.v0.2.min.js
cp -v ./build/d3.github.com/d3-transition.v0.3.js docs/public/d3-transition.v0.3.js
cp -v ./build/d3.github.com/d3-transition.v0.3.min.js docs/public/d3-transition.v0.3.min.js
cp -v ./build/d3.github.com/d3-transition.v1.js docs/public/d3-transition.v1.js
cp -v ./build/d3.github.com/d3-transition.v1.min.js docs/public/d3-transition.v1.min.js
cp -v ./build/d3.github.com/d3-transition.v2.js docs/public/d3-transition.v2.js
cp -v ./build/d3.github.com/d3-transition.v2.min.js docs/public/d3-transition.v2.min.js
cp -v ./build/d3.github.com/d3-transition.v3.js docs/public/d3-transition.v3.js
cp -v ./build/d3.github.com/d3-transition.v3.min.js docs/public/d3-transition.v3.min.js
cp -v ./build/d3.github.com/d3-voronoi.v0.1.js docs/public/d3-voronoi.v0.1.js
cp -v ./build/d3.github.com/d3-voronoi.v0.1.min.js docs/public/d3-voronoi.v0.1.min.js
cp -v ./build/d3.github.com/d3-voronoi.v0.2.js docs/public/d3-voronoi.v0.2.js
cp -v ./build/d3.github.com/d3-voronoi.v0.2.min.js docs/public/d3-voronoi.v0.2.min.js
cp -v ./build/d3.github.com/d3-voronoi.v0.3.js docs/public/d3-voronoi.v0.3.js
cp -v ./build/d3.github.com/d3-voronoi.v0.3.min.js docs/public/d3-voronoi.v0.3.min.js
cp -v ./build/d3.github.com/d3-voronoi.v0.4.js docs/public/d3-voronoi.v0.4.js
cp -v ./build/d3.github.com/d3-voronoi.v0.4.min.js docs/public/d3-voronoi.v0.4.min.js
cp -v ./build/d3.github.com/d3-voronoi.v1.js docs/public/d3-voronoi.v1.js
cp -v ./build/d3.github.com/d3-voronoi.v1.min.js docs/public/d3-voronoi.v1.min.js
cp -v ./build/d3.github.com/d3-zoom.v0.0.js docs/public/d3-zoom.v0.0.js
cp -v ./build/d3.github.com/d3-zoom.v0.0.min.js docs/public/d3-zoom.v0.0.min.js
cp -v ./build/d3.github.com/d3-zoom.v0.1.js docs/public/d3-zoom.v0.1.js
cp -v ./build/d3.github.com/d3-zoom.v0.1.min.js docs/public/d3-zoom.v0.1.min.js
cp -v ./build/d3.github.com/d3-zoom.v0.2.js docs/public/d3-zoom.v0.2.js
cp -v ./build/d3.github.com/d3-zoom.v0.2.min.js docs/public/d3-zoom.v0.2.min.js
cp -v ./build/d3.github.com/d3-zoom.v0.3.js docs/public/d3-zoom.v0.3.js
cp -v ./build/d3.github.com/d3-zoom.v0.3.min.js docs/public/d3-zoom.v0.3.min.js
cp -v ./build/d3.github.com/d3-zoom.v1.js docs/public/d3-zoom.v1.js
cp -v ./build/d3.github.com/d3-zoom.v1.min.js docs/public/d3-zoom.v1.min.js
cp -v ./build/d3.github.com/d3-zoom.v2.js docs/public/d3-zoom.v2.js
cp -v ./build/d3.github.com/d3-zoom.v2.min.js docs/public/d3-zoom.v2.min.js
cp -v ./build/d3.github.com/d3-zoom.v3.js docs/public/d3-zoom.v3.js
cp -v ./build/d3.github.com/d3-zoom.v3.min.js docs/public/d3-zoom.v3.min.js
cp -v ./build/d3.github.com/d3.geo.polyhedron.v0.js docs/public/d3.geo.polyhedron.v0.js
cp -v ./build/d3.github.com/d3.geo.polyhedron.v0.min.js docs/public/d3.geo.polyhedron.v0.min.js
cp -v ./build/d3.github.com/d3.geo.projection.v0.js docs/public/d3.geo.projection.v0.js
cp -v ./build/d3.github.com/d3.geo.projection.v0.min.js docs/public/d3.geo.projection.v0.min.js
cp -v ./build/d3.github.com/d3.geo.tile.v0.js docs/public/d3.geo.tile.v0.js
cp -v ./build/d3.github.com/d3.geo.tile.v0.min.js docs/public/d3.geo.tile.v0.min.js
cp -v ./build/d3.github.com/d3.geodesic.v0.js docs/public/d3.geodesic.v0.js
cp -v ./build/d3.github.com/d3.geodesic.v0.min.js docs/public/d3.geodesic.v0.min.js
cp -v ./build/d3.github.com/d3.geom.contour.v0.js docs/public/d3.geom.contour.v0.js
cp -v ./build/d3.github.com/d3.geom.contour.v0.min.js docs/public/d3.geom.contour.v0.min.js
cp -v ./build/d3.github.com/d3.hexbin.v0.js docs/public/d3.hexbin.v0.js
cp -v ./build/d3.github.com/d3.hexbin.v0.min.js docs/public/d3.hexbin.v0.min.js
cp -v ./build/d3.github.com/d3.hive.v0.js docs/public/d3.hive.v0.js
cp -v ./build/d3.github.com/d3.hive.v0.min.js docs/public/d3.hive.v0.min.js
cp -v ./build/d3.github.com/d3.interpolate-zoom.v0.js docs/public/d3.interpolate-zoom.v0.js
cp -v ./build/d3.github.com/d3.interpolate-zoom.v0.min.js docs/public/d3.interpolate-zoom.v0.min.js
cp -v ./build/d3.github.com/d3.qq.v0.js docs/public/d3.qq.v0.js
cp -v ./build/d3.github.com/d3.qq.v0.min.js docs/public/d3.qq.v0.min.js
cp -v ./build/d3.github.com/d3.rollup.v0.js docs/public/d3.rollup.v0.js
cp -v ./build/d3.github.com/d3.rollup.v0.min.js docs/public/d3.rollup.v0.min.js
cp -v ./build/d3.github.com/d3.superformula.v0.js docs/public/d3.superformula.v0.js
cp -v ./build/d3.github.com/d3.superformula.v0.min.js docs/public/d3.superformula.v0.min.js
cp -v ./build/d3.github.com/d3.v2.js docs/public/d3.v2.js
cp -v ./build/d3.github.com/d3.v2.min.js docs/public/d3.v2.min.js
cp -v ./build/d3.github.com/d3.v3.js docs/public/d3.v3.js
cp -v ./build/d3.github.com/d3.v3.min.js docs/public/d3.v3.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.1.js docs/public/d3.v4.0.0-alpha.1.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.1.min.js docs/public/d3.v4.0.0-alpha.1.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.10.js docs/public/d3.v4.0.0-alpha.10.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.10.min.js docs/public/d3.v4.0.0-alpha.10.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.11.js docs/public/d3.v4.0.0-alpha.11.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.11.min.js docs/public/d3.v4.0.0-alpha.11.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.12.js docs/public/d3.v4.0.0-alpha.12.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.12.min.js docs/public/d3.v4.0.0-alpha.12.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.13.js docs/public/d3.v4.0.0-alpha.13.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.13.min.js docs/public/d3.v4.0.0-alpha.13.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.14.js docs/public/d3.v4.0.0-alpha.14.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.14.min.js docs/public/d3.v4.0.0-alpha.14.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.15.js docs/public/d3.v4.0.0-alpha.15.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.15.min.js docs/public/d3.v4.0.0-alpha.15.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.16.js docs/public/d3.v4.0.0-alpha.16.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.16.min.js docs/public/d3.v4.0.0-alpha.16.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.17.js docs/public/d3.v4.0.0-alpha.17.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.17.min.js docs/public/d3.v4.0.0-alpha.17.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.18.js docs/public/d3.v4.0.0-alpha.18.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.18.min.js docs/public/d3.v4.0.0-alpha.18.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.19.js docs/public/d3.v4.0.0-alpha.19.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.19.min.js docs/public/d3.v4.0.0-alpha.19.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.2.js docs/public/d3.v4.0.0-alpha.2.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.2.min.js docs/public/d3.v4.0.0-alpha.2.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.20.js docs/public/d3.v4.0.0-alpha.20.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.20.min.js docs/public/d3.v4.0.0-alpha.20.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.21.js docs/public/d3.v4.0.0-alpha.21.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.21.min.js docs/public/d3.v4.0.0-alpha.21.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.22.js docs/public/d3.v4.0.0-alpha.22.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.22.min.js docs/public/d3.v4.0.0-alpha.22.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.23.js docs/public/d3.v4.0.0-alpha.23.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.23.min.js docs/public/d3.v4.0.0-alpha.23.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.24.js docs/public/d3.v4.0.0-alpha.24.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.24.min.js docs/public/d3.v4.0.0-alpha.24.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.26.js docs/public/d3.v4.0.0-alpha.26.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.26.min.js docs/public/d3.v4.0.0-alpha.26.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.27.js docs/public/d3.v4.0.0-alpha.27.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.27.min.js docs/public/d3.v4.0.0-alpha.27.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.28.js docs/public/d3.v4.0.0-alpha.28.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.28.min.js docs/public/d3.v4.0.0-alpha.28.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.29.js docs/public/d3.v4.0.0-alpha.29.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.29.min.js docs/public/d3.v4.0.0-alpha.29.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.3.js docs/public/d3.v4.0.0-alpha.3.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.3.min.js docs/public/d3.v4.0.0-alpha.3.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.30.js docs/public/d3.v4.0.0-alpha.30.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.30.min.js docs/public/d3.v4.0.0-alpha.30.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.31.js docs/public/d3.v4.0.0-alpha.31.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.31.min.js docs/public/d3.v4.0.0-alpha.31.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.32.js docs/public/d3.v4.0.0-alpha.32.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.32.min.js docs/public/d3.v4.0.0-alpha.32.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.33.js docs/public/d3.v4.0.0-alpha.33.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.33.min.js docs/public/d3.v4.0.0-alpha.33.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.34.js docs/public/d3.v4.0.0-alpha.34.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.34.min.js docs/public/d3.v4.0.0-alpha.34.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.35.js docs/public/d3.v4.0.0-alpha.35.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.35.min.js docs/public/d3.v4.0.0-alpha.35.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.36.js docs/public/d3.v4.0.0-alpha.36.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.36.min.js docs/public/d3.v4.0.0-alpha.36.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.37.js docs/public/d3.v4.0.0-alpha.37.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.37.min.js docs/public/d3.v4.0.0-alpha.37.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.38.js docs/public/d3.v4.0.0-alpha.38.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.38.min.js docs/public/d3.v4.0.0-alpha.38.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.39.js docs/public/d3.v4.0.0-alpha.39.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.39.min.js docs/public/d3.v4.0.0-alpha.39.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.4.js docs/public/d3.v4.0.0-alpha.4.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.4.min.js docs/public/d3.v4.0.0-alpha.4.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.40.js docs/public/d3.v4.0.0-alpha.40.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.40.min.js docs/public/d3.v4.0.0-alpha.40.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.41.js docs/public/d3.v4.0.0-alpha.41.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.41.min.js docs/public/d3.v4.0.0-alpha.41.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.42.js docs/public/d3.v4.0.0-alpha.42.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.42.min.js docs/public/d3.v4.0.0-alpha.42.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.43.js docs/public/d3.v4.0.0-alpha.43.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.43.min.js docs/public/d3.v4.0.0-alpha.43.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.44.js docs/public/d3.v4.0.0-alpha.44.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.44.min.js docs/public/d3.v4.0.0-alpha.44.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.45.js docs/public/d3.v4.0.0-alpha.45.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.45.min.js docs/public/d3.v4.0.0-alpha.45.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.46.js docs/public/d3.v4.0.0-alpha.46.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.46.min.js docs/public/d3.v4.0.0-alpha.46.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.47.js docs/public/d3.v4.0.0-alpha.47.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.47.min.js docs/public/d3.v4.0.0-alpha.47.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.48.js docs/public/d3.v4.0.0-alpha.48.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.48.min.js docs/public/d3.v4.0.0-alpha.48.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.49.js docs/public/d3.v4.0.0-alpha.49.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.49.min.js docs/public/d3.v4.0.0-alpha.49.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.5.js docs/public/d3.v4.0.0-alpha.5.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.5.min.js docs/public/d3.v4.0.0-alpha.5.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.50.js docs/public/d3.v4.0.0-alpha.50.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.50.min.js docs/public/d3.v4.0.0-alpha.50.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.6.js docs/public/d3.v4.0.0-alpha.6.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.6.min.js docs/public/d3.v4.0.0-alpha.6.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.7.js docs/public/d3.v4.0.0-alpha.7.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.7.min.js docs/public/d3.v4.0.0-alpha.7.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.8.js docs/public/d3.v4.0.0-alpha.8.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.8.min.js docs/public/d3.v4.0.0-alpha.8.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.9.js docs/public/d3.v4.0.0-alpha.9.js
cp -v ./build/d3.github.com/d3.v4.0.0-alpha.9.min.js docs/public/d3.v4.0.0-alpha.9.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-rc.1.js docs/public/d3.v4.0.0-rc.1.js
cp -v ./build/d3.github.com/d3.v4.0.0-rc.1.min.js docs/public/d3.v4.0.0-rc.1.min.js
cp -v ./build/d3.github.com/d3.v4.0.0-rc.2.js docs/public/d3.v4.0.0-rc.2.js
cp -v ./build/d3.github.com/d3.v4.0.0-rc.2.min.js docs/public/d3.v4.0.0-rc.2.min.js
cp -v ./build/d3.github.com/d3.v4.js docs/public/d3.v4.js
cp -v ./build/d3.github.com/d3.v4.min.js docs/public/d3.v4.min.js
cp -v ./build/d3.github.com/d3.v5.js docs/public/d3.v5.js
cp -v ./build/d3.github.com/d3.v5.min.js docs/public/d3.v5.min.js
cp -v ./build/d3.github.com/d3.v6.js docs/public/d3.v6.js
cp -v ./build/d3.github.com/d3.v6.min.js docs/public/d3.v6.min.js
cp -v ./build/d3.github.com/highlight.v0.min.js docs/public/highlight.v0.min.js
cp -v ./build/d3.github.com/highlight.v9.min.js docs/public/highlight.v9.min.js
cp -v ./build/d3.github.com/queue.v1.js docs/public/queue.v1.js
cp -v ./build/d3.github.com/queue.v1.min.js docs/public/queue.v1.min.js
cp -v ./build/d3.github.com/topojson.v0.js docs/public/topojson.v0.js
cp -v ./build/d3.github.com/topojson.v0.min.js docs/public/topojson.v0.min.js
cp -v ./build/d3.github.com/topojson.v1.js docs/public/topojson.v1.js
cp -v ./build/d3.github.com/topojson.v1.min.js docs/public/topojson.v1.min.js
cp -v ./build/d3.github.com/topojson.v2.js docs/public/topojson.v2.js
cp -v ./build/d3.github.com/topojson.v2.min.js docs/public/topojson.v2.min.js
cp -v ./build/d3.github.com/topojson.v3.js docs/public/topojson.v3.js
cp -v ./build/d3.github.com/topojson.v3.min.js docs/public/topojson.v3.min.js
cp -v ./build/d3.github.com/us-10m.v0.json docs/public/us-10m.v0.json
cp -v ./build/d3.github.com/us-10m.v1.json docs/public/us-10m.v1.json
cp -v ./build/d3.github.com/us-10m.v2.json docs/public/us-10m.v2.json
cp -v ./build/d3.github.com/world-110m.v1.json docs/public/world-110m.v1.json
cp -v ./build/d3.github.com/world-110m.v1.tsv docs/public/world-110m.v1.tsv
cp -v ./build/d3.github.com/world-50m.v1.json docs/public/world-50m.v1.json
cp -v ./build/d3.github.com/world-50m.v1.tsv docs/public/world-50m.v1.tsv

cp -v ./dist/d3.js docs/public/d3.v7.js
cp -v ./dist/d3.min.js docs/public/d3.v7.min.js

cp -v ./node_modules/d3-array/dist/d3-array.js docs/public/d3-array.v3.js
cp -v ./node_modules/d3-array/dist/d3-array.min.js docs/public/d3-array.v3.min.js
cp -v ./node_modules/d3-axis/dist/d3-axis.js docs/public/d3-axis.v3.js
cp -v ./node_modules/d3-axis/dist/d3-axis.min.js docs/public/d3-axis.v3.min.js
cp -v ./node_modules/d3-brush/dist/d3-brush.js docs/public/d3-brush.v3.js
cp -v ./node_modules/d3-brush/dist/d3-brush.min.js docs/public/d3-brush.v3.min.js
cp -v ./node_modules/d3-chord/dist/d3-chord.js docs/public/d3-chord.v3.js
cp -v ./node_modules/d3-chord/dist/d3-chord.min.js docs/public/d3-chord.v3.min.js
cp -v ./node_modules/d3-color/dist/d3-color.js docs/public/d3-color.v3.js
cp -v ./node_modules/d3-color/dist/d3-color.min.js docs/public/d3-color.v3.min.js
cp -v ./node_modules/d3-contour/dist/d3-contour.js docs/public/d3-contour.v4.js
cp -v ./node_modules/d3-contour/dist/d3-contour.min.js docs/public/d3-contour.v4.min.js
cp -v ./node_modules/d3-delaunay/dist/d3-delaunay.js docs/public/d3-delaunay.v6.js
cp -v ./node_modules/d3-delaunay/dist/d3-delaunay.min.js docs/public/d3-delaunay.v6.min.js
cp -v ./node_modules/d3-dispatch/dist/d3-dispatch.js docs/public/d3-dispatch.v3.js
cp -v ./node_modules/d3-dispatch/dist/d3-dispatch.min.js docs/public/d3-dispatch.v3.min.js
cp -v ./node_modules/d3-drag/dist/d3-drag.js docs/public/d3-drag.v3.js
cp -v ./node_modules/d3-drag/dist/d3-drag.min.js docs/public/d3-drag.v3.min.js
cp -v ./node_modules/d3-dsv/dist/d3-dsv.js docs/public/d3-dsv.v3.js
cp -v ./node_modules/d3-dsv/dist/d3-dsv.min.js docs/public/d3-dsv.v3.min.js
cp -v ./node_modules/d3-ease/dist/d3-ease.js docs/public/d3-ease.v3.js
cp -v ./node_modules/d3-ease/dist/d3-ease.min.js docs/public/d3-ease.v3.min.js
cp -v ./node_modules/d3-fetch/dist/d3-fetch.js docs/public/d3-fetch.v3.js
cp -v ./node_modules/d3-fetch/dist/d3-fetch.min.js docs/public/d3-fetch.v3.min.js
cp -v ./node_modules/d3-force/dist/d3-force.js docs/public/d3-force.v3.js
cp -v ./node_modules/d3-force/dist/d3-force.min.js docs/public/d3-force.v3.min.js
cp -v ./node_modules/d3-format/dist/d3-format.js docs/public/d3-format.v3.js
cp -v ./node_modules/d3-format/dist/d3-format.min.js docs/public/d3-format.v3.min.js
cp -v ./node_modules/d3-geo/dist/d3-geo.js docs/public/d3-geo.v3.js
cp -v ./node_modules/d3-geo/dist/d3-geo.min.js docs/public/d3-geo.v3.min.js
cp -v ./node_modules/d3-hierarchy/dist/d3-hierarchy.js docs/public/d3-hierarchy.v3.js
cp -v ./node_modules/d3-hierarchy/dist/d3-hierarchy.min.js docs/public/d3-hierarchy.v3.min.js
cp -v ./node_modules/d3-interpolate/dist/d3-interpolate.js docs/public/d3-interpolate.v3.js
cp -v ./node_modules/d3-interpolate/dist/d3-interpolate.min.js docs/public/d3-interpolate.v3.min.js
cp -v ./node_modules/d3-path/dist/d3-path.js docs/public/d3-path.v3.js
cp -v ./node_modules/d3-path/dist/d3-path.min.js docs/public/d3-path.v3.min.js
cp -v ./node_modules/d3-polygon/dist/d3-polygon.js docs/public/d3-polygon.v3.js
cp -v ./node_modules/d3-polygon/dist/d3-polygon.min.js docs/public/d3-polygon.v3.min.js
cp -v ./node_modules/d3-quadtree/dist/d3-quadtree.js docs/public/d3-quadtree.v3.js
cp -v ./node_modules/d3-quadtree/dist/d3-quadtree.min.js docs/public/d3-quadtree.v3.min.js
cp -v ./node_modules/d3-random/dist/d3-random.js docs/public/d3-random.v3.js
cp -v ./node_modules/d3-random/dist/d3-random.min.js docs/public/d3-random.v3.min.js
cp -v ./node_modules/d3-scale-chromatic/dist/d3-scale-chromatic.js docs/public/d3-scale-chromatic.v3.js
cp -v ./node_modules/d3-scale-chromatic/dist/d3-scale-chromatic.min.js docs/public/d3-scale-chromatic.v3.min.js
cp -v ./node_modules/d3-scale/dist/d3-scale.js docs/public/d3-scale.v4.js
cp -v ./node_modules/d3-scale/dist/d3-scale.min.js docs/public/d3-scale.v4.min.js
cp -v ./node_modules/d3-selection/dist/d3-selection.js docs/public/d3-selection.v3.js
cp -v ./node_modules/d3-selection/dist/d3-selection.min.js docs/public/d3-selection.v3.min.js
cp -v ./node_modules/d3-shape/dist/d3-shape.js docs/public/d3-shape.v3.js
cp -v ./node_modules/d3-shape/dist/d3-shape.min.js docs/public/d3-shape.v3.min.js
cp -v ./node_modules/d3-time-format/dist/d3-time-format.js docs/public/d3-time-format.v4.js
cp -v ./node_modules/d3-time-format/dist/d3-time-format.min.js docs/public/d3-time-format.v4.min.js
cp -v ./node_modules/d3-time/dist/d3-time.js docs/public/d3-time.v3.js
cp -v ./node_modules/d3-time/dist/d3-time.min.js docs/public/d3-time.v3.min.js
cp -v ./node_modules/d3-timer/dist/d3-timer.js docs/public/d3-timer.v3.js
cp -v ./node_modules/d3-timer/dist/d3-timer.min.js docs/public/d3-timer.v3.min.js
cp -v ./node_modules/d3-transition/dist/d3-transition.js docs/public/d3-transition.v3.js
cp -v ./node_modules/d3-transition/dist/d3-transition.min.js docs/public/d3-transition.v3.min.js
cp -v ./node_modules/d3-zoom/dist/d3-zoom.js docs/public/d3-zoom.v3.js
cp -v ./node_modules/d3-zoom/dist/d3-zoom.min.js docs/public/d3-zoom.v3.min.js



================================================
FILE: rollup.config.js
================================================
import {readFileSync} from "fs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import meta from "./package.json" assert {type: "json"};

// Extract copyrights from the LICENSE.
const copyright = readFileSync("./LICENSE", "utf-8")
  .split(/\n/g)
  .filter(line => /^Copyright\s+/.test(line))
  .map(line => line.replace(/^Copyright\s+/, ""))
  .join(", ");

const config = {
  input: "bundle.js",
  output: {
    file: `dist/${meta.name}.js`,
    name: "d3",
    format: "umd",
    indent: false,
    extend: true,
    banner: `// ${meta.homepage} v${meta.version} Copyright ${copyright}`
  },
  plugins: [
    nodeResolve(),
    json()
  ],
  onwarn(message, warn) {
    if (message.code === "CIRCULAR_DEPENDENCY") return;
    warn(message);
  }
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: `dist/${meta.name}.mjs`,
      format: "esm"
    }
  },
  {
    ...config,
    output: {
      ...config.output,
      file: `dist/${meta.name}.min.js`
    },
    plugins: [
      ...config.plugins,
      terser({
        output: {
          preamble: config.output.banner
        },
        mangle: {
          reserved: [
            "InternMap",
            "InternSet"
          ]
        }
      })
    ]
  }
];



================================================
FILE: .eslintrc.json
================================================
{
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 8
  }
}



================================================
FILE: docs/api.md
================================================
---
next: false
outline: 2
---

# API index

D3 is a collection of modules that are designed to work together; you can use the modules independently, or you can use them together as part of the default build.

## [d3-array](./d3-array.md)

Array manipulation, ordering, searching, summarizing, *etc.*

### [Add](./d3-array/add.md)

Add floating point values with full precision.

* [new Adder](./d3-array/add.md#Adder) - create a full precision adder.
* [*adder*.add](./d3-array/add.md#adder_add) - add a value to an adder.
* [*adder*.valueOf](./d3-array/add.md#adder_valueOf) - get the double-precision representation of an adder’s value.
* [fcumsum](./d3-array/add.md#fcumsum) - compute a full precision cumulative summation of numbers.
* [fsum](./d3-array/add.md#fsum) - compute a full precision summation of an iterable of numbers.

### [Bin](./d3-array/bin.md)

Bin discrete samples into continuous, non-overlapping intervals.

* [bin](./d3-array/bin.md#bin) - create a new bin generator.
* [*bin*](./d3-array/bin.md#_bin) - bins a given array of samples.
* [*bin*.value](./d3-array/bin.md#bin_value) - specify a value accessor for each sample.
* [*bin*.domain](./d3-array/bin.md#bin_domain) - specify the interval of observable values.
* [*bin*.thresholds](./d3-array/bin.md#bin_thresholds) - specify how values are divided into bins.
* [thresholdFreedmanDiaconis](./d3-array/bin.md#thresholdFreedmanDiaconis) - the Freedman–Diaconis binning rule.
* [thresholdScott](./d3-array/bin.md#thresholdScott) - Scott’s normal reference binning rule.
* [thresholdSturges](./d3-array/bin.md#thresholdSturges) - Sturges’ binning formula.

### [Bisect](./d3-array/bisect.md)

Quickly find a value in a sorted array.

* [bisector](./d3-array/bisect.md#bisector) - bisect using an accessor or comparator.
* [*bisector*.right](./d3-array/bisect.md#bisector_right) - bisectRight, with the given comparator.
* [*bisector*.left](./d3-array/bisect.md#bisector_left) - bisectLeft, with the given comparator.
* [*bisector*.center](./d3-array/bisect.md#bisector_center) - binary search for a value in a sorted array.
* [bisect](./d3-array/bisect.md#bisect) - binary search for a value in a sorted array.
* [bisectRight](./d3-array/bisect.md#bisectRight) - binary search for a value in a sorted array.
* [bisectLeft](./d3-array/bisect.md#bisectLeft) - binary search for a value in a sorted array.
* [bisectCenter](./d3-array/bisect.md#bisectCenter) - binary search for a value in a sorted array.

### [Blur](./d3-array/blur.md)

Blur quantitative values in one or two dimensions.

* [d3.blur](./d3-array/blur.md#blur) - blur an array of numbers in place.
* [d3.blur2](./d3-array/blur.md#blur2) - blur a two-dimensional array of numbers in place.
* [d3.blurImage](./d3-array/blur.md#blurImage) - blur an RGBA ImageData in place.

### [Group](./d3-array/group.md)

Group discrete values.

* [d3.group](./d3-array/group.md#group) - group an iterable into a nested Map.
* [d3.groups](./d3-array/group.md#groups) - group an iterable into a nested array.
* [d3.rollup](./d3-array/group.md#rollup) - reduce an iterable into a nested Map.
* [d3.rollups](./d3-array/group.md#rollups) - reduce an iterable into a nested array.
* [d3.index](./d3-array/group.md#index) - index an iterable into a nested Map.
* [d3.indexes](./d3-array/group.md#indexes) - index an iterable into a nested array.
* [d3.flatGroup](./d3-array/group.md#flatGroup) - group an iterable into a flat array.
* [d3.flatRollup](./d3-array/group.md#flatRollup) - reduce an iterable into a flat array.
* [d3.groupSort](./d3-array/group.md#groupSort) - sort keys according to grouped values.

### [Intern](./d3-array/intern.md)

Create maps and sets with non-primitive values such as dates.

* [new InternMap](./d3-array/intern.md#InternMap) - a key-interning Map.
* [new InternSet](./d3-array/intern.md#InternSet) - a value-interning Set.

### [Sets](./d3-array/sets.md)

Logical operations on sets.

* [d3.difference](./d3-array/sets.md#difference) - compute a set difference.
* [d3.disjoint](./d3-array/sets.md#disjoint) - test whether two sets are disjoint.
* [d3.intersection](./d3-array/sets.md#intersection) - compute a set intersection.
* [d3.superset](./d3-array/sets.md#superset) - test whether a set is a superset of another.
* [d3.subset](./d3-array/sets.md#subset) - test whether a set is a subset of another.
* [d3.union](./d3-array/sets.md#union) - compute a set union.

### [Sort](./d3-array/sort.md)

Sort and reorder arrays of values.

* [d3.ascending](./d3-array/sort.md#ascending) - compute the natural order of two values.
* [d3.descending](./d3-array/sort.md#descending) - compute the natural order of two values.
* [d3.permute](./d3-array/sort.md#permute) - reorder an iterable of elements according to an iterable of indexes.
* [d3.quickselect](./d3-array/sort.md#quickselect) - reorder an array of numbers.
* [d3.reverse](./d3-array/sort.md#reverse) - reverse the order of values.
* [d3.shuffle](./d3-array/sort.md#shuffle) - randomize the order of an iterable.
* [d3.shuffler](./d3-array/sort.md#shuffler) - randomize the order of an iterable.
* [d3.sort](./d3-array/sort.md#sort) - sort values.

### [Summarize](./d3-array/summarize.md)

Compute summary statistics.

* [d3.count](./d3-array/summarize.md#count) - count valid number values in an iterable.
* [d3.min](./d3-array/summarize.md#min) - compute the minimum value in an iterable.
* [d3.minIndex](./d3-array/summarize.md#minIndex) - compute the index of the minimum value in an iterable.
* [d3.max](./d3-array/summarize.md#max) - compute the maximum value in an iterable.
* [d3.maxIndex](./d3-array/summarize.md#maxIndex) - compute the index of the maximum value in an iterable.
* [d3.least](./d3-array/summarize.md#least) - returns the least element of an iterable.
* [d3.leastIndex](./d3-array/summarize.md#leastIndex) - returns the index of the least element of an iterable.
* [d3.greatest](./d3-array/summarize.md#greatest) - returns the greatest element of an iterable.
* [d3.greatestIndex](./d3-array/summarize.md#greatestIndex) - returns the index of the greatest element of an iterable.
* [d3.extent](./d3-array/summarize.md#extent) - compute the minimum and maximum value in an iterable.
* [d3.mode](./d3-array/summarize.md#mode) - compute the mode (the most common value) of an iterable of numbers.
* [d3.sum](./d3-array/summarize.md#sum) - compute the sum of an iterable of numbers.
* [d3.mean](./d3-array/summarize.md#mean) - compute the arithmetic mean of an iterable of numbers.
* [d3.median](./d3-array/summarize.md#median) - compute the median of an iterable of numbers (the 0.5-quantile).
* [d3.medianIndex](./d3-array/summarize.md#median) - compute the median index of an iterable of numbers (the 0.5-quantile).
* [d3.cumsum](./d3-array/summarize.md#cumsum) - compute the cumulative sum of an iterable.
* [d3.quantile](./d3-array/summarize.md#quantile) - compute a quantile for an iterable of numbers.
* [d3.quantileIndex](./d3-array/summarize.md#quantileIndex) - compute a quantile index for an iterable of numbers.
* [d3.quantileSorted](./d3-array/summarize.md#quantileSorted) - compute a quantile for a sorted array of numbers.
* [d3.rank](./d3-array/summarize.md#rank) - compute the rank order of an iterable.
* [d3.variance](./d3-array/summarize.md#variance) - compute the variance of an iterable of numbers.
* [d3.deviation](./d3-array/summarize.md#deviation) - compute the standard deviation of an iterable of numbers.
* [d3.every](./d3-array/summarize.md#every) - test if all values satisfy a condition.
* [d3.some](./d3-array/summarize.md#some) - test if any value satisfies a condition.

### [Ticks](./d3-array/ticks.md)

Generate representative values from a continuous interval.

* [d3.ticks](./d3-array/ticks.md#ticks) - generate representative values from a numeric interval.
* [d3.tickIncrement](./d3-array/ticks.md#tickIncrement) - generate representative values from a numeric interval.
* [d3.tickStep](./d3-array/ticks.md#tickStep) - generate representative values from a numeric interval.
* [d3.nice](./d3-array/ticks.md#nice) - extend an interval to align with ticks.
* [d3.range](./d3-array/ticks.md#range) - generate a range of numeric values.

### [Transform](./d3-array/transform.md)

Derive new arrays.

* [d3.cross](./d3-array/transform.md#cross) - compute the Cartesian product of two iterables.
* [d3.merge](./d3-array/transform.md#merge) - merge multiple iterables into one array.
* [d3.pairs](./d3-array/transform.md#pairs) - create an array of adjacent pairs of elements.
* [d3.transpose](./d3-array/transform.md#transpose) - transpose an array of arrays.
* [d3.zip](./d3-array/transform.md#zip) - transpose a variable number of arrays.
* [d3.filter](./d3-array/transform.md#filter) - filter values.
* [d3.map](./d3-array/transform.md#map) - map values.
* [d3.reduce](./d3-array/transform.md#reduce) - reduce values.

## [d3-axis](./d3-axis.md)

Human-readable reference marks for scales.

* [d3.axisTop](./d3-axis.md#axisTop) - create a new top-oriented axis generator.
* [d3.axisRight](./d3-axis.md#axisRight) - create a new right-oriented axis generator.
* [d3.axisBottom](./d3-axis.md#axisBottom) - create a new bottom-oriented axis generator.
* [d3.axisLeft](./d3-axis.md#axisLeft) - create a new left-oriented axis generator.
* [*axis*](./d3-axis.md#_axis) - generate an axis for the given selection.
* [*axis*.scale](./d3-axis.md#axis_scale) - set the scale.
* [*axis*.ticks](./d3-axis.md#axis_ticks) - customize how ticks are generated and formatted.
* [*axis*.tickArguments](./d3-axis.md#axis_tickArguments) - customize how ticks are generated and formatted.
* [*axis*.tickValues](./d3-axis.md#axis_tickValues) - set the tick values explicitly.
* [*axis*.tickFormat](./d3-axis.md#axis_tickFormat) - set the tick format explicitly.
* [*axis*.tickSize](./d3-axis.md#axis_tickSize) - set the size of the ticks.
* [*axis*.tickSizeInner](./d3-axis.md#axis_tickSizeInner) - set the size of inner ticks.
* [*axis*.tickSizeOuter](./d3-axis.md#axis_tickSizeOuter) - set the size of outer (extent) ticks.
* [*axis*.tickPadding](./d3-axis.md#axis_tickPadding) - set the padding between ticks and labels.
* [*axis*.offset](./d3-axis.md#axis_offset) - set the pixel offset for crisp edges.

## [d3-brush](./d3-brush.md)

Select a one- or two-dimensional region using the mouse or touch.

* [d3.brush](./d3-brush.md#brush) - create a new two-dimensional brush.
* [d3.brushX](./d3-brush.md#brushX) - create a brush along the *x*-dimension.
* [d3.brushY](./d3-brush.md#brushY) - create a brush along the *y*-dimension.
* [*brush*](./d3-brush.md#_brush) - apply the brush to a selection.
* [*brush*.move](./d3-brush.md#brush_move) - move the brush selection.
* [*brush*.clear](./d3-brush.md#brush_clear) - clear the brush selection.
* [*brush*.extent](./d3-brush.md#brush_extent) - define the brushable region.
* [*brush*.filter](./d3-brush.md#brush_filter) - control which input events initiate brushing.
* [*brush*.touchable](./d3-brush.md#brush_touchable) - set the touch support detector.
* [*brush*.keyModifiers](./d3-brush.md#brush_keyModifiers) - enable or disable key interaction.
* [*brush*.handleSize](./d3-brush.md#brush_handleSize) - set the size of the brush handles.
* [*brush*.on](./d3-brush.md#brush_on) - listen for brush events.
* [d3.brushSelection](./d3-brush.md#brushSelection) - get the brush selection for a given node.

## [d3-chord](./d3-chord.md)

* [d3.chord](./d3-chord/chord.md#chord) - create a new chord layout.
* [*chord*](./d3-chord/chord.md#_chord) - compute the layout for the given matrix.
* [*chord*.padAngle](./d3-chord/chord.md#chord_padAngle) - set the padding between adjacent groups.
* [*chord*.sortGroups](./d3-chord/chord.md#chord_sortGroups) - define the group order.
* [*chord*.sortSubgroups](./d3-chord/chord.md#chord_sortSubgroups) - define the source and target order within groups.
* [*chord*.sortChords](./d3-chord/chord.md#chord_sortChords) - define the chord order across groups.
* [d3.chordDirected](./d3-chord/chord.md#chordDirected) - create a directed chord generator.
* [d3.chordTranspose](./d3-chord/chord.md#chordTranspose) - create a transposed chord generator.
* [d3.ribbon](./d3-chord/ribbon.md#ribbon) - create a ribbon shape generator.
* [*ribbon*](./d3-chord/ribbon.md#_ribbon) - generate a ribbon shape.
* [*ribbon*.source](./d3-chord/ribbon.md#ribbon_source) - set the source accessor.
* [*ribbon*.target](./d3-chord/ribbon.md#ribbon_target) - set the target accessor.
* [*ribbon*.radius](./d3-chord/ribbon.md#ribbon_radius) - set the ribbon source and target radius.
* [*ribbon*.sourceRadius](./d3-chord/ribbon.md#ribbon_sourceRadius) - set the ribbon source radius.
* [*ribbon*.targetRadius](./d3-chord/ribbon.md#ribbon_targetRadius) - set the ribbon target radius.
* [*ribbon*.startAngle](./d3-chord/ribbon.md#ribbon_startAngle) - set the ribbon source or target start angle.
* [*ribbon*.endAngle](./d3-chord/ribbon.md#ribbon_endAngle) - set the ribbon source or target end angle.
* [*ribbon*.padAngle](./d3-chord/ribbon.md#ribbon_padAngle) - set the pad angle accessor.
* [*ribbon*.context](./d3-chord/ribbon.md#ribbon_context) - set the render context.
* [d3.ribbonArrow](./d3-chord/ribbon.md#ribbonArrow) - create an arrow ribbon generator.
* [*ribbonArrow*.headRadius](./d3-chord/ribbon.md#ribbonArrow_headRadius) - set the arrowhead radius accessor.

## [d3-color](./d3-color.md)

Color manipulation and color space conversion.

* [d3.color](./d3-color.md#color) - parse the given CSS color specifier.
* [*color*.opacity](./d3-color.md#color_opacity) - the color’s opacity.
* [*color*.rgb](./d3-color.md#color_rgb) - compute the RGB equivalent of this color.
* [*color*.copy](./d3-color.md#color_copy) - return a copy of this color.
* [*color*.brighter](./d3-color.md#color_brighter) - create a brighter copy of this color.
* [*color*.darker](./d3-color.md#color_darker) - create a darker copy of this color.
* [*color*.displayable](./d3-color.md#color_displayable) - returns true if the color is displayable on standard hardware.
* [*color*.formatHex](./d3-color.md#color_formatHex) - returns the hexadecimal RRGGBB string representation of this color.
* [*color*.formatHex8](./d3-color.md#color_formatHex8) - returns the hexadecimal RRGGBBAA string representation of this color.
* [*color*.formatHsl](./d3-color.md#color_formatHsl) - returns the RGB string representation of this color.
* [*color*.formatRgb](./d3-color.md#color_formatRgb) - returns the HSL string representation of this color.
* [*color*.toString](./d3-color.md#color_toString) - returns the RGB string representation of this color.
* [d3.rgb](./d3-color.md#rgb) - create a new RGB color.
* [*rgb*.clamp](./d3-color.md#rgb_clamp) - returns copy of this color clamped to the RGB color space.
* [d3.hsl](./d3-color.md#hsl) - create a new HSL color.
* [*hsl*.clamp](./d3-color.md#hsl_clamp) - returns copy of this color clamped to the HSL color space.
* [d3.lab](./d3-color.md#lab) - create a new Lab color.
* [d3.gray](./d3-color.md#gray) - create a new Lab gray.
* [d3.hcl](./d3-color.md#hcl) - create a new HCL color.
* [d3.lch](./d3-color.md#lch) - create a new HCL color.
* [d3.cubehelix](./d3-color.md#cubehelix) - create a new Cubehelix color.

## [d3-contour](./d3-contour.md)

Compute contour polygons using marching squares.

* [d3.contours](./d3-contour/contour.md#contours) - create a new contour generator.
* [*contours*](./d3-contour/contour.md#_contours) - compute the contours for a given grid of values.
* [*contours*.contour](./d3-contour/contour.md#contours_contour) - compute a contour for a given value.
* [*contours*.size](./d3-contour/contour.md#contours_size) - set the size of a contour generator.
* [*contours*.smooth](./d3-contour/contour.md#contours_smooth) - set whether or not the generated contours are smoothed.
* [*contours*.thresholds](./d3-contour/contour.md#contours_thresholds) - set the thresholds of a contour generator.
* [d3.contourDensity](./d3-contour/density.md#contourDensity) - create a new density estimator.
* [*density*](./d3-contour/density.md#_density) - estimate the density of a given array of samples.
* [*density*.x](./d3-contour/density.md#density_x) - set the *x* accessor of the density estimator.
* [*density*.y](./d3-contour/density.md#density_y) - set the *y* accessor of the density estimator.
* [*density*.weight](./d3-contour/density.md#density_weight) - set the *weight* accessor of the density estimator.
* [*density*.size](./d3-contour/density.md#density_size) - set the size of the density estimator.
* [*density*.cellSize](./d3-contour/density.md#density_cellSize) - set the cell size of the density estimator.
* [*density*.thresholds](./d3-contour/density.md#density_thresholds) - set the thresholds of the density estimator.
* [*density*.bandwidth](./d3-contour/density.md#density_bandwidth) - set the bandwidth of the density estimator.
* [*density*.contours](./d3-contour/density.md#density_contours) - compute density contours.

## [d3-delaunay](./d3-delaunay.md)

Compute the Voronoi diagram of a set of two-dimensional points.

* [new Delaunay](./d3-delaunay/delaunay.md#Delaunay) - create a delaunay triangulation for an array of point coordinates.
* [Delaunay.from](./d3-delaunay/delaunay.md#Delaunay_from) - create a delaunay triangulation for an iterable of points.
* [*delaunay*.points](./d3-delaunay/delaunay.md#delaunay_points) - the coordinates of the points.
* [*delaunay*.halfedges](./d3-delaunay/delaunay.md#delaunay_halfedges) - the delaunay halfedges.
* [*delaunay*.hull](./d3-delaunay/delaunay.md#delaunay_hull) - the convex hull as point indices.
* [*delaunay*.triangles](./d3-delaunay/delaunay.md#delaunay_triangles) - the delaunay triangles.
* [*delaunay*.inedges](./d3-delaunay/delaunay.md#delaunay_inedges) - the delaunay inedges
* [*delaunay*.find](./d3-delaunay/delaunay.md#delaunay_find) - find the closest point in the delaunay triangulation.
* [*delaunay*.neighbors](./d3-delaunay/delaunay.md#delaunay_neighbors) - the neighbors of a point in the delaunay triangulation.
* [*delaunay*.render](./d3-delaunay/delaunay.md#delaunay_render) - render the edges of the delaunay triangulation.
* [*delaunay*.renderHull](./d3-delaunay/delaunay.md#delaunay_renderHull) - render the convex hull.
* [*delaunay*.renderTriangle](./d3-delaunay/delaunay.md#delaunay_renderTriangle) - render a triangle.
* [*delaunay*.renderPoints](./d3-delaunay/delaunay.md#delaunay_renderPoints) - render the points.
* [*delaunay*.hullPolygon](./d3-delaunay/delaunay.md#delaunay_hullPolygon) - the closed convex hull as point coordinates.
* [*delaunay*.trianglePolygons](./d3-delaunay/delaunay.md#delaunay_trianglePolygons) - iterate over all the triangles as polygons.
* [*delaunay*.trianglePolygon](./d3-delaunay/delaunay.md#delaunay_trianglePolygon) - return a triangle as a polygon.
* [*delaunay*.update](./d3-delaunay/delaunay.md#delaunay_update) - update a delaunay triangulation in place.
* [*delaunay*.voronoi](./d3-delaunay/voronoi.md#delaunay_voronoi) - compute the voronoi diagram associated with a delaunay triangulation.
* [*voronoi*.delaunay](./d3-delaunay/voronoi.md#voronoi_delaunay) - the voronoi diagram’s source delaunay triangulation.
* [*voronoi*.circumcenters](./d3-delaunay/voronoi.md#voronoi_circumcenters) - the triangles’ circumcenters.
* [*voronoi*.vectors](./d3-delaunay/voronoi.md#voronoi_vectors) - directions for the outer (infinite) cells of the voronoi diagram.
* [*voronoi*.xmin](./d3-delaunay/voronoi.md#voronoi_bounds) - set the *xmin* bound of the extent.
* [*voronoi*.ymin](./d3-delaunay/voronoi.md#voronoi_bounds) - set the *ymin* bound of the extent.
* [*voronoi*.xmax](./d3-delaunay/voronoi.md#voronoi_bounds) - set the *xmax* bound of the extent.
* [*voronoi*.ymax](./d3-delaunay/voronoi.md#voronoi_bounds) - set the *ymax* bound of the extent.
* [*voronoi*.contains](./d3-delaunay/voronoi.md#voronoi_contains) - test whether a point is inside a voronoi cell.
* [*voronoi*.neighbors](./d3-delaunay/voronoi.md#voronoi_neighbors) - the neighbors of a point in the voronoi diagram.
* [*voronoi*.render](./d3-delaunay/voronoi.md#voronoi_render) - render the mesh of voronoi cells.
* [*voronoi*.renderBounds](./d3-delaunay/voronoi.md#voronoi_renderBounds) - render the extent.
* [*voronoi*.renderCell](./d3-delaunay/voronoi.md#voronoi_renderCell) - render a voronoi cell.
* [*voronoi*.cellPolygons](./d3-delaunay/voronoi.md#voronoi_cellPolygons) - iterate over all the cells as polygons.
* [*voronoi*.cellPolygon](./d3-delaunay/voronoi.md#voronoi_cellPolygon) - return a cell as a polygon.
* [*voronoi*.update](./d3-delaunay/voronoi.md#voronoi_update) - update a voronoi diagram in place.

## [d3-dispatch](./d3-dispatch.md)

Separate concerns using named callbacks.

* [d3.dispatch](./d3-dispatch.md#dispatch) - create a custom event dispatcher.
* [*dispatch*.on](./d3-dispatch.md#dispatch_on) - register or unregister an event listener.
* [*dispatch*.copy](./d3-dispatch.md#dispatch_copy) - create a copy of a dispatcher.
* [*dispatch*.call](./d3-dispatch.md#dispatch_call) - dispatch an event to registered listeners.
* [*dispatch*.apply](./d3-dispatch.md#dispatch_apply) - dispatch an event to registered listeners.

## [d3-drag](./d3-drag.md)

Drag and drop SVG, HTML or Canvas using mouse or touch input.

* [d3.drag](./d3-drag.md#drag) - create a drag behavior.
* [*drag*](./d3-drag.md#_drag) - apply the drag behavior to a selection.
* [*drag*.container](./d3-drag.md#drag_container) - set the coordinate system.
* [*drag*.filter](./d3-drag.md#drag_filter) - ignore some initiating input events.
* [*drag*.touchable](./d3-drag.md#drag_touchable) - set the touch support detector.
* [*drag*.subject](./d3-drag.md#drag_subject) - set the thing being dragged.
* [*drag*.clickDistance](./d3-drag.md#drag_clickDistance) - set the click distance threshold.
* [*drag*.on](./d3-drag.md#drag_on) - listen for drag events.
* [d3.dragDisable](./d3-drag.md#dragDisable) - prevent native drag-and-drop and text selection.
* [d3.dragEnable](./d3-drag.md#dragEnable) - enable native drag-and-drop and text selection.
* [*event*.on](./d3-drag.md#event_on) - listen for drag events on the current gesture.

## [d3-dsv](./d3-dsv.md)

Parse and format delimiter-separated values, most commonly CSV and TSV.

* [d3.csvParse](./d3-dsv.md#csvParse) - parse the given CSV string, returning an array of objects.
* [d3.csvParseRows](./d3-dsv.md#csvParseRows) - parse the given CSV string, returning an array of rows.
* [d3.csvFormat](./d3-dsv.md#csvFormat) - format the given array of objects as CSV.
* [d3.csvFormatBody](./d3-dsv.md#csvFormatBody) - format the given array of objects as CSV.
* [d3.csvFormatRows](./d3-dsv.md#csvFormatRows) - format the given array of rows as CSV.
* [d3.csvFormatRow](./d3-dsv.md#csvFormatRow) - format the given row as CSV.
* [d3.csvFormatValue](./d3-dsv.md#csvFormatValue) - format the given value as CSV.
* [d3.tsvParse](./d3-dsv.md#tsvParse) - parse the given TSV string, returning an array of objects.
* [d3.tsvParseRows](./d3-dsv.md#tsvParseRows) - parse the given TSV string, returning an array of rows.
* [d3.tsvFormat](./d3-dsv.md#tsvFormat) - format the given array of objects as TSV.
* [d3.tsvFormatBody](./d3-dsv.md#tsvFormatBody) - format the given array of objects as TSV.
* [d3.tsvFormatRows](./d3-dsv.md#tsvFormatRows) - format the given array of rows as TSV.
* [d3.tsvFormatRow](./d3-dsv.md#tsvFormatRow) - format the given row as TSV.
* [d3.tsvFormatValue](./d3-dsv.md#tsvFormatValue) - format the given value as TSV.
* [d3.dsvFormat](./d3-dsv.md#dsvFormat) - create a new parser and formatter for the given delimiter.
* [*dsv*.parse](./d3-dsv.md#dsv_parse) - parse the given string, returning an array of objects.
* [*dsv*.parseRows](./d3-dsv.md#dsv_parseRows) - parse the given string, returning an array of rows.
* [*dsv*.format](./d3-dsv.md#dsv_format) - format the given array of objects.
* [*dsv*.formatBody](./d3-dsv.md#dsv_formatBody) - format the given array of objects.
* [*dsv*.formatRows](./d3-dsv.md#dsv_formatRows) - format the given array of rows.
* [*dsv*.formatRow](./d3-dsv.md#dsv_formatRow) - format the given row.
* [*dsv*.formatValue](./d3-dsv.md#dsv_formatValue) - format the given value.
* [d3.autoType](./d3-dsv.md#autoType) - automatically infer value types for the given object.

## [d3-ease](./d3-ease.md)

Easing functions for smooth animation.

* [*ease*](./d3-ease.md#_ease) - ease the given normalized time.
* [d3.easeLinear](./d3-ease.md#easeLinear) - linear easing; the identity function.
* [d3.easePolyIn](./d3-ease.md#easePolyIn) - polynomial easing; raises time to the given power.
* [d3.easePolyOut](./d3-ease.md#easePolyOut) - reverse polynomial easing.
* [d3.easePoly](./d3-ease.md#easePoly) - an alias for easePolyInOut.
* [d3.easePolyInOut](./d3-ease.md#easePolyInOut) - symmetric polynomial easing.
* [*poly*.exponent](./d3-ease.md#easePoly_exponent) - specify the polynomial exponent.
* [d3.easeQuadIn](./d3-ease.md#easeQuadIn) - quadratic easing; squares time.
* [d3.easeQuadOut](./d3-ease.md#easeQuadOut) - reverse quadratic easing.
* [d3.easeQuad](./d3-ease.md#easeQuad) - an alias for easeQuadInOut.
* [d3.easeQuadInOut](./d3-ease.md#easeQuadInOut) - symmetric quadratic easing.
* [d3.easeCubicIn](./d3-ease.md#easeCubicIn) - cubic easing; cubes time.
* [d3.easeCubicOut](./d3-ease.md#easeCubicOut) - reverse cubic easing.
* [d3.easeCubic](./d3-ease.md#easeCubic) - an alias for easeCubicInOut.
* [d3.easeCubicInOut](./d3-ease.md#easeCubicInOut) - symmetric cubic easing.
* [d3.easeSinIn](./d3-ease.md#easeSinIn) - sinusoidal easing.
* [d3.easeSinOut](./d3-ease.md#easeSinOut) - reverse sinusoidal easing.
* [d3.easeSin](./d3-ease.md#easeSin) - an alias for easeSinInOut.
* [d3.easeSinInOut](./d3-ease.md#easeSinInOut) - symmetric sinusoidal easing.
* [d3.easeExpIn](./d3-ease.md#easeExpIn) - exponential easing.
* [d3.easeExpOut](./d3-ease.md#easeExpOut) - reverse exponential easing.
* [d3.easeExp](./d3-ease.md#easeExp) - an alias for easeExpInOut.
* [d3.easeExpInOut](./d3-ease.md#easeExpInOut) - symmetric exponential easing.
* [d3.easeCircleIn](./d3-ease.md#easeCircleIn) - circular easing.
* [d3.easeCircleOut](./d3-ease.md#easeCircleOut) - reverse circular easing.
* [d3.easeCircle](./d3-ease.md#easeCircle) - an alias for easeCircleInOut.
* [d3.easeCircleInOut](./d3-ease.md#easeCircleInOut) - symmetric circular easing.
* [d3.easeElasticIn](./d3-ease.md#easeElasticIn) - elastic easing, like a rubber band.
* [d3.easeElastic](./d3-ease.md#easeElastic) - an alias for easeElasticOut.
* [d3.easeElasticOut](./d3-ease.md#easeElasticOut) - reverse elastic easing.
* [d3.easeElasticInOut](./d3-ease.md#easeElasticInOut) - symmetric elastic easing.
* [*elastic*.amplitude](./d3-ease.md#easeElastic_amplitude) - specify the elastic amplitude.
* [*elastic*.period](./d3-ease.md#easeElastic_period) - specify the elastic period.
* [d3.easeBackIn](./d3-ease.md#easeBackIn) - anticipatory easing, like a dancer bending his knees before jumping.
* [d3.easeBackOut](./d3-ease.md#easeBackOut) - reverse anticipatory easing.
* [d3.easeBack](./d3-ease.md#easeBack) - an alias for easeBackInOut.
* [d3.easeBackInOut](./d3-ease.md#easeBackInOut) - symmetric anticipatory easing.
* [*back*.overshoot](./d3-ease.md#easeBack_overshoot) - specify the amount of overshoot.
* [d3.easeBounceIn](./d3-ease.md#easeBounceIn) - bounce easing, like a rubber ball.
* [d3.easeBounce](./d3-ease.md#easeBounce) - an alias for easeBounceOut.
* [d3.easeBounceOut](./d3-ease.md#easeBounceOut) - reverse bounce easing.
* [d3.easeBounceInOut](./d3-ease.md#easeBounceInOut) - symmetric bounce easing.

## [d3-fetch](./d3-fetch.md)

Convenience methods on top of the Fetch API.

* [d3.blob](./d3-fetch.md#blob) - get a file as a blob.
* [d3.buffer](./d3-fetch.md#buffer) - get a file as an array buffer.
* [d3.csv](./d3-fetch.md#csv) - get a comma-separated values (CSV) file.
* [d3.dsv](./d3-fetch.md#dsv) - get a delimiter-separated values (CSV) file.
* [d3.html](./d3-fetch.md#html) - get an HTML file.
* [d3.image](./d3-fetch.md#image) - get an image.
* [d3.json](./d3-fetch.md#json) - get a JSON file.
* [d3.svg](./d3-fetch.md#svg) - get an SVG file.
* [d3.text](./d3-fetch.md#text) - get a plain text file.
* [d3.tsv](./d3-fetch.md#tsv) - get a tab-separated values (TSV) file.
* [d3.xml](./d3-fetch.md#xml) - get an XML file.

## [d3-force](./d3-force.md)

Force-directed graph layout using velocity Verlet integration.

* [d3.forceSimulation](./d3-force/simulation.md#forceSimulation) - create a new force simulation.
* [*simulation*.restart](./d3-force/simulation.md#simulation_restart) - reheat and restart the simulation’s timer.
* [*simulation*.stop](./d3-force/simulation.md#simulation_stop) - stop the simulation’s timer.
* [*simulation*.tick](./d3-force/simulation.md#simulation_tick) - advance the simulation one step.
* [*simulation*.nodes](./d3-force/simulation.md#simulation_nodes) - set the simulation’s nodes.
* [*simulation*.alpha](./d3-force/simulation.md#simulation_alpha) - set the current alpha.
* [*simulation*.alphaMin](./d3-force/simulation.md#simulation_alphaMin) - set the minimum alpha threshold.
* [*simulation*.alphaDecay](./d3-force/simulation.md#simulation_alphaDecay) - set the alpha exponential decay rate.
* [*simulation*.alphaTarget](./d3-force/simulation.md#simulation_alphaTarget) - set the target alpha.
* [*simulation*.velocityDecay](./d3-force/simulation.md#simulation_velocityDecay) - set the velocity decay rate.
* [*simulation*.force](./d3-force/simulation.md#simulation_force) - add or remove a force.
* [*simulation*.find](./d3-force/simulation.md#simulation_find) - find the closest node to the given position.
* [*simulation*.randomSource](./d3-force/simulation.md#simulation_randomSource) - set the simulation’s random source.
* [*simulation*.on](./d3-force/simulation.md#simulation_on) - add or remove an event listener.
* [*force*](./d3-force/simulation.md#_force) - apply the force.
* [*force*.initialize](./d3-force/simulation.md#force_initialize) - initialize the force with the given nodes.
* [d3.forceCenter](./d3-force/center.md#forceCenter) - create a centering force.
* [*center*.x](./d3-force/center.md#center_x) - set the center *x*-coordinate.
* [*center*.y](./d3-force/center.md#center_y) - set the center y coordinate.
* [*center*.strength](./d3-force/center.md#center_strength) - set the strength of the centering force.
* [d3.forceCollide](./d3-force/collide.md#forceCollide) - create a circle collision force.
* [*collide*.radius](./d3-force/collide.md#collide_radius) - set the circle radius.
* [*collide*.strength](./d3-force/collide.md#collide_strength) - set the collision resolution strength.
* [*collide*.iterations](./d3-force/collide.md#collide_iterations) - set the number of iterations.
* [d3.forceLink](./d3-force/link.md#forceLink) - create a link force.
* [*link*.links](./d3-force/link.md#link_links) - set the array of links.
* [*link*.id](./d3-force/link.md#link_id) - link nodes by numeric index or string identifier.
* [*link*.distance](./d3-force/link.md#link_distance) - set the link distance.
* [*link*.strength](./d3-force/link.md#link_strength) - set the link strength.
* [*link*.iterations](./d3-force/link.md#link_iterations) - set the number of iterations.
* [d3.forceManyBody](./d3-force/many-body.md#forceManyBody) - create a many-body force.
* [*manyBody*.strength](./d3-force/many-body.md#manyBody_strength) - set the force strength.
* [*manyBody*.theta](./d3-force/many-body.md#manyBody_theta) - set the Barnes–Hut approximation accuracy.
* [*manyBody*.distanceMin](./d3-force/many-body.md#manyBody_distanceMin) - limit the force when nodes are close.
* [*manyBody*.distanceMax](./d3-force/many-body.md#manyBody_distanceMax) - limit the force when nodes are far.
* [d3.forceX](./d3-force/position.md#forceX) - create an *x*-positioning force.
* [*x*.strength](./d3-force/position.md#x_strength) - set the force strength.
* [*x*.x](./d3-force/position.md#x_x) - set the target *x*-coordinate.
* [d3.forceY](./d3-force/position.md#forceY) - create an *y*-positioning force.
* [*y*.strength](./d3-force/position.md#y_strength) - set the force strength.
* [*y*.y](./d3-force/position.md#y_y) - set the target y coordinate.
* [d3.forceRadial](./d3-force/position.md#forceRadial) - create a radial positioning force.
* [*radial*.strength](./d3-force/position.md#radial_strength) - set the force strength.
* [*radial*.radius](./d3-force/position.md#radial_radius) - set the target radius.
* [*radial*.x](./d3-force/position.md#radial_x) - set the target center *x*-coordinate.
* [*radial*.y](./d3-force/position.md#radial_y) - set the target center y coordinate.

## [d3-format](./d3-format.md)

Format numbers for human consumption.

* [d3.format](./d3-format.md#format) - alias for *locale*.format on the default locale.
* [d3.formatPrefix](./d3-format.md#formatPrefix) - alias for *locale*.formatPrefix on the default locale.
* [*locale*.format](./d3-format.md#locale_format) - create a number format.
* [*locale*.formatPrefix](./d3-format.md#locale_formatPrefix) - create a SI-prefix number format.
* [d3.formatSpecifier](./d3-format.md#formatSpecifier) - parse a number format specifier.
* [new d3.FormatSpecifier](./d3-format.md#FormatSpecifier) - augments a number format specifier object.
* [d3.precisionFixed](./d3-format.md#precisionFixed) - compute decimal precision for fixed-point notation.
* [d3.precisionPrefix](./d3-format.md#precisionPrefix) - compute decimal precision for SI-prefix notation.
* [d3.precisionRound](./d3-format.md#precisionRound) - compute significant digits for rounded notation.
* [d3.formatLocale](./d3-format.md#formatLocale) - define a custom locale.
* [d3.formatDefaultLocale](./d3-format.md#formatDefaultLocale) - define the default locale.

## [d3-geo](./d3-geo.md)

Geographic projections, shapes and math.

### [Paths](./d3-geo/path.md)

* [d3.geoPath](./d3-geo/path.md#geoPath) - create a new geographic path generator.
* [*path*](./d3-geo/path.md#_path) - project and render the specified feature.
* [*path*.area](./d3-geo/path.md#path_area) - compute the projected planar area of a given feature.
* [*path*.bounds](./d3-geo/path.md#path_bounds) - compute the projected planar bounding box of a given feature.
* [*path*.centroid](./d3-geo/path.md#path_centroid) - compute the projected planar centroid of a given feature.
* [*path*.digits](./d3-geo/path.md#path_digits) - set the output precision.
* [*path*.measure](./d3-geo/path.md#path_measure) - compute the projected planar length of a given feature.
* [*path*.projection](./d3-geo/path.md#path_projection) - set the geographic projection.
* [*path*.context](./d3-geo/path.md#path_context) - set the render context.
* [*path*.pointRadius](./d3-geo/path.md#path_pointRadius) - set the radius to display point features.

### [Projections](./d3-geo/projection.md)

* [*projection*](./d3-geo/projection.md#_projection) - project the specified point from the sphere to the plane.
* [*projection*.invert](./d3-geo/projection.md#projection_invert) - unproject the specified point from the plane to the sphere.
* [*projection*.stream](./d3-geo/projection.md#projection_stream) - wrap the specified stream to project geometry.
* [*projection*.preclip](./d3-geo/projection.md#projection_preclip) - set the projection’s spherical clipping function.
* [*projection*.postclip](./d3-geo/projection.md#projection_postclip) - set the projection’s cartesian clipping function.
* [*projection*.clipAngle](./d3-geo/projection.md#projection_clipAngle) - set the radius of the clip circle.
* [*projection*.clipExtent](./d3-geo/projection.md#projection_clipExtent) - set the viewport clip extent, in pixels.
* [*projection*.scale](./d3-geo/projection.md#projection_scale) - set the scale factor.
* [*projection*.translate](./d3-geo/projection.md#projection_translate) - set the translation offset.
* [*projection*.center](./d3-geo/projection.md#projection_center) - set the center point.
* [*projection*.angle](./d3-geo/projection.md#projection_angle) - set the post-projection rotation.
* [*projection*.reflectX](./d3-geo/projection.md#projection_reflectX) - reflect the *x*-dimension.
* [*projection*.reflectY](./d3-geo/projection.md#projection_reflectY) - reflect the *y*-dimension.
* [*projection*.rotate](./d3-geo/projection.md#projection_rotate) - set the three-axis spherical rotation angles.
* [*projection*.precision](./d3-geo/projection.md#projection_precision) - set the precision threshold for adaptive sampling.
* [*projection*.fitExtent](./d3-geo/projection.md#projection_fitExtent) - set the scale and translate to fit a GeoJSON object.
* [*projection*.fitSize](./d3-geo/projection.md#projection_fitSize) - set the scale and translate to fit a GeoJSON object.
* [*projection*.fitWidth](./d3-geo/projection.md#projection_fitWidth) - set the scale and translate to fit a GeoJSON object.
* [*projection*.fitHeight](./d3-geo/projection.md#projection_fitHeight) - set the scale and translate to fit a GeoJSON object.

#### [Raw projections](./d3-geo/projection.md#raw-projections)

* [*project*](./d3-geo/projection.md#_project) - project the specified point from the sphere to the plane.
* [*project*.invert](./d3-geo/projection.md#project_invert) - unproject the specified point from the plane to the sphere.
* [d3.geoProjection](./d3-geo/projection.md#geoProjection) - create a custom projection.
* [d3.geoProjectionMutator](./d3-geo/projection.md#geoProjectionMutator) - create a custom configurable projection.
* [d3.geoTransform](./d3-geo/projection.md#geoTransform) - define a custom geometry transform.
* [d3.geoIdentity](./d3-geo/projection.md#geoIdentity) - scale, translate or clip planar geometry.
* [d3.geoClipAntimeridian](./d3-geo/projection.md#geoClipAntimeridian) - cuts spherical geometries that cross the antimeridian.
* [d3.geoClipCircle](./d3-geo/projection.md#geoClipCircle) - clips spherical geometries to a small circle.
* [d3.geoClipRectangle](./d3-geo/projection.md#geoClipRectangle) - clips planar geometries to a rectangular viewport.

#### [Azimuthal projections](./d3-geo/azimuthal.md)

* [d3.geoAzimuthalEqualArea](./d3-geo/azimuthal.md#geoAzimuthalEqualArea) - the azimuthal equal-area projection.
* [d3.geoAzimuthalEquidistant](./d3-geo/azimuthal.md#geoAzimuthalEquidistant) - the azimuthal equidistant projection.
* [d3.geoGnomonic](./d3-geo/azimuthal.md#geoGnomonic) - the gnomonic projection.
* [d3.geoOrthographic](./d3-geo/azimuthal.md#geoOrthographic) - the azimuthal orthographic projection.
* [d3.geoStereographic](./d3-geo/azimuthal.md#geoStereographic) - the azimuthal stereographic projection.

#### [Conic projections](./d3-geo/conic.md)

* [*conic*.parallels](./d3-geo/conic.md#conic_parallels) - set the two standard parallels.
* [d3.geoConicConformal](./d3-geo/conic.md#geoConicConformal) - the conic conformal projection.
* [d3.geoConicEqualArea](./d3-geo/conic.md#geoConicEqualArea) - the conic equal-area (Albers) projection.
* [d3.geoConicEquidistant](./d3-geo/conic.md#geoConicEquidistant) - the conic equidistant projection.
* [d3.geoAlbers](./d3-geo/conic.md#geoAlbers) - the Albers equal-area conic projection.
* [d3.geoAlbersUsa](./d3-geo/conic.md#geoAlbersUsa) - a composite Albers projection for the United States.

#### [Cylindrical projections](./d3-geo/cylindrical.md)

* [d3.geoEquirectangular](./d3-geo/cylindrical.md#geoEquirectangular) - the equirectangular (plate carreé) projection.
* [d3.geoMercator](./d3-geo/cylindrical.md#geoMercator) - the spherical Mercator projection.
* [d3.geoTransverseMercator](./d3-geo/cylindrical.md#geoTransverseMercator) - the transverse spherical Mercator projection.
* [d3.geoEqualEarth](./d3-geo/cylindrical.md#geoEqualEarth) - the Equal Earth projection.
* [d3.geoNaturalEarth1](./d3-geo/cylindrical.md#geoNaturalEarth1) - the Equal Earth projection, version 1.

### [Streams](./d3-geo/stream.md)

* [d3.geoStream](./d3-geo/stream.md#geoStream) - convert a GeoJSON object to a geometry stream.
* [*stream*.point](./d3-geo/stream.md#stream_point) - indicates a point with the specified coordinates.
* [*stream*.lineStart](./d3-geo/stream.md#stream_lineStart) - indicates the start of a line or ring.
* [*stream*.lineEnd](./d3-geo/stream.md#stream_lineEnd) - indicates the end of a line or ring.
* [*stream*.polygonStart](./d3-geo/stream.md#stream_polygonStart) - indicates the start of a polygon.
* [*stream*.polygonEnd](./d3-geo/stream.md#stream_polygonEnd) - indicates the end of a polygon.
* [*stream*.sphere](./d3-geo/stream.md#stream_sphere) - indicates the sphere.

### [Spherical shapes](./d3-geo/shape.md)

* [d3.geoGraticule](./d3-geo/shape.md#geoGraticule) - create a graticule generator.
* [*graticule*](./d3-geo/shape.md#_graticule) - generate a MultiLineString of meridians and parallels.
* [*graticule*.lines](./d3-geo/shape.md#graticule_lines) - generate an array of LineStrings of meridians and parallels.
* [*graticule*.outline](./d3-geo/shape.md#graticule_outline) - generate a Polygon of the graticule’s extent.
* [*graticule*.extent](./d3-geo/shape.md#graticule_extent) - get or set the major & minor extents.
* [*graticule*.extentMajor](./d3-geo/shape.md#graticule_extentMajor) - get or set the major extent.
* [*graticule*.extentMinor](./d3-geo/shape.md#graticule_extentMinor) - get or set the minor extent.
* [*graticule*.step](./d3-geo/shape.md#graticule_step) - get or set the major & minor step intervals.
* [*graticule*.stepMajor](./d3-geo/shape.md#graticule_stepMajor) - get or set the major step intervals.
* [*graticule*.stepMinor](./d3-geo/shape.md#graticule_stepMinor) - get or set the minor step intervals.
* [*graticule*.precision](./d3-geo/shape.md#graticule_precision) - get or set the latitudinal precision.
* [d3.geoGraticule10](./d3-geo/shape.md#geoGraticule10) - generate the default 10° global graticule.
* [d3.geoCircle](./d3-geo/shape.md#geoCircle) - create a circle generator.
* [*circle*](./d3-geo/shape.md#_circle) - generate a piecewise circle as a Polygon.
* [*circle*.center](./d3-geo/shape.md#circle_center) - specify the circle center in latitude and longitude.
* [*circle*.radius](./d3-geo/shape.md#circle_radius) - specify the angular radius in degrees.
* [*circle*.precision](./d3-geo/shape.md#circle_precision) - specify the precision of the piecewise circle.

### [Spherical math](./d3-geo/math.md)

* [d3.geoArea](./d3-geo/math.md#geoArea) - compute the spherical area of a given feature.
* [d3.geoBounds](./d3-geo/math.md#geoBounds) - compute the latitude-longitude bounding box for a given feature.
* [d3.geoCentroid](./d3-geo/math.md#geoCentroid) - compute the spherical centroid of a given feature.
* [d3.geoDistance](./d3-geo/math.md#geoDistance) - compute the great-arc distance between two points.
* [d3.geoLength](./d3-geo/math.md#geoLength) - compute the length of a line string or the perimeter of a polygon.
* [d3.geoInterpolate](./d3-geo/math.md#geoInterpolate) - interpolate between two points along a great arc.
* [d3.geoContains](./d3-geo/math.md#geoContains) - test whether a point is inside a given feature.
* [d3.geoRotation](./d3-geo/math.md#geoRotation) - create a rotation function for the specified angles.

## [d3-hierarchy](./d3-hierarchy.md)

Layout algorithms for visualizing hierarchical data.

* [d3.hierarchy](./d3-hierarchy/hierarchy.md#hierarchy) - constructs a root node from hierarchical data.
* [*node*.ancestors](./d3-hierarchy/hierarchy.md#node_ancestors) - generate an array of ancestors.
* [*node*.descendants](./d3-hierarchy/hierarchy.md#node_descendants) - generate an array of descendants.
* [*node*.leaves](./d3-hierarchy/hierarchy.md#node_leaves) - generate an array of leaves.
* [*node*.find](./d3-hierarchy/hierarchy.md#node_find) - find a node in the hierarchy.
* [*node*.path](./d3-hierarchy/hierarchy.md#node_path) - generate the shortest path to another node.
* [*node*.links](./d3-hierarchy/hierarchy.md#node_links) - generate an array of links.
* [*node*.sum](./d3-hierarchy/hierarchy.md#node_sum) - evaluate and aggregate quantitative values.
* [*node*.count](./d3-hierarchy/hierarchy.md#node_count) - count the number of leaves.
* [*node*.sort](./d3-hierarchy/hierarchy.md#node_sort) - sort all descendant siblings.
* [*node*[Symbol.iterator]](./d3-hierarchy/hierarchy.md#node_iterator) - iterate on a hierarchy.
* [*node*.each](./d3-hierarchy/hierarchy.md#node_each) - breadth-first traversal.
* [*node*.eachAfter](./d3-hierarchy/hierarchy.md#node_eachAfter) - post-order traversal.
* [*node*.eachBefore](./d3-hierarchy/hierarchy.md#node_eachBefore) - pre-order traversal.
* [*node*.copy](./d3-hierarchy/hierarchy.md#node_copy) - copy a hierarchy.
* [d3.stratify](./d3-hierarchy/stratify.md#stratify) - create a new stratify operator.
* [*stratify*](./d3-hierarchy/stratify.md#_stratify) - construct a root node from tabular data.
* [*stratify*.id](./d3-hierarchy/stratify.md#stratify_id) - set the node id accessor.
* [*stratify*.parentId](./d3-hierarchy/stratify.md#stratify_parentId) - set the parent node id accessor.
* [*stratify*.path](./d3-hierarchy/stratify.md#stratify_path) - set the path accessor.
* [d3.cluster](./d3-hierarchy/cluster.md#cluster) - create a new cluster (dendrogram) layout.
* [*cluster*](./d3-hierarchy/cluster.md#_cluster) - layout the specified hierarchy in a dendrogram.
* [*cluster*.size](./d3-hierarchy/cluster.md#cluster_size) - set the layout size.
* [*cluster*.nodeSize](./d3-hierarchy/cluster.md#cluster_nodeSize) - set the node size.
* [*cluster*.separation](./d3-hierarchy/cluster.md#cluster_separation) - set the separation between leaves.
* [d3.tree](./d3-hierarchy/tree.md#tree) - create a new tidy tree layout.
* [*tree*](./d3-hierarchy/tree.md#_tree) - layout the specified hierarchy in a tidy tree.
* [*tree*.size](./d3-hierarchy/tree.md#tree_size) - set the layout size.
* [*tree*.nodeSize](./d3-hierarchy/tree.md#tree_nodeSize) - set the node size.
* [*tree*.separation](./d3-hierarchy/tree.md#tree_separation) - set the separation between nodes.
* [d3.treemap](./d3-hierarchy/treemap.md#treemap) - create a new treemap layout.
* [*treemap*](./d3-hierarchy/treemap.md#_treemap) - layout the specified hierarchy as a treemap.
* [*treemap*.tile](./d3-hierarchy/treemap.md#treemap_tile) - set the tiling method.
* [*treemap*.size](./d3-hierarchy/treemap.md#treemap_size) - set the layout size.
* [*treemap*.round](./d3-hierarchy/treemap.md#treemap_round) - set whether the output coordinates are rounded.
* [*treemap*.padding](./d3-hierarchy/treemap.md#treemap_padding) - set the padding.
* [*treemap*.paddingInner](./d3-hierarchy/treemap.md#treemap_paddingInner) - set the padding between siblings.
* [*treemap*.paddingOuter](./d3-hierarchy/treemap.md#treemap_paddingOuter) - set the padding between parent and children.
* [*treemap*.paddingTop](./d3-hierarchy/treemap.md#treemap_paddingTop) - set the padding between the parent’s top edge and children.
* [*treemap*.paddingRight](./d3-hierarchy/treemap.md#treemap_paddingRight) - set the padding between the parent’s right edge and children.
* [*treemap*.paddingBottom](./d3-hierarchy/treemap.md#treemap_paddingBottom) - set the padding between the parent’s bottom edge and children.
* [*treemap*.paddingLeft](./d3-hierarchy/treemap.md#treemap_paddingLeft) - set the padding between the parent’s left edge and children.
* [d3.treemapBinary](./d3-hierarchy/treemap.md#treemapBinary) - tile using a balanced binary tree.
* [d3.treemapDice](./d3-hierarchy/treemap.md#treemapDice) - tile into a horizontal row.
* [d3.treemapSlice](./d3-hierarchy/treemap.md#treemapSlice) - tile into a vertical column.
* [d3.treemapSliceDice](./d3-hierarchy/treemap.md#treemapSliceDice) - alternate between slicing and dicing.
* [d3.treemapSquarify](./d3-hierarchy/treemap.md#treemapSquarify) - tile using squarified rows per Bruls *et. al.*
* [d3.treemapResquarify](./d3-hierarchy/treemap.md#treemapResquarify) - like d3.treemapSquarify, but performs stable updates.
* [*squarify*.ratio](./d3-hierarchy/treemap.md#squarify_ratio) - set the desired rectangle aspect ratio.
* [d3.partition](./d3-hierarchy/partition.md#partition) - create a new partition (icicle or sunburst) layout.
* [*partition*](./d3-hierarchy/partition.md#_partition) - layout the specified hierarchy as a partition diagram.
* [*partition*.size](./d3-hierarchy/partition.md#partition_size) - set the layout size.
* [*partition*.round](./d3-hierarchy/partition.md#partition_round) - set whether the output coordinates are rounded.
* [*partition*.padding](./d3-hierarchy/partition.md#partition_padding) - set the padding.
* [d3.pack](./d3-hierarchy/pack.md#pack) - create a new circle-packing layout.
* [*pack*](./d3-hierarchy/pack.md#_pack) - layout the specified hierarchy using circle-packing.
* [*pack*.radius](./d3-hierarchy/pack.md#pack_radius) - set the radius accessor.
* [*pack*.size](./d3-hierarchy/pack.md#pack_size) - set the layout size.
* [*pack*.padding](./d3-hierarchy/pack.md#pack_padding) - set the padding.
* [d3.packSiblings](./d3-hierarchy/pack.md#packSiblings) - pack the specified array of circles.
* [d3.packEnclose](./d3-hierarchy/pack.md#packEnclose) - enclose the specified array of circles.

## [d3-interpolate](./d3-interpolate.md)

Interpolate numbers, colors, strings, arrays, objects, whatever!

### [Value interpolation](./d3-interpolate/value.md)

* [d3.interpolate](./d3-interpolate/value.md#interpolate) - interpolate arbitrary values.
* [d3.interpolateNumber](./d3-interpolate/value.md#interpolateNumber) - interpolate numbers.
* [d3.interpolateRound](./d3-interpolate/value.md#interpolateRound) - interpolate integers.
* [d3.interpolateString](./d3-interpolate/value.md#interpolateString) - interpolate strings with embedded numbers.
* [d3.interpolateDate](./d3-interpolate/value.md#interpolateDate) - interpolate dates.
* [d3.interpolateArray](./d3-interpolate/value.md#interpolateArray) - interpolate arrays of arbitrary values.
* [d3.interpolateNumberArray](./d3-interpolate/value.md#interpolateNumberArray) - interpolate arrays of numbers.
* [d3.interpolateObject](./d3-interpolate/value.md#interpolateObject) - interpolate arbitrary objects.
* [d3.interpolateBasis](./d3-interpolate/value.md#interpolateBasis) - generate a B-spline through a set of values.
* [d3.interpolateBasisClosed](./d3-interpolate/value.md#interpolateBasisClosed) - generate a closed B-spline through a set of values.
* [d3.interpolateDiscrete](./d3-interpolate/value.md#interpolateDiscrete) - generate a discrete interpolator from a set of values.
* [d3.quantize](./d3-interpolate/value.md#quantize) - generate uniformly-spaced samples from an interpolator.
* [d3.piecewise](./d3-interpolate/value.md#piecewise) - generate a piecewise linear interpolator from a set of values.

### [Color interpolation](./d3-interpolate/color.md)

* [d3.interpolateRgb](./d3-interpolate/color.md#interpolateRgb) - interpolate RGB colors.
* [d3.interpolateRgbBasis](./d3-interpolate/color.md#interpolateRgbBasis) - generate a B-spline through a set of colors.
* [d3.interpolateRgbBasisClosed](./d3-interpolate/color.md#interpolateRgbBasisClosed) - generate a closed B-spline through a set of colors.
* [d3.interpolateHsl](./d3-interpolate/color.md#interpolateHsl) - interpolate HSL colors.
* [d3.interpolateHslLong](./d3-interpolate/color.md#interpolateHslLong) - interpolate HSL colors, the long way.
* [d3.interpolateLab](./d3-interpolate/color.md#interpolateLab) - interpolate Lab colors.
* [d3.interpolateHcl](./d3-interpolate/color.md#interpolateHcl) - interpolate HCL colors.
* [d3.interpolateHclLong](./d3-interpolate/color.md#interpolateHclLong) - interpolate HCL colors, the long way.
* [d3.interpolateCubehelix](./d3-interpolate/color.md#interpolateCubehelix) - interpolate Cubehelix colors.
* [d3.interpolateCubehelixLong](./d3-interpolate/color.md#interpolateCubehelixLong) - interpolate Cubehelix colors, the long way.
* [*interpolateColor*.gamma](./d3-interpolate/color.md#interpolateColor_gamma) - apply gamma correction during interpolation.
* [d3.interpolateHue](./d3-interpolate/color.md#interpolateHue) - interpolate a hue angle.

### [Transform interpolation](./d3-interpolate/transform.md)

* [d3.interpolateTransformCss](./d3-interpolate/transform.md#interpolateTransformCss) - interpolate 2D CSS transforms.
* [d3.interpolateTransformSvg](./d3-interpolate/transform.md#interpolateTransformSvg) - interpolate 2D SVG transforms.

### [Zoom interpolation](./d3-interpolate/zoom.md)

* [d3.interpolateZoom](./d3-interpolate/zoom.md#interpolateZoom) - zoom and pan between two views.
* [*interpolateZoom*.rho](./d3-interpolate/zoom.md#interpolateZoom_rho) - set the curvature *rho* of the zoom interpolator.

## [d3-path](./d3-path.md)

Serialize Canvas path commands to SVG.

* [d3.path](./d3-path.md#path) - create a new path serializer.
* [*path*.moveTo](./d3-path.md#path_moveTo) - move to the given point.
* [*path*.closePath](./d3-path.md#path_closePath) - close the current subpath.
* [*path*.lineTo](./d3-path.md#path_lineTo) - draw a straight line segment.
* [*path*.quadraticCurveTo](./d3-path.md#path_quadraticCurveTo) - draw a quadratic Bézier segment.
* [*path*.bezierCurveTo](./d3-path.md#path_bezierCurveTo) - draw a cubic Bézier segment.
* [*path*.arcTo](./d3-path.md#path_arcTo) - draw a circular arc segment.
* [*path*.arc](./d3-path.md#path_arc) - draw a circular arc segment.
* [*path*.rect](./d3-path.md#path_rect) - draw a rectangle.
* [*path*.toString](./d3-path.md#path_toString) - serialize to an SVG path data string.
* [d3.pathRound](./d3-path.md#pathRound) - create a new path serializer with fixed output precision.

## [d3-polygon](./d3-polygon.md)

Geometric operations for two-dimensional polygons.

* [d3.polygonArea](./d3-polygon.md#polygonArea) - compute the area of the given polygon.
* [d3.polygonCentroid](./d3-polygon.md#polygonCentroid) - compute the centroid of the given polygon.
* [d3.polygonHull](./d3-polygon.md#polygonHull) - compute the convex hull of the given points.
* [d3.polygonContains](./d3-polygon.md#polygonContains) - test whether a point is inside a polygon.
* [d3.polygonLength](./d3-polygon.md#polygonLength) - compute the length of the given polygon’s perimeter.

## [d3-quadtree](./d3-quadtree.md)

Two-dimensional recursive spatial subdivision.

* [d3.quadtree](./d3-quadtree.md#quadtree) - create a new, empty quadtree.
* [*quadtree*.x](./d3-quadtree.md#quadtree_x) - set the *x* accessor.
* [*quadtree*.y](./d3-quadtree.md#quadtree_y) - set the *y* accessor.
* [*quadtree*.extent](./d3-quadtree.md#quadtree_extent) - extend the quadtree to cover an extent.
* [*quadtree*.cover](./d3-quadtree.md#quadtree_cover) - extend the quadtree to cover a point.
* [*quadtree*.add](./d3-quadtree.md#quadtree_add) - add a datum to a quadtree.
* [*quadtree*.addAll](./d3-quadtree.md#quadtree_addAll) - add an array of data to a quadtree.
* [*quadtree*.remove](./d3-quadtree.md#quadtree_remove) - remove a datum from a quadtree.
* [*quadtree*.removeAll](./d3-quadtree.md#quadtree_removeAll) - remove an array of data from a quadtree.
* [*quadtree*.copy](./d3-quadtree.md#quadtree_copy) - create a copy of a quadtree.
* [*quadtree*.root](./d3-quadtree.md#quadtree_root) - get the quadtree’s root node.
* [*quadtree*.data](./d3-quadtree.md#quadtree_data) - retrieve all data from the quadtree.
* [*quadtree*.size](./d3-quadtree.md#quadtree_size) - count the number of data in the quadtree.
* [*quadtree*.find](./d3-quadtree.md#quadtree_find) - quickly find the closest datum in a quadtree.
* [*quadtree*.visit](./d3-quadtree.md#quadtree_visit) - selectively visit nodes in a quadtree.
* [*quadtree*.visitAfter](./d3-quadtree.md#quadtree_visitAfter) - visit all nodes in a quadtree.

## [d3-random](./d3-random.md)

Generate random numbers from various distributions.

* [d3.randomUniform](./d3-random.md#randomUniform) - from a uniform distribution.
* [d3.randomInt](./d3-random.md#randomInt) - from a uniform integer distribution.
* [d3.randomNormal](./d3-random.md#randomNormal) - from a normal distribution.
* [d3.randomLogNormal](./d3-random.md#randomLogNormal) - from a log-normal distribution.
* [d3.randomBates](./d3-random.md#randomBates) - from a Bates distribution.
* [d3.randomIrwinHall](./d3-random.md#randomIrwinHall) - from an Irwin–Hall distribution.
* [d3.randomExponential](./d3-random.md#randomExponential) - from an exponential distribution.
* [d3.randomPareto](./d3-random.md#randomPareto) - from a Pareto distribution.
* [d3.randomBernoulli](./d3-random.md#randomBernoulli) - from a Bernoulli distribution.
* [d3.randomGeometric](./d3-random.md#randomGeometric) - from a geometric distribution.
* [d3.randomBinomial](./d3-random.md#randomBinomial) - from a binomial distribution.
* [d3.randomGamma](./d3-random.md#randomGamma) - from a gamma distribution.
* [d3.randomBeta](./d3-random.md#randomBeta) - from a beta distribution.
* [d3.randomWeibull](./d3-random.md#randomWeibull) - from a Weibull, Gumbel or Fréchet distribution.
* [d3.randomCauchy](./d3-random.md#randomCauchy) - from a Cauchy distribution.
* [d3.randomLogistic](./d3-random.md#randomLogistic) - from a logistic distribution.
* [d3.randomPoisson](./d3-random.md#randomPoisson) - from a Poisson distribution.
* [*random*.source](./d3-random.md#random_source) - set the source of randomness.
* [d3.randomLcg](./d3-random.md#randomLcg) - a seeded pseudorandom number generator.

## [d3-scale](./d3-scale.md)

Encodings that map abstract data to visual representation.

### [Linear scales](./d3-scale/linear.md)

Map a continuous, quantitative domain to a continuous range.

* [d3.scaleLinear](./d3-scale/linear.md#scaleLinear) - create a quantitative linear scale.
* [*linear*](./d3-scale/linear.md#_linear) - compute the range value corresponding to a given domain value.
* [*linear*.invert](./d3-scale/linear.md#linear_invert) - compute the domain value corresponding to a given range value.
* [*linear*.domain](./d3-scale/linear.md#linear_domain) - set the input domain.
* [*linear*.range](./d3-scale/linear.md#linear_range) - set the output range.
* [*linear*.rangeRound](./d3-scale/linear.md#linear_rangeRound) - set the output range and enable rounding.
* [*linear*.clamp](./d3-scale/linear.md#linear_clamp) - enable clamping to the domain or range.
* [*linear*.unknown](./d3-scale/linear.md#linear_unknown) - set the output value for unknown inputs.
* [*linear*.interpolate](./d3-scale/linear.md#linear_interpolate) - set the output interpolator.
* [*linear*.ticks](./d3-scale/linear.md#linear_ticks) - compute representative values from the domain.
* [*linear*.tickFormat](./d3-scale/linear.md#linear_tickFormat) - format ticks for human consumption.
* [*linear*.nice](./d3-scale/linear.md#linear_nice) - extend the domain to nice round numbers.
* [*linear*.copy](./d3-scale/linear.md#linear_copy) - create a copy of this scale.
* [d3.tickFormat](./d3-scale/linear.md#tickFormat) - format ticks for human consumption.
* [d3.scaleIdentity](./d3-scale/linear.md#scaleIdentity) - creates an identity scale.
* [d3.scaleRadial](./d3-scale/linear.md#scaleRadial) - creates a radial scale.

### [Pow scales](./d3-scale/pow.md)

* [d3.scalePow](./d3-scale/pow.md#scalePow) - create a quantitative power scale.
* [d3.scaleSqrt](./d3-scale/pow.md#scaleSqrt) - create a quantitative power scale with exponent 0.5.
* [*pow*.exponent](./d3-scale/pow.md#pow_exponent) - set the power exponent.

### [Log scales](./d3-scale/log.md)

* [d3.scaleLog](./d3-scale/log.md#scaleLog) - create a quantitative logarithmic scale.
* [*log*.base](./d3-scale/log.md#log_base) - set the logarithm base.
* [*log*.ticks](./d3-scale/log.md#log_ticks) - compute representative values from the domain.
* [*log*.tickFormat](./d3-scale/log.md#log_tickFormat) - format ticks for human consumption.
* [*log*.nice](./d3-scale/log.md#log_nice) - extend the domain to nice round numbers.

### [Symlog scales](./d3-scale/symlog.md)

* [d3.scaleSymlog](./d3-scale/symlog.md#scaleSymlog) - create a symmetric logarithmic scale.
* [*symlog*.constant](./d3-scale/symlog.md#symlog_constant) - set the constant of a symlog scale.

### [Time scales](./d3-scale/time.md)

* [d3.scaleTime](./d3-scale/time.md#scaleTime) - create a linear scale for time.
* [*time*.ticks](./d3-scale/time.md#time_ticks) - compute representative values from the domain.
* [*time*.tickFormat](./d3-scale/time.md#time_tickFormat) - format ticks for human consumption.
* [*time*.nice](./d3-scale/time.md#time_nice) - extend the domain to nice round times.
* [d3.scaleUtc](./d3-scale/time.md#scaleUtc) - create a linear scale for UTC.

### [Sequential scales](./d3-scale/sequential.md)

Map a continuous, quantitative domain to a continuous, fixed interpolator.

* [d3.scaleSequential](./d3-scale/sequential.md#scaleSequential) - create a sequential scale.
* [*sequential*.interpolator](./d3-scale/sequential.md#sequential_interpolator) - set the scale’s output interpolator.
* [*sequential*.range](./d3-scale/sequential.md#sequential_range) - set the output range.
* [*sequential*.rangeRound](./d3-scale/sequential.md#sequential_rangeRound) - set the output range and enable rounding.
* [d3.scaleSequentialLog](./d3-scale/sequential.md#scaleSequentialLog) - create a logarithmic sequential scale.
* [d3.scaleSequentialPow](./d3-scale/sequential.md#scaleSequentialPow) - create a power sequential scale.
* [d3.scaleSequentialSqrt](./d3-scale/sequential.md#scaleSequentialSqrt) - create a power sequential scale with exponent 0.5.
* [d3.scaleSequentialSymlog](./d3-scale/sequential.md#scaleSequentialSymlog) - create a symmetric logarithmic sequential scale.
* [d3.scaleSequentialQuantile](./d3-scale/sequential.md#scaleSequentialQuantile) - create a sequential scale using a *p*-quantile transform.
* [*sequentialQuantile*.quantiles](./d3-scale/sequential.md#sequentialQuantile_quantiles) - return the scale’s quantiles.

### [Diverging scales](./d3-scale/diverging.md)

Map a continuous, quantitative domain to a continuous, fixed interpolator.

* [d3.scaleDiverging](./d3-scale/diverging.md#scaleDiverging) - create a diverging scale.
* [*diverging*.interpolator](./d3-scale/diverging.md#diverging_interpolator) - set the scale’s output interpolator.
* [*diverging*.range](./d3-scale/diverging.md#diverging_range) - set the output range.
* [*diverging*.rangeRound](./d3-scale/diverging.md#diverging_rangeRound) - set the output range and enable rounding.
* [d3.scaleDivergingLog](./d3-scale/diverging.md#scaleDivergingLog) - create a diverging logarithmic scale.
* [d3.scaleDivergingPow](./d3-scale/diverging.md#scaleDivergingPow) - create a diverging power scale.
* [d3.scaleDivergingSqrt](./d3-scale/diverging.md#scaleDivergingSqrt) - create a diverging power scale with exponent 0.5.
* [d3.scaleDivergingSymlog](./d3-scale/diverging.md#scaleDivergingSymlog) - create a diverging symmetric logarithmic scale.

### [Quantize scales](./d3-scale/quantize.md)

Map a continuous, quantitative domain to a discrete range.

* [d3.scaleQuantize](./d3-scale/quantize.md#scaleQuantize) - create a uniform quantizing linear scale.
* [*quantize*](./d3-scale/quantize.md#_quantize) - compute the range value corresponding to a given domain value.
* [*quantize*.invertExtent](./d3-scale/quantize.md#quantize_invertExtent) - compute the domain values corresponding to a given range value.
* [*quantize*.domain](./d3-scale/quantize.md#quantize_domain) - set the input domain.
* [*quantize*.range](./d3-scale/quantize.md#quantize_range) - set the output range.
* [*quantize*.thresholds](./d3-scale/quantize.md#quantize_thresholds) - return the array of computed thresholds within the domain.
* [*quantize*.copy](./d3-scale/quantize.md#quantize_copy) - create a copy of this scale.

### [Quantile scales](./d3-scale/quantile.md)

* [d3.scaleQuantile](./d3-scale/quantile.md#scaleQuantile) - create a quantile quantizing linear scale.
* [*quantile*](./d3-scale/quantile.md#_quantile) - compute the range value corresponding to a given domain value.
* [*quantile*.invertExtent](./d3-scale/quantile.md#quantile_invertExtent) - compute the domain values corresponding to a given range value.
* [*quantile*.domain](./d3-scale/quantile.md#quantile_domain) - set the input domain.
* [*quantile*.range](./d3-scale/quantile.md#quantile_range) - set the output range.
* [*quantile*.quantiles](./d3-scale/quantile.md#quantile_quantiles) - get the quantile thresholds.
* [*quantile*.copy](./d3-scale/quantile.md#quantile_copy) - create a copy of this scale.

### [Threshold scales](./d3-scale/threshold.md)

* [d3.scaleThreshold](./d3-scale/threshold.md#scaleThreshold) - create an arbitrary quantizing linear scale.
* [*threshold*](./d3-scale/threshold.md#_threshold) - compute the range value corresponding to a given domain value.
* [*threshold*.invertExtent](./d3-scale/threshold.md#threshold_invertExtent) - compute the domain values corresponding to a given range value.
* [*threshold*.domain](./d3-scale/threshold.md#threshold_domain) - set the input domain.
* [*threshold*.range](./d3-scale/threshold.md#threshold_range) - set the output range.
* [*threshold*.copy](./d3-scale/threshold.md#threshold_copy) - create a copy of this scale.

### [Ordinal scales](./d3-scale/ordinal.md)

Map a discrete domain to a discrete range.

* [d3.scaleOrdinal](./d3-scale/ordinal.md#scaleOrdinal) - create an ordinal scale.
* [*ordinal*](./d3-scale/ordinal.md#_ordinal) - compute the range value corresponding to a given domain value.
* [*ordinal*.domain](./d3-scale/ordinal.md#ordinal_domain) - set the input domain.
* [*ordinal*.range](./d3-scale/ordinal.md#ordinal_range) - set the output range.
* [*ordinal*.unknown](./d3-scale/ordinal.md#ordinal_unknown) - set the output value for unknown inputs.
* [*ordinal*.copy](./d3-scale/ordinal.md#ordinal_copy) - create a copy of this scale.
* [d3.scaleImplicit](./d3-scale/ordinal.md#scaleImplicit) - a special unknown value for implicit domains.

### [Band scales](./d3-scale/band.md)

* [d3.scaleBand](./d3-scale/band.md#scaleBand) - create an ordinal band scale.
* [*band*](./d3-scale/band.md#_band) - compute the band start corresponding to a given domain value.
* [*band*.domain](./d3-scale/band.md#band_domain) - set the input domain.
* [*band*.range](./d3-scale/band.md#band_range) - set the output range.
* [*band*.rangeRound](./d3-scale/band.md#band_rangeRound) - set the output range and enable rounding.
* [*band*.round](./d3-scale/band.md#band_round) - enable rounding.
* [*band*.paddingInner](./d3-scale/band.md#band_paddingInner) - set padding between bands.
* [*band*.paddingOuter](./d3-scale/band.md#band_paddingOuter) - set padding outside the first and last bands.
* [*band*.padding](./d3-scale/band.md#band_padding) - set padding outside and between bands.
* [*band*.align](./d3-scale/band.md#band_align) - set band alignment, if there is extra space.
* [*band*.bandwidth](./d3-scale/band.md#band_bandwidth) - get the width of each band.
* [*band*.step](./d3-scale/band.md#band_step) - get the distance between the starts of adjacent bands.
* [*band*.copy](./d3-scale/band.md#band_copy) - create a copy of this scale.

### [Point scales](./d3-scale/point.md)

* [d3.scalePoint](./d3-scale/point.md#scalePoint) - create an ordinal point scale.
* [*point*](./d3-scale/point.md#_point) - compute the point corresponding to a given domain value.
* [*point*.domain](./d3-scale/point.md#point_domain) - set the input domain.
* [*point*.range](./d3-scale/point.md#point_range) - set the output range.
* [*point*.rangeRound](./d3-scale/point.md#point_rangeRound) - set the output range and enable rounding.
* [*point*.round](./d3-scale/point.md#point_round) - enable rounding.
* [*point*.padding](./d3-scale/point.md#point_padding) - set padding outside the first and last point.
* [*point*.align](./d3-scale/point.md#point_align) - set point alignment, if there is extra space.
* [*point*.bandwidth](./d3-scale/point.md#point_bandwidth) - returns zero.
* [*point*.step](./d3-scale/point.md#point_step) - get the distance between the starts of adjacent points.
* [*point*.copy](./d3-scale/point.md#point_copy) - create a copy of this scale.

## [d3-scale-chromatic](./d3-scale-chromatic.md)

Color ramps and palettes for quantitative, ordinal and categorical scales.

### [Categorical](./d3-scale-chromatic/categorical.md)

* [d3.schemeCategory10](./d3-scale-chromatic/categorical.md#schemeCategory10) - an array of ten categorical colors.
* [d3.schemeAccent](./d3-scale-chromatic/categorical.md#schemeAccent) - an array of eight categorical colors.
* [d3.schemeDark2](./d3-scale-chromatic/categorical.md#schemeDark2) - an array of eight categorical colors.
* [d3.schemeObservable10](./d3-scale-chromatic/categorical.md#schemeObservable10) - an array of ten categorical colors.
* [d3.schemePaired](./d3-scale-chromatic/categorical.md#schemePaired) - an array of twelve categorical colors.
* [d3.schemePastel1](./d3-scale-chromatic/categorical.md#schemePastel1) - an array of nine categorical colors.
* [d3.schemePastel2](./d3-scale-chromatic/categorical.md#schemePastel2) - an array of eight categorical colors.
* [d3.schemeSet1](./d3-scale-chromatic/categorical.md#schemeSet1) - an array of nine categorical colors.
* [d3.schemeSet2](./d3-scale-chromatic/categorical.md#schemeSet2) - an array of eight categorical colors.
* [d3.schemeSet3](./d3-scale-chromatic/categorical.md#schemeSet3) - an array of twelve categorical colors.
* [d3.schemeTableau10](./d3-scale-chromatic/categorical.md#schemeTableau10) - an array of ten categorical colors.

### [Cyclical](./d3-scale-chromatic/cyclical.md)

* [d3.interpolateRainbow](./d3-scale-chromatic/cyclical.md#interpolateRainbow) - the “less-angry” rainbow
* [d3.interpolateSinebow](./d3-scale-chromatic/cyclical.md#interpolateSinebow) - the “sinebow” smooth rainbow

### [Diverging](./d3-scale-chromatic/diverging.md)

* [d3.interpolateBrBG](./d3-scale-chromatic/diverging.md#interpolateBrBG) - ColorBrewer BrBG interpolator.
* [d3.interpolatePiYG](./d3-scale-chromatic/diverging.md#interpolatePiYG) - ColorBrewer PiYG interpolator.
* [d3.interpolatePRGn](./d3-scale-chromatic/diverging.md#interpolatePRGn) - ColorBrewer PRGn interpolator.
* [d3.interpolatePuOr](./d3-scale-chromatic/diverging.md#interpolatePuOr) - ColorBrewer PuOr interpolator.
* [d3.interpolateRdBu](./d3-scale-chromatic/diverging.md#interpolateRdBu) - ColorBrewer RdBu interpolator.
* [d3.interpolateRdGy](./d3-scale-chromatic/diverging.md#interpolateRdGy) - ColorBrewer RdGy interpolator.
* [d3.interpolateRdYlBu](./d3-scale-chromatic/diverging.md#interpolateRdYlBu) - ColorBrewer RdYlBu interpolator.
* [d3.interpolateRdYlGn](./d3-scale-chromatic/diverging.md#interpolateRdYlGn) - ColorBrewer RdYlGn interpolator.
* [d3.interpolateSpectral](./d3-scale-chromatic/diverging.md#interpolateSpectral) - ColorBrewer spectral interpolator.
* [d3.schemeBrBG](./d3-scale-chromatic/diverging.md#schemeBrBG) - ColorBrewer BrBG scheme.
* [d3.schemePiYG](./d3-scale-chromatic/diverging.md#schemePiYG) - ColorBrewer PiYG scheme.
* [d3.schemePRGn](./d3-scale-chromatic/diverging.md#schemePRGn) - ColorBrewer PRGn scheme.
* [d3.schemePuOr](./d3-scale-chromatic/diverging.md#schemePuOr) - ColorBrewer PuOr scheme.
* [d3.schemeRdBu](./d3-scale-chromatic/diverging.md#schemeRdBu) - ColorBrewer RdBu scheme.
* [d3.schemeRdGy](./d3-scale-chromatic/diverging.md#schemeRdGy) - ColorBrewer RdGy scheme.
* [d3.schemeRdYlBu](./d3-scale-chromatic/diverging.md#schemeRdYlBu) - ColorBrewer RdYlBu scheme.
* [d3.schemeRdYlGn](./d3-scale-chromatic/diverging.md#schemeRdYlGn) - ColorBrewer RdYlGn scheme.
* [d3.schemeSpectral](./d3-scale-chromatic/diverging.md#schemeSpectral) - ColorBrewer spectral scheme.

### [Sequential](./d3-scale-chromatic/sequential.md)

* [d3.interpolateBlues](./d3-scale-chromatic/sequential.md#interpolateBlues) -
* [d3.interpolateGreens](./d3-scale-chromatic/sequential.md#interpolateGreens) -
* [d3.interpolateGreys](./d3-scale-chromatic/sequential.md#interpolateGreys) -
* [d3.interpolateOranges](./d3-scale-chromatic/sequential.md#interpolateOranges) -
* [d3.interpolatePurples](./d3-scale-chromatic/sequential.md#interpolatePurples) -
* [d3.interpolateReds](./d3-scale-chromatic/sequential.md#interpolateReds) -
* [d3.schemeBlues](./d3-scale-chromatic/sequential.md#schemeBlues) -
* [d3.schemeGreens](./d3-scale-chromatic/sequential.md#schemeGreens) -
* [d3.schemeGreys](./d3-scale-chromatic/sequential.md#schemeGreys) -
* [d3.schemeOranges](./d3-scale-chromatic/sequential.md#schemeOranges) -
* [d3.schemePurples](./d3-scale-chromatic/sequential.md#schemePurples) -
* [d3.schemeReds](./d3-scale-chromatic/sequential.md#schemeReds) -
* [d3.interpolateBuGn](./d3-scale-chromatic/sequential.md#interpolateBuGn) - ColorBrewer BuGn interpolator.
* [d3.interpolateBuPu](./d3-scale-chromatic/sequential.md#interpolateBuPu) - ColorBrewer BuPu interpolator.
* [d3.interpolateCividis](./d3-scale-chromatic/sequential.md#interpolateCividis) - cividis interpolator.
* [d3.interpolateCool](./d3-scale-chromatic/sequential.md#interpolateCool) - cool interpolator.
* [d3.interpolateCubehelixDefault](./d3-scale-chromatic/sequential.md#interpolateCubehelixDefault) - cubehelix interpolator.
* [d3.interpolateGnBu](./d3-scale-chromatic/sequential.md#interpolateGnBu) - ColorBrewer GnBu interpolator.
* [d3.interpolateInferno](./d3-scale-chromatic/sequential.md#interpolateInferno) - inferno interpolator.
* [d3.interpolateMagma](./d3-scale-chromatic/sequential.md#interpolateMagma) - magma interpolator.
* [d3.interpolateOrRd](./d3-scale-chromatic/sequential.md#interpolateOrRd) - ColorBrewer OrRd interpolator.
* [d3.interpolatePlasma](./d3-scale-chromatic/sequential.md#interpolatePlasma) - plasma interpolator.
* [d3.interpolatePuBu](./d3-scale-chromatic/sequential.md#interpolatePuBu) - ColorBrewer PuBu interpolator.
* [d3.interpolatePuBuGn](./d3-scale-chromatic/sequential.md#interpolatePuBuGn) - ColorBrewer PuBuGn interpolator.
* [d3.interpolatePuRd](./d3-scale-chromatic/sequential.md#interpolatePuRd) - ColorBrewer PuRd interpolator.
* [d3.interpolateRdPu](./d3-scale-chromatic/sequential.md#interpolateRdPu) - ColorBrewer RdPu interpolator.
* [d3.interpolateTurbo](./d3-scale-chromatic/sequential.md#interpolateTurbo) - turbo interpolator.
* [d3.interpolateViridis](./d3-scale-chromatic/sequential.md#interpolateViridis) - viridis interpolator.
* [d3.interpolateWarm](./d3-scale-chromatic/sequential.md#interpolateWarm) - warm interpolator.
* [d3.interpolateYlGn](./d3-scale-chromatic/sequential.md#interpolateYlGn) - ColorBrewer YlGn interpolator.
* [d3.interpolateYlGnBu](./d3-scale-chromatic/sequential.md#interpolateYlGnBu) - ColorBrewer YlGnBu interpolator.
* [d3.interpolateYlOrBr](./d3-scale-chromatic/sequential.md#interpolateYlOrBr) - ColorBrewer YlOrBr interpolator.
* [d3.interpolateYlOrRd](./d3-scale-chromatic/sequential.md#interpolateYlOrRd) - ColorBrewer YlOrRd interpolator.
* [d3.schemeBuGn](./d3-scale-chromatic/sequential.md#schemeBuGn) - ColorBrewer BuGn scheme.
* [d3.schemeBuPu](./d3-scale-chromatic/sequential.md#schemeBuPu) - ColorBrewer BuPu scheme.
* [d3.schemeGnBu](./d3-scale-chromatic/sequential.md#schemeGnBu) - ColorBrewer GnBu scheme.
* [d3.schemeOrRd](./d3-scale-chromatic/sequential.md#schemeOrRd) - ColorBrewer OrRd scheme.
* [d3.schemePuBu](./d3-scale-chromatic/sequential.md#schemePuBu) - ColorBrewer PuBu scheme.
* [d3.schemePuBuGn](./d3-scale-chromatic/sequential.md#schemePuBuGn) - ColorBrewer PuBuGn scheme.
* [d3.schemePuRd](./d3-scale-chromatic/sequential.md#schemePuRd) - ColorBrewer PuRd scheme.
* [d3.schemeRdPu](./d3-scale-chromatic/sequential.md#schemeRdPu) - ColorBrewer RdPu scheme.
* [d3.schemeYlGn](./d3-scale-chromatic/sequential.md#schemeYlGn) - ColorBrewer YlGn scheme.
* [d3.schemeYlGnBu](./d3-scale-chromatic/sequential.md#schemeYlGnBu) - ColorBrewer YlGnBu scheme.
* [d3.schemeYlOrBr](./d3-scale-chromatic/sequential.md#schemeYlOrBr) - ColorBrewer YlOrBr scheme.
* [d3.schemeYlOrRd](./d3-scale-chromatic/sequential.md#schemeYlOrRd) - ColorBrewer YlOrRd scheme.

## [d3-selection](./d3-selection.md)

Transform the DOM by selecting elements and joining to data.

### [Selecting elements](./d3-selection/selecting.md)

* [d3.selection](./d3-selection/selecting.md#selection) - select the root document element.
* [d3.select](./d3-selection/selecting.md#