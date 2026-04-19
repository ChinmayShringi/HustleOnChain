'use client'

/**
 * Detects x402 resource payments made by the agent during a job.
 *
 * Heuristic:
 *   - Reads `GraderEvaluator.authorizedGrader()` to learn the grader
 *     signer address.
 *   - If job is known, scans `tUSDT.Transfer` events where `to` is
 *     the grader signer between the JobCreated block and latest.
 *   - Each match is surfaced as a candidate x402 payment.
 */

import { useQuery } from '@tanstack/react-query'
import type { Address, Hash, PublicClient } from 'viem'
import { useChainId, usePublicClient, useReadContract } from 'wagmi'
import { getContracts } from '@/lib/contracts/addresses'
import { erc20Abi } from '@/lib/contracts/erc20.abi'
import { graderEvaluatorAbi } from '@/lib/contracts/graderEvaluator.abi'

export type X402Payment = {
  readonly txHash: Hash
  readonly blockNumber: bigint
  readonly from: Address
  readonly to: Address
  readonly value: bigint
}

const WINDOW_BLOCKS = 200_000n
const PAGE_SIZE = 9_000n

export function useX402Payment(params: {
  readonly jobExists: boolean
  readonly provider: Address | null
  readonly token: Address | null
}) {
  const chainId = useChainId()
  const publicClient = usePublicClient({ chainId })
  const contracts = tryGetContracts(chainId)

  const authorized = useReadContract({
    abi: graderEvaluatorAbi,
    address: contracts?.graderEvaluator,
    functionName: 'authorizedGrader',
    query: { enabled: Boolean(contracts) && params.jobExists },
  })

  const graderSigner = authorized.data as Address | undefined

  const enabled =
    Boolean(publicClient) &&
    params.jobExists &&
    Boolean(graderSigner) &&
    Boolean(params.token) &&
    Boolean(params.provider)

  const query = useQuery<readonly X402Payment[]>({
    queryKey: [
      'x402',
      chainId,
      params.token,
      params.provider,
      graderSigner ?? null,
    ],
    enabled,
    queryFn: async () => {
      if (!publicClient || !params.token || !graderSigner || !params.provider) {
        return []
      }
      return findTransfers(
        publicClient,
        params.token,
        params.provider,
        graderSigner,
      )
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading || authorized.isLoading,
    error:
      (query.error instanceof Error ? query.error : null) ??
      (authorized.error instanceof Error ? authorized.error : null),
  }
}

async function findTransfers(
  publicClient: PublicClient,
  token: Address,
  from: Address,
  to: Address,
): Promise<readonly X402Payment[]> {
  const latest = await publicClient.getBlockNumber()
  const floor = latest > WINDOW_BLOCKS ? latest - WINDOW_BLOCKS : 0n
  const transferAbi = erc20Abi.find(
    (entry) => entry.type === 'event' && entry.name === 'Transfer',
  )
  if (!transferAbi) return []

  const out: X402Payment[] = []
  let cursor = floor
  while (cursor <= latest) {
    const end =
      cursor + PAGE_SIZE - 1n > latest ? latest : cursor + PAGE_SIZE - 1n
    try {
      const logs = await publicClient.getLogs({
        address: token,
        event: transferAbi,
        args: { from, to },
        fromBlock: cursor,
        toBlock: end,
      })
      for (const log of logs) {
        const args = (log.args ?? {}) as {
          from?: Address
          to?: Address
          value?: bigint
        }
        if (
          args.from &&
          args.to &&
          typeof args.value === 'bigint' &&
          typeof log.blockNumber === 'bigint' &&
          log.transactionHash
        ) {
          out.push({
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            from: args.from,
            to: args.to,
            value: args.value,
          })
        }
      }
    } catch {
      // skip failed window
    }
    if (end === latest) break
    cursor = end + 1n
  }
  return out
}

function tryGetContracts(chainId: number) {
  try {
    return getContracts(chainId)
  } catch {
    return null
  }
}
