import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/proxmox'
import { useUIStore } from '@/store/uiStore'
import { useServerStore } from '@/store/serverStore'

function usePollingInterval() {
  return useUIStore((s) => s.pollingInterval)
}

// ─── Cluster ─────────────────────────────────────────────────────────────────

export function useClusterStatus(serverId: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['cluster-status', serverId],
    queryFn: () => api.getClusterStatus(serverId!),
    enabled: !!serverId,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 3,
  })
}

export function useClusterResources(serverId: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['cluster-resources', serverId],
    queryFn: () => api.getClusterResources(serverId!),
    enabled: !!serverId,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 3,
  })
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

export function useNodes(serverId: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['nodes', serverId],
    queryFn: () => api.getNodes(serverId!),
    enabled: !!serverId,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 3,
  })
}

export function useNodeStatus(serverId: string | null, node: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['node-status', serverId, node],
    queryFn: () => api.getNodeStatus(serverId!, node!),
    enabled: !!serverId && !!node,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 3,
  })
}

export function useNodeRrddata(serverId: string | null, node: string | null, timeframe = 'hour') {
  return useQuery({
    queryKey: ['node-rrddata', serverId, node, timeframe],
    queryFn: () => api.getNodeRrddata(serverId!, node!, timeframe),
    enabled: !!serverId && !!node,
    refetchInterval: 5000,
    staleTime: 2500,
    retry: 2,
  })
}

// ─── VMs ─────────────────────────────────────────────────────────────────────

export function useVMs(serverId: string | null, node: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['vms', serverId, node],
    queryFn: () => api.getVMs(serverId!, node!).then((vms) => vms.map((vm) => ({ ...vm, node: node! }))),
    enabled: !!serverId && !!node,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 3,
  })
}

export function useAllVMs(serverId: string | null, nodes: string[]) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['all-vms', serverId, nodes],
    queryFn: async () => {
      const results = await Promise.allSettled(
        nodes.map((node) =>
          api.getVMs(serverId!, node).then((vms) =>
            vms.map((vm) => ({ ...vm, node }))
          )
        )
      )
      return results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof api.getVMs>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
    },
    enabled: !!serverId && nodes.length > 0,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 2,
  })
}

export function useVMStatus(serverId: string | null, node: string | null, vmid: number | null) {
  return useQuery({
    queryKey: ['vm-status', serverId, node, vmid],
    queryFn: () => api.getVMStatus(serverId!, node!, vmid!),
    enabled: !!serverId && !!node && vmid !== null,
    refetchInterval: 3000,
    staleTime: 1500,
    retry: 2,
  })
}

export function useVMConfig(serverId: string | null, node: string | null, vmid: number | null) {
  return useQuery({
    queryKey: ['vm-config', serverId, node, vmid],
    queryFn: () => api.getVMConfig(serverId!, node!, vmid!),
    enabled: !!serverId && !!node && vmid !== null,
    staleTime: 30000,
    retry: 2,
  })
}

export function useVMSnapshots(serverId: string | null, node: string | null, vmid: number | null) {
  return useQuery({
    queryKey: ['vm-snapshots', serverId, node, vmid],
    queryFn: () => api.getVMSnapshots(serverId!, node!, vmid!),
    enabled: !!serverId && !!node && vmid !== null,
    staleTime: 10000,
    retry: 2,
  })
}

export function useVMAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      serverId,
      node,
      vmid,
      action,
    }: {
      serverId: string
      node: string
      vmid: number
      action: 'start' | 'stop' | 'shutdown' | 'reset' | 'suspend' | 'resume'
    }) => api.vmAction(serverId, node, vmid, action),
    onSuccess: (_data, { serverId, node }) => {
      queryClient.invalidateQueries({ queryKey: ['vms', serverId, node] })
      queryClient.invalidateQueries({ queryKey: ['cluster-resources', serverId] })
    },
  })
}

export function useCreateVMSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      serverId,
      node,
      vmid,
      params,
    }: {
      serverId: string
      node: string
      vmid: number
      params: { snapname: string; description?: string; vmstate?: boolean }
    }) => api.createVMSnapshot(serverId, node, vmid, params),
    onSuccess: (_data, { serverId, node, vmid }) => {
      queryClient.invalidateQueries({ queryKey: ['vm-snapshots', serverId, node, vmid] })
    },
  })
}

