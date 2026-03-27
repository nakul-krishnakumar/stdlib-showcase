"use client";

import { Chart, registerables, type ChartConfiguration, type ChartDataset, type Point as ChartPoint } from "chart.js";
import { useEffect, useMemo, useRef, useState } from "react";
import dminkowski from "@stdlib/stats-strided-distances-dminkowski";
import dcityblock from "@stdlib/stats-strided-distances-dcityblock";
import dsquaredEuclidean from "@stdlib/stats-strided-distances-dsquared-euclidean";
import dcosineDistance from "@stdlib/stats-strided-distances-dcosine-distance";
import dchebychev from "@stdlib/stats-strided-distances-dchebychev";
import deuclidean from "@stdlib/stats-strided-distances-deuclidean";
import { cos, sin, abs, min, max } from "@stdlib/math/base/special";
import randu from '@stdlib/random/base/randu';
import PI from '@stdlib/constants/float64/pi';

// Register all Chart.js components
Chart.register( ...registerables );

type Point = { x: number; y: number };

type MetricType =
| "minkowski"
| "cityblock"
| "squaredEuclidean"
| "cosine"
| "euclidean"
| "chebyshev";

type MetricConfig = {
	id: string;
	type: MetricType;
	label: string;
	p?: number;
};

type Palette = { stroke: string; fill: string };

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
const CENTER: Point = { x: 0.0001, y: -0.0001 };
const SCRATCH_A = new Float64Array( 2 );
const SCRATCH_B = new Float64Array( 2 );

const OPTIONS: Array<Omit<MetricConfig, "id">> = [
	{
		type: "minkowski",
		label: "Minkowski ( custom p )",
		p: 3,
	},
	{
		type: "euclidean",
		label: "Euclidean",
	},
	{
		type: "squaredEuclidean",
		label: "Squared Euclidean",
	},
	{
		type: "cityblock",
		label: "Cityblock",
	},
	{
		type: "chebyshev",
		label: "Chebyshev ( L-infinity )",
	},
	{
		type: "cosine",
		label: "Cosine Distance",
	},
];

