/**
 * Continuation of Task ID: 2 — generates only the missing images (hero, atelier).
 * Skips files that already exist and are non-trivially sized.
 */
import fs from 'node:fs';
import path from 'node:path';
import ZAI from 'z-ai-web-dev-sdk';

const OUT_DIR = '/home/z/my-project/public/images';

type ImageJob = {
  filename: string;
  size: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440';
  prompt: string;
};

const JOBS: ImageJob[] = [
  {
    // NOTE: Task spec asked for '1440x720', but the upstream API rejects it
    // (720 is not a multiple of 32 — error code 1214). The closest valid wide
    // hero aspect ratio listed by the SDK is '1344x768' (both divisible by 32,
    // ~1.75:1, ≈16:9). Frontend can crop/scale via object-fit: cover.
    filename: 'hero.png',
    size: '1344x768',
    prompt:
      "Ultra-luxury macro photograph of an exquisite mechanical wristwatch on black velvet, dramatic single-source warm rim lighting, gold case, deep midnight blue dial, exposed tourbillon, fine dust particles in light beam, cinematic moody dark background, hyper-detailed, professional product photography, 8k, no text",
  },
  {
    filename: 'atelier.png',
    size: '1344x768',
    prompt:
      "Master watchmaker's atelier, hands holding tweezers over a disassembled luxury watch movement, warm focused task lamp, dark workshop background, brass tools, cinematic chiaroscuro lighting, hyper-detailed craftsmanship scene, no text",
  },
];

const MAX_RETRIES = 3;
const MIN_BYTES = 50 * 1024; // 50KB

async function generateOne(zai: ZAI, job: ImageJob): Promise<{ path: string; bytes: number }> {
  const outPath = path.join(OUT_DIR, job.filename);
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[${job.filename}] attempt ${attempt}/${MAX_RETRIES} — size=${job.size}`);
      const resp = await zai.images.generations.create({
        prompt: job.prompt,
        size: job.size,
      });

      const base64 = resp?.data?.[0]?.base64;
      if (!base64 || typeof base64 !== 'string' || base64.length === 0) {
        throw new Error(`Empty base64 in response: ${JSON.stringify(resp).slice(0, 200)}`);
      }

      const buf = Buffer.from(base64, 'base64');
      if (buf.length < 1024) {
        throw new Error(`Decoded buffer too small (${buf.length} bytes)`);
      }

      fs.writeFileSync(outPath, buf);
      const bytes = fs.statSync(outPath).size;
      console.log(`[${job.filename}] OK — wrote ${bytes} bytes`);
      return { path: outPath, bytes };
    } catch (err: any) {
      lastErr = err;
      console.error(`[${job.filename}] attempt ${attempt} failed: ${err?.message ?? err}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }

  throw new Error(
    `[${job.filename}] failed after ${MAX_RETRIES} attempts: ${(lastErr as any)?.message ?? lastErr}`,
  );
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Initializing ZAI SDK...');
  const zai = await ZAI.create();
  console.log('ZAI SDK ready.');

  const results: Array<{ filename: string; path: string; bytes: number; ok: boolean; error?: string }> = [];

  for (const job of JOBS) {
    const existing = path.join(OUT_DIR, job.filename);
    if (fs.existsSync(existing)) {
      const sz = fs.statSync(existing).size;
      if (sz >= MIN_BYTES) {
        console.log(`[${job.filename}] already exists (${sz} bytes), skipping.`);
        results.push({ filename: job.filename, path: existing, bytes: sz, ok: true });
        continue;
      }
    }
    try {
      const { path: p, bytes } = await generateOne(zai, job);
      results.push({ filename: job.filename, path: p, bytes, ok: true });
    } catch (err: any) {
      console.error(err.message);
      results.push({ filename: job.filename, path: '', bytes: 0, ok: false, error: err.message });
    }
  }

  console.log('\n========== SUMMARY (continuation) ==========');
  for (const r of results) {
    if (r.ok) console.log(`OK   ${r.filename}  ${r.bytes} bytes  -> ${r.path}`);
    else console.log(`FAIL ${r.filename}  ${r.error}`);
  }
  console.log('============================================');

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`${failed.length} image(s) failed: ${failed.map((f) => f.filename).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