export function useDeleteVMSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      serverId,
      node,
      vmid,
      snapname,
    }: {
      serverId: string
      node: string
      vmid: number
      snapname: string
    }) => api.deleteVMSnapshot(serverId, node, vmid, snapname),
    onSuccess: (_data, { serverId, node, vmid }) => {
      queryClient.invalidateQueries({ queryKey: ['vm-snapshots', serverId, node, vmid] })
    },
  })
}

// ─── Containers ───────────────────────────────────────────────────────────────

export function useContainers(serverId: string | null, node: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['containers', serverId, node],
    queryFn: () => api.getContainers(serverId!, node!).then((cts) => cts.map((ct) => ({ ...ct, node: node! }))),
    enabled: !!serverId && !!node,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 3,
  })
}

export function useAllContainers(serverId: string | null, nodes: string[]) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['all-containers', serverId, nodes],
    queryFn: async () => {
      const results = await Promise.allSettled(
        nodes.map((node) =>
          api.getContainers(serverId!, node).then((cts) =>
            cts.map((ct) => ({ ...ct, node }))
          )
        )
      )
      return results
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof api.getContainers>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
    },
    enabled: !!serverId && nodes.length > 0,
    refetchInterval: interval,
    staleTime: interval / 2,
    retry: 2,
  })
}

export function useContainerAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      serverId,
      node,
      vmid,
      action,
    }: {
      serverId: string
      node: string
      vmid: number
      action: 'start' | 'stop' | 'shutdown' | 'restart' | 'suspend' | 'resume'
    }) => api.containerAction(serverId, node, vmid, action),
    onSuccess: (_data, { serverId, node }) => {
      queryClient.invalidateQueries({ queryKey: ['containers', serverId, node] })
      queryClient.invalidateQueries({ queryKey: ['cluster-resources', serverId] })
    },
  })
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export function useStorage(serverId: string | null, node: string | null) {
  const interval = usePollingInterval()
  return useQuery({
    queryKey: ['storage', serverId, node],
    queryFn: () => api.getStorage(serverId!, node!),
    enabled: !!serverId && !!node,
    refetchInterval: interval * 2,
    staleTime: interval,
    retry: 2,
  })
}

export function useStorageContent(serverId: string | null, node: string | null, storage: string | null) {
  return useQuery({
    queryKey: ['storage-content', serverId, node, storage],
    queryFn: () => api.getStorageContent(serverId!, node!, storage!),
    enabled: !!serverId && !!node && !!storage,
    staleTime: 10000,
    retry: 2,
  })
}

// ─── Network ─────────────────────────────────────────────────────────────────

export function useNetwork(serverId: string | null, node: string | null) {
  return useQuery({
    queryKey: ['network', serverId, node],
    queryFn: () => api.getNetwork(serverId!, node!),
    enabled: !!serverId && !!node,
    staleTime: 30000,
    retry: 2,
  })
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useTasks(serverId: string | null, node: string | null) {
  return useQuery({
    queryKey: ['tasks', serverId, node],
    queryFn: () => api.getTasks(serverId!, node!),
    enabled: !!serverId && !!node,
    refetchInterval: 3000,
    staleTime: 1500,
    retry: 2,
  })
}

export function useTaskStatus(serverId: string | null, node: string | null, upid: string | null) {
  return useQuery({
    queryKey: ['task-status', serverId, node, upid],
    queryFn: () => api.getTaskStatus(serverId!, node!, upid!),
    enabled: !!serverId && !!node && !!upid,
    refetchInterval: 2000,
    retry: 1,
  })
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export function useBackups(serverId: string | null, node: string | null, storage: string | null) {
  return useQuery({
    queryKey: ['backups', serverId, node, storage],
    queryFn: () => api.getBackups(serverId!, node!, storage!),
    enabled: !!serverId && !!node && !!storage,
    staleTime: 30000,
    retry: 2,
  })
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function useLogs(serverId: string | null, node: string | null) {
  return useQuery({
    queryKey: ['logs', serverId, node],
    queryFn: () => api.getLogs(serverId!, node!),
    enabled: !!serverId && !!node,
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 2,
  })
}

// ─── Active Server Helper ────────────────────────────────────────────────────

export function useActiveServerId() {
  return useServerStore((s) => s.activeServerId)
}

export function useActiveServer() {
  return useServerStore((s) => s.getActiveServer())
}