export default function Home() {
	const [metrics, setMetrics] = useState<MetricConfig[]>( () => [] );
	const [selectedType, setSelectedType] = useState<MetricType>( "minkowski" );
	const [pendingP, setPendingP] = useState( 3 );
	const canvasRef = useRef<HTMLCanvasElement | null>( null );
	const chartRef = useRef<Chart | null>( null );
	
	const datasets = useMemo( () => buildChartDatasets( metrics ), [metrics] );
	const chartConfig = useMemo( () => createChartConfig( datasets ), [datasets] );
	
	useEffect( () => {
		const canvas = canvasRef.current;
		if ( !canvas ) {
			return undefined;
		}
		
		// Destroy existing chart if any
		if ( chartRef.current ) {
			chartRef.current.destroy();
		}
		
		// Create new chart
		chartRef.current = new Chart( canvas, chartConfig );
		
		return () => {
			if ( chartRef.current ) {
				chartRef.current.destroy();
				chartRef.current = null;
			}
		};
	}, [chartConfig] );
	
	// Handle resize
	useEffect( () => {
		function handleResize() {
			if ( chartRef.current ) {
				chartRef.current.resize();
			}
		}
		
		window.addEventListener( "resize", handleResize );
		return () => {
			window.removeEventListener( "resize", handleResize );
		};
	}, [] );
	
	const addMetric = () => {
		const option = OPTIONS.find( ( item ) => item.type === selectedType );
		if ( !option ) {
			return;
		}
		const next: MetricConfig = {
			...option,
			id: `metric-${uniqueId()}`,
			p: selectedType === "minkowski" ? pendingP : option.p,
		};
		setMetrics( ( prev ) => [...prev, next] );
	};
	
	const removeMetric = ( id: string ) => {
		setMetrics( ( prev ) => prev.filter( ( metric ) => metric.id !== id ) );
	};
	
	const updateMinkowskiP = ( id: string, value: number ) => {
		setMetrics( ( prev ) =>
			prev.map( ( metric ) =>
				metric.id === id
		? {
			...metric,
			p: clamp( value, 1, 12 ),
		}
		: metric
	 )
 );
};

return ( 
	<main className="min-h-screen bg-slate-950 text-slate-100">
	<div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
	<section className="space-y-6">
	<header className="space-y-2">
	<h1 className="text-3xl font-semibold text-white">Distance Metric Playground</h1>
	<p className="text-sm text-slate-400">Build using <code>@stdlib/stats-strided-distances</code> library for the implementations of all the distance metrics used.</p>
	</header>
	
	<div className="space-y-3">
	{metrics.map( ( metric, index ) => ( 
		<div key={metric.id} className="rounded-xl border border-white/15 p-4 text-sm">
		<div className="flex items-center justify-between">
		<span className="font-semibold" style={{ color: paletteForIndex( index ).stroke }}>
		{metric.type === "minkowski"
			? `${metric.label} ( p=${( metric.p ?? 3 ).toFixed( 1 )} )`
			: metric.label}
			</span>
			<button onClick={() => removeMetric( metric.id )} className="rounded border border-white/20 px-2 py-0.5 text-xs text-slate-300">
			remove
			</button>
			</div>
			{metric.type === "minkowski" && ( 
				<label className="mt-3 block text-xs uppercase tracking-[0.3em] text-slate-300">
				Adjust p
				<input
				type="range"
				min={1}
				max={10}
				step={0.1}
				value={metric.p ?? 3}
				onChange={( event ) => updateMinkowskiP( metric.id, parseFloat( event.target.value ) )}
				className="mt-2 w-full accent-fuchsia-400"
				/>
				</label>
			 )}
			</div>
		 ) )}
		{metrics.length === 0 && ( 
			<p className="rounded-xl border border-dashed border-white/20 p-4 text-xs text-slate-400">No metrics added yet.</p>
		 )}
		</div>
		
		<div className="rounded-xl border border-white/15 p-4 text-sm">
		<label className="block text-xs uppercase tracking-[0.3em] text-slate-300">
		Metric type
		<select
		value={selectedType}
		onChange={( event ) => setSelectedType( event.target.value as MetricType )}
		className="mt-2 w-full rounded border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
		>
		{OPTIONS.map( ( option ) => ( 
			<option key={option.type} value={option.type} className="bg-slate-900 text-white">
			{option.label}
			</option>
		 ) )}
		</select>
		</label>
		
		{selectedType === "minkowski" && ( 
			<label className="mt-4 block text-xs uppercase tracking-[0.3em] text-slate-300">
			Order p
			<div className="flex items-center gap-3">
			<input
			type="range"
			min={1}
			max={10}
			step={0.1}
			value={pendingP}
			onChange={( event ) => setPendingP( parseFloat( event.target.value ) )}
			className="mt-2 flex-1 accent-fuchsia-400"
			/>
			<span className="font-mono text-base">{pendingP.toFixed( 1 )}</span>
			</div>
			</label>
		 )}
		
		<button onClick={addMetric} className="mt-4 w-full rounded border border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
		Add metric
		</button>
		</div>
		</section>
		
		<section>
		<div className="relative h-[70vh] min-h-130 rounded-3xl border border-white/15 bg-slate-900 p-4 ">
		<canvas ref={canvasRef} className="h-full w-full p-4 pl-2" />
		</div>
		</section>
		</div>
		</main>
	 );
}

function buildChartDatasets( metrics: MetricConfig[] ): ChartDataset<"line", ChartPoint[]>[] {
	const datasets: ChartDataset<"line", ChartPoint[]>[] = metrics.map( ( metric, index ) => {
		const palette = paletteForIndex( index );
		const shape = generateShape( metric );
		
		return {
			label: metric.type === "minkowski" ? `${metric.label} ( p=${( metric.p ?? 3 ).toFixed( 1 )} )` : metric.label,
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

function createChartConfig( datasets: ChartDataset<"line", ChartPoint[]>[] ): ChartConfiguration<"line", ChartPoint[]> {
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

function paletteForIndex( index: number ): Palette {
	const color = COLOR_SEQUENCE[index % COLOR_SEQUENCE.length];
	return {
		stroke: color,
		fill: hexToRgba( color, 0.2 ),
	};
}

function generateShape( config: MetricConfig ) {
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

function findRadius( dirX: number, dirY: number, config: MetricConfig ) {
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

function evaluateDistance( config: MetricConfig, dirX: number, dirY: number, radius: number ) {
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
		case "cosine":
		return dcosineDistance.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		case "euclidean":
		return deuclidean.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		case "chebyshev":
		return dchebychev.ndarray( 2, SCRATCH_A, 1, 0, SCRATCH_B, 1, 0 );
		default:
		return NaN;
	}
}

function uniqueId() {
	if ( typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${randu().toString( 36 ).slice( 2 )}`;
}

function clamp( value: number, minN: number, maxN: number ) {
	return min(  max( value, minN ), maxN  );
}

function hexToRgba( hex: string, alpha: number ) {
	const normalized = hex.replace( "#", "" );
	const value = parseInt( normalized, 16 );
	const r = ( value >> 16 ) & 255;
	const g = ( value >> 8 ) & 255;
	const b = value & 255;
	return `rgba( ${r},${g},${b},${alpha} )`;
}
