let pipeline = null
let loading = false

export function isSemanticAvailable() {
  return pipeline !== null
}

export function isSemanticLoading() {
  return loading
}

export async function loadSemanticModel(onProgress) {
  if (pipeline) return
  loading = true
  try {
    const { pipeline: createPipeline } = await import('@xenova/transformers')
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: onProgress,
    })
  } finally {
    loading = false
  }
}

export async function computeEmbedding(text) {
  if (!pipeline) throw new Error('Semantic model not loaded')
  const output = await pipeline(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

export function cosineSimilarity(a, b) {
  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }
  return dot
}
