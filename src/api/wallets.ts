import { apiClient, type ApiListEnvelope } from './client'
import type { Wallet } from './types'

export async function listWallets(): Promise<Wallet[]> {
  const response = await apiClient.request<ApiListEnvelope<Wallet>>('/wallets', { is_active: true })

  return response.data
}
