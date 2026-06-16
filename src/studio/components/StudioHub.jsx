import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Box,
    Button,
    Container,
    Stack,
    TextField,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import HistoryIcon from '@mui/icons-material/History'
import { appNavigate } from '../../utils/appNavigate.js'
import { buildAppSpacePath, buildPreferencesPath } from '../../utils/spaceRouting.js'
import { buildBetaHubPath } from '../../beta/utils/betaRouting.js'
import { importLegacySceneFile } from '../../project/import/importLegacyScene.js'
import {
    DEFAULT_PROJECT_SPACE_ID,
    createProject,
    deleteProject,
    listProjects,
    updateProjectDocument,
    uploadProjectAsset
} from '../../project/services/projectsApi.js'
import { getServerSpace, updateServerSpace } from '../../services/serverSpaces.js'
import { buildStudioProjectPath, navigateToStudioPath } from '../utils/studioRouting.js'
import '../styles/studio-hub.css'

const formatProjectSourceLabel = (source = '') => {
    switch (source) {
        case 'studio-v3':
            return 'Studio'
        case 'legacy-import-studio':
            return 'Imported'
        case 'beta-v2':
            return 'V2 Beta'
        case 'legacy-import':
            return 'Legacy'
        case 'project':
        case '':
            return 'Project'
        default:
            return source
    }
}

