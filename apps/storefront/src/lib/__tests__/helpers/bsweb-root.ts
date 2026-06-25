import * as fs from 'fs'
import * as path from 'path'

export function resolveBswebRoot(cwd = process.cwd()): string | null {
    const candidates = [
        process.env.BOOTANDSTRAP_WEB_ROOT,
        path.resolve(cwd, '../../../BOOTANDSTRAP_WEB'),
        path.resolve(cwd, '../../BOOTANDSTRAP_WEB'),
        path.resolve(cwd, '../BOOTANDSTRAP_WEB'),
        path.resolve(cwd, 'BOOTANDSTRAP_WEB'),
    ].filter(Boolean) as string[]

    return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

export function readBswebFile(relativePath: string, cwd = process.cwd()): string {
    const bswebRoot = resolveBswebRoot(cwd)
    if (!bswebRoot) {
        throw new Error('BOOTANDSTRAP_WEB workspace not available for cross-repo contract checks')
    }

    return fs.readFileSync(path.join(bswebRoot, relativePath), 'utf-8')
}
