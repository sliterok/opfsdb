/* eslint-disable import/default */
import { WorkerManager } from 'src/db/helpers'
import workerUrl from '../../routes/workers/dedicated?worker&url'
import sharedWorkerUrl from '../../routes/workers/shared?sharedworker&url'

export const batchSize = 50

export const TABLE_HEADER_HEIGHT = 30

export const { sendCommand } = new WorkerManager(workerUrl, sharedWorkerUrl)
