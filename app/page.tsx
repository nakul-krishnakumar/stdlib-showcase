"use client";

import { Chart, registerables } from "chart.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildChartDatasets, createChartConfig, paletteForIndex, uniqueId } from "../lib/utils";
import { MetricConfig, MetricType } from "../lib/types";
import { clamp } from "@stdlib/math/base/special";

// Register all Chart.js components
Chart.register( ...registerables );

const OPTIONS: Array<Omit<MetricConfig, "id">> = [
	{
		type: "minkowski",
		label: "Minkowski",
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
		label: "Chebyshev (L-infinity)",
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
	<p className="text-sm text-slate-400">Build using <code>@stdlib/stats-strided-distances</code></p>
	</header>
	
	<div className="space-y-3">
	{metrics.map( ( metric, index ) => ( 
		<div key={metric.id} className="rounded-xl border border-white/15 p-4 text-sm">
		<div className="flex items-center justify-between">
		<span className="font-semibold" style={{ color: paletteForIndex( index ).stroke }}>
		{metric.type === "minkowski"
			? `${metric.label} (p=${( metric.p ?? 3 ).toFixed( 1 )})`
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