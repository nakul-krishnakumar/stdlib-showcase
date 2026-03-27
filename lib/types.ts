export type MetricType =
| "minkowski"
| "cityblock"
| "squaredEuclidean"
| "cosine"
| "euclidean"
| "chebyshev";

export type MetricConfig = {
	id: string;
	type: MetricType;
	label: string;
	p?: number;
};

export type Point = { x: number; y: number };

export type Palette = { stroke: string; fill: string };