/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

class ScriptContentReader {
	tagContents: string = "";
	text(text: Text) {
		this.tagContents = this.tagContents + text.text;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const pathName = new URL(request.url).pathname;
		if (pathName != '/') {
			return new Response("", {status: 404})
		}
		const res = await fetch("https://osu.ppy.sh/home/changelog");
		const scriptContentReader = new ScriptContentReader();
		await new HTMLRewriter().on('script#json-index', scriptContentReader).transform(res).text();
		const parsed = JSON.parse(scriptContentReader.tagContents);

		// todo: do something with parsed json here

		return new Response(JSON.stringify(parsed));
	},
};
