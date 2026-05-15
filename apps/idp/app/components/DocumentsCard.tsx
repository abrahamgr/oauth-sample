import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormField, Input } from '@oauth-sample/ui'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFetcher } from 'react-router'
import type { DocumentResult } from '../lib/api-client'
import {
  DOCUMENT_MAX_SIZE_BYTES,
  deleteDocumentObject,
  getDocumentDownloadUrl,
  uploadDocument,
} from '../lib/document.client'
import { type DocumentFormFields, documentFormSchema } from '../lib/schemas'

interface DocumentsCardProps {
  userId: string
  documents: DocumentResult[]
}

type DocumentActionData =
  | {
      success: string
      document?: DocumentResult
      deletedDocument?: DocumentResult
    }
  | { error: string }
  | undefined

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 3v12m0 0l-4-4m4 4l4-4M4.5 17.25v1.5A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25v-1.5"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M14.74 9l-.346 9m-4.788 0L9.26 9M19.5 5.79l-.722 12.273A2.25 2.25 0 0116.534 20.25H7.466a2.25 2.25 0 01-2.244-2.187L4.5 5.79m15 0a48.108 48.108 0 00-3.478-.397m-12 .398c.34-.059.68-.114 1.022-.165m11.396 0a48.11 48.11 0 00-3.478-.397m0 0V3.75a1.5 1.5 0 00-1.5-1.5h-3a1.5 1.5 0 00-1.5 1.5v1.71m6 0V3.75a1.5 1.5 0 00-1.5-1.5h-3"
      />
    </svg>
  )
}

export function DocumentsCard({ userId, documents }: DocumentsCardProps) {
  const fetcher = useFetcher<DocumentActionData>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormFields>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (fetcher.state !== 'idle') return
    if (!fetcher.data) return
    if ('success' in fetcher.data) {
      reset({ name: '' })
      setSelectedFile(null)
      setUploadError(null)
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      const deleted = fetcher.data.deletedDocument
      if (deleted) {
        void deleteDocumentObject(deleted.storage_path)
      }
      setDeletingId(null)
    }
    if ('error' in fetcher.data) {
      setIsUploading(false)
      setDeletingId(null)
    }
  }, [fetcher.state, fetcher.data, reset])

  const successMessage =
    fetcher.data && 'success' in fetcher.data ? fetcher.data.success : null
  const errorMessage =
    fetcher.data && 'error' in fetcher.data ? fetcher.data.error : null

  async function onValid(values: DocumentFormFields) {
    if (!selectedFile) {
      setUploadError('Choose a file to upload')
      return
    }
    if (selectedFile.size > DOCUMENT_MAX_SIZE_BYTES) {
      setUploadError('File exceeds the 100 MB upload limit')
      return
    }

    setUploadError(null)
    setIsUploading(true)
    try {
      const uploaded = await uploadDocument(userId, selectedFile)
      const formData = new FormData()
      formData.set('intent', 'create-document')
      formData.set('name', values.name)
      formData.set('storage_path', uploaded.storagePath)
      formData.set('content_type', uploaded.contentType)
      formData.set('size_bytes', String(uploaded.sizeBytes))
      fetcher.submit(formData, { method: 'post' })
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload document',
      )
      setIsUploading(false)
    }
  }

  async function handleDownload(document: DocumentResult) {
    try {
      const url = await getDocumentDownloadUrl(document.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Could not open document',
      )
    }
  }

  function handleDelete(document: DocumentResult) {
    if (!window.confirm(`Delete "${document.name}"? This cannot be undone.`)) {
      return
    }
    setDeletingId(document.id)
    const formData = new FormData()
    formData.set('intent', 'delete-document')
    formData.set('id', document.id)
    fetcher.submit(formData, { method: 'post' })
  }

  const isBusy = fetcher.state !== 'idle' || isUploading

  return (
    <div className="mt-6 app-panel-strong overflow-hidden rounded-3xl">
      <div className="px-8 py-7">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">
            Documents
          </h2>
          <p className="app-muted mt-1 text-sm">
            Upload files (up to 100 MB). Only you can see and download them.
          </p>
        </div>

        {successMessage ? (
          <div className="app-success mb-4 rounded-lg p-3 text-sm">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="app-danger mb-4 rounded-lg p-3 text-sm">
            {errorMessage}
          </div>
        ) : null}

        {uploadError ? (
          <div className="app-danger mb-4 rounded-lg p-3 text-sm">
            {uploadError}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit(onValid)}
          className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          noValidate
        >
          <FormField
            label="Document name"
            htmlFor="document-name"
            error={errors.name?.message}
          >
            <Input
              id="document-name"
              type="text"
              placeholder="e.g. Tax return 2025"
              error={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="document-file"
              className="cursor-pointer rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--bg-accent)] px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:border-[color:var(--accent)]"
            >
              <span className="block font-medium">
                {selectedFile ? selectedFile.name : 'Choose file'}
              </span>
              <span className="app-muted mt-0.5 block text-xs">
                {selectedFile
                  ? formatBytes(selectedFile.size)
                  : 'Any file type'}
              </span>
              <input
                ref={fileInputRef}
                id="document-file"
                type="file"
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null
                  setSelectedFile(file)
                  setUploadError(null)
                }}
              />
            </label>
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isBusy}
              className="rounded-xl px-4 py-2 text-sm font-semibold"
            >
              {isUploading ? 'Uploading…' : 'Upload document'}
            </Button>
          </div>
        </form>

        <div className="mt-8 border-t border-[color:var(--border)] pt-6">
          {documents.length === 0 ? (
            <p className="app-muted text-sm">No documents yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[color:var(--text)]">
                      {document.name}
                    </p>
                    <p className="app-muted truncate text-xs">
                      {formatBytes(document.size_bytes)} ·{' '}
                      {formatDate(document.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="app-icon-button"
                    aria-label={`Download ${document.name}`}
                    onClick={() => handleDownload(document)}
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    type="button"
                    className="app-icon-button"
                    aria-label={`Delete ${document.name}`}
                    disabled={deletingId === document.id}
                    onClick={() => handleDelete(document)}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
