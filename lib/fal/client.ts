const FAL_KEY = process.env.FAL_KEY!
const FAL_LORA_PATH = process.env.FAL_LORA_PATH!
const FAL_LORA_SCALE = parseFloat(process.env.FAL_LORA_SCALE || '0.7')

const FAL_QUEUE_BASE_URL = 'https://queue.fal.run'
const MODEL_ID = 'fal-ai/z-image/turbo/lora'

// fal.ai Queue API response types
export interface FalQueueSubmitResponse {
  request_id: string
  response_url: string
  status_url: string
  cancel_url: string
}

export interface FalQueueStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'
  queue_position?: number
  response_url: string
  logs?: FalLog[]
  metrics?: Record<string, number>
}

export interface FalLog {
  timestamp: string
  message: string
  level?: string
  source?: string
}

export interface FalImageOutput {
  url: string
  content_type: string
  file_name?: string
  file_size?: number
  width: number
  height: number
}

export interface FalZImageResponse {
  images: FalImageOutput[]
  seed: number
  prompt: string
  has_nsfw_concepts: boolean[]
  timings?: Record<string, number>
}

export interface FalCompletedResponse {
  status: 'COMPLETED'
  logs?: FalLog[]
  response: FalZImageResponse
}

export interface FalErrorResponse {
  detail?: string
  message?: string
}

// Request payload for z-image-turbo-lora
export interface ZImageGenerateRequest {
  prompt: string
  num_inference_steps?: number
  enable_prompt_expansion?: boolean
  acceleration?: 'regular' | 'fast' | 'turbo'
  loras?: {
    path: string
    scale: number
  }[]
  image_size?: {
    width: number
    height: number
  }
  seed?: number
}

/**
 * Submit a generation request to fal.ai queue
 */
export async function submitToQueue(prompt: string): Promise<FalQueueSubmitResponse> {
  const payload: ZImageGenerateRequest = {
    prompt,
    num_inference_steps: 8,
    enable_prompt_expansion: true,
    acceleration: 'regular',
    loras: [
      {
        path: FAL_LORA_PATH,
        scale: FAL_LORA_SCALE,
      },
    ],
  }

  const response = await fetch(`${FAL_QUEUE_BASE_URL}/${MODEL_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json() as FalErrorResponse
    throw new Error(`Failed to submit to fal.ai queue: ${error.detail || error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Get the status of a queued request
 */
export async function getQueueStatus(requestId: string): Promise<FalQueueStatusResponse> {
  const response = await fetch(
    `${FAL_QUEUE_BASE_URL}/${MODEL_ID}/requests/${requestId}/status?logs=1`,
    {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get queue status: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get the completed response from a queued request
 */
export async function getQueueResponse(requestId: string): Promise<FalZImageResponse> {
  const response = await fetch(
    `${FAL_QUEUE_BASE_URL}/${MODEL_ID}/requests/${requestId}`,
    {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json() as FalErrorResponse
    throw new Error(`Failed to get response: ${error.detail || error.message || response.statusText}`)
  }

  const data = await response.json() as FalCompletedResponse
  return data.response
}

/**
 * Cancel a queued request (only works if not yet started)
 */
export async function cancelQueueRequest(requestId: string): Promise<boolean> {
  const response = await fetch(
    `${FAL_QUEUE_BASE_URL}/${MODEL_ID}/requests/${requestId}/cancel`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    }
  )

  return response.status === 202
}
