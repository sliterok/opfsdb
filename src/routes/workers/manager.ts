/* eslint-disable import/default */
import workerUrl from './dedicated?worker&url'
import sharedWorkerUrl from './shared?sharedworker&url'
import { WorkerManager } from 'src/db/helpers'

export const { sendCommand } = new WorkerManager(workerUrl, sharedWorkerUrl)
