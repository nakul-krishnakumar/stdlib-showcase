import { type ChartConfiguration, type ChartDataset, type Point as ChartPoint } from "chart.js";
import dminkowski from "@stdlib/stats-strided-distances-dminkowski";
import dcityblock from "@stdlib/stats-strided-distances-dcityblock";
import dsquaredEuclidean from "@stdlib/stats-strided-distances-dsquared-euclidean";
import dchebychev from "@stdlib/stats-strided-distances-dchebychev";
import deuclidean from "@stdlib/stats-strided-distances-deuclidean";
import { cos, sin, abs, clamp } from "@stdlib/math/base/special";
import randu from '@stdlib/random/base/randu';
import PI from '@stdlib/constants/float64/pi';
import { MetricConfig, Point, Palette } from "./types";

const EXTENT = 2;
const SAMPLE_STEPS = 512;
const SEARCH_STEPS = 128;
const BINARY_ITERS = 18;
const COLOR_SEQUENCE = [
	"#f87171",
	"#34d399",
	"#60a5fa",
	"#fbbf24",
	"#a78bfa",
	"#fb7185",
	"#38bdf8",
	"#f472b6",
];
const CENTER: Point = { x: 0.000, y: 0.000 };
const SCRATCH_A = new Float64Array( 2 );
const SCRATCH_B = new Float64Array( 2 );

export function buildChartDatasets( metrics: MetricConfig[] ): ChartDataset<"line", ChartPoint[]>[] {
	const datasets: ChartDataset<"line", ChartPoint[]>[] = metrics.map( ( metric, index ) => {
		const palette = paletteForIndex( index );
		const shape = generateShape( metric );
		
		return {
			label: metric.type === "minkowski" ? `${metric.label} (p=${( metric.p ?? 3 ).toFixed( 1 )})` : metric.label,
			data: shape,
			fill: true,
			backgroundColor: palette.fill,
			borderColor: palette.stroke,
			borderWidth: 2,
			pointRadius: 0,
			pointHoverRadius: 0,
			tension: 0,
		};
	} );
	
	// Add center point marker
	datasets.push( {
		label: "Center",
		data: [{ x: CENTER.x, y: CENTER.y }],
		fill: false,
		backgroundColor: "#f8fafc",
		borderColor: "#f8fafc",
		borderWidth: 0,
		pointRadius: 6,
		pointHoverRadius: 8,
		pointStyle: "circle",
		showLine: false,
	} );
	
	return datasets;
}

export function createChartConfig( datasets: ChartDataset<"line", ChartPoint[]>[] ): ChartConfiguration<"line", ChartPoint[]> {
	return {
		type: "line",
		data: {
			datasets,
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: {
				duration: 300,
			},
			interaction: {
				mode: "nearest",
				intersect: false,
			},
			scales: {
				x: {
					type: "linear",
					position: "bottom",
					min: -EXTENT,
					max: EXTENT,
					title: {
						display: true,
						text: "x",
						color: "#e2e8f0",
					},
					grid: {
						color: "rgba( 248, 250, 252, 0.08 )",
					},
					ticks: {
						color: "#cbd5f5",
					},
					border: {
						color: "rgba( 248, 250, 252, 0.2 )",
					},
				},
				y: {
					type: "linear",
					position: "left",
					min: -EXTENT,
					max: EXTENT,
					title: {
						display: true,
						text: "y",
						color: "#e2e8f0",
					},
					grid: {
						color: "rgba( 248, 250, 252, 0.08 )",
					},
					ticks: {
						color: "#cbd5f5",
					},
					border: {
						color: "rgba( 248, 250, 252, 0.2 )",
					},
				},
			},
			plugins: {
				legend: {
					display: true,
					position: "top",
					labels: {
						color: "#e2e8f0",
						usePointStyle: true,
						padding: 16,
					},
				},
				tooltip: {
					enabled: true,
					mode: "nearest",
					intersect: false,
					callbacks: {
						label: function( context ) {
							return context.dataset.label || "";
						},
					},
				},
			},
		},
	};
}

export function paletteForIndex( index: number ): Palette {
	const color = COLOR_SEQUENCE[index % COLOR_SEQUENCE.length];
	return {
		stroke: color,
		fill: hexToRgba( color, 0.2 ),
	};
}

export function generateShape( config: MetricConfig ) {
	const points: Array<Point> = [];
	for ( let step = 0; step <= SAMPLE_STEPS; step++ ) {
		const theta = ( step / SAMPLE_STEPS ) * PI * 2;
		const dirX = cos( theta );
		const dirY = sin( theta );
		const radius = findRadius( dirX, dirY, config );
		const x = CENTER.x + dirX * radius;
		const y = CENTER.y + dirY * radius;
		points.push( { x, y } );
	}
	return points;
}

export function findRadius( dirX: number, dirY: number, config: MetricConfig ) {
	const maxRadius = EXTENT;
	let low = 0;
	let high = maxRadius;
	let bestRadius = maxRadius;
	let bestDelta = Number.POSITIVE_INFINITY;
	let foundBracket = false;
	
	for ( let step = 0; step <= SEARCH_STEPS; step++ ) {
		const radius = ( step / SEARCH_STEPS ) * maxRadius;
		const distance = evaluateDistance( config, dirX, dirY, radius );
		if ( !Number.isFinite( distance ) ) {
			continue;
		}
		const delta = abs( distance - 1 );
		if ( delta < bestDelta ) {
			bestDelta = delta;
			bestRadius = radius;
		}
		if ( distance > 1 ) {
			high = radius;
			foundBracket = true;
			break;
		}
		low = radius;
	}
	
	if ( !foundBracket ) {
		return bestRadius;
	}
	
	for ( let iter = 0; iter < BINARY_ITERS; iter++ ) {
		const radius = ( low + high ) / 2;
		const distance = evaluateDistance( config, dirX, dirY, radius );
		if ( !Number.isFinite( distance ) ) {
			high = radius;
			continue;
		}
		const delta = abs( distance - 1 );
		if ( delta < bestDelta ) {
			bestDelta = delta;
			bestRadius = radius;
		}
		if ( distance > 1 ) {
			high = radius;
		} else {
			low = radius;
		}
	}
	
	return bestRadius;
}

export function evaluateDistance( config: MetricConfig, dirX: number, dirY: number, radius: number ) {
	SCRATCH_A[0] = CENTER.x;
	SCRATCH_A[1] = CENTER.y;
	SCRATCH_B[0] = CENTER.x + dirX * radius;
	SCRATCH_B[1] = CENTER.y + dirY * radius;
	
	switch ( config.type ) {
		case "minkowski":
		return dminkowski.ndarray( 
			2,
			clamp( config.p ?? 3, 1, 12 ),
			SCRATCH_A,
			1,
			0,
			SCRATCH_B,
			1,
			0
		 );
		case "cityblock":
		return dcityblock.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		case "squaredEuclidean":
		return dsquaredEuclidean.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		case "euclidean":
		return deuclidean.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		case "chebyshev":
		return dchebychev.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		default:
		return NaN;
	}
}

export function uniqueId() {
	if ( typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${randu().toString( 36 ).slice( 2 )}`;
}

export function hexToRgba( hex: string, alpha: number ) {
	const normalized = hex.replace( "#", "" );
	const value = parseInt( normalized, 16 );
	const r = ( value >> 16 ) & 255;
	const g = ( value >> 8 ) & 255;
	const b = value & 255;
	return `rgba( ${r},${g},${b},${alpha} )`;
}