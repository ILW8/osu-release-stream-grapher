/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

class ScriptContentReader {
	tagContents: string = "";
	text(text: Text) {
		this.tagContents = this.tagContents + text.text;
	}
}

interface BuildHistory { label: "Web" | "Stable" | "Beta" | "Cutting Edge" | "Lazer", user_count: number, created_at: string }

interface JsonChartConfig {
	build_history: [BuildHistory];
	order: [string];
}

interface ThingDataset { label: string, data: [number?] }

export default {
	async fetch(request: Request): Promise<Response> {
		const pathName = new URL(request.url).pathname;
		if (pathName != '/') {
			return new Response("", {status: 404})
		}
		const res = await fetch("https://osu.ppy.sh/home/changelog");
		const scriptContentReader = new ScriptContentReader();
		await new HTMLRewriter().on('script#json-chart-config', scriptContentReader).transform(res).text();

		const parsed: JsonChartConfig = JSON.parse(scriptContentReader.tagContents);

		let a: {
			Beta: ThingDataset,
			Lazer: ThingDataset,
			Stable: ThingDataset,
			"Cutting Edge": ThingDataset} = {
			"Lazer": {label: "Lazer", data: []},
			"Stable": {label: "Stable", data: []},
			"Beta": {label: "Beta", data: []},
			"Cutting Edge": {label: "Cutting Edge", data: []},
		};
		let labels: string[] = [];
		for (const buildHistoryElement of parsed.build_history) {
			switch (buildHistoryElement.label) {
				case "Web":
					break;
				default:
					if (labels[labels.length - 1] != buildHistoryElement.created_at) {
						labels.push(buildHistoryElement.created_at);
					}
					a[buildHistoryElement.label].data.push(buildHistoryElement.user_count)
					break;
			}
		}

		const html = `
<!DOCTYPE html>
<head>
	<title>727</title>
</head>
<body>
	<div>
		<canvas id="myChart"></canvas>
	</div>

	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
	<script>
		const ctx = document.getElementById('myChart');

		new Chart(ctx, {
			type: 'line',
			data: {
				labels: ${JSON.stringify(labels)},
				datasets: ${JSON.stringify(Object.values(a))}
			},
			options: {
				elements: {
					point: {
						pointStyle: false
					},
					line: {
						fill: true,
						cubicInterpolationMode: 'monotone'
					}
				},
				scales: {
					y: {
						stacked: true,
						beginAtZero: true
					}
				}
			}
		});
	</script>
</body>
`;

		return new Response(html, {
			headers: {
				"content-type": "text/html;charset=UTF-8",
			},
		});
	},
};