export default function StudioHub({ spaceId = DEFAULT_PROJECT_SPACE_ID }) {
    const [projects, setProjects] = useState([])
    const [title, setTitle] = useState('Untitled Project')
    const [status, setStatus] = useState('Loading projects...')
    const [isBusy, setIsBusy] = useState(false)
    const [importWarnings, setImportWarnings] = useState([])

    const mostRecentProject = useMemo(() => projects[0] || null, [projects])

    const loadProjects = useCallback(async () => {
        setStatus('Loading projects...')
        try {
            const nextProjects = await listProjects(spaceId)
            setProjects(nextProjects)
            setStatus(nextProjects.length ? '' : 'No projects yet.')
        } catch (error) {
            setStatus(error.message || 'Unable to load projects.')
        }
    }, [spaceId])

    useEffect(() => {
        loadProjects()
    }, [loadProjects])

    const openProject = (projectId) => {
        navigateToStudioPath(buildStudioProjectPath(projectId, spaceId))
    }

    const handleCreate = async () => {
        setIsBusy(true)
        setStatus('Creating project...')
        try {
            const response = await createProject(spaceId, {
                title,
                slug: title,
                source: 'studio-v3'
            })
            openProject(response.project.id)
        } catch (error) {
            setStatus(error.message || 'Unable to create project.')
        } finally {
            setIsBusy(false)
        }
    }

    const handleImportLegacy = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        setIsBusy(true)
        setImportWarnings([])
        setStatus(`Importing ${file.name}...`)
        try {
            const { document, assetFiles, warnings } = await importLegacySceneFile(file)
            const response = await createProject(spaceId, {
                title: document.projectMeta.title,
                slug: document.projectMeta.title,
                source: 'legacy-import-studio'
            })
            const assetMap = new Map()
            for (const [assetId, assetFile] of assetFiles.entries()) {
                const uploaded = await uploadProjectAsset(response.project.id, assetFile, { assetId })
                assetMap.set(assetId, uploaded)
            }
            const nextDocument = {
                ...document,
                projectMeta: {
                    ...document.projectMeta,
                    id: response.project.id,
                    spaceId,
                    source: 'legacy-import-studio'
                }
            }
            await updateProjectDocument(response.project.id, nextDocument)
            setImportWarnings(warnings)
            openProject(response.project.id)
        } catch (error) {
            setStatus(error.message || 'Unable to import legacy scene.')
        } finally {
            setIsBusy(false)
            event.target.value = ''
        }
    }

    const handleDeleteProject = async (project) => {
        if (!project?.id) return
        const confirmed = window.confirm(`Delete project "${project.title || project.id}"? This cannot be undone.`)
        if (!confirmed) return
        setIsBusy(true)
        setStatus(`Deleting ${project.title || project.id}...`)
        try {
            const spaceMeta = await getServerSpace(spaceId).catch(() => null)
            if (spaceMeta?.publishedProjectId === project.id) {
                await updateServerSpace(spaceId, { publishedProjectId: null })
            }
            await deleteProject(project.id)
            await loadProjects()
            setStatus('Project deleted.')
        } catch (error) {
            setStatus(error.message || 'Unable to delete project.')
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <Box className="studio-shell-root studio-hub-root">
            <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
                <Stack spacing={4}>

                    {/* Header */}
                    <Stack
                        className="sh-header"
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={3}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', lg: 'flex-start' }}
                    >
                        <Stack spacing={0.5}>
                            <p className="sh-eyebrow">di.iiii · Studio</p>
                            <h1 className="sh-title">Projects</h1>
                            <p className="sh-desc">
                                Create and open 3D projects. Import legacy scenes, publish to a public URL, or hand off to the Beta node editor.
                            </p>
                        </Stack>

                        {/* Create panel */}
                        <Stack
                            className="sh-create-panel"
                            spacing={1.5}
                            sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}
                        >
                            <TextField
                                label="Project title"
                                size="small"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <Button
                                    startIcon={<AddIcon />}
                                    variant="contained"
                                    onClick={handleCreate}
                                    disabled={isBusy}
                                    sx={{ borderRadius: 0 }}
                                >
                                    New project
                                </Button>
                                <Button
                                    component="label"
                                    startIcon={<UploadFileIcon />}
                                    variant="outlined"
                                    disabled={isBusy}
                                    sx={{ borderRadius: 0 }}
                                >
                                    Import legacy
                                    <input
                                        hidden
                                        type="file"
                                        accept=".zip,.json,application/zip,application/json"
                                        onChange={handleImportLegacy}
                                    />
                                </Button>
                            </Stack>
                            <Stack direction="row" spacing={0} flexWrap="wrap" useFlexGap>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    size="small"
                                    onClick={() => navigateToStudioPath(buildStudioProjectPath(mostRecentProject?.id, spaceId))}
                                    disabled={!mostRecentProject}
                                    startIcon={<HistoryIcon />}
                                    sx={{ borderRadius: 0, fontSize: '0.75rem', color: 'var(--di-text-muted)', textTransform: 'none' }}
                                >
                                    Reopen latest
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="inherit"
                                    onClick={() => appNavigate(buildAppSpacePath(spaceId))}
                                    sx={{ borderRadius: 0, fontSize: '0.75rem', color: 'var(--di-text-muted)', textTransform: 'none' }}
                                >
                                    Public view
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="inherit"
                                    onClick={() => appNavigate(buildBetaHubPath(spaceId))}
                                    sx={{ borderRadius: 0, fontSize: '0.75rem', color: 'var(--di-text-muted)', textTransform: 'none' }}
                                >
                                    Beta
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="inherit"
                                    onClick={() => appNavigate(buildPreferencesPath(spaceId))}
                                    sx={{ borderRadius: 0, fontSize: '0.75rem', color: 'var(--di-text-muted)', textTransform: 'none' }}
                                >
                                    Admin
                                </Button>
                            </Stack>
                        </Stack>
                    </Stack>

                    {/* Status */}
                    {status ? (
                        <p className={`sh-status${status.includes('Unable') ? ' sh-status-error' : ''}`}>
                            {status}
                        </p>
                    ) : null}
                    {importWarnings.length ? (
                        <p className="sh-warn">{importWarnings.join(' ')}</p>
                    ) : null}

                    {/* Projects */}
                    {projects.length > 0 && (
                        <Stack spacing={1.5}>
                            <p className="sh-section-label">Projects — {projects.length}</p>
                            <div className="sh-projects-grid">
                                {projects.map((project) => (
                                    <div key={project.id} className="sh-project-card">
                                        <p className="sh-project-title">{project.title}</p>
                                        <p className="sh-project-id">{project.id}</p>
                                        <div className="sh-project-meta">
                                            <span className="sh-meta-tag">
                                                {new Date(project.updatedAt || Date.now()).toLocaleDateString()}
                                            </span>
                                            <span className="sh-meta-tag">
                                                {formatProjectSourceLabel(project.source)}
                                            </span>
                                        </div>
                                        <div className="sh-project-actions">
                                            <button className="sh-btn-open" onClick={() => openProject(project.id)}>
                                                Open
                                            </button>
                                            <button className="sh-btn-delete" onClick={() => handleDeleteProject(project)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Stack>
                    )}

                </Stack>
            </Container>
        </Box>
    )
}
