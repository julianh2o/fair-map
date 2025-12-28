declare module 'heic-convert' {
	interface ConvertOptions {
		// eslint-disable-next-line no-undef
		buffer: Buffer;
		format: 'JPEG' | 'PNG';
		quality: number;
	}

	function convert(options: ConvertOptions): Promise<Uint8Array>;

	export = convert;
}
